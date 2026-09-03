from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(Integer, nullable=False)

    title = Column(String(255), nullable=False)

    problem_understanding = Column(Text, nullable=True)

    proposed_approach = Column(Text, nullable=True)

    technology = Column(Text, nullable=True)

    objectives = Column(Text, nullable=True)

    expected_outcome = Column(Text, nullable=True)

    timeline = Column(String(255), nullable=True)

    budget = Column(Float, nullable=True)

    status = Column(String(50), default="Draft")

    review_comments = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )