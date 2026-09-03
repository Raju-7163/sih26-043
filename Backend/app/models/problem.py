from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.sql import func

from app.database.connection import Base


class Problem(Base):

    __tablename__ = "problems"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    location = Column(
        String(255),
        nullable=True
    )

    category = Column(
        String(100),
        nullable=True
    )

    affected = Column(
        String(100),
        nullable=True
    )

    input_type = Column(
        String(50),
        default="text"
    )

    language = Column(
        String(50),
        default="English"
    )

    detected_category = Column(
        String(100),
        nullable=True
    )

    detected_department = Column(
        String(150),
        nullable=True
    )

    department_confidence = Column(
        Float,
        nullable=True
    )

    urgency = Column(
        String(50),
        default="Medium"
    )

    priority_score = Column(
        Integer,
        nullable=True
    )

    impact_score = Column(
        Integer,
        nullable=True
    )

    affected_population = Column(
        String(255),
        nullable=True
    )

    required_expertise = Column(
        JSON,
        nullable=True
    )

    suggested_solution_areas = Column(
        JSON,
        nullable=True
    )

    duplicate_of = Column(
        Integer,
        nullable=True
    )

    duplicate_count = Column(
        Integer,
        default=0
    )

    validation_status = Column(
        String(50),
        default="Pending"
    )

    status = Column(
        String(50),
        default="Submitted"
    )

    # FK to users.id — nullable so old anonymous problems remain valid
    submitted_by = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )