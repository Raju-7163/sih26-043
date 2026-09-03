from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Partnership(Base):

    __tablename__ = "partnerships"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    problem_id = Column(
        Integer,
        nullable=False
    )

    project_id = Column(
        Integer,
        nullable=True
    )

    industry_id = Column(
        Integer,
        nullable=False
    )

    contribution_type = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        default="Proposed"
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