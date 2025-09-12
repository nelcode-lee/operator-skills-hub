"""
Configuration settings for the Operator Skills Hub application.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    app_name: str = "Operator Skills Hub"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database - Using Neon DB as preferred
    database_url: str = "postgresql://postgres:postgres@localhost:5432/operator_skills_hub"
    database_test_url: str = "postgresql://postgres:postgres@localhost:5432/operator_skills_hub_test"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"  # MUST be changed in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Security Settings
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_special_chars: bool = True
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window_minutes: int = 15
    
    # File Upload Security
    max_file_size_mb: int = 10
    allowed_file_types: list = ["application/pdf", "image/jpeg", "image/png", "image/gif", "text/plain"]
    
    # Session Security
    session_timeout_minutes: int = 30
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 15
    
    # AI Integration
    openai_api_key: Optional[str] = None
    pinecone_api_key: Optional[str] = None
    pinecone_environment: str = "us-west1-gcp"
    
    # AI Model Configuration
    ai_model: str = "gpt-3.5-turbo"
    ai_max_tokens: int = 2000
    ai_temperature: float = 0.7
    ai_embedding_model: str = "all-MiniLM-L6-v2"
    
    # Vector Store Configuration
    vector_store_path: str = "data/vector_store"
    vector_dimension: int = 384
    vector_index_type: str = "faiss"
    
    # Content Generation Settings
    default_question_count: int = 10
    default_passing_score: int = 70
    default_time_limit: int = 30
    
    # File Storage
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "operator-skills-hub"
    
    # CSCS Integration
    cscs_api_key: Optional[str] = None
    cscs_api_url: str = "https://api.cscs.co.uk"
    
    # Email/SMS
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # Payment Processing
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
