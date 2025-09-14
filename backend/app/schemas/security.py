"""
Security-related Pydantic schemas for validation.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, validator, EmailStr
import re


class PasswordValidationRequest(BaseModel):
    """Request schema for password validation."""
    password: str = Field(..., min_length=1, max_length=128)


class PasswordValidationResponse(BaseModel):
    """Response schema for password validation."""
    is_valid: bool
    score: int = Field(..., ge=0, le=5)
    issues: List[str]
    strength: str = Field(..., pattern="^(weak|medium|strong)$")


class SecuritySettingsUpdate(BaseModel):
    """Schema for updating security settings."""
    password_min_length: Optional[int] = Field(None, ge=8, le=128)
    password_require_uppercase: Optional[bool] = None
    password_require_lowercase: Optional[bool] = None
    password_require_numbers: Optional[bool] = None
    password_require_special_chars: Optional[bool] = None
    max_login_attempts: Optional[int] = Field(None, ge=3, le=10)
    lockout_duration_minutes: Optional[int] = Field(None, ge=5, le=60)
    session_timeout_minutes: Optional[int] = Field(None, ge=15, le=480)


class LoginAttempt(BaseModel):
    """Schema for login attempt tracking."""
    email: EmailStr
    ip_address: str = Field(..., pattern=r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
    user_agent: Optional[str] = Field(None, max_length=500)
    success: bool
    timestamp: Optional[str] = None


class SecurityAuditLog(BaseModel):
    """Schema for security audit logging."""
    user_id: Optional[int] = None
    action: str = Field(..., max_length=100)
    resource: Optional[str] = Field(None, max_length=200)
    ip_address: str = Field(..., pattern=r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
    user_agent: Optional[str] = Field(None, max_length=500)
    details: Optional[dict] = None
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    timestamp: Optional[str] = None


class FileUploadValidation(BaseModel):
    """Schema for file upload validation."""
    filename: str = Field(..., max_length=255)
    content_type: str = Field(..., max_length=100)
    size: int = Field(..., ge=1, le=10485760)  # Max 10MB
    
    @validator('filename')
    def validate_filename(cls, v):
        # Check for dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in dangerous_chars:
            if char in v:
                raise ValueError(f"Filename contains dangerous character: {char}")
        return v
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if v not in allowed_types:
            raise ValueError(f"Content type {v} not allowed")
        return v


class CSRFTokenRequest(BaseModel):
    """Schema for CSRF token request."""
    pass


class CSRFTokenResponse(BaseModel):
    """Schema for CSRF token response."""
    csrf_token: str = Field(..., min_length=32, max_length=64)


class SecurityMetrics(BaseModel):
    """Schema for security metrics."""
    total_login_attempts: int = Field(..., ge=0)
    failed_login_attempts: int = Field(..., ge=0)
    successful_logins: int = Field(..., ge=0)
    blocked_ips: int = Field(..., ge=0)
    rate_limited_requests: int = Field(..., ge=0)
    suspicious_activities: int = Field(..., ge=0)
    last_24h_attempts: int = Field(..., ge=0)
    last_24h_failures: int = Field(..., ge=0)


class SecurityAlert(BaseModel):
    """Schema for security alerts."""
    alert_id: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., pattern="^(brute_force|suspicious_activity|rate_limit|file_upload|sql_injection|xss)$")
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    message: str = Field(..., max_length=500)
    ip_address: str = Field(..., pattern=r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
    user_id: Optional[int] = None
    timestamp: str
    resolved: bool = False
    details: Optional[dict] = None


class SecurityConfig(BaseModel):
    """Schema for security configuration."""
    enable_rate_limiting: bool = True
    enable_csrf_protection: bool = True
    enable_file_validation: bool = True
    enable_ip_whitelisting: bool = False
    enable_audit_logging: bool = True
    max_file_size_mb: int = Field(10, ge=1, le=100)
    session_timeout_minutes: int = Field(30, ge=15, le=480)
    password_policy: dict = Field(default_factory=dict)
    allowed_origins: List[str] = Field(default_factory=list)
    trusted_hosts: List[str] = Field(default_factory=list)
