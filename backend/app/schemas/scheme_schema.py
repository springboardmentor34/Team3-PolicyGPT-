from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SchemeCategory(str, Enum):
    SCHOLARSHIPS = "Scholarships"
    FARMER_WELFARE = "Farmer Welfare"
    HEALTHCARE = "Healthcare"
    HOUSING = "Housing"
    BUSINESS_SUPPORT = "Business Support"
    WOMEN_EMPOWERMENT = "Women Empowerment"
    SENIOR_CITIZEN_WELFARE = "Senior Citizen Welfare"
    STUDENT_SCHEMES = "Student Schemes"
    EMPLOYMENT_PROGRAMS = "Employment Programs"
    SOCIAL_SECURITY = "Social Security"


class SchemeCreate(BaseModel):
    scheme_name: str
    description: Optional[str] = None
    category: Optional[SchemeCategory] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    benefits: Optional[str] = None
    application_process: Optional[str] = None
    required_documents: Optional[str] = None
    official_website: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    uploaded_by_user_id: int

    model_config = ConfigDict(use_enum_values=True)


class SchemeUpdate(BaseModel):
    scheme_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[SchemeCategory] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    benefits: Optional[str] = None
    application_process: Optional[str] = None
    required_documents: Optional[str] = None
    official_website: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

    model_config = ConfigDict(use_enum_values=True)


class SchemeOut(SchemeCreate):
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)