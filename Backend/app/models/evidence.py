from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Evidence(Base):

    __tablename__ = "evidence"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    problem_id = Column(
        Integer,
        nullable=True
    )

    project_id = Column(
        Integer,
        nullable=True
    )

    milestone_id = Column(
        Integer,
        nullable=True
    )

    impact_id = Column(
        Integer,
        nullable=True
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_type = Column(
        String(100),
        nullable=True
    )

    file_size = Column(
        Integer,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    uploaded_by = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )