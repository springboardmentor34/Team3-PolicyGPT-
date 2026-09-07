import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICIAL = "official"
    RESEARCHER = "researcher"
    ORGANIZATION = "organization"


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8, description="Must be at least 8 characters long.")
    role: UserRole
    mobile: Optional[str] = None
    state: Optional[str] = None

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: Optional[str]) -> Optional[str]:
        # Blank/omitted stays optional (unchanged) — only a NON-EMPTY value
        # is required to be exactly 10 digits.
        if value and not re.fullmatch(r"\d{10}", value):
            raise ValueError("Mobile number must be exactly 10 digits.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


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