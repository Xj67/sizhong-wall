# -*- coding: utf-8 -*-
"""WSGI 入口（PythonAnywhere 等平台使用）。"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import Campus  # noqa: E402

app = Campus()

STATUS_TEXT = {
    200: "200 OK",
    400: "400 Bad Request",
    401: "401 Unauthorized",
    403: "403 Forbidden",
    404: "404 Not Found",
    405: "405 Method Not Allowed",
    500: "500 Internal Server Error",
}


def application(environ, start_response):
    method = environ.get("REQUEST_METHOD", "GET")
    path = environ.get("PATH_INFO", "/") or "/"
    headers = {}
    for key, value in environ.items():
        if key.startswith("HTTP_"):
            headers[key[5:].lower().replace("_", "-")] = value
    try:
        length = int(environ.get("CONTENT_LENGTH") or 0)
    except (TypeError, ValueError):
        length = 0
    body = environ["wsgi.input"].read(length) if length else b""

    status, ctype, data = app.dispatch(method, path, headers, body)
    start_response(
        STATUS_TEXT.get(status, "%d OK" % status),
        [
            ("Content-Type", ctype),
            ("Content-Length", str(len(data))),
            ("Cache-Control", "no-store"),
            ("X-Content-Type-Options", "nosniff"),
        ],
    )
    return [data]
