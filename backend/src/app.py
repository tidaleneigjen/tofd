"""TOFD API Lambda entrypoint.

Single function hosting all API routes via AWS Lambda Powertools'
APIGatewayHttpResolver. Phase 1.1 gives the homepage its own structured
schema (carousel slides + sidebar); Phase 2 adds schemas for the generic
informational pages.
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

MAX_SLIDES = 8
IMAGE_URL_PREFIXES = ("/images/", "https://")

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


def _string_field(container: dict, key: str, path: str, errors: list, *, required: bool, max_length: int):
    """Validate container[key] as a string within max_length.

    Returns the cleaned value, or None when absent/invalid (an error is
    appended for invalid values, and for missing required fields).
    """
    if key not in container:
        if required:
            errors.append(f"Missing required field: {path}.{key}")
        return None
    value = container[key]
    if not isinstance(value, str):
        errors.append(f"Field {path}.{key} must be a string.")
        return None
    if len(value) > max_length:
        errors.append(f"Field {path}.{key} is too long (max {max_length} characters).")
        return None
    return value


def _validate_slide(slide, index: int, errors: list) -> dict:
    path = f"slides[{index}]"
    if not isinstance(slide, dict):
        errors.append(f"Field {path} must be an object.")
        return {}

    for key in sorted(set(slide) - {"imageUrl", "title", "text"}):
        errors.append(f"Unknown field: {path}.{key}")

    clean: dict = {}

    if "imageUrl" not in slide:
        errors.append(f"Missing required field: {path}.imageUrl")
    else:
        image_url = slide["imageUrl"]
        if not isinstance(image_url, str):
            errors.append(f"Field {path}.imageUrl must be a string.")
        elif len(image_url) > 500:
            errors.append(f"Field {path}.imageUrl is too long (max 500 characters).")
        elif not image_url.startswith(IMAGE_URL_PREFIXES):
            errors.append(f"Field {path}.imageUrl must start with '/images/' or 'https://'.")
        else:
            clean["imageUrl"] = image_url

    for field, limit in (("title", 100), ("text", 1000)):
        value = _string_field(slide, field, path, errors, required=False, max_length=limit)
        if value is not None:
            clean[field] = value

    return clean


def _validate_slides(value, errors: list):
    if not isinstance(value, list):
        errors.append("Field slides must be a list.")
        return None
    if not 1 <= len(value) <= MAX_SLIDES:
        errors.append(f"Field slides must contain between 1 and {MAX_SLIDES} items.")
        return None
    return [_validate_slide(slide, i, errors) for i, slide in enumerate(value)]


def _validate_sidebar(value, errors: list):
    if not isinstance(value, dict):
        errors.append("Field sidebar must be an object.")
        return None

    for key in sorted(set(value) - {"title", "text"}):
        errors.append(f"Unknown field: sidebar.{key}")

    clean: dict = {}
    title = _string_field(value, "title", "sidebar", errors, required=True, max_length=100)
    if title is not None:
        clean["title"] = title
    text = _string_field(value, "text", "sidebar", errors, required=True, max_length=3000)
    if text is not None:
        clean["text"] = text
    return clean


def _validate_home(payload) -> tuple[dict | None, list[str]]:
    """Validate a PUT body for slug 'home'. Returns (fields, errors)."""
    errors: list[str] = []
    if not isinstance(payload, dict):
        return None, ["Request body must be a JSON object."]

    # updatedAt/updatedBy/slug and any Phase-1 fields are rejected here as
    # unknown — they are server-managed or no longer part of the schema.
    for field in sorted(set(payload) - {"slides", "sidebar"}):
        errors.append(f"Unknown field: {field}")

    slides = None
    if "slides" not in payload:
        errors.append("Missing required field: slides")
    else:
        slides = _validate_slides(payload["slides"], errors)

    sidebar = None
    if "sidebar" not in payload:
        errors.append("Missing required field: sidebar")
    else:
        sidebar = _validate_sidebar(payload["sidebar"], errors)

    if errors:
        return None, errors
    return {"slides": slides, "sidebar": sidebar}, []


# Per-slug request schemas. The dict key is also the slug allow-list: a slug
# is editable iff it has an entry here. Phase 2 adds schemas for the
# generic informational pages.
PAGE_SCHEMAS = {"home": _validate_home}
ALLOWED_SLUGS = frozenset(PAGE_SCHEMAS)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "tofd-api"}


@app.get("/api/pages/<slug>")
def get_page(slug: str):
    # GET is deliberately tolerant: whatever is stored is returned as-is, so
    # legacy Phase 1 items (no slides/sidebar) still read fine and clients
    # fall back to defaults per missing part.
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

    validator = PAGE_SCHEMAS.get(slug)
    if validator is None:
        return _error(404, f"Page not found: {slug}")

    try:
        payload = json.loads(app.current_event.body or "{}")
    except (json.JSONDecodeError, TypeError):
        return _error(400, "Invalid JSON body.", ["Request body must be valid JSON."])

    fields, errors = validator(payload)
    if errors:
        return _error(400, "Invalid page data.", errors)

    updated_by = claims.get("email") or claims.get("sub") or "unknown"
    item = {
        "slug": slug,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "updatedBy": updated_by,
        # PUT replaces the whole item — the validated fields are the entire
        # editable document.
        **fields,
    }
    _table(PAGES_TABLE_NAME).put_item(Item=item)
    logger.info("page_saved", slug=slug, updated_by=updated_by)
    return item


@logger.inject_lambda_context
def handler(event, context):
    logger.info("request", path=event.get("rawPath"))
    return app.resolve(event, context)
