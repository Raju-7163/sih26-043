from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Collaboration(Base):

    __tablename__ = "collaborations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    project_id = Column(
        Integer,
        nullable=False
    )

    sender_type = Column(
        String(50),
        nullable=False
    )

    sender_name = Column(
        String(255),
        nullable=False
    )

    message_type = Column(
        String(50),
        default="Update"
    )

    message = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )