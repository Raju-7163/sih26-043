from sqlalchemy import func

from app.models.problem import Problem
from app.models.university import University
from app.models.university_match import UniversityMatch
from app.models.industry import Industry
from app.models.industry_match import IndustryMatch
from app.models.project import Project
from app.models.milestone import Milestone
from app.models.partnership import Partnership


def get_dashboard_statistics(db):

    # ---------------------------------------------------------
    # PROBLEM STATISTICS
    # ---------------------------------------------------------

    total_problems = db.query(Problem).count()

    submitted_problems = db.query(Problem).filter(
        Problem.status == "Submitted"
    ).count()

    validated_problems = db.query(Problem).filter(
        Problem.validation_status == "Validated"
    ).count()

    rejected_problems = db.query(Problem).filter(
        Problem.validation_status == "Rejected"
    ).count()

    duplicate_problems = db.query(Problem).filter(
        Problem.status == "Duplicate"
    ).count()

    # ---------------------------------------------------------
    # PROBLEMS BY CATEGORY
    # ---------------------------------------------------------

    category_rows = db.query(
        Problem.category,
        func.count(Problem.id)
    ).group_by(
        Problem.category
    ).all()

    problems_by_category = []

    for category, count in category_rows:

        problems_by_category.append({
            "category": category or "Unknown",
            "count": count
        })

    # ---------------------------------------------------------
    # PROBLEMS BY LOCATION
    # ---------------------------------------------------------

    location_rows = db.query(
        Problem.location,
        func.count(Problem.id)
    ).group_by(
        Problem.location
    ).all()

    problems_by_location = []

    for location, count in location_rows:

        problems_by_location.append({
            "location": location or "Unknown",
            "count": count
        })

    # ---------------------------------------------------------
    # UNIVERSITY STATISTICS
    # ---------------------------------------------------------

    total_universities = db.query(
        University
    ).count()

    university_matches = db.query(
        UniversityMatch
    ).count()

    accepted_universities = db.query(
        UniversityMatch
    ).filter(
        UniversityMatch.status == "Accepted"
    ).count()

    # ---------------------------------------------------------
    # INDUSTRY STATISTICS
    # ---------------------------------------------------------

    total_industries = db.query(
        Industry
    ).count()

    industry_matches = db.query(
        IndustryMatch
    ).count()

    accepted_industries = db.query(
        IndustryMatch
    ).filter(
        IndustryMatch.status == "Accepted"
    ).count()

    # ---------------------------------------------------------
    # PARTNERSHIP STATISTICS
    # ---------------------------------------------------------

    total_partnerships = db.query(
        Partnership
    ).count()

    active_partnerships = db.query(
        Partnership
    ).filter(
        Partnership.status == "Active"
    ).count()

    completed_partnerships = db.query(
        Partnership
    ).filter(
        Partnership.status == "Completed"
    ).count()

    # ---------------------------------------------------------
    # PROJECT STATISTICS
    # ---------------------------------------------------------

    total_projects = db.query(
        Project
    ).count()

    projects_by_status_rows = db.query(
        Project.status,
        func.count(Project.id)
    ).group_by(
        Project.status
    ).all()

    projects_by_status = []

    for status, count in projects_by_status_rows:

        projects_by_status.append({
            "status": status,
            "count": count
        })

    completed_projects = db.query(
        Project
    ).filter(
        Project.status == "Resolved"
    ).count()

    deployed_projects = db.query(
        Project
    ).filter(
        Project.status == "Deployed"
    ).count()

    pilot_projects = db.query(
        Project
    ).filter(
        Project.status == "Pilot"
    ).count()

    prototype_projects = db.query(
        Project
    ).filter(
        Project.status == "Prototype"
    ).count()

    testing_projects = db.query(
        Project
    ).filter(
        Project.status == "Testing"
    ).count()

    # ---------------------------------------------------------
    # MILESTONE STATISTICS
    # ---------------------------------------------------------

    total_milestones = db.query(
        Milestone
    ).count()

    completed_milestones = db.query(
        Milestone
    ).filter(
        Milestone.status == "Completed"
    ).count()

    # ---------------------------------------------------------
    # OVERALL MILESTONE PROGRESS
    # ---------------------------------------------------------

    progress_row = db.query(
        func.avg(Milestone.progress)
    ).first()

    overall_progress = progress_row[0] or 0

    # ---------------------------------------------------------
    # RETURN DASHBOARD
    # ---------------------------------------------------------

    return {

        "problems": {
            "total": total_problems,
            "submitted": submitted_problems,
            "validated": validated_problems,
            "rejected": rejected_problems,
            "duplicates": duplicate_problems
        },

        "problems_by_category": problems_by_category,

        "problems_by_location": problems_by_location,

        "universities": {
            "total": total_universities,
            "total_matches": university_matches,
            "accepted": accepted_universities
        },

        "industries": {
            "total": total_industries,
            "total_matches": industry_matches,
            "accepted": accepted_industries
        },

        "partnerships": {
            "total": total_partnerships,
            "active": active_partnerships,
            "completed": completed_partnerships
        },

        "projects": {
            "total": total_projects,
            "prototype": prototype_projects,
            "testing": testing_projects,
            "pilot": pilot_projects,
            "deployed": deployed_projects,
            "resolved": completed_projects,
            "by_status": projects_by_status
        },

        "milestones": {
            "total": total_milestones,
            "completed": completed_milestones,
            "overall_progress": round(
                float(overall_progress),
                2
            )
        }
    }