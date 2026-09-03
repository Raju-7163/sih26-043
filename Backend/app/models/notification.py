from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # Who should receive the notification
    recipient_type = Column(String(50), nullable=False)
    # Government / University / Industry / Community

    recipient_id = Column(Integer, nullable=True)

    recipient_name = Column(String(255), nullable=True)

    # Related records
    problem_id = Column(Integer, nullable=True)
    project_id = Column(Integer, nullable=True)
    milestone_id = Column(Integer, nullable=True)

    # Notification information
    notification_type = Column(String(100), nullable=False)

    title = Column(String(255), nullable=False)

    message = Column(Text, nullable=False)

    # Has the recipient seen it?
    is_read = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )