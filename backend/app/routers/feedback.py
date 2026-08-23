from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.feedback import Feedback
from app.schemas.feedback_schema import FeedbackCreate, FeedbackOut

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"]
)


@router.post("/", response_model=FeedbackOut)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db)
):
    new_feedback = Feedback(
        user_id=feedback.user_id,
        policy_id=feedback.policy_id,
        scheme_id=feedback.scheme_id,
        rating=feedback.rating,
        comments=feedback.comments
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return new_feedback


@router.get("/", response_model=list[FeedbackOut])
def get_feedback(
    db: Session = Depends(get_db)
):
    feedbacks = db.query(Feedback).order_by(
        Feedback.created_at.desc()
    ).all()

    return feedbacks