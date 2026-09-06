"""
Authentication routes.

POST /auth/register   → create account
POST /auth/login      → returns JWT token
GET  /auth/me         → current user profile (requires token)
PUT  /auth/me         → update name / org
GET  /auth/demo       → demo credentials for login page
POST /auth/logout     → client-side logout acknowledgement
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.user import User
from app.deps import get_current_user, get_db, SECRET_KEY, ALGORITHM


router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Token ─────────────────────────────────────────────────────────────────────
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")   # 7 days
)


def create_access_token(user_id: int) -> str:
    expire  = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Request schemas ───────────────────────────────────────────────────────────
VALID_ROLES = {"citizen", "government", "university", "industry"}


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "citizen"
    organization_name: Optional[str] = None
    org_id: Optional[int] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(VALID_ROLES)}")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    organization_name: Optional[str] = None


# ── Helper ────────────────────────────────────────────────────────────────────
def _user_dict(user: User) -> dict:
    return {
        "id":                user.id,
        "name":              user.name,
        "email":             user.email,
        "role":              user.role,
        "organization_name": user.organization_name,
        "org_id":            user.org_id,
        "is_active":         user.is_active,
    }


# ── REGISTER ──────────────────────────────────────────────────────────────────
@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name              = body.name,
        email             = body.email,
        hashed_password   = hash_password(body.password),
        role              = body.role,
        organization_name = body.organization_name,
        org_id            = body.org_id,
        is_active         = True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message":      "Account created successfully.",
        "access_token": create_access_token(user.id),
        "token_type":   "bearer",
        "user":         _user_dict(user),
    }


# ── LOGIN ─────────────────────────────────────────────────────────────────────
@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    return {
        "message":      "Login successful.",
        "access_token": create_access_token(user.id),
        "token_type":   "bearer",
        "user":         _user_dict(user),
    }


# ── ME ────────────────────────────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.put("/me")
def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        current_user.name = body.name
    if body.organization_name is not None:
        current_user.organization_name = body.organization_name

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated.", "user": _user_dict(current_user)}


# ── DEMO ACCOUNTS ─────────────────────────────────────────────────────────────
@router.get("/demo")
def get_demo_accounts():
    """
    Returns demo login credentials for the login page quick-fill buttons.
    Only exposes the known demo emails and the shared demo password.
    """
    return {
        "accounts": [
            {"role": "citizen",    "email": "citizen@demo.com",  "password": "demo123"},
            {"role": "government", "email": "govt@demo.com",     "password": "demo123"},
            {"role": "university", "email": "uni@demo.com",      "password": "demo123"},
            {"role": "industry",   "email": "industry@demo.com", "password": "demo123"},
        ]
    }


# ── LOGOUT ────────────────────────────────────────────────────────────────────
@router.post("/logout")
def logout():
    """JWT is stateless — real logout happens client-side by deleting the token."""
    return {"message": "Logged out successfully."}
