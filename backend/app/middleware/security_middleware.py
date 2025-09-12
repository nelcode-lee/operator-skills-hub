"""
Security middleware for enhanced protection.
"""

import time
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.security import security_manager, get_security_headers


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        for header, value in get_security_headers().items():
            response.headers[header] = value
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""
    
    def __init__(self, app, calls: int = 100, period: int = 900):  # 100 calls per 15 minutes
        super().__init__(app)
        self.calls = calls
        self.period = period
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Create identifier for rate limiting
        identifier = f"rate_limit:{client_ip}:{hash(user_agent) % 10000}"
        
        if not security_manager.check_rate_limit(identifier, self.calls, self.period // 60):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": self.period
                },
                headers={"Retry-After": str(self.period)}
            )
        
        response = await call_next(request)
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging security-relevant requests."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log suspicious patterns
        suspicious_patterns = [
            "..",  # Path traversal
            "script",  # XSS attempts
            "union",  # SQL injection
            "drop",  # SQL injection
            "delete",  # SQL injection
            "insert",  # SQL injection
            "update",  # SQL injection
            "exec",  # Command injection
            "eval",  # Code injection
        ]
        
        request_path = str(request.url.path).lower()
        query_string = str(request.url.query).lower()
        
        for pattern in suspicious_patterns:
            if pattern in request_path or pattern in query_string:
                # Log suspicious activity (in production, use proper logging)
                print(f"SECURITY WARNING: Suspicious request from {request.client.host} to {request.url}")
        
        response = await call_next(request)
        
        # Log response time for performance monitoring
        process_time = time.time() - start_time
        if process_time > 5.0:  # Log slow requests
            print(f"SLOW REQUEST: {request.method} {request.url} took {process_time:.2f}s")
        
        return response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware for CSRF protection on state-changing requests."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only check CSRF for state-changing methods
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # Skip CSRF check for API endpoints that use JWT
            if request.url.path.startswith("/api/"):
                # JWT tokens provide CSRF protection
                pass
            else:
                # Check CSRF token for other endpoints
                csrf_token = request.headers.get("X-CSRF-Token")
                if not csrf_token:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "CSRF token missing"}
                    )
        
        response = await call_next(request)
        return response


class ContentTypeValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate content types for file uploads."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "POST" and "multipart/form-data" in request.headers.get("content-type", ""):
            # Validate file uploads
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("multipart/form-data"):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Invalid content type for file upload"}
                )
        
        response = await call_next(request)
        return response


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """Middleware for IP whitelisting (optional)."""
    
    def __init__(self, app, whitelist: list = None):
        super().__init__(app)
        self.whitelist = whitelist or []
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if self.whitelist:
            client_ip = request.client.host
            
            # Allow localhost and whitelisted IPs
            if client_ip not in ["127.0.0.1", "localhost"] and client_ip not in self.whitelist:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Access denied from this IP address"}
                )
        
        response = await call_next(request)
        return response
