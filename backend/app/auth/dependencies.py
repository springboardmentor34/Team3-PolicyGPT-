from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.utils.database import get_db
from app.models.user import User
from app.auth.security import decode_access_token
# tokenUrl is just for Swagger's "Authorize" button — login itself still
# accepts a plain JSON body, this doesn't change that.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
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
    # Blocks a deactivated account immediately, even mid-session with a
    # still-valid token — not just at the next login attempt. Without
    # this, an admin "deactivating" someone would have no real effect.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
def get_current_user_optional(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    """
    Like get_current_user, but returns None instead of raising 401 when
    there's no token or it's invalid — for endpoints usable by guests
    (e.g. search) that should still log history when someone IS logged in.
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
    Usage:  Depends(require_roles("admin"))
    Compares case-insensitively since existing user.role values in the
    database aren't consistently cased (e.g. sample data uses "Government
    Official" while the registration enum uses "official"). Raises 403
    (not 401 — the user IS authenticated, just not authorized) if the
    current user's role isn't in the allowed set.
    """
    allowed_lower = {r.lower() for r in allowed_roles}
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if (current_user.role or "").strip().lower() not in allowed_lower:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user
    return checker