"""TOFD API Lambda entrypoint.

Single function hosting all API routes via AWS Lambda Powertools'
APIGatewayHttpResolver. Phase 1 adds the pages content API; later phases
add more content-type routes to the same function.
"""

import json
import os
from datetime import datetime, timezone

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, Response

logger = Logger()
app = APIGatewayHttpResolver()

PAGES_TABLE_NAME = os.environ.get("PAGES_TABLE_NAME", "")

# Phase 1 only allows editing the homepage. Phase 2 widens this set.
ALLOWED_SLUGS = {"home"}

# Client-settable fields for PUT /api/pages/{slug}. bodyFormat, updatedAt and
# updatedBy are server-managed and rejected as unknown fields if supplied.
ALLOWED_PAGE_FIELDS = {"title", "heroHeading", "missionStatement", "body", "heroImageUrl"}

FIELD_LIMITS = {
    "title": 200,
    "heroHeading": 200,
    "missionStatement": 2000,
    "body": 20000,
}

REQUIRED_PAGE_FIELDS = {"heroHeading", "missionStatement", "body"}

_dynamodb = None


def _table(name: str):
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb.Table(name)


def _error(status_code: int, message: str, errors: list | None = None):
    body: dict = {"message": message}
    if errors:
        body["errors"] = errors
    return Response(
        status_code=status_code,
        content_type="application/json",
        body=json.dumps(body),
    )


def _jwt_claims() -> dict | None:
    """Return the Cognito JWT claims for this request, or None.

    API Gateway HTTP APIs with a JWT authorizer populate
    requestContext.authorizer.jwt.claims (exposed by Powertools as
    request_context.authorizer.jwt_claim). The Lambda checks this itself as
    defense in depth behind the gateway authorizer.
    """
    try:
        claims = app.current_event.request_context.authorizer.jwt_claim
    except (AttributeError, KeyError, TypeError):
        return None
    return claims or None


def _validate_page_payload(payload) -> tuple[dict | None, list[str]]:
    """Validate a PUT body. Returns (clean_item_fields, errors)."""
    errors: list[str] = []
    if not isinstance(payload, dict):
        return None, ["Request body must be a JSON object."]

    unknown = sorted(set(payload) - ALLOWED_PAGE_FIELDS)
    for field in unknown:
        errors.append(f"Unknown field: {field}")

    for field in REQUIRED_PAGE_FIELDS:
        if field not in payload:
            errors.append(f"Missing required field: {field}")

    clean: dict = {}
    for field, limit in FIELD_LIMITS.items():
        if field not in payload:
            continue
        value = payload[field]
        if not isinstance(value, str):
            errors.append(f"Field {field} must be a string.")
            continue
        if len(value) > limit:
            errors.append(f"Field {field} is too long (max {limit} characters).")
            continue
        clean[field] = value

    if "heroImageUrl" in payload:
        value = payload["heroImageUrl"]
        if value is not None and not isinstance(value, str):
            errors.append("Field heroImageUrl must be a string.")
        else:
            clean["heroImageUrl"] = value

    return (clean if not errors else None), errors


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "tofd-api"}


@app.get("/api/pages/<slug>")
def get_page(slug: str):
    if slug not in ALLOWED_SLUGS:
        return _error(404, f"Page not found: {slug}")

    response = _table(PAGES_TABLE_NAME).get_item(Key={"slug": slug})
    item = response.get("Item")
    if item is None:
        return _error(404, f"Page not found: {slug}")
    return item


@app.put("/api/pages/<slug>")
def put_page(slug: str):
    claims = _jwt_claims()
    if claims is None:
        return _error(401, "Authentication required.")

    if slug not in ALLOWED_SLUGS:
        return _error(404, f"Page not found: {slug}")

    try:
        payload = json.loads(app.current_event.body or "{}")
    except (json.JSONDecodeError, TypeError):
        return _error(400, "Invalid JSON body.", ["Request body must be valid JSON."])

    fields, errors = _validate_page_payload(payload)
    if errors:
        return _error(400, "Invalid page data.", errors)

    updated_by = claims.get("email") or claims.get("sub") or "unknown"
    item = {
        "slug": slug,
        "bodyFormat": "text",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "updatedBy": updated_by,
        **fields,
    }
    _table(PAGES_TABLE_NAME).put_item(Item=item)
    logger.info("page_saved", slug=slug, updated_by=updated_by)
    return item


@logger.inject_lambda_context
def handler(event, context):
    logger.info("request", path=event.get("rawPath"))
    return app.resolve(event, context)
