import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from backend.config import logger

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate a unique request identification code
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Attach start time and request meta
        start_time = time.perf_counter()
        
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        
        logger.info(f"[{request_id}] ---> Incoming {method} request to {path} from {client_host}")
        
        try:
            # Process the downstream pipeline
            response = await call_next(request)
            
            # Record elapsed time
            elapsed_time = (time.perf_counter() - start_time) * 1000.0
            
            # Inject request ID into standard headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-Ms"] = f"{elapsed_time:.2f}"
            
            # Log successful completion metadata
            logger.info(
                f"[{request_id}] <--- Outgoing {method} response {response.status_code} "
                f"to {path} ({elapsed_time:.2f}ms)"
            )
            return response
            
        except Exception as e:
            elapsed_time = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                f"[{request_id}] XXX Failed {method} {path} with exception: {e} "
                f"after {elapsed_time:.2f}ms",
                exc_info=True
            )
            # Re-raise to let general app handlers gracefully capture the stack
            raise e
