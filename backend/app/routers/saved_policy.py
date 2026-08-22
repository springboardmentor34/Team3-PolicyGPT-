from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.saved_policy import SavedPolicy
from app.models.policy import Policy
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.saved_policy_schema import SavedPolicyCreate, SavedPolicyOut
from app.schemas.policy_schema import PolicyOut

router = APIRouter(
    prefix="/saved-policies",
    tags=["Saved Policies"]
)


@router.get("/me")
def get_my_saved_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the logged-in citizen's saved policies, newest first."""
    saved_rows = (
        db.query(SavedPolicy)
        .filter(SavedPolicy.user_id == current_user.user_id)
        .order_by(SavedPolicy.saved_at.desc())
        .all()
    )

    results = []
    for row in saved_rows:
        policy = db.query(Policy).filter(Policy.policy_id == row.policy_id).first()
        if policy:
            results.append({
                "saved_id": row.saved_id,
                "saved_at": row.saved_at,
                "policy": PolicyOut.model_validate(policy)
            })

    return {
        "message": "Saved policies",
        "count": len(results),
        "data": results
    }


@router.get("/is-saved/{policy_id}")
def check_if_saved(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Used by the frontend to show a filled vs outline bookmark icon."""
    existing = (
        db.query(SavedPolicy)
        .filter(SavedPolicy.user_id == current_user.user_id, SavedPolicy.policy_id == policy_id)
        .first()
    )
    return {"saved": existing is not None}


@router.post("/")
def save_policy(
    payload: SavedPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(Policy.policy_id == payload.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy with id {payload.policy_id} not found")

    existing = (
        db.query(SavedPolicy)
        .filter(SavedPolicy.user_id == current_user.user_id, SavedPolicy.policy_id == payload.policy_id)
        .first()
    )
    if existing:
        return {"message": "Policy already saved", "saved_id": existing.saved_id}

    new_saved = SavedPolicy(user_id=current_user.user_id, policy_id=payload.policy_id)
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)

    return {"message": "Policy saved successfully", "saved_id": new_saved.saved_id}


@router.delete("/{policy_id}")
def unsave_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = (
        db.query(SavedPolicy)
        .filter(SavedPolicy.user_id == current_user.user_id, SavedPolicy.policy_id == policy_id)
        .first()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="This policy isn't in your saved list")

    db.delete(existing)
    db.commit()

    return {"message": "Policy removed from saved list"}