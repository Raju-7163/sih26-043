from sqlalchemy import Column, Integer, String, JSON
from app.database.connection import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    location = Column(String(255), nullable=True)

    institution_type = Column(String(100), nullable=True)

    disciplines = Column(JSON, nullable=True)

    expertise = Column(JSON, nullable=True)

    facilities = Column(JSON, nullable=True)

    innovation_centres = Column(JSON, nullable=True)

    incubation_facilities = Column(JSON, nullable=True)

    description = Column(String(1000), nullable=True)