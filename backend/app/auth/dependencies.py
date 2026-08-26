from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.utils.database import get_db
from app.models.user import User
from app.auth.security import decode_access_token


# Required bearer token for protected endpoints.
bearer_scheme = HTTPBearer()

# Optional bearer token for endpoints that can also be used by guests.
bearer_scheme_optional = HTTPBearer(auto_error=False)


def oauth2_scheme(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    return credentials.credentials


def oauth2_scheme_optional(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme_optional
    ),
):
    if credentials:
        return credentials.credentials
    return None


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate the JWT token and return the logged-in user.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")

    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise credentials_exception

    # Block deactivated accounts even if their JWT has not expired yet.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_user_optional(
    token: str = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """
    Like get_current_user, but returns None instead of raising 401
    when there is no token or the token is invalid.
    """

    if not token:
        return None

    payload = decode_access_token(token)

    if payload is None:
        return None

    email = payload.get("sub")

    if email is None:
        return None

    user = db.query(User).filter(User.email == email).first()

    if user is None or not user.is_active:
        return None

    return user


def require_roles(*allowed_roles: str):
    """
    Dependency factory for role-gated endpoints.

    Example:
        Depends(require_roles("admin"))

    Role comparison is case-insensitive.
    """

    allowed_lower = {role.lower() for role in allowed_roles}

    def checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        current_role = (current_user.role or "").strip().lower()

        if current_role not in allowed_lower:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return checker