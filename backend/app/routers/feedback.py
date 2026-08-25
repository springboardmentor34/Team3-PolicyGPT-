from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.feedback import Feedback
from app.models.policy import Policy
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.feedback_schema import FeedbackCreate, FeedbackOut
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"]
)


@router.post("/", response_model=FeedbackOut)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Requires login now — previously anyone, logged in or not, could
    submit feedback claiming to be any user_id, since the client sent it
    directly and nothing checked who was actually making the request.
    user_id is always the real authenticated caller now, same fix
    pattern as Policy/Scheme's uploaded_by_user_id.
    """
    if feedback.policy_id is not None:
        if not db.query(Policy).filter(Policy.policy_id == feedback.policy_id).first():
            raise HTTPException(status_code=404, detail="Policy not found")

    if feedback.scheme_id is not None:
        if not db.query(Scheme).filter(Scheme.scheme_id == feedback.scheme_id).first():
            raise HTTPException(status_code=404, detail="Scheme not found")

    new_feedback = Feedback(
        user_id=current_user.user_id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrator")),
):
    """
    Admin-only now — previously this had no auth check at all, meaning
    every citizen's raw feedback comments were readable by anyone,
    logged in or not. Also now resolves submitted_by_name so Admin can
    actually tell who left which piece of feedback, same reasoning as
    Policy Approvals' submitted_by_name.
    """
    feedbacks = db.query(Feedback).order_by(
        Feedback.created_at.desc()
    ).all()

    results = []
    for f in feedbacks:
        item = FeedbackOut.model_validate(f).model_dump()
        submitter = db.query(User).filter(User.user_id == f.user_id).first()
        item["submitted_by_name"] = submitter.full_name if submitter else "Unknown"
        results.append(item)

    return results