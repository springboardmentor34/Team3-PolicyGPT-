from fastapi import APIRouter
from backend.app.schemas.policy_schema import Policy
router = APIRouter(
    prefix="/policies",
    tags=["Policy Management"]
)

policies = []


@router.get("/")
def get_all_policies():
    return {
        "message": "List of all policies",
        "data": policies
    }


@router.post("/")
def create_policy(policy: Policy):
    policies.append(policy)
    return {
        "message": "Policy created successfully",
        "policy": policy
    }