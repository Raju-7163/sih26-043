"""
JWT authentication dependency.

Usage in route:
    current_user = Depends(get_current_user)          # requires valid token
    current_user = Depends(get_optional_user)          # returns None if no token
    current_user = Depends(require_role("government")) # returns user or 403
"""

import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.user import User


# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY  = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_USE_ENV")
ALGORITHM   = "HS256"

oauth2_scheme          = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ── DB dependency ─────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Decode token ──────────────────────────────────────────────────────────────
def _decode_token(token: str) -> Optional[int]:
    """Return user_id from a valid JWT, or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except (JWTError, ValueError):
        return None


# ── Mandatory auth ────────────────────────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = _decode_token(token)
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception

    return user


# ── Optional auth (anonymous-friendly endpoints) ──────────────────────────────
def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Returns the logged-in User, or None if unauthenticated."""
    if not token:
        return None
    user_id = _decode_token(token)
    if user_id is None:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()


# ── Role guard ────────────────────────────────────────────────────────────────
def require_role(*allowed_roles: str):
    """
    Factory that returns a FastAPI dependency enforcing one of the given roles.

    Usage:
        @router.put("/validate")
        def validate(user=Depends(require_role("government"))):
            ...
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {' or '.join(allowed_roles)}.",
            )
        return current_user

    return _check


def assert_org_access(user: User, org_id: int, role: str) -> None:
    """Government may inspect any organisation; org users may only access their own."""
    if user.role == "government":
        return
    if user.role != role or user.org_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own organisation's data.",
        )
