from typing import Optional
from pydantic import BaseModel


class Scheme(BaseModel):
    scheme_name: str
    category: str
    eligibility: str
    benefits: str
    department: str
    state: str

    min_age: Optional[int] = None
    max_age: Optional[int] = None
    max_income: Optional[float] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    social_category: Optional[str] = None
    disability_required: Optional[bool] = None
    application_guidance: Optional[str] = None