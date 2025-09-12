"""
Security API endpoints for enhanced protection.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..core.database import get_db
from ..core.auth import get_current_user
from ..core.security import security_manager, jwt_manager
from ..models.user import User
from ..schemas.security import (
    PasswordValidationRequest, PasswordValidationResponse,
    SecuritySettingsUpdate, LoginAttempt, SecurityAuditLog,
    FileUploadValidation, CSRFTokenResponse, SecurityMetrics,
    SecurityAlert, SecurityConfig
)

router = APIRouter()


@router.post("/validate-password", response_model=PasswordValidationResponse)
async def validate_password_strength(
    request: PasswordValidationRequest,
    current_user: User = Depends(get_current_user)
):
    """Validate password strength according to security policy."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can validate passwords"
        )
    
    validation_result = security_manager.validate_password_strength(request.password)
    return PasswordValidationResponse(**validation_result)


@router.post("/csrf-token", response_model=CSRFTokenResponse)
async def get_csrf_token():
    """Generate CSRF token for form protection."""
    csrf_token = security_manager.generate_csrf_token()
    return CSRFTokenResponse(csrf_token=csrf_token)


@router.post("/validate-file", response_model=dict)
async def validate_file_upload(
    file_validation: FileUploadValidation,
    current_user: User = Depends(get_current_user)
):
    """Validate file upload for security compliance."""
    validation_result = security_manager.validate_file_upload(
        file_validation.filename,
        file_validation.content_type,
        file_validation.size
    )
    
    if not validation_result["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result["error"]
        )
    
    return {"message": "File validation passed", "is_valid": True}


@router.get("/security-metrics", response_model=SecurityMetrics)
async def get_security_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get security metrics and statistics."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view security metrics"
        )
    
    # This would typically query a security events table
    # For now, return mock data
    return SecurityMetrics(
        total_login_attempts=150,
        failed_login_attempts=25,
        successful_logins=125,
        blocked_ips=3,
        rate_limited_requests=12,
        suspicious_activities=2,
        last_24h_attempts=45,
        last_24h_failures=8
    )


@router.get("/security-alerts", response_model=List[SecurityAlert])
async def get_security_alerts(
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get security alerts and notifications."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view security alerts"
        )
    
    # This would typically query a security alerts table
    # For now, return mock data
    alerts = [
        SecurityAlert(
            alert_id="alert_001",
            type="brute_force",
            severity="high",
            message="Multiple failed login attempts detected from IP 192.168.1.100",
            ip_address="192.168.1.100",
            timestamp=datetime.utcnow().isoformat(),
            resolved=False
        ),
        SecurityAlert(
            alert_id="alert_002",
            type="suspicious_activity",
            severity="medium",
            message="Unusual file upload pattern detected",
            ip_address="192.168.1.101",
            user_id=current_user.id,
            timestamp=datetime.utcnow().isoformat(),
            resolved=True
        )
    ]
    
    # Filter by severity if specified
    if severity:
        alerts = [alert for alert in alerts if alert.severity == severity]
    
    # Filter by resolved status if specified
    if resolved is not None:
        alerts = [alert for alert in alerts if alert.resolved == resolved]
    
    return alerts


@router.put("/security-settings", response_model=dict)
async def update_security_settings(
    settings: SecuritySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update security settings (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update security settings"
        )
    
    # This would typically update security settings in the database
    # For now, return success message
    updated_settings = settings.dict(exclude_unset=True)
    
    return {
        "message": "Security settings updated successfully",
        "updated_settings": updated_settings
    }


@router.post("/audit-log", response_model=dict)
async def create_audit_log(
    audit_log: SecurityAuditLog,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create security audit log entry."""
    # This would typically save to an audit log table
    # For now, just log to console
    print(f"SECURITY AUDIT: {audit_log.action} by user {audit_log.user_id} from {audit_log.ip_address}")
    
    return {"message": "Audit log created successfully"}


@router.get("/login-attempts", response_model=List[LoginAttempt])
async def get_login_attempts(
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get login attempt history."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view login attempts"
        )
    
    # This would typically query a login attempts table
    # For now, return mock data
    attempts = [
        LoginAttempt(
            email="user@example.com",
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0...",
            success=True,
            timestamp=datetime.utcnow().isoformat()
        ),
        LoginAttempt(
            email="user@example.com",
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0...",
            success=False,
            timestamp=datetime.utcnow().isoformat()
        )
    ]
    
    # Filter by user_id if specified
    if user_id:
        attempts = [attempt for attempt in attempts if attempt.email == f"user{user_id}@example.com"]
    
    # Filter by IP address if specified
    if ip_address:
        attempts = [attempt for attempt in attempts if attempt.ip_address == ip_address]
    
    return attempts


@router.post("/block-ip", response_model=dict)
async def block_ip_address(
    ip_address: str,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Block an IP address (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can block IP addresses"
        )
    
    # This would typically add the IP to a blocked IPs table
    # For now, return success message
    return {
        "message": f"IP address {ip_address} blocked successfully",
        "reason": reason,
        "blocked_by": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.delete("/unblock-ip/{ip_address}", response_model=dict)
async def unblock_ip_address(
    ip_address: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unblock an IP address (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can unblock IP addresses"
        )
    
    # This would typically remove the IP from the blocked IPs table
    # For now, return success message
    return {
        "message": f"IP address {ip_address} unblocked successfully",
        "unblocked_by": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/security-config", response_model=SecurityConfig)
async def get_security_config(
    current_user: User = Depends(get_current_user)
):
    """Get current security configuration."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view security configuration"
        )
    
    # Return current security configuration
    return SecurityConfig(
        enable_rate_limiting=True,
        enable_csrf_protection=True,
        enable_file_validation=True,
        enable_ip_whitelisting=False,
        enable_audit_logging=True,
        max_file_size_mb=10,
        session_timeout_minutes=30,
        password_policy={
            "min_length": 8,
            "require_uppercase": True,
            "require_lowercase": True,
            "require_numbers": True,
            "require_special_chars": True
        },
        allowed_origins=[
            "http://localhost:3000",
            "https://operatorskillshub.com"
        ],
        trusted_hosts=[
            "localhost",
            "operatorskillshub.com"
        ]
    )
