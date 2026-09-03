from sqlalchemy import Column, Integer, Float, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class IndustryMatch(Base):
    __tablename__ = "industry_matches"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    problem_id = Column(
        Integer,
        nullable=False
    )

    industry_id = Column(
        Integer,
        nullable=False
    )

    match_score = Column(
        Float,
        nullable=True
    )

    expertise_score = Column(
        Float,
        nullable=True
    )

    domain_match = Column(
        Boolean,
        default=False
    )

    capability_match = Column(
        Boolean,
        default=False
    )

    matched_expertise = Column(
        JSON,
        nullable=True
    )

    missing_expertise = Column(
        JSON,
        nullable=True
    )

    matched_capabilities = Column(
        JSON,
        nullable=True
    )

    missing_capabilities = Column(
        JSON,
        nullable=True
    )

    status = Column(
        String(50),
        default="Pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )