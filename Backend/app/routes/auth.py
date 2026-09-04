"""
Authentication routes.

POST /auth/register   → create a new user account
POST /auth/login      → returns JWT access token
GET  /auth/me         → returns current user profile (requires token)
PUT  /auth/me         → update name / organization_name
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
from app.models.university import University
from app.models.industry import Industry
from app.deps import get_current_user, get_db, SECRET_KEY, ALGORITHM


router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Token helpers ─────────────────────────────────────────────────────────────
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")  # 7 days default
)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Request / Response schemas ────────────────────────────────────────────────

VALID_ROLES = {"citizen", "government", "university", "industry"}


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "citizen"
    organization_name: Optional[str] = None
    org_id: Optional[int] = None  # university_id or industry_id for org accounts

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
    role: str

    @field_validator("role")
    @classmethod
    def validate_login_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(VALID_ROLES)}")
        return v


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    organization_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    organization_name: Optional[str]
    org_id: Optional[int]
    is_active: bool


# ── Helpers ───────────────────────────────────────────────────────────────────

def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "organization_name": user.organization_name,
        "org_id": user.org_id,
        "is_active": user.is_active,
    }


# ── REGISTER ──────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
):
    # Check for duplicate email
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    org_id = body.org_id
    organization_name = body.organization_name

    # Link university / industry accounts to existing org records when possible
    if body.role == "university" and not org_id and organization_name:
        uni = (
            db.query(University)
            .filter(University.name.ilike(organization_name.strip()))
            .first()
        )
        if uni:
            org_id = uni.id
            organization_name = uni.name
    if body.role == "industry" and not org_id and organization_name:
        industry = (
            db.query(Industry)
            .filter(Industry.name.ilike(organization_name.strip()))
            .first()
        )
        if industry:
            org_id = industry.id
            organization_name = industry.name

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        organization_name=organization_name,
        org_id=org_id,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)

    return {
        "message": "Account created successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": _user_to_dict(user),
    }


# ── LOGIN ─────────────────────────────────────────────────────────────────────

@router.post("/login")
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact support.",
        )

    if user.role != body.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"These credentials are not registered as {body.role}. Selected role must match the account.",
        )

    token = create_access_token(user.id)

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": _user_to_dict(user),
    }


# ── CURRENT USER ──────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_dict(current_user)


# ── UPDATE PROFILE ────────────────────────────────────────────────────────────

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

    return {
        "message": "Profile updated.",
        "user": _user_to_dict(current_user),
    }


# ── LOGOUT (stateless JWT — client discards the token) ────────────────────────

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {
        "message": "Logged out.",
        "user_id": current_user.id,
    }


# ── DEMO ACCOUNTS (development / SIH demo only) ───────────────────────────────

def _demo_mode_enabled() -> bool:
    return os.getenv("DEMO_MODE", "false").strip().lower() in {"1", "true", "yes"}


def _demo_password() -> str:
    return os.getenv("DEMO_PASSWORD", "demo123")


DEMO_ACCOUNT_SPECS = (
    {
        "name": "Demo Citizen",
        "email": "citizen@demo.com",
        "role": "citizen",
        "organization_name": None,
    },
    {
        "name": "Demo Government Officer",
        "email": "govt@demo.com",
        "role": "government",
        "organization_name": "District Administration",
    },
    {
        "name": "Demo University",
        "email": "uni@demo.com",
        "role": "university",
        "organization_name": None,
    },
    {
        "name": "Demo Industry",
        "email": "industry@demo.com",
        "role": "industry",
        "organization_name": None,
    },
)


def seed_demo_accounts() -> None:
    """Create demo users and realistic demo University/Industry records in PostgreSQL."""
    if not _demo_mode_enabled():
        return

    password = _demo_password()
    db = SessionLocal()
    try:
        # Seed 3 Realistic Demo Universities if not present
        demo_unis_data = [
            {
                "name": "IIT Delhi — Department of Civil & Environmental Engineering",
                "location": "New Delhi, NCR",
                "institution_type": "IIT / Central University",
                "disciplines": ["Civil Engineering", "Environmental Engineering", "Water Resources", "Computer Science"],
                "expertise": ["Hydrology", "Flood Management", "GIS", "Remote Sensing", "Water Resources", "Environmental Engineering", "Artificial Intelligence", "IoT Sensors"],
                "facilities": ["Advanced Environmental Lab", "Hydrology Research Center", "AI & Robotics Lab"],
                "innovation_centres": ["Technology Innovation Hub (TIH)"],
                "incubation_facilities": ["FITT IIT Delhi Incubation Center"],
                "description": "Premier research institution specializing in urban water management, hydrology, and environmental sensing."
            },
            {
                "name": "IIT (ISM) Dhanbad — Center of Water & Disaster Management",
                "location": "Dhanbad, Jharkhand",
                "institution_type": "IIT / Institution of National Importance",
                "disciplines": ["Environmental Science", "Mining Engineering", "Civil Engineering", "Disaster Mitigation"],
                "expertise": ["Disaster Management", "Waste Management", "Mining Reclamation", "Soil Science", "Hydrology", "GIS"],
                "facilities": ["Geo-Spatial Analysis Lab", "Water Quality Control Lab"],
                "innovation_centres": ["Center for Societal Technology Transfer"],
                "incubation_facilities": ["TexMin Incubation Center"],
                "description": "Leading research hub for disaster management, waste recycling, and water resource monitoring."
            },
            {
                "name": "IIT Roorkee — School of Hydrology & Renewable Energy",
                "location": "Roorkee, Uttarakhand",
                "institution_type": "IIT / Central Institute",
                "disciplines": ["Hydrology", "Renewable Energy", "Earthquake Engineering", "Electrical Engineering"],
                "expertise": ["Hydrology", "Flood Warning Systems", "Solar Energy", "Smart Grids", "River Engineering", "IoT"],
                "facilities": ["National Hydrology Lab", "Renewable Energy Testing Center"],
                "innovation_centres": ["TIDES Incubation Center"],
                "incubation_facilities": ["Innovation & Incubation Cell"],
                "description": "Pioneer institute in water resources engineering, dam safety, and renewable energy technologies."
            }
        ]

        uni_records = []
        for u_data in demo_unis_data:
            existing_uni = db.query(University).filter(University.name == u_data["name"]).first()
            if not existing_uni:
                existing_uni = University(**u_data)
                db.add(existing_uni)
                db.commit()
                db.refresh(existing_uni)
            uni_records.append(existing_uni)

        first_uni = uni_records[0]

        # Seed 3 Realistic Demo Industry / MSME / CSR Organizations if not present
        demo_inds_data = [
            {
                "name": "AquaTech Solutions Ltd (Water & CSR Division)",
                "domain": "Water Infrastructure, Smart Sensors & CSR",
                "capabilities": ["IoT Sensors", "Water Purification", "Smart Drainage", "CSR Funding", "Field Implementation"],
                "resources": ["Engineering Field Team", "Water Sensor Kits", "CSR Impact Fund"],
                "location": "Mumbai / National Operations"
            },
            {
                "name": "EcoClean Municipal Systems India Ltd",
                "domain": "Waste Management & Urban Infrastructure",
                "capabilities": ["Waste Classification", "Smart Bin Sensors", "Recycling Plants", "Route Optimization", "MSME Manufacturing"],
                "resources": ["Waste Processing Machinery", "Fleet Logistics", "CSR Project Management"],
                "location": "Vadodara / Gujarat"
            },
            {
                "name": "SolveX Tech & Infrastructure Solutions Pvt Ltd",
                "domain": "Smart City Technology & Hardware Manufacturing",
                "capabilities": ["Hardware Prototyping", "Cloud Platform", "Civil Infrastructure", "Solar Microgrids", "CSR Funding"],
                "resources": ["Hardware Lab", "Cloud Infrastructure", "Field Technicians"],
                "location": "Bengaluru / National HQ"
            }
        ]

        ind_records = []
        for i_data in demo_inds_data:
            existing_ind = db.query(Industry).filter(Industry.name == i_data["name"]).first()
            if not existing_ind:
                existing_ind = Industry(**i_data)
                db.add(existing_ind)
                db.commit()
                db.refresh(existing_ind)
            ind_records.append(existing_ind)

        first_ind = ind_records[0]

        for spec in DEMO_ACCOUNT_SPECS:
            existing = db.query(User).filter(User.email == spec["email"]).first()
            org_id = None
            org_name = spec["organization_name"]

            if spec["role"] == "university":
                org_id = first_uni.id
                org_name = first_uni.name
            elif spec["role"] == "industry":
                org_id = first_ind.id
                org_name = first_ind.name

            if existing:
                if existing.org_id != org_id or existing.organization_name != org_name:
                    existing.org_id = org_id
                    existing.organization_name = org_name
                    db.commit()
                continue

            db.add(
                User(
                    name=spec["name"],
                    email=spec["email"],
                    hashed_password=hash_password(password),
                    role=spec["role"],
                    organization_name=org_name,
                    org_id=org_id,
                    is_active=True,
                )
            )

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error seeding demo accounts: {e}")
    finally:
        db.close()


@router.get("/demo")
def get_demo_accounts():
    """Return demo credentials only when DEMO_MODE is enabled."""
    if not _demo_mode_enabled():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo accounts are disabled.",
        )

    password = _demo_password()
    return {
        "enabled": True,
        "accounts": [
            {
                "name": spec["name"],
                "email": spec["email"],
                "role": spec["role"],
                "password": password,
            }
            for spec in DEMO_ACCOUNT_SPECS
        ],
    }
