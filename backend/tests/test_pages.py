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
    response = _get("bogus-page")

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
    response = _put(pages_table, slug="bogus-page")

    assert response["statusCode"] == 404


def test_all_phase2_slugs_are_allowed(pages_table):
    for slug in (
        "about",
        "vision-mission",
        "history",
        "honoring-kay",
        "iseum-musicum",
        "donate",
        "contact",
    ):
        response = _put(
            pages_table,
            slug=slug,
            payload={"title": f"{slug} title", "body": "<p>Hello.</p>"},
        )
        assert response["statusCode"] == 200, slug


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


# --- GET /api/pages (list) -------------------------------------------------


def _list():
    return handler(_event("GET", "/api/pages"), FakeContext())


def test_list_pages_empty(pages_table):
    response = _list()

    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == []


def test_list_pages_returns_summary_for_saved_pages(pages_table):
    _put_home(pages_table)
    _put(
        pages_table,
        slug="about",
        payload={"title": "About Us", "body": "<p>Text.</p>"},
    )
    _put(
        pages_table,
        slug="donate",
        payload={"title": "Donate", "body": ""},
    )

    response = _list()

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    # sorted by slug; only saved items; home gets the stable "Home" title
    assert [entry["slug"] for entry in body] == ["about", "donate", "home"]
    by_slug = {entry["slug"]: entry for entry in body}
    assert by_slug["home"]["title"] == "Home"
    assert by_slug["about"]["title"] == "About Us"
    assert by_slug["donate"]["updatedAt"]
    # list entries expose only the summary fields
    assert set(by_slug["about"]) == {"slug", "title", "updatedAt"}


# --- Generic page schema ----------------------------------------------------


def _page_payload(title="About Us", body="<p>Hello world.</p>", **extra):
    payload = {"title": title, "body": body}
    payload.update(extra)
    return payload


def test_generic_put_valid(pages_table):
    response = _put(pages_table, slug="about", payload=_page_payload())

    assert response["statusCode"] == 200
    saved = pages_table.get_item(Key={"slug": "about"})["Item"]
    assert saved["title"] == "About Us"
    assert saved["body"] == "<p>Hello world.</p>"
    assert saved["bodyFormat"] == "html"
    assert saved["updatedBy"] == "admin@example.com"
    assert saved["updatedAt"]


def test_generic_put_empty_body_ok(pages_table):
    response = _put(pages_table, slug="contact", payload=_page_payload(body=""))

    assert response["statusCode"] == 200
    saved = pages_table.get_item(Key={"slug": "contact"})["Item"]
    assert saved["body"] == ""


def test_generic_get_roundtrip(pages_table):
    _put(pages_table, slug="history", payload=_page_payload(title="History", body="<p>Old.</p>"))

    response = _get("history")

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["title"] == "History"
    assert body["bodyFormat"] == "html"


def test_generic_put_missing_and_wrong_types(pages_table):
    response = _put(pages_table, slug="about", payload={"body": "<p>x</p>"})
    assert response["statusCode"] == 400
    assert any("Missing required field: title" in e for e in _errors(response))

    response = _put(pages_table, slug="about", payload={"title": "t"})
    assert response["statusCode"] == 400
    assert any("Missing required field: body" in e for e in _errors(response))

    response = _put(pages_table, slug="about", payload=_page_payload(title=123))
    assert response["statusCode"] == 400
    assert any("title must be a string" in e for e in _errors(response))

    response = _put(pages_table, slug="about", payload=_page_payload(body=["<p>x</p>"]))
    assert response["statusCode"] == 400
    assert any("body must be a string" in e for e in _errors(response))


def test_generic_put_too_long(pages_table):
    response = _put(pages_table, slug="about", payload=_page_payload(title="t" * 201))
    assert response["statusCode"] == 400
    assert any("title" in e and "too long" in e for e in _errors(response))

    response = _put(pages_table, slug="about", payload=_page_payload(body="x" * 50001))
    assert response["statusCode"] == 400
    assert any("body" in e and "too long" in e for e in _errors(response))


def test_generic_put_rejects_unknown_and_server_fields(pages_table):
    response = _put(
        pages_table,
        slug="about",
        payload=_page_payload(updatedAt="1999-01-01T00:00:00+00:00", bodyFormat="text", slug="about"),
    )
    assert response["statusCode"] == 400
    errors = _errors(response)
    for field in ("updatedAt", "bodyFormat", "slug"):
        assert any(field in e for e in errors), errors


def test_generic_put_without_claims_401(pages_table):
    response = _put(pages_table, slug="donate", payload=_page_payload(), claims=None)

    assert response["statusCode"] == 401


# --- HTML sanitization (nh3 allowlist) --------------------------------------


def _saved_body(pages_table, slug="about", body=""):
    _put(pages_table, slug=slug, payload=_page_payload(title="t", body=body))
    return pages_table.get_item(Key={"slug": slug})["Item"]["body"]


def test_sanitize_strips_script_style_img_iframe(pages_table):
    dirty = (
        '<p>ok</p><script>alert(1)</script><style>body{}</style>'
        '<img src="x" onerror="alert(1)"><iframe src="https://evil.example"></iframe>'
    )
    saved = _saved_body(pages_table, body=dirty)

    assert saved == "<p>ok</p>"


def test_sanitize_strips_event_handlers_and_disallowed_attrs(pages_table):
    saved = _saved_body(
        pages_table,
        body='<p onclick="alert(1)" style="color:red" class="x">text</p>',
    )
    assert saved == "<p>text</p>"


def test_sanitize_link_schemes(pages_table):
    saved = _saved_body(
        pages_table,
        body=(
            '<p><a href="javascript:alert(1)">js</a>'
            '<a href="data:text/html,x">data</a>'
            '<a href="ftp://example.com/f">ftp</a></p>'
        ),
    )
    assert "javascript:" not in saved
    assert "data:" not in saved
    assert "ftp:" not in saved
    # dangerous hrefs are removed but the anchor text/tag survive
    assert saved.count("<a") == 3


def test_sanitize_preserves_allowed_markup_and_forces_rel(pages_table):
    saved = _saved_body(
        pages_table,
        body=(
            "<h2>Head</h2><h3>Sub</h3><h4>Minor</h4><h1>not allowed</h1>"
            "<p><strong>b</strong><em>i</em><u>u</u></p>"
            "<ul><li>a</li></ul><ol><li>b</li></ol>"
            "<blockquote>q</blockquote><hr>"
            '<p><a href="https://example.com" rel="nofollow">ext</a>'
            '<a href="http://example.com">insecure-but-allowed</a>'
            '<a href="mailto:a@b.c">mail</a></p>'
        ),
    )
    for tag in ("<h2>", "<h3>", "<h4>", "<strong>", "<em>", "<u>", "<ul>", "<ol>", "<li>", "<blockquote>", "<hr>"):
        assert tag in saved, tag
    assert "<h1>" not in saved
    assert 'href="https://example.com"' in saved
    assert 'href="mailto:a@b.c"' in saved
    # rel is forced on every anchor, replacing any client-supplied value
    assert saved.count('rel="noopener noreferrer"') == saved.count("<a ")
    assert "nofollow" not in saved


def test_sanitize_relative_links_preserved(pages_table):
    saved = _saved_body(pages_table, body='<p><a href="/about">about</a><a href="#top">top</a></p>')
    assert 'href="/about"' in saved
    assert 'href="#top"' in saved
