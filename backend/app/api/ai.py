"""
AI and analytics API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.ai import ContentGeneration, PredictiveScore, InstructorMetric
from ..api.auth import get_current_user

router = APIRouter()


@router.get("/content-generations")
async def get_content_generations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI content generations (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    generations = db.query(ContentGeneration).all()
    return generations


@router.get("/predictive-scores")
async def get_predictive_scores(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get predictive scores for current user."""
    scores = db.query(PredictiveScore).filter(PredictiveScore.user_id == current_user.id).all()
    return scores

