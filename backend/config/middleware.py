import contextvars
import logging
import time
import uuid

from django.http import JsonResponse


_request_id = contextvars.ContextVar("request_id", default="-")
logger = logging.getLogger("config.request")


def get_request_id():
    return _request_id.get()


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id()
        return True


class RequestIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = _request_id.set(request_id)
        started = time.monotonic()
        response = None
        try:
            response = self.get_response(request)
        except Exception:
            logger.exception("unhandled request error")
            if request.path.startswith("/api/"):
                response = JsonResponse(
                    {"detail": "Internal server error.", "request_id": request_id},
                    status=500,
                )
            else:
                raise
        finally:
            duration_ms = (time.monotonic() - started) * 1000
            user = getattr(request, "user", None)
            user_id = getattr(user, "pk", None) if getattr(
                user, "is_authenticated", False
            ) else None
            logger.info(
                "request completed method=%s path=%s status=%s ms=%.2f "
                "request_id=%s user_id=%s",
                request.method,
                request.path,
                response.status_code if response is not None else 500,
                duration_ms,
                request_id,
                user_id if user_id is not None else "-",
            )
            _request_id.reset(token)
        response["X-Request-ID"] = request_id
        return response
