"""TOFD API Lambda entrypoint.

Single function hosting all API routes via AWS Lambda Powertools'
APIGatewayHttpResolver. New content-type routes get added here in later
phases — no new infrastructure per route.
"""

import json
import os

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver

logger = Logger()
app = APIGatewayHttpResolver()

TABLE_NAME = os.environ.get("TABLE_NAME", "")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "tofd-api"}


@logger.inject_lambda_context
def handler(event, context):
    logger.info("request", path=event.get("rawPath"))
    return app.resolve(event, context)
