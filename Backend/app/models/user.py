"""
User model — supports four roles:
  citizen     → can submit problems, track status
  government  → can validate/reject problems
  university  → can accept/reject problem requests
  industry    → can accept/reject partnership requests
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic identity
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Role — one of: citizen | government | university | industry
    role = Column(String(50), nullable=False, default="citizen")

    # For university / industry users, link to the org record
    # (university_id or industry_id in their respective tables)
    org_id = Column(Integer, nullable=True)
    organization_name = Column(String(255), nullable=True)

    # Account status
    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
