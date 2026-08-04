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