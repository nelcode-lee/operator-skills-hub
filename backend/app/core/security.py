"""
Security utilities and middleware for Operator Skills Hub.
"""

import secrets
import hashlib
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis
from jose import JWTError, jwt
from passlib.context import CryptContext
import re

from .config import settings

# Enhanced password hashing with better configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Increased from default 10
)

# Security headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
}

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[str, Dict[str, Any]] = {}

class SecurityManager:
    """Enhanced security management."""
    
    def __init__(self):
        self.redis_client = None
        if settings.redis_url:
            try:
                self.redis_client = redis.from_url(settings.redis_url)
            except Exception:
                pass  # Fallback to in-memory storage
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token."""
        return secrets.token_urlsafe(length)
    
    def hash_password(self, password: str) -> str:
        """Hash password with enhanced security."""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    def validate_password_strength(self, password: str) -> Dict[str, Any]:
        """Validate password strength."""
        issues = []
        score = 0
        
        if len(password) < 8:
            issues.append("Password must be at least 8 characters long")
        else:
            score += 1
            
        if not re.search(r'[A-Z]', password):
            issues.append("Password must contain at least one uppercase letter")
        else:
            score += 1
            
        if not re.search(r'[a-z]', password):
            issues.append("Password must contain at least one lowercase letter")
        else:
            score += 1
            
        if not re.search(r'\d', password):
            issues.append("Password must contain at least one digit")
        else:
            score += 1
            
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            issues.append("Password must contain at least one special character")
        else:
            score += 1
        
        return {
            "is_valid": len(issues) == 0,
            "score": score,
            "issues": issues,
            "strength": "weak" if score < 3 else "medium" if score < 5 else "strong"
        }
    
    def check_rate_limit(self, identifier: str, max_requests: int = 100, window_minutes: int = 15) -> bool:
        """Check if request is within rate limit."""
        now = time.time()
        window_start = now - (window_minutes * 60)
        
        if self.redis_client:
            # Use Redis for distributed rate limiting
            key = f"rate_limit:{identifier}"
            pipe = self.redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, window_minutes * 60)
            results = pipe.execute()
            current_requests = results[1]
        else:
            # Fallback to in-memory storage
            if identifier not in rate_limit_storage:
                rate_limit_storage[identifier] = {"requests": [], "last_cleanup": now}
            
            storage = rate_limit_storage[identifier]
            
            # Clean old requests
            if now - storage["last_cleanup"] > 60:  # Cleanup every minute
                storage["requests"] = [req_time for req_time in storage["requests"] if req_time > window_start]
                storage["last_cleanup"] = now
            
            current_requests = len(storage["requests"])
            storage["requests"].append(now)
        
        return current_requests < max_requests
    
    def sanitize_input(self, text: str) -> str:
        """Sanitize user input to prevent XSS."""
        if not text:
            return ""
        
        # Remove potentially dangerous characters
        text = re.sub(r'[<>"\']', '', text)
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
        text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def generate_csrf_token(self) -> str:
        """Generate CSRF token."""
        return self.generate_secure_token(32)
    
    def verify_csrf_token(self, token: str, session_token: str) -> bool:
        """Verify CSRF token."""
        return secrets.compare_digest(token, session_token)

# Global security manager instance
security_manager = SecurityManager()

class SecurityMiddleware:
    """Security middleware for adding security headers and rate limiting."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Add security headers
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                for header, value in SECURITY_HEADERS.items():
                    headers[header.encode()] = value.encode()
                message["headers"] = list(headers.items())
            await send(message)
        
        # Rate limiting
        client_ip = request.client.host
        if not security_manager.check_rate_limit(f"ip:{client_ip}"):
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )
            await response(scope, receive, send_wrapper)
            return
        
        await self.app(scope, receive, send_wrapper)

class EnhancedJWTManager:
    """Enhanced JWT token management with security features."""
    
    def __init__(self):
        self.secret_key = settings.secret_key
        self.algorithm = settings.algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token with enhanced security."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        # Add security claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": security_manager.generate_secure_token(16),  # JWT ID for token revocation
            "iss": "operator-skills-hub",  # Issuer
            "aud": "operator-skills-hub-users"  # Audience
        })
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token with enhanced validation."""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                audience="operator-skills-hub-users",
                issuer="operator-skills-hub"
            )
            
            # Check if token is expired
            if datetime.utcnow() > datetime.fromtimestamp(payload.get("exp", 0)):
                return None
            
            return payload
        except JWTError:
            return None
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create refresh token for token renewal."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7)  # Refresh tokens last 7 days
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh",
            "jti": security_manager.generate_secure_token(16)
        })
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

# Global JWT manager instance
jwt_manager = EnhancedJWTManager()

def get_security_headers() -> Dict[str, str]:
    """Get security headers for responses."""
    return SECURITY_HEADERS.copy()

def validate_file_upload(file, max_size: int = 10 * 1024 * 1024, allowed_types: list = None) -> Dict[str, Any]:
    """Validate file upload for security."""
    if not file:
        return {"is_valid": False, "error": "No file provided"}
    
    # Check file size
    if hasattr(file, 'size') and file.size > max_size:
        return {"is_valid": False, "error": f"File too large. Maximum size: {max_size // (1024*1024)}MB"}
    
    # Check file type
    if allowed_types and hasattr(file, 'content_type'):
        if file.content_type not in allowed_types:
            return {"is_valid": False, "error": f"File type not allowed. Allowed types: {', '.join(allowed_types)}"}
    
    # Check file extension
    if hasattr(file, 'filename'):
        filename = file.filename.lower()
        dangerous_extensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar']
        if any(filename.endswith(ext) for ext in dangerous_extensions):
            return {"is_valid": False, "error": "File type not allowed for security reasons"}
    
    return {"is_valid": True, "error": None}
