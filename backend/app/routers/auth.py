import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.utils.database import get_db
from app.models.user import User
from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ProfileUpdateRequest,
)
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from app.auth.dependencies import get_current_user
logger = logging.getLogger("policygpt.auth")
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)
@router.post("/register")
def register(user: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role.value,
        mobile=user.mobile,
        state=user.state,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}
@router.post("/login", response_model=TokenResponse)
def login(user: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account has been deactivated. Contact an administrator.",
        )
    token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )
    return {
        "access_token": token,
        "token_type": "bearer"
    }
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "mobile": current_user.mobile,
        "date_of_birth": current_user.date_of_birth,
        "gender": current_user.gender,
        "occupation": current_user.occupation,
        "education": current_user.education,
        "income": current_user.income,
        "state": current_user.state,
        "district": current_user.district,
        "social_category": current_user.social_category,
        "disability_status": current_user.disability_status,
    }
@router.put("/profile")
def update_profile(
    profile: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Profile Management (Module 1): lets a logged-in user edit their own
    profile fields. Email and role are intentionally not editable here —
    email is the login identifier and role changes are an authorization
    concern, not a self-service profile edit."""
    update_data = profile.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Profile updated successfully",
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "mobile": current_user.mobile,
        "date_of_birth": current_user.date_of_birth,
        "gender": current_user.gender,
        "occupation": current_user.occupation,
        "education": current_user.education,
        "income": current_user.income,
        "state": current_user.state,
        "district": current_user.district,
        "social_category": current_user.social_category,
        "disability_status": current_user.disability_status,
    }
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Password Reset step 1. Always returns the same generic message
    whether or not the email exists, so this endpoint can't be used to
    enumerate registered accounts.
    There's no SMTP/email service wired up in this project yet (it's on
    the tech-stack list but not implemented), so for now the reset link
    is written to the server log instead of emailed. Swap the logger.info
    call below for a real email send once SMTP is configured — nothing
    else about this flow needs to change."""
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        reset_token = create_password_reset_token(user.email)
        reset_link = f"http://localhost:4200/reset-password?token={reset_token}"
        logger.info("Password reset link for %s: %s", user.email, reset_link)
    return {
        "message": "If an account with that email exists, a password reset link has been sent."
    }
@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Password Reset step 2. Validates the short-lived reset token and
    sets the new password."""
    email = decode_password_reset_token(payload.token)
    if email is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password has been reset successfully. You can now log in."}