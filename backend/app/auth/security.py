import hashlib
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Secret key used to sign JWT tokens
SECRET_KEY = "your_secret_key_here_change_this"

# Algorithm used for JWT
ALGORITHM = "HS256"

# Token expiry time (in minutes). 30 minutes was too short for a real
# working session (filling multi-section forms, reviewing several
# policies) — sessions were expiring mid-task. 2 hours is generous
# enough that a normal work or demo session won't hit it, while still
# being a bounded, real expiry rather than "forever."
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Convert plain password into hashed password
def hash_password(password: str):
    return pwd_context.hash(password)

# Verify entered password with stored hashed password
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Generate JWT access token
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

# Decode JWT token
def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload
    except JWTError:
        return None


# Password Reset: short-lived, single-purpose token. Stateless (no DB
# column/migration needed) — signed with the same SECRET_KEY, but tagged
# with purpose="password_reset" and a short 15-minute expiry so it can
# never be reused as a normal login/access token even if it leaks.
RESET_TOKEN_EXPIRE_MINUTES = 15


def password_fingerprint(password_hash: str) -> str:
    """Irreversible fingerprint of a user's CURRENT password_hash, embedded
    in the reset token so it's bound to "the password as it was when this
    token was issued." password_hash changes the instant a reset succeeds,
    so a replayed token's fingerprint stops matching on its second use —
    making the token single-use without a denylist or DB column."""
    return hashlib.sha256(password_hash.encode()).hexdigest()


def create_password_reset_token(email: str, password_hash: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "purpose": "password_reset",
        "pwd_fp": password_fingerprint(password_hash),
        "exp": expire,
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_password_reset_token(token: str) -> dict | None:
    """Returns the token's payload (with 'sub' and 'pwd_fp') if it's valid,
    unexpired, and actually a password-reset token (not a normal login
    access token). Returns None otherwise.
    The caller MUST additionally compare payload['pwd_fp'] against
    password_fingerprint(current_user.password_hash) before trusting
    'sub' — that's what makes the token single-use (see reset_password()
    in routers/auth.py)."""
    payload = decode_access_token(token)
    if payload is None:
        return None
    if payload.get("purpose") != "password_reset":
        return None
    return payload