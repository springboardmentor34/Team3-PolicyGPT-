from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICIAL = "official"
    RESEARCHER = "researcher"
    ORGANIZATION = "organization"


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole
    mobile: Optional[str] = None
    state: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    income: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    social_category: Optional[str] = None
    disability_status: Optional[bool] = None