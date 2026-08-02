from pydantic import BaseModel


class Scheme(BaseModel):
    scheme_name: str
    category: str
    eligibility: str
    benefits: str
    department: str
    state: str