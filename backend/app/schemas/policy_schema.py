from pydantic import BaseModel


class Policy(BaseModel):
    policy_name: str
    category: str
    department: str
    state: str
    status: str