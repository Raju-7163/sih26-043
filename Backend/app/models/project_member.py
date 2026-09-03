from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(Integer, nullable=False)

    name = Column(String(255), nullable=False)

    role = Column(String(100), nullable=False)

    department = Column(String(255), nullable=True)

    email = Column(String(255), nullable=True)

    member_type = Column(String(50), nullable=False)
    # Student / Faculty / Researcher / Mentor / Industry Expert

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )