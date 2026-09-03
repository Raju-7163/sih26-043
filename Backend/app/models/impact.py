from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Impact(Base):

    __tablename__ = "impacts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    project_id = Column(
        Integer,
        nullable=False
    )

    metric_name = Column(
        String(255),
        nullable=False
    )

    metric_unit = Column(
        String(100),
        nullable=True
    )
    direction = Column(
        String(20),
        default="increase"
    )

    baseline_value = Column(
        Float,
        nullable=True
    )

    current_value = Column(
        Float,
        nullable=True
    )

    target_value = Column(
        Float,
        nullable=True
    )

    beneficiaries = Column(
        Integer,
        nullable=True
    )

    location = Column(
        String(255),
        nullable=True
    )

    evidence = Column(
        Text,
        nullable=True
    )

    notes = Column(
        Text,
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