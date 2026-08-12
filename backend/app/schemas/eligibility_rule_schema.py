from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EligibilityRuleCreate(BaseModel):
    scheme_id: int
    minimum_age: Optional[int] = None
    maximum_age: Optional[int] = None
    gender: Optional[str] = None
    maximum_income: Optional[Decimal] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    social_category: Optional[str] = None
    disability_status: Optional[bool] = None


class EligibilityRuleUpdate(BaseModel):
    minimum_age: Optional[int] = None
    maximum_age: Optional[int] = None
    gender: Optional[str] = None
    maximum_income: Optional[Decimal] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    social_category: Optional[str] = None
    disability_status: Optional[bool] = None


class EligibilityRuleOut(EligibilityRuleCreate):
    rule_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)