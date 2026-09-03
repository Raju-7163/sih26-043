import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


def ensure_problem_schema():

    inspector = inspect(engine)

    if not inspector.has_table("problems"):

        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("problems")
    }

    missing_columns = {
        "location": "VARCHAR(255)",
        "category": "VARCHAR(100)",
        "affected": "VARCHAR(100)",
        "input_type": "VARCHAR(50) DEFAULT 'text'",
        "language": "VARCHAR(50) DEFAULT 'English'",
        "detected_category": "VARCHAR(100)",
        "detected_department": "VARCHAR(150)",
        "department_confidence": "FLOAT",
        "urgency": "VARCHAR(50) DEFAULT 'Medium'",
        "priority_score": "INTEGER",
        "impact_score": "INTEGER",
        "affected_population": "VARCHAR(255)",
        "required_expertise": "JSON",
        "suggested_solution_areas": "JSON",
        "duplicate_of": "INTEGER",
        "duplicate_count": "INTEGER DEFAULT 0",
        "validation_status": "VARCHAR(50) DEFAULT 'Pending'",
        "status": "VARCHAR(50) DEFAULT 'Submitted'",
        "submitted_by": "INTEGER",
        "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
    }

    with engine.begin() as connection:

        for column_name, column_type in missing_columns.items():

            if column_name not in existing_columns:

                connection.execute(
                    text(
                        f"ALTER TABLE problems ADD COLUMN {column_name} {column_type}"
                    )
                )
