from pydantic import BaseModel


class EligibilityRequest(BaseModel):
    age: int
    gender: str
    income: float
    occupation: str
    education: str
    location: str
    category: str
    social_category: str
    disability_status: bool