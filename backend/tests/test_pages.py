import json
import os

import boto3
import pytest
from moto import mock_aws

from app import handler

TABLE_NAME = os.environ["PAGES_TABLE_NAME"]

VALID_CLAIMS = {"sub": "user-sub-123", "email": "admin@example.com"}


def _event(method: str, path: str, slug: str | None = None, body=None, claims=None) -> dict:
    route_key = f"{method} /api/pages/{{slug}}" if slug else f"{method} /api/pages"
    event = {
        "version": "2.0",
        "routeKey": route_key,
        "rawPath": path,
        "rawQueryString": "",
        "headers": {"host": "example.com", "content-type": "application/json"},
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "api-id",
            "domainName": "example.com",
            "domainPrefix": "example",
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "pytest",
            },
            "requestId": "test-request-id",
            "routeKey": route_key,
            "stage": "$default",
            "time": "01/Jan/2026:00:00:00 +0000",
            "timeEpoch": 1767225600000,
        },
        "isBase64Encoded": False,
    }
    if slug is not None:
        event["pathParameters"] = {"slug": slug}
    if body is not None:
        event["body"] = body if isinstance(body, str) else json.dumps(body)
    if claims is not None:
        event["requestContext"]["authorizer"] = {"jwt": {"claims": claims, "scopes": []}}
    return event


class FakeContext:
    function_name = "tofd-api"
    memory_limit_in_mb = 256
    invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:tofd-api"
    aws_request_id = "test-request-id"
    log_group_name = "/aws/lambda/tofd-api"
    log_stream_name = "2026/01/01/[$LATEST]abcdef"

    def get_remaining_time_in_millis(self):
        return 30000


@pytest.fixture
def pages_table():
    with mock_aws():
        ddb = boto3.resource("dynamodb", region_name="us-east-1")
        ddb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[{"AttributeName": "slug", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "slug", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        yield ddb.Table(TABLE_NAME)


def _put_slug(table, slug="home", **fields):
    item = {
        "slug": slug,
        "title": "Home",
        "heroHeading": "Temple of the Feminine Divine",
        "missionStatement": "A spiritual community.",
        "body": "We celebrate the feminine divine.",
        "bodyFormat": "text",
        "updatedAt": "2026-01-01T00:00:00+00:00",
        "updatedBy": "seed",
    }
    item.update(fields)
    table.put_item(Item=item)


def test_get_existing_page(pages_table):
    _put_slug(pages_table)

    response = handler(_event("GET", "/api/pages/home", slug="home"), FakeContext())

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["slug"] == "home"
    assert body["heroHeading"] == "Temple of the Feminine Divine"
    assert body["bodyFormat"] == "text"


def test_get_missing_page_404(pages_table):
    response = handler(_event("GET", "/api/pages/home", slug="home"), FakeContext())

    assert response["statusCode"] == 404
    assert "message" in json.loads(response["body"])


def test_get_disallowed_slug_404(pages_table):
    response = handler(_event("GET", "/api/pages/about", slug="about"), FakeContext())

    assert response["statusCode"] == 404


def test_put_valid_page(pages_table):
    payload = {
        "title": "Home",
        "heroHeading": "New heading",
        "missionStatement": "New mission.",
        "body": "New body.\n\nSecond paragraph.",
    }
    response = handler(
        _event("PUT", "/api/pages/home", slug="home", body=payload, claims=VALID_CLAIMS),
        FakeContext(),
    )

    assert response["statusCode"] == 200
    saved = pages_table.get_item(Key={"slug": "home"})["Item"]
    assert saved["heroHeading"] == "New heading"
    assert saved["bodyFormat"] == "text"
    assert saved["updatedBy"] == "admin@example.com"
    assert saved["updatedAt"]
    assert saved["updatedBy"] != "ignored-client-value"


def test_put_without_claims_401(pages_table):
    payload = {"heroHeading": "x", "missionStatement": "y", "body": "z"}
    response = handler(
        _event("PUT", "/api/pages/home", slug="home", body=payload),
        FakeContext(),
    )

    assert response["statusCode"] == 401


def test_put_rejects_server_managed_fields(pages_table):
    payload = {
        "heroHeading": "x",
        "missionStatement": "y",
        "body": "z",
        "updatedAt": "1999-01-01T00:00:00+00:00",
        "updatedBy": "mallory",
        "bodyFormat": "html",
    }
    response = handler(
        _event("PUT", "/api/pages/home", slug="home", body=payload, claims=VALID_CLAIMS),
        FakeContext(),
    )

    assert response["statusCode"] == 400
    errors = json.loads(response["body"])["errors"]
    assert any("updatedAt" in e for e in errors)
    assert any("updatedBy" in e for e in errors)
    assert any("bodyFormat" in e for e in errors)


def test_put_malformed_body_400(pages_table):
    payload = {
        "heroHeading": 123,  # wrong type
        "missionStatement": "y" * 2001,  # too long
        "bogusField": "nope",  # unknown
        # body missing entirely
    }
    response = handler(
        _event("PUT", "/api/pages/home", slug="home", body=payload, claims=VALID_CLAIMS),
        FakeContext(),
    )

    assert response["statusCode"] == 400
    errors = json.loads(response["body"])["errors"]
    assert any("Missing required field: body" in e for e in errors)
    assert any("Unknown field: bogusField" in e for e in errors)
    assert any("too long" in e for e in errors)
    assert any("must be a string" in e for e in errors)


def test_put_invalid_json_400(pages_table):
    response = handler(
        _event("PUT", "/api/pages/home", slug="home", body="{not json", claims=VALID_CLAIMS),
        FakeContext(),
    )

    assert response["statusCode"] == 400


def test_put_disallowed_slug_404(pages_table):
    payload = {"heroHeading": "x", "missionStatement": "y", "body": "z"}
    response = handler(
        _event("PUT", "/api/pages/about", slug="about", body=payload, claims=VALID_CLAIMS),
        FakeContext(),
    )

    assert response["statusCode"] == 404
