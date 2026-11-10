import json

from app import handler


class FakeContext:
    function_name = "tofd-api"
    memory_limit_in_mb = 256
    invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:tofd-api"
    aws_request_id = "test-request-id"
    log_group_name = "/aws/lambda/tofd-api"
    log_stream_name = "2026/01/01/[$LATEST]abcdef"

    def get_remaining_time_in_millis(self):
        return 30000


def _health_event() -> dict:
    return {
        "version": "2.0",
        "routeKey": "GET /api/health",
        "rawPath": "/api/health",
        "rawQueryString": "",
        "headers": {"host": "example.com"},
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "api-id",
            "domainName": "example.com",
            "domainPrefix": "example",
            "http": {
                "method": "GET",
                "path": "/api/health",
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "pytest",
            },
            "requestId": "test-request-id",
            "routeKey": "GET /api/health",
            "stage": "$default",
            "time": "01/Jan/2026:00:00:00 +0000",
            "timeEpoch": 1767225600000,
        },
        "isBase64Encoded": False,
    }


def test_health_returns_ok():
    response = handler(_health_event(), FakeContext())

    assert response["statusCode"] == 200
    headers = {k.lower(): v for k, v in response["headers"].items()}
    assert headers["content-type"] == "application/json"
    assert json.loads(response["body"]) == {"status": "ok", "service": "tofd-api"}
