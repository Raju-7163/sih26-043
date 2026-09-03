from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(Integer, nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(
        String(50),
        default="Pending"
    )

    progress = Column(
        Integer,
        default=0
    )

    due_date = Column(
        DateTime(timezone=True),
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