from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, engine, ensure_problem_schema
from app.routes.problems import router as problems_router
from app.routes.auth import router as auth_router

# Import all models so SQLAlchemy creates their tables on startup
from app.models.user import User
from app.models.university import University
from app.models.university_match import UniversityMatch
from app.models.project import Project
from app.models.milestone import Milestone
from app.models.industry import Industry
from app.models.industry_match import IndustryMatch
from app.models.partnership import Partnership
from app.models.collaboration import Collaboration
from app.models.impact import Impact
from app.models.evidence import Evidence
from app.models.notification import Notification
from app.models.project_member import ProjectMember
from app.models.proposal import Proposal

from app.services.ai_service import test_gemini_connection, analyze_problem

# Create all tables
Base.metadata.create_all(bind=engine)

# Run column-level migrations for the problems table
ensure_problem_schema()


app = FastAPI(
    title="SolveX — Societal Innovation Portal",
    description="SIH 2026 Problem Statement 043",
    version="2.0.0",
)


# ── CORS — allow all origins so any frontend port works ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(problems_router)


# ── Health & debug endpoints ──────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "message": "SolveX backend is running!",
        "database": "Neon PostgreSQL",
        "version": "2.0.0",
    }


@app.get("/api/ai/test")
def test_ai():
    result = test_gemini_connection()
    return {"success": True, "message": result}


@app.get("/api/ai/analyze-test")
def analyze_test():
    problem_text = """
    Our village faces severe flooding every monsoon.
    The drainage system is poor and people have difficulty
    reaching hospitals and schools during heavy rainfall.
    """
    result = analyze_problem(problem_text)
    return {"success": True, "analysis": result}
