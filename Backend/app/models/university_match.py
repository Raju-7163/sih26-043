from sqlalchemy import Column, Integer, Float, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class UniversityMatch(Base):
    __tablename__ = "university_matches"

    id = Column(Integer, primary_key=True, index=True)

    problem_id = Column(Integer, nullable=False)
    university_id = Column(Integer, nullable=False)

    match_score = Column(Float, nullable=True)
    expertise_score = Column(Float, nullable=True)

    category_match = Column(Boolean, default=False)

    matched_expertise = Column(JSON, nullable=True)
    missing_expertise = Column(JSON, nullable=True)

    status = Column(String(50), default="Pending")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )