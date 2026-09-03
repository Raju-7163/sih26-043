from sqlalchemy import Column, Integer, String, JSON, Text
from app.database.connection import Base


class Industry(Base):
    __tablename__ = "industries"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    location = Column(
        String(255),
        nullable=True
    )

    organization_type = Column(
        String(100),
        nullable=True
    )

    domains = Column(
        JSON,
        nullable=True
    )

    expertise = Column(
        JSON,
        nullable=True
    )

    capabilities = Column(
        JSON,
        nullable=True
    )

    funding_capacity = Column(
        String(100),
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )