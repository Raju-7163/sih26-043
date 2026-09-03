from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    problem_id = Column(Integer, nullable=False)
    university_id = Column(Integer, nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    objectives = Column(Text, nullable=True)
    expected_solution = Column(Text, nullable=True)

    status = Column(String(50), default="Proposal")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )