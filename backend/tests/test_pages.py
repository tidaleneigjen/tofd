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


def _put_home(table, **overrides):
    item = {
        "slug": "home",
        "slides": [{"imageUrl": "/images/labyrinth.jpg", "title": "News", "text": "Hello"}],
        "sidebar": {"title": "About Us", "text": "A spiritual community."},
        "updatedAt": "2026-01-01T00:00:00+00:00",
        "updatedBy": "seed",
    }
    item.update(overrides)
    table.put_item(Item=item)


def _valid_payload(**slide_overrides):
    slide = {"imageUrl": "/images/window.jpg"}
    slide.update(slide_overrides)
    return {
        "slides": [slide],
        "sidebar": {"title": "About Us", "text": "A spiritual community."},
    }


def _put(table, slug="home", payload=None, claims=VALID_CLAIMS):
    return handler(
        _event("PUT", f"/api/pages/{slug}", slug=slug, body=payload if payload is not None else _valid_payload(), claims=claims),
        FakeContext(),
    )


def _get(slug="home"):
    return handler(_event("GET", f"/api/pages/{slug}", slug=slug), FakeContext())


def _errors(response):
    return json.loads(response["body"]).get("errors", [])


# --- GET -----------------------------------------------------------------


def test_get_existing_page(pages_table):
    _put_home(pages_table)

    response = _get()

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["slug"] == "home"
    assert body["slides"][0]["imageUrl"] == "/images/labyrinth.jpg"
    assert body["sidebar"]["title"] == "About Us"


def test_get_missing_page_404(pages_table):
    response = _get()

    assert response["statusCode"] == 404
    assert "message" in json.loads(response["body"])


def test_get_disallowed_slug_404(pages_table):
    response = _get("about")

    assert response["statusCode"] == 404


def test_get_legacy_phase1_item_tolerated(pages_table):
    pages_table.put_item(
        Item={
            "slug": "home",
            "heroHeading": "Temple of the Feminine Divine",
            "missionStatement": "Old copy.",
            "body": "Old body.",
            "bodyFormat": "text",
            "updatedAt": "2026-01-01T00:00:00+00:00",
            "updatedBy": "seed",
        }
    )

    response = _get()

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["heroHeading"] == "Temple of the Feminine Divine"
    assert "slides" not in body


# --- PUT happy path -------------------------------------------------------


def test_put_valid_page(pages_table):
    payload = _valid_payload(title="Temple News", text="Dear friends.\n\nSecond paragraph.")
    payload["slides"].append({"imageUrl": "https://cdn.example.com/x.jpg"})

    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 200
    saved = pages_table.get_item(Key={"slug": "home"})["Item"]
    assert saved["slides"][0]["title"] == "Temple News"
    assert saved["slides"][1]["imageUrl"] == "https://cdn.example.com/x.jpg"
    assert saved["sidebar"]["text"] == "A spiritual community."
    assert saved["updatedBy"] == "admin@example.com"
    assert saved["updatedAt"]


def test_put_slide_variants(pages_table):
    # title only, text only, both, neither — all valid
    payload = {
        "slides": [
            {"imageUrl": "/images/a.jpg", "title": "Title only"},
            {"imageUrl": "/images/b.jpg", "text": "Text only"},
            {"imageUrl": "/images/c.jpg", "title": "Both", "text": "Body"},
            {"imageUrl": "/images/d.jpg"},
        ],
        "sidebar": {"title": "About Us", "text": "Sidebar text."},
    }
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 200


def test_put_max_slides_ok(pages_table):
    payload = _valid_payload()
    payload["slides"] = [{"imageUrl": f"/images/{i}.jpg"} for i in range(8)]

    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 200


def test_put_updated_by_falls_back_to_sub(pages_table):
    response = _put(pages_table, claims={"sub": "user-sub-123"})

    assert response["statusCode"] == 200
    saved = pages_table.get_item(Key={"slug": "home"})["Item"]
    assert saved["updatedBy"] == "user-sub-123"


# --- PUT auth -------------------------------------------------------------


def test_put_without_claims_401(pages_table):
    response = _put(pages_table, claims=None)

    assert response["statusCode"] == 401


def test_put_empty_claims_401(pages_table):
    response = _put(pages_table, claims={})

    assert response["statusCode"] == 401


def test_put_disallowed_slug_404(pages_table):
    response = _put(pages_table, slug="about")

    assert response["statusCode"] == 404


# --- PUT validation --------------------------------------------------------


def test_put_rejects_server_and_legacy_fields(pages_table):
    payload = _valid_payload()
    payload.update(
        {
            "updatedAt": "1999-01-01T00:00:00+00:00",
            "updatedBy": "mallory",
            "heroHeading": "old field",
            "bodyFormat": "html",
            "slug": "home",
        }
    )
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 400
    errors = _errors(response)
    for field in ("updatedAt", "updatedBy", "heroHeading", "bodyFormat", "slug"):
        assert any(field in e for e in errors), errors


def test_put_zero_slides_400(pages_table):
    payload = _valid_payload()
    payload["slides"] = []
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 400
    assert any("between 1 and 8" in e for e in _errors(response))


def test_put_nine_slides_400(pages_table):
    payload = _valid_payload()
    payload["slides"] = [{"imageUrl": f"/images/{i}.jpg"} for i in range(9)]
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 400


def test_put_bad_image_urls(pages_table):
    for url in ["ftp://x/y.jpg", "images/no-slash.jpg", "http://insecure.com/x.jpg", "/other/place.jpg"]:
        payload = _valid_payload()
        payload["slides"][0]["imageUrl"] = url
        response = _put(pages_table, payload=payload)
        assert response["statusCode"] == 400, url
        assert any("imageUrl" in e for e in _errors(response)), url


def test_put_image_url_too_long_and_wrong_type(pages_table):
    payload = _valid_payload()
    payload["slides"][0]["imageUrl"] = "x" * 501
    assert _put(pages_table, payload=payload)["statusCode"] == 400

    payload = _valid_payload()
    payload["slides"][0]["imageUrl"] = 123
    response = _put(pages_table, payload=payload)
    assert response["statusCode"] == 400
    assert any("must be a string" in e for e in _errors(response))


def test_put_missing_image_url(pages_table):
    payload = {"slides": [{"title": "no image"}], "sidebar": {"title": "t", "text": "x"}}
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 400
    assert any("imageUrl" in e for e in _errors(response))


def test_put_unknown_nested_keys(pages_table):
    payload = _valid_payload()
    payload["slides"][0]["bogus"] = 1
    payload["sidebar"]["extra"] = "nope"
    payload["topLevel"] = True
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 400
    errors = _errors(response)
    assert any("slides[0].bogus" in e for e in errors)
    assert any("sidebar.extra" in e for e in errors)
    assert any("topLevel" in e for e in errors)


def test_put_too_long_fields(pages_table):
    payload = _valid_payload(title="t" * 101, text="x" * 1001)
    payload["sidebar"] = {"title": "s" * 101, "text": "y" * 3001}
    response = _put(pages_table, payload=payload)

    assert response["statusCode"] == 400
    errors = _errors(response)
    assert any("slides[0].title" in e and "too long" in e for e in errors)
    assert any("slides[0].text" in e and "too long" in e for e in errors)
    assert any("sidebar.title" in e and "too long" in e for e in errors)
    assert any("sidebar.text" in e and "too long" in e for e in errors)


def test_put_missing_required(pages_table):
    # missing slides
    response = _put(pages_table, payload={"sidebar": {"title": "t", "text": "x"}})
    assert response["statusCode"] == 400
    assert any("Missing required field: slides" in e for e in _errors(response))

    # missing sidebar
    payload = _valid_payload()
    del payload["sidebar"]
    response = _put(pages_table, payload=payload)
    assert response["statusCode"] == 400
    assert any("Missing required field: sidebar" in e for e in _errors(response))

    # missing sidebar.title / sidebar.text
    response = _put(pages_table, payload={"slides": [{"imageUrl": "/images/a.jpg"}], "sidebar": {"title": "t"}})
    assert response["statusCode"] == 400
    assert any("sidebar.text" in e for e in _errors(response))


def test_put_wrong_types(pages_table):
    payload = _valid_payload()
    payload["slides"] = "not-a-list"
    response = _put(pages_table, payload=payload)
    assert response["statusCode"] == 400
    assert any("must be a list" in e for e in _errors(response))

    payload = _valid_payload()
    payload["slides"][0] = "not-an-object"
    response = _put(pages_table, payload=payload)
    assert response["statusCode"] == 400
    assert any("must be an object" in e for e in _errors(response))

    payload = {"slides": [{"imageUrl": "/images/a.jpg"}], "sidebar": ["not", "object"]}
    response = _put(pages_table, payload=payload)
    assert response["statusCode"] == 400
    assert any("sidebar must be an object" in e for e in _errors(response))


def test_put_non_object_body(pages_table):
    response = _put(pages_table, payload=[1, 2, 3])
    assert response["statusCode"] == 400


def test_put_invalid_json_400(pages_table):
    response = handler(
        _event("PUT", "/api/pages/home", slug="home", body="{not json", claims=VALID_CLAIMS),
        FakeContext(),
    )

    assert response["statusCode"] == 400
