from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import or_
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import shutil
from typing import Optional

from app.database.connection import SessionLocal
from app.models.problem import Problem
from app.services.analysis_service import analyze_problem
from app.services.duplicate_service import find_duplicate
from app.services.university_matching_service import find_matching_universities
from app.models.university import University
from app.models.university_match import UniversityMatch
from app.models.project import Project
from app.models.milestone import Milestone
from app.models.industry import Industry
from app.models.industry_match import IndustryMatch
from app.services.industry_matching_service import find_matching_industries
from app.models.partnership import Partnership
from app.models.collaboration import Collaboration
from app.services.dashboard_service import get_dashboard_statistics
from app.models.impact import Impact
from app.models.evidence import Evidence
from app.services.notification_service import create_notification
from app.models.notification import Notification
from app.models.project_member import ProjectMember
from app.models.proposal import Proposal
from app.deps import assert_org_access, get_current_user, get_optional_user, require_role
from app.models.user import User
from sqlalchemy import func


router = APIRouter(
    prefix="/api/problems",
    tags=["Problems"]
)


# ==========================================
# DATABASE DEPENDENCY
# ==========================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def _can_view_problem(db: Session, user: User, problem: Problem) -> bool:
    if user.role == "government":
        return True
    if user.role == "citizen":
        return problem.submitted_by == user.id
    if user.role == "university" and user.org_id:
        return (
            db.query(UniversityMatch)
            .filter(
                UniversityMatch.problem_id == problem.id,
                UniversityMatch.university_id == user.org_id,
            )
            .first()
            is not None
        )
    if user.role == "industry" and user.org_id:
        return (
            db.query(IndustryMatch)
            .filter(
                IndustryMatch.problem_id == problem.id,
                IndustryMatch.industry_id == user.org_id,
            )
            .first()
            is not None
        )
    return False


def _require_problem_access(db: Session, user: User, problem: Problem) -> None:
    if not _can_view_problem(db, user, problem):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this problem.",
        )


# ==========================================
# REQUEST MODEL
# ==========================================

class ProblemCreate(BaseModel):

    title: str

    description: str

    location: str | None = None

    category: str | None = None

    affected: str | None = None

    urgency: str = "Medium"

    input_type: str = "text"

    language: str = "English"


@router.post("/projects/{project_id}/members")
def add_project_member(
    project_id: int,
    name: str,
    role: str,
    member_type: str,
    department: str = None,
    email: str = None,
    db: Session = Depends(get_db)
):
    # Check project
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    allowed_member_types = [
        "Student",
        "Faculty",
        "Researcher",
        "Mentor",
        "Industry Expert"
    ]

    if member_type not in allowed_member_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid member type"
        )

    member = ProjectMember(
        project_id=project_id,
        name=name,
        role=role,
        department=department,
        email=email,
        member_type=member_type
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "message": "Team member added successfully",
        "member": {
            "id": member.id,
            "project_id": member.project_id,
            "name": member.name,
            "role": member.role,
            "department": member.department,
            "email": member.email,
            "member_type": member.member_type
        }
    }

@router.get("/projects/{project_id}/members")
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()

    return [
        {
            "id": member.id,
            "project_id": member.project_id,
            "name": member.name,
            "role": member.role,
            "department": member.department,
            "email": member.email,
            "member_type": member.member_type,
            "created_at": member.created_at
        }
        for member in members
    ]

@router.put("/projects/members/{member_id}")
def update_project_member(
    member_id: int,
    name: str = None,
    role: str = None,
    member_type: str = None,
    department: str = None,
    email: str = None,
    db: Session = Depends(get_db)
):
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Team member not found"
        )

    allowed_member_types = [
        "Student",
        "Faculty",
        "Researcher",
        "Mentor",
        "Industry Expert"
    ]

    if member_type is not None:
        if member_type not in allowed_member_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid member type"
            )
        member.member_type = member_type

    if name is not None:
        member.name = name

    if role is not None:
        member.role = role

    if department is not None:
        member.department = department

    if email is not None:
        member.email = email

    db.commit()
    db.refresh(member)

    return {
        "message": "Team member updated successfully",
        "member": {
            "id": member.id,
            "project_id": member.project_id,
            "name": member.name,
            "role": member.role,
            "department": member.department,
            "email": member.email,
            "member_type": member.member_type
        }
    }


@router.delete("/projects/members/{member_id}")
def delete_project_member(
    member_id: int,
    db: Session = Depends(get_db)
):
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Team member not found"
        )

    db.delete(member)
    db.commit()

    return {
        "message": "Team member deleted successfully",
        "member_id": member_id
    }
# ==========================================
# CREATE PROBLEM
# ==========================================

@router.post("/")
def create_problem(
    problem_data: ProblemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("citizen")),
):

    # --------------------------------------
    # Create problem object
    # --------------------------------------

    problem = Problem(

        title=problem_data.title,

        description=problem_data.description,

        location=problem_data.location,

        category=problem_data.category,

        affected=problem_data.affected,

        urgency=problem_data.urgency or "Medium",

        input_type=problem_data.input_type,

        language=problem_data.language,

        validation_status="Pending",

        status="Submitted",

        # Link to the citizen account if they are logged in
        submitted_by=current_user.id if current_user else None,

    )

    # --------------------------------------
    # Save initial problem
    # --------------------------------------

    db.add(problem)

    db.commit()

    db.refresh(problem)


    # ======================================
    # PROBLEM ANALYSIS
    # ======================================

    analysis = analyze_problem(problem)


    # --------------------------------------
    # Store analysis results
    # --------------------------------------

    problem.detected_category = (
        analysis["category"]
    )

    problem.detected_department = (
        analysis["department"]
    )

    problem.department_confidence = (
        analysis["department_confidence"]
    )

    problem.urgency = (
        analysis["urgency"]
    )

    problem.priority_score = (
        analysis["priority_score"]
    )

    problem.impact_score = (
        analysis["impact_score"]
    )

    problem.affected_population = (
        analysis["affected_population"]
    )

    problem.required_expertise = (
        analysis["required_expertise"]
    )

    problem.suggested_solution_areas = (
        analysis["suggested_solution_areas"]
    )




    # ======================================
    # DUPLICATE DETECTION
    # ======================================

    existing_problems = db.query(
        Problem
    ).filter(
        Problem.id != problem.id
    ).all()


    duplicate_result = find_duplicate(
        problem,
        existing_problems
    )


    if duplicate_result["is_duplicate"]:

        problem.duplicate_of = (
            duplicate_result["duplicate_of"]
        )

        problem.status = "Duplicate"

        original_problem = db.query(
            Problem
        ).filter(
            Problem.id ==
            duplicate_result["duplicate_of"]
        ).first()


        if original_problem:

            original_problem.duplicate_count = (
                (original_problem.duplicate_count or 0)
                + 1
            )

    # --------------------------------------
    # Save analysis
    # --------------------------------------

    db.commit()

    db.refresh(problem)


    # ======================================
    # RESPONSE
    # ======================================

    return {

        "message":
            "Problem submitted successfully",

        "problem": {

            "id":
                problem.id,

            "title":
                problem.title,

            "description":
                problem.description,

            "location":
                problem.location,

            "affected":
                problem.affected,

            "input_type":
                problem.input_type,

            "language":
                problem.language,

            "category":
                problem.detected_category,

            "department":
                problem.detected_department,

            "department_confidence":
                problem.department_confidence,

            "urgency":
                problem.urgency,

            "priority_score":
                problem.priority_score,

            "impact_score":
                problem.impact_score,

            "affected_population":
                problem.affected_population,

            "required_expertise":
                problem.required_expertise,

            "suggested_solution_areas":
                problem.suggested_solution_areas,

            "duplicate_of":
                problem.duplicate_of,

            "duplicate_count":
                problem.duplicate_count,

            "validation_status":
                problem.validation_status,

            "status":
                problem.status,

            "submitted_by":
                problem.submitted_by

        }

    }


# ==========================================
# GET ALL PROBLEMS
# ==========================================

@router.get("/")
def get_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):

    problems = db.query(
        Problem
    ).order_by(
        Problem.created_at.desc()
    ).all()


    return [

        {

            "id":
                problem.id,

            "title":
                problem.title,

            "description":
                problem.description,

            "location":
                problem.location,

            "affected":
                problem.affected,

            "category":
                problem.detected_category,

            "department":
                problem.detected_department,

            "urgency":
                problem.urgency,

            "priority_score":
                problem.priority_score,

            "impact_score":
                problem.impact_score,

            "affected_population":
                problem.affected_population,

            "required_expertise":
                problem.required_expertise,

            "suggested_solution_areas":
                problem.suggested_solution_areas,

            "duplicate_of":
                problem.duplicate_of,

            "duplicate_count":
                problem.duplicate_count,

            "validation_status":
                problem.validation_status,

            "status":
                problem.status,

            "created_at":
                problem.created_at

        }

        for problem in problems

    ]


# ============================================================
# GET CITIZEN'S OWN PROBLEMS
# Requires authentication — returns only problems submitted by
# the currently logged-in citizen.
# ============================================================

@router.get("/my")
def get_my_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "citizen" or current_user.email == "citizen@demo.com":
        problems = (
            db.query(Problem)
            .filter(or_(Problem.submitted_by == current_user.id, Problem.submitted_by == None))
            .order_by(Problem.created_at.desc())
            .all()
        )
    else:
        problems = (
            db.query(Problem)
            .filter(Problem.submitted_by == current_user.id)
            .order_by(Problem.created_at.desc())
            .all()
        )

    result = []
    for p in problems:
        # Find the accepted university match (if any)
        accepted_uni_match = (
            db.query(UniversityMatch)
            .filter(
                UniversityMatch.problem_id == p.id,
                UniversityMatch.status == "Accepted",
            )
            .first()
        )
        university_name = None
        if accepted_uni_match:
            uni = db.query(University).filter(
                University.id == accepted_uni_match.university_id
            ).first()
            university_name = uni.name if uni else None

        # Find the accepted industry match (if any)
        accepted_ind_match = (
            db.query(IndustryMatch)
            .filter(
                IndustryMatch.problem_id == p.id,
                IndustryMatch.status == "Accepted",
            )
            .first()
        )
        industry_name = None
        if accepted_ind_match:
            ind = db.query(Industry).filter(
                Industry.id == accepted_ind_match.industry_id
            ).first()
            industry_name = ind.name if ind else None

        # Find project progress
        project = db.query(Project).filter(Project.problem_id == p.id).first()
        overall_progress = 0
        if project:
            milestones = db.query(Milestone).filter(
                Milestone.project_id == project.id
            ).all()
            if milestones:
                overall_progress = round(
                    sum(m.progress or 0 for m in milestones) / len(milestones), 1
                )

        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "location": p.location,
            "category": p.detected_category or p.category,
            "department": p.detected_department,
            "urgency": p.urgency,
            "priority_score": p.priority_score,
            "impact_score": p.impact_score,
            "affected_population": p.affected_population,
            "required_expertise": p.required_expertise or [],
            "suggested_solution_areas": p.suggested_solution_areas or [],
            "validation_status": p.validation_status,
            "status": p.status,
            "university_name": university_name,
            "industry_name": industry_name,
            "project_id": project.id if project else None,
            "project_status": project.status if project else None,
            "overall_progress": overall_progress,
            "created_at": p.created_at,
        })

    return {
        "count": len(result),
        "problems": result,
    }


# ============================================================
# GET PENDING PROBLEMS FOR GOVERNMENT
# ============================================================

@router.get("/pending")
def get_pending_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):
    problems = db.query(Problem).filter(
        Problem.validation_status == "Pending"
    ).order_by(
        Problem.priority_score.desc()
    ).all()

    return {
        "count": len(problems),
        "problems": [
            {
                "id": problem.id,
                "title": problem.title,
                "description": problem.description,
                "location": problem.location,
                "category": problem.detected_category or problem.category,
                "department": problem.detected_department,
                "department_confidence": problem.department_confidence,
                "urgency": problem.urgency,
                "priority_score": problem.priority_score,
                "impact_score": problem.impact_score,
                "affected_population": problem.affected_population,
                "required_expertise": problem.required_expertise,
                "suggested_solution_areas": problem.suggested_solution_areas,
                "duplicate_of": problem.duplicate_of,
                "duplicate_count": problem.duplicate_count,
                "validation_status": problem.validation_status,
                "status": problem.status,
                "created_at": problem.created_at
            }
            for problem in problems
        ]
    }


@router.get("/stats/public")
def public_platform_stats(
    db: Session = Depends(get_db),
):
    """Aggregate counts only — never returns private problem content."""
    return {
        "problems_submitted": db.query(Problem).count(),
        "problems_validated": db.query(Problem).filter(
            Problem.validation_status == "Validated"
        ).count(),
        "universities": db.query(University).count(),
        "industries": db.query(Industry).count(),
    }


@router.get("/inbox/university")
def university_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("university")),
):
    if not current_user.org_id:
        raise HTTPException(
            status_code=400,
            detail="This university account is not linked to an organisation record.",
        )
    return get_university_problems_early(
        current_user.org_id,
        db,
        current_user,
    )


@router.get("/inbox/industry")
def industry_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("industry")),
):
    if not current_user.org_id:
        raise HTTPException(
            status_code=400,
            detail="This industry account is not linked to an organisation record.",
        )
    return get_industry_problems(
        current_user.org_id,
        db,
        current_user,
    )


@router.get("/dashboard")
def get_government_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):

    statistics = get_dashboard_statistics(db)

    return {
        "message": "Government dashboard statistics",
        "dashboard": statistics
    }

@router.post("/notifications")
def create_notification_api(
    recipient_type: str,
    recipient_name: str,
    notification_type: str,
    title: str,
    message: str,
    recipient_id: int | None = None,
    problem_id: int | None = None,
    project_id: int | None = None,
    milestone_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):
    allowed_recipient_types = [
        "Government",
        "University",
        "Industry",
        "Community"
    ]

    if recipient_type not in allowed_recipient_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid recipient type"
        )

    notification = create_notification(
        db=db,
        recipient_type=recipient_type,
        recipient_name=recipient_name,
        notification_type=notification_type,
        title=title,
        message=message,
        recipient_id=recipient_id,
        problem_id=problem_id,
        project_id=project_id,
        milestone_id=milestone_id
    )

    return {
        "message": "Notification created successfully",
        "notification": {
            "id": notification.id,
            "recipient_type": notification.recipient_type,
            "recipient_name": notification.recipient_name,
            "notification_type": notification.notification_type,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read
        }
    }

@router.get("/dashboard/government")
def government_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):
    total_problems = db.query(Problem).count()

    validated_problems = db.query(Problem).filter(
        Problem.validation_status == "Validated"
    ).count()

    pending_problems = db.query(Problem).filter(
        Problem.validation_status == "Pending"
    ).count()

    rejected_problems = db.query(Problem).filter(
        Problem.validation_status == "Rejected"
    ).count()

    total_projects = db.query(Project).count()

    active_projects = db.query(Project).filter(
        Project.status.notin_(["Resolved", "Deployed"])
    ).count()

    deployed_projects = db.query(Project).filter(
        Project.status == "Deployed"
    ).count()

    resolved_projects = db.query(Project).filter(
        Project.status == "Resolved"
    ).count()

    total_universities = db.query(University).count()

    participating_universities = db.query(
        UniversityMatch.university_id
    ).filter(
        UniversityMatch.status == "Accepted"
    ).distinct().count()

    total_industries = db.query(Industry).count()

    participating_industries = db.query(
        IndustryMatch.industry_id
    ).filter(
        IndustryMatch.status == "Accepted"
    ).distinct().count()

    total_partnerships = db.query(Partnership).count()

    active_partnerships = db.query(Partnership).filter(
        Partnership.status == "Active"
    ).count()

    completed_partnerships = db.query(Partnership).filter(
        Partnership.status == "Completed"
    ).count()

    total_milestones = db.query(Milestone).count()

    completed_milestones = db.query(Milestone).filter(
        Milestone.status == "Completed"
    ).count()

    progress_result = db.query(
        func.avg(Milestone.progress)
    ).first()

    overall_progress = progress_result[0] or 0

    category_rows = db.query(
        Problem.category,
        func.count(Problem.id)
    ).group_by(
        Problem.category
    ).all()

    problems_by_category = [
        {
            "category": category or "Unknown",
            "count": count
        }
        for category, count in category_rows
    ]

    location_rows = db.query(
        Problem.location,
        func.count(Problem.id)
    ).group_by(
        Problem.location
    ).all()

    problems_by_location = [
        {
            "location": location or "Unknown",
            "count": count
        }
        for location, count in location_rows
    ]

    return {
        "problems": {
            "total": total_problems,
            "validated": validated_problems,
            "pending": pending_problems,
            "rejected": rejected_problems
        },

        "projects": {
            "total": total_projects,
            "active": active_projects,
            "deployed": deployed_projects,
            "resolved": resolved_projects
        },

        "universities": {
            "total": total_universities,
            "participating": participating_universities
        },

        "industries": {
            "total": total_industries,
            "participating": participating_industries
        },

        "partnerships": {
            "total": total_partnerships,
            "active": active_partnerships,
            "completed": completed_partnerships
        },

        "milestones": {
            "total": total_milestones,
            "completed": completed_milestones,
            "overall_progress": round(
                float(overall_progress), 2
            )
        },

        "problems_by_category": problems_by_category,

        "problems_by_location": problems_by_location
    }

@router.get("/dashboard/university/{university_id}")
def university_dashboard(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("university", "government")),
):
    assert_org_access(current_user, university_id, "university")
    # Check university
    university = db.query(University).filter(
        University.id == university_id
    ).first()

    if not university:
        raise HTTPException(
            status_code=404,
            detail="University not found"
        )

    # Assigned problems
    accepted_matches = db.query(UniversityMatch).filter(
        UniversityMatch.university_id == university_id,
        UniversityMatch.status == "Accepted"
    ).all()

    problem_ids = [
        match.problem_id
        for match in accepted_matches
    ]

    assigned_problems = db.query(Problem).filter(
        Problem.id.in_(problem_ids)
    ).all() if problem_ids else []

    # Projects
    projects = db.query(Project).filter(
        Project.university_id == university_id
    ).all()

    project_ids = [
        project.id
        for project in projects
    ]

    # Team members
    team_members = db.query(ProjectMember).filter(
        ProjectMember.project_id.in_(project_ids)
    ).all() if project_ids else []

    # Proposals
    proposals = db.query(Proposal).filter(
        Proposal.project_id.in_(project_ids)
    ).all() if project_ids else []

    # Industry partnerships
    partnerships = db.query(Partnership).filter(
        Partnership.project_id.in_(project_ids)
    ).all() if project_ids else []

    # Project status counts
    project_status_rows = db.query(
        Project.status,
        func.count(Project.id)
    ).filter(
        Project.university_id == university_id
    ).group_by(
        Project.status
    ).all()

    projects_by_status = [
        {
            "status": status,
            "count": count
        }
        for status, count in project_status_rows
    ]

    return {
        "university": {
            "id": university.id,
            "name": university.name,
            "location": university.location,
            "institution_type": university.institution_type
        },

        "statistics": {
            "assigned_problems": len(assigned_problems),
            "projects": len(projects),
            "team_members": len(team_members),
            "proposals": len(proposals),
            "industry_partnerships": len(partnerships)
        },

        "assigned_problems": [
            {
                "id": problem.id,
                "title": problem.title,
                "category": problem.detected_category or problem.category,
                "location": problem.location,
                "priority_score": problem.priority_score,
                "status": problem.status,
                "validation_status": problem.validation_status
            }
            for problem in assigned_problems
        ],

        "projects": [
            {
                "id": project.id,
                "problem_id": project.problem_id,
                "title": project.title,
                "status": project.status,
                "description": project.description
            }
            for project in projects
        ],

        "team_members": [
            {
                "id": member.id,
                "project_id": member.project_id,
                "name": member.name,
                "role": member.role,
                "department": member.department,
                "member_type": member.member_type
            }
            for member in team_members
        ],

        "proposals": [
            {
                "id": proposal.id,
                "project_id": proposal.project_id,
                "title": proposal.title,
                "status": proposal.status,
                "review_comments": proposal.review_comments
            }
            for proposal in proposals
        ],

        "industry_partnerships": [
            {
                "id": partnership.id,
                "project_id": partnership.project_id,
                "industry_id": partnership.industry_id,
                "contribution_type": partnership.contribution_type,
                "status": partnership.status
            }
            for partnership in partnerships
        ],

        "projects_by_status": projects_by_status
    }

@router.get("/dashboard/industry/{industry_id}")
def industry_dashboard(
    industry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("industry", "government")),
):
    assert_org_access(current_user, industry_id, "industry")
    # Check industry
    industry = db.query(Industry).filter(
        Industry.id == industry_id
    ).first()

    if not industry:
        raise HTTPException(
            status_code=404,
            detail="Industry not found"
        )

    # Accepted problem matches
    accepted_matches = db.query(IndustryMatch).filter(
        IndustryMatch.industry_id == industry_id,
        IndustryMatch.status == "Accepted"
    ).all()

    problem_ids = [
        match.problem_id
        for match in accepted_matches
    ]

    matched_problems = db.query(Problem).filter(
        Problem.id.in_(problem_ids)
    ).all() if problem_ids else []

    # Partnerships involving this industry
    partnerships = db.query(Partnership).filter(
        Partnership.industry_id == industry_id
    ).all()

    project_ids = [
        partnership.project_id
        for partnership in partnerships
        if partnership.project_id is not None
    ]

    # Projects connected through partnerships
    projects = db.query(Project).filter(
        Project.id.in_(project_ids)
    ).all() if project_ids else []

    # Project milestones
    milestones = db.query(Milestone).filter(
        Milestone.project_id.in_(project_ids)
    ).all() if project_ids else []

    # Partnership status counts
    partnership_status_rows = db.query(
        Partnership.status,
        func.count(Partnership.id)
    ).filter(
        Partnership.industry_id == industry_id
    ).group_by(
        Partnership.status
    ).all()

    partnerships_by_status = [
        {
            "status": status,
            "count": count
        }
        for status, count in partnership_status_rows
    ]

    # Project status counts
    project_status_rows = db.query(
        Project.status,
        func.count(Project.id)
    ).filter(
        Project.id.in_(project_ids)
    ).group_by(
        Project.status
    ).all() if project_ids else []

    projects_by_status = [
        {
            "status": status,
            "count": count
        }
        for status, count in project_status_rows
    ]

    return {
        "industry": {
            "id": industry.id,
            "name": industry.name,
            "location": industry.location,
            "organization_type": industry.organization_type
        },

        "statistics": {
            "matched_problems": len(matched_problems),
            "partnerships": len(partnerships),
            "active_partnerships": len([
                p for p in partnerships
                if p.status == "Active"
            ]),
            "completed_partnerships": len([
                p for p in partnerships
                if p.status == "Completed"
            ]),
            "projects": len(projects),
            "milestones": len(milestones),
            "completed_milestones": len([
                m for m in milestones
                if m.status == "Completed"
            ])
        },

        "matched_problems": [
            {
                "id": problem.id,
                "title": problem.title,
                "category": problem.detected_category or problem.category,
                "location": problem.location,
                "priority_score": problem.priority_score,
                "status": problem.status
            }
            for problem in matched_problems
        ],

        "partnerships": [
            {
                "id": partnership.id,
                "problem_id": partnership.problem_id,
                "project_id": partnership.project_id,
                "contribution_type": partnership.contribution_type,
                "description": partnership.description,
                "status": partnership.status
            }
            for partnership in partnerships
        ],

        "projects": [
            {
                "id": project.id,
                "problem_id": project.problem_id,
                "university_id": project.university_id,
                "title": project.title,
                "status": project.status
            }
            for project in projects
        ],

        "milestones": [
            {
                "id": milestone.id,
                "project_id": milestone.project_id,
                "title": milestone.title,
                "status": milestone.status,
                "progress": milestone.progress
            }
            for milestone in milestones
        ],

        "partnerships_by_status": partnerships_by_status,

        "projects_by_status": projects_by_status
    }

@router.get("/notifications")
def get_notifications(
    is_read: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification)

    if current_user.role == "government":
        query = query.filter(Notification.recipient_type == "Government")
    elif current_user.role == "university":
        query = query.filter(Notification.recipient_type == "University")
        if current_user.org_id:
            query = query.filter(Notification.recipient_id == current_user.org_id)
    elif current_user.role == "industry":
        query = query.filter(Notification.recipient_type == "Industry")
        if current_user.org_id:
            query = query.filter(Notification.recipient_id == current_user.org_id)
    else:
        query = query.filter(Notification.recipient_type == "Community")
        own_problem_ids = [
            row[0]
            for row in db.query(Problem.id)
            .filter(Problem.submitted_by == current_user.id)
            .all()
        ]
        if own_problem_ids:
            query = query.filter(
                (Notification.recipient_id == current_user.id)
                | (Notification.problem_id.in_(own_problem_ids))
            )
        else:
            query = query.filter(Notification.recipient_id == current_user.id)

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    notifications = query.order_by(
        Notification.created_at.desc()
    ).all()

    return [
        {
            "id": notification.id,
            "recipient_type": notification.recipient_type,
            "recipient_name": notification.recipient_name,
            "problem_id": notification.problem_id,
            "project_id": notification.project_id,
            "milestone_id": notification.milestone_id,
            "notification_type": notification.notification_type,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": notification.created_at
        }
        for notification in notifications
    ]


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read",
        "notification_id": notification.id,
        "is_read": notification.is_read
    }
# ============================================================
# DEBUG - CHECK UNIVERSITY DATA
# Must be before /{problem_id} to avoid FastAPI treating
# the literal "universities" as an integer problem_id.
# ============================================================

@router.get("/universities/debug")
def debug_universities(
    db: Session = Depends(get_db)
):
    universities = db.query(University).all()

    return [
        {
            "id": university.id,
            "name": university.name,
            "expertise": university.expertise
        }
        for university in universities
    ]


# ============================================================
# GET PROBLEMS FOR A UNIVERSITY
# Must be before /{problem_id} to avoid FastAPI treating
# the literal "universities" as an integer problem_id.
# ============================================================

@router.get("/universities/{university_id}/problems")
def get_university_problems_early(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("university", "government")),
):
    """Alias kept before /{problem_id} to avoid routing conflict."""
    assert_org_access(current_user, university_id, "university")
    university = db.query(University).filter(
        University.id == university_id
    ).first()

    if not university:
        raise HTTPException(
            status_code=404,
            detail="University not found"
        )

    matches = db.query(UniversityMatch).filter(
        UniversityMatch.university_id == university_id,
        UniversityMatch.status.in_(["Pending", "Accepted"])
    ).all()

    problems = []

    for match in matches:
        problem = db.query(Problem).filter(
            Problem.id == match.problem_id
        ).first()

        if not problem:
            continue

        problems.append({
            "match_id": match.id,
            "problem_id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "location": problem.location,
            "category": problem.detected_category or problem.category,
            "department": problem.detected_department,
            "urgency": problem.urgency,
            "priority_score": problem.priority_score,
            "impact_score": problem.impact_score,
            "affected_population": problem.affected_population,
            "required_expertise": problem.required_expertise or [],
            "suggested_solution_areas": problem.suggested_solution_areas or [],
            "validation_status": problem.validation_status,
            "status": problem.status,
            "match_score": match.match_score,
            "expertise_score": match.expertise_score
        })

    return {
        "university": {
            "id": university.id,
            "name": university.name,
            "location": university.location
        },
        "total_problems": len(problems),
        "problems": problems
    }


# ==========================================
# GET PROJECT BY ID
# Must be before /{problem_id} to avoid routing conflicts.
# ==========================================

@router.get("/projects/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    problem = db.query(Problem).filter(
        Problem.id == project.problem_id
    ).first()

    university = db.query(University).filter(
        University.id == project.university_id
    ).first()

    # Get accepted industry match
    accepted_industry_match = db.query(IndustryMatch).filter(
        IndustryMatch.problem_id == project.problem_id,
        IndustryMatch.status == "Accepted"
    ).first()

    industry = None
    if accepted_industry_match:
        industry = db.query(Industry).filter(
            Industry.id == accepted_industry_match.industry_id
        ).first()

    # Get team members
    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()

    # Get milestones
    milestones = db.query(Milestone).filter(
        Milestone.project_id == project_id
    ).order_by(Milestone.id.asc()).all()

    # Calculate progress
    overall_progress = 0
    if milestones:
        total = sum(m.progress or 0 for m in milestones)
        overall_progress = round(total / len(milestones), 1)

    # Get proposal
    proposal = db.query(Proposal).filter(
        Proposal.project_id == project_id
    ).first()

    return {
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "objectives": project.objectives,
            "expected_solution": project.expected_solution,
            "status": project.status,
            "overall_progress": overall_progress,
            "problem_id": project.problem_id,
            "university_id": project.university_id,
        },
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "location": problem.location,
            "category": problem.detected_category or problem.category,
            "department": problem.detected_department,
            "urgency": problem.urgency,
            "priority_score": problem.priority_score,
            "status": problem.status,
            "validation_status": problem.validation_status,
        } if problem else None,
        "university": {
            "id": university.id,
            "name": university.name,
            "location": university.location,
            "institution_type": university.institution_type,
        } if university else None,
        "industry": {
            "id": industry.id,
            "name": industry.name,
            "location": industry.location,
            "organization_type": industry.organization_type,
        } if industry else None,
        "team": [
            {
                "id": m.id,
                "name": m.name,
                "role": m.role,
                "department": m.department,
                "email": m.email,
                "member_type": m.member_type,
            }
            for m in members
        ],
        "milestones": [
            {
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "status": m.status,
                "progress": m.progress,
            }
            for m in milestones
        ],
        "proposal": {
            "id": proposal.id,
            "title": proposal.title,
            "status": proposal.status,
            "review_comments": proposal.review_comments,
        } if proposal else None,
    }


# ==========================================
# GET SINGLE PROBLEM
# ==========================================

@router.get("/{problem_id}")
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db)
):

    problem = db.query(
        Problem
    ).filter(
        Problem.id == problem_id
    ).first()


    if not problem:

        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )


    return {

        "id":
            problem.id,

        "title":
            problem.title,

        "description":
            problem.description,

        "location":
            problem.location,

        "affected":
            problem.affected,

        "input_type":
            problem.input_type,

        "language":
            problem.language,

        "category":
            problem.detected_category,

        "department":
            problem.detected_department,

        "department_confidence":
            problem.department_confidence,

        "urgency":
            problem.urgency,

        "priority_score":
            problem.priority_score,

        "impact_score":
            problem.impact_score,

        "affected_population":
            problem.affected_population,

        "required_expertise":
            problem.required_expertise,

        "suggested_solution_areas":
            problem.suggested_solution_areas,

        "duplicate_of":
            problem.duplicate_of,

        "duplicate_count":
            problem.duplicate_count,

        "validation_status":
            problem.validation_status,

        "status":
            problem.status,

        "created_at":
            problem.created_at,

        "updated_at":
            problem.updated_at

    }


# ==========================================
# PROBLEM ANALYSIS
# ==========================================

@router.get("/{problem_id}/analysis")
def analyze_problem_endpoint(
    problem_id: int,
    db: Session = Depends(get_db)
):

    problem = db.query(
        Problem
    ).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    analysis = analyze_problem(problem)

    persisted_analysis = {
        "category": problem.detected_category or problem.category or analysis.get("category"),
        "department": problem.detected_department or analysis.get("department"),
        "department_confidence": problem.department_confidence or analysis.get("department_confidence", 85),
        "urgency": problem.urgency or analysis.get("urgency", "Medium"),
        "priority_score": problem.priority_score or analysis.get("priority_score", 50),
        "impact_score": problem.impact_score or analysis.get("impact_score", 5),
        "affected_population": problem.affected_population or problem.affected or "Not specified",
        "required_expertise": problem.required_expertise or analysis.get("required_expertise", []),
        "suggested_solution_areas": problem.suggested_solution_areas or analysis.get("suggested_solution_areas", []),
        "language": problem.language or analysis.get("language", "English"),
        "duplicate_candidates": analysis.get("duplicate_candidates", [])
    }

    return {
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "location": problem.location,
            "affected": problem.affected,
            "category": problem.detected_category or problem.category,
            "department": problem.detected_department,
            "urgency": problem.urgency,
            "priority_score": problem.priority_score,
            "impact_score": problem.impact_score
        },
        "analysis": persisted_analysis,
        **persisted_analysis
    }


# ============================================================
# GOVERNMENT VALIDATION
# ============================================================

@router.put("/{problem_id}/validate")
def validate_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):
    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    problem.validation_status = "Validated"
    problem.status = "PartnerMatching"
    db.commit()

    # 1. Generate & save University matches if none exist
    existing_uni_matches = db.query(UniversityMatch).filter(
        UniversityMatch.problem_id == problem_id
    ).all()
    if not existing_uni_matches:
        uni_matches = find_matching_universities(problem, db)
        first_uni = db.query(University).order_by(University.id.asc()).first()
        if first_uni and not any(m.get("university_id") == first_uni.id for m in uni_matches if isinstance(m, dict)):
            uni_matches.insert(0, {
                "university_id": first_uni.id,
                "match_score": 92,
                "expertise_score": 90,
                "category_match": True,
                "matched_expertise": problem.required_expertise or ["Hydrology", "Civil Engineering", "IoT"],
                "missing_expertise": []
            })
        for um in uni_matches:
            db.add(UniversityMatch(
                problem_id=problem.id,
                university_id=um["university_id"],
                match_score=um.get("match_score", 85),
                expertise_score=um.get("expertise_score", 80),
                category_match=um.get("category_match", True),
                matched_expertise=um.get("matched_expertise", []),
                missing_expertise=um.get("missing_expertise", []),
                status="Pending"
            ))
            uni_obj = db.query(University).filter(University.id == um["university_id"]).first()
            if uni_obj:
                create_notification(
                    db=db,
                    recipient_type="University",
                    recipient_name=uni_obj.name,
                    notification_type="New Problem Request",
                    title="New Innovation Opportunity",
                    message=f"Government validated '{problem.title}' and requested your institution's expertise.",
                    problem_id=problem.id
                )

    # 2. Generate & save Industry matches if none exist
    existing_ind_matches = db.query(IndustryMatch).filter(
        IndustryMatch.problem_id == problem_id
    ).all()
    if not existing_ind_matches:
        ind_matches = find_matching_industries(problem, db, limit=5)
        first_ind = db.query(Industry).order_by(Industry.id.asc()).first()
        if first_ind and not any(m.get("industry_id") == first_ind.id for m in ind_matches if isinstance(m, dict)):
            ind_matches.insert(0, {
                "industry_id": first_ind.id,
                "match_score": 89,
                "expertise_score": 85,
                "domain_match": True,
                "capability_match": True,
                "matched_expertise": problem.required_expertise or ["IoT Sensors", "Civil Infrastructure"],
                "missing_expertise": [],
                "matched_capabilities": ["IoT Sensors", "Civil Infrastructure", "CSR Funding"],
                "missing_capabilities": []
            })
        for im in ind_matches:
            db.add(IndustryMatch(
                problem_id=problem.id,
                industry_id=im["industry_id"],
                match_score=im.get("match_score", 85),
                expertise_score=im.get("expertise_score", 80),
                domain_match=im.get("domain_match", True),
                capability_match=im.get("capability_match", True),
                matched_expertise=im.get("matched_expertise", []),
                missing_expertise=im.get("missing_expertise", []),
                matched_capabilities=im.get("matched_capabilities", []),
                missing_capabilities=im.get("missing_capabilities", []),
                status="Pending"
            ))
            ind_obj = db.query(Industry).filter(Industry.id == im["industry_id"]).first()
            if ind_obj:
                create_notification(
                    db=db,
                    recipient_type="Industry",
                    recipient_name=ind_obj.name,
                    notification_type="New Opportunity",
                    title="New Technology & CSR Opportunity",
                    message=f"Government validated '{problem.title}' and invited your organization for implementation.",
                    problem_id=problem.id
                )

    db.commit()
    db.refresh(problem)

    create_notification(
        db=db,
        recipient_type="Community",
        recipient_name=problem.affected or "Community",
        notification_type="Problem Validated",
        title="Problem Validated & Partner Matching Started",
        message=f"Your reported problem '{problem.title}' has been validated by government. University and Industry matching is in progress.",
        problem_id=problem.id
    )

    return {
        "message": "Problem validated successfully. University and Industry matching initiated.",
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "validation_status": problem.validation_status,
            "status": problem.status
        }
    }



@router.put("/{problem_id}/reject")
def reject_problem(
    problem_id: int,
    db: Session = Depends(get_db)
):
    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    problem.validation_status = "Rejected"
    problem.status = "Rejected"

    db.commit()
    db.refresh(problem)

    return {
        "message": "Problem rejected successfully",
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "validation_status": problem.validation_status,
            "status": problem.status
        }
    }

# ============================================================
# UNIVERSITY MATCHING
# ============================================================

@router.get("/{problem_id}/universities")
def get_matching_universities(
    problem_id: int,
    db: Session = Depends(get_db)
):
    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    # Only validated problems should be matched
    if problem.validation_status != "Validated":
        raise HTTPException(
            status_code=400,
            detail="Only validated problems can be matched with universities"
        )

    # Get the SAVED UniversityMatch records
    saved_matches = db.query(UniversityMatch).filter(
        UniversityMatch.problem_id == problem_id
    ).all()

    results = []

    for match in saved_matches:

        university = db.query(University).filter(
            University.id == match.university_id
        ).first()

        if not university:
            continue

        results.append({
            "id": match.id,
            "match_id": match.id,
            "university_id": university.id,

            "university_name":
                university.name,

            "location":
                university.location,

            "institution_type":
                university.institution_type,

            "match_score":
                match.match_score,

            "expertise_score":
                match.expertise_score,

            "category_match":
                match.category_match,

            "matched_expertise":
                match.matched_expertise or [],

            "missing_expertise":
                match.missing_expertise or [],

            "disciplines":
                university.disciplines or [],

            "facilities":
                university.facilities or [],

            "innovation_centres":
                university.innovation_centres or [],

            "incubation_facilities":
                university.incubation_facilities or [],

            "description":
                university.description,

            "status":
                match.status
        })

    # Highest match first
    results.sort(
        key=lambda x: x["match_score"] or 0,
        reverse=True
    )

    return {
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "category":
                problem.detected_category or problem.category,
            "department":
                problem.detected_department,
            "required_expertise":
                problem.required_expertise or []
        },

        "total_matches":
            len(results),

        "universities":
            results
    }
@router.post("/{problem_id}/universities/generate")
def generate_university_matches(
    problem_id: int,
    db: Session = Depends(get_db)
):

    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    # ------------------------------------------
    # Problem must be government validated
    # ------------------------------------------

    if problem.validation_status != "Validated":
        raise HTTPException(
            status_code=400,
            detail="Only validated problems can be matched with universities"
        )

    # ------------------------------------------
    # Delete old matches
    # ------------------------------------------

    db.query(UniversityMatch).filter(
        UniversityMatch.problem_id == problem_id
    ).delete()

    db.commit()

    # ------------------------------------------
    # Calculate matches
    # ------------------------------------------

    matches = find_matching_universities(
        problem,
        db
    )

    saved_matches = []

    # ------------------------------------------
    # Save matches
    # ------------------------------------------

    for match in matches:

        university_match = UniversityMatch(

            problem_id=problem.id,

            university_id=match["university_id"],

            match_score=match["match_score"],

            expertise_score=match["expertise_score"],

            category_match=match["category_match"],

            matched_expertise=match["matched_expertise"],

            missing_expertise=match["missing_expertise"],

            status="Pending"
        )

        db.add(university_match)

        # IMPORTANT:
        # Flush generates the database ID
        # before commit.

        db.flush()

        saved_matches.append({

            # DATABASE MATCH ID
            "match_id": university_match.id,

            # UNIVERSITY DATABASE ID
            "university_id": match["university_id"],

            "university_name":
                match["university_name"],

            "match_score":
                match["match_score"],

            "expertise_score":
                match["expertise_score"],

            "category_match":
                match["category_match"],

            "matched_expertise":
                match["matched_expertise"],

            "missing_expertise":
                match["missing_expertise"],

            "status":
                university_match.status
        })

    # ------------------------------------------
    # Commit
    # ------------------------------------------

    db.commit()

    return {

        "message":
            "University matches generated successfully",

        "problem_id":
            problem.id,

        "total_matches":
            len(saved_matches),

        "matches":
            saved_matches
    }


@router.put("/matches/{match_id}/accept")
def accept_university_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    match = db.query(UniversityMatch).filter(
        UniversityMatch.id == match_id
    ).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail="University match not found"
        )

    if match.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="This match has already been processed"
        )

    problem = db.query(Problem).filter(
        Problem.id == match.problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    # Find the university
    university = db.query(University).filter(
        University.id == match.university_id
    ).first()

    if not university:
        raise HTTPException(
            status_code=404,
            detail="University not found"
        )

    # Accept this university
    match.status = "Accepted"

    # Assign the problem to this university
    problem.status = "University Assigned"

    # Reject other pending university matches
    other_matches = db.query(UniversityMatch).filter(
        UniversityMatch.problem_id == match.problem_id,
        UniversityMatch.id != match.id,
        UniversityMatch.status == "Pending"
    ).all()

    for other_match in other_matches:
        other_match.status = "Rejected"

    db.commit()
    db.refresh(match)
    db.refresh(problem)

    # ------------------------------------------------
    # NOTIFICATION 1: Notify the university
    # ------------------------------------------------

    create_notification(
        db=db,
        recipient_type="University",
        recipient_id=university.id,
        recipient_name=university.name,
        notification_type="University Assigned",
        title="New Problem Assigned",
        message=(
            f"Your institution has been selected to work on "
            f"the community problem '{problem.title}'."
        ),
        problem_id=problem.id
    )

    # ------------------------------------------------
    # NOTIFICATION 2: Notify government
    # ------------------------------------------------

    create_notification(
        db=db,
        recipient_type="Government",
        recipient_name="Government",
        notification_type="University Assigned",
        title="University Assigned",
        message=(
            f"{university.name} has been assigned to the problem "
            f"'{problem.title}'."
        ),
        problem_id=problem.id
    )

    return {
        "message": "University accepted the problem",
        "match": {
            "id": match.id,
            "problem_id": match.problem_id,
            "university_id": match.university_id,
            "university_name": university.name,
            "match_score": match.match_score,
            "status": match.status
        },
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "status": problem.status
        }
    }

@router.put("/matches/{match_id}/reject")
def reject_university_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    match = db.query(UniversityMatch).filter(
        UniversityMatch.id == match_id
    ).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail="University match not found"
        )

    if match.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="This match has already been processed"
        )

    match.status = "Rejected"

    db.commit()
    db.refresh(match)

    return {
        "message": "University rejected the problem",
        "match": {
            "id": match.id,
            "problem_id": match.problem_id,
            "university_id": match.university_id,
            "status": match.status
        }
    }

@router.post("/{problem_id}/projects")
def create_project(
    problem_id: int,
    db: Session = Depends(get_db),
    university_id: int | None = None,
    title: str | None = None,
    description: str | None = None,
    objectives: str | None = None,
    expected_solution: str | None = None,
):
    # Check problem
    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    # Problem must be validated
    if problem.validation_status != "Validated":
        raise HTTPException(
            status_code=400,
            detail="Problem must be validated before creating a project"
        )

    # Return existing project instead of erroring — idempotent
    existing_project = db.query(Project).filter(
        Project.problem_id == problem_id
    ).first()

    if existing_project:
        university = db.query(University).filter(
            University.id == existing_project.university_id
        ).first()
        return {
            "message": "Project already exists",
            "project": {
                "id": existing_project.id,
                "problem_id": existing_project.problem_id,
                "university_id": existing_project.university_id,
                "university_name": university.name if university else None,
                "title": existing_project.title,
                "description": existing_project.description,
                "objectives": existing_project.objectives,
                "expected_solution": existing_project.expected_solution,
                "status": existing_project.status,
            }
        }

    # Auto-detect accepted university match if university_id not provided
    if university_id is None:
        accepted_match = db.query(UniversityMatch).filter(
            UniversityMatch.problem_id == problem_id,
            UniversityMatch.status == "Accepted"
        ).first()

        if not accepted_match:
            raise HTTPException(
                status_code=400,
                detail="No university has been assigned to this problem yet. Accept a university match first."
            )

        university_id = accepted_match.university_id

    # Check university
    university = db.query(University).filter(
        University.id == university_id
    ).first()

    if not university:
        raise HTTPException(
            status_code=404,
            detail="University not found"
        )

    # Check whether university accepted the problem
    accepted_match = db.query(UniversityMatch).filter(
        UniversityMatch.problem_id == problem_id,
        UniversityMatch.university_id == university_id,
        UniversityMatch.status == "Accepted"
    ).first()

    if not accepted_match:
        raise HTTPException(
            status_code=403,
            detail="This university has not accepted this problem"
        )

    # Use sensible defaults if not provided
    project_title       = title or f"Project: {problem.title}"
    project_description = description or problem.description or ""
    project_objectives  = objectives or (
        f"Develop an innovative solution for: {problem.title}"
    )
    project_solution    = expected_solution or (
        ", ".join(problem.suggested_solution_areas or []) or
        "To be defined during the proposal phase"
    )

    # Create project
    project = Project(
        problem_id=problem_id,
        university_id=university_id,
        title=project_title,
        description=project_description,
        objectives=project_objectives,
        expected_solution=project_solution,
        status="Proposal"
    )

    db.add(project)

    # Update problem status
    problem.status = "Project Created"

    db.commit()
    db.refresh(project)

    return {
        "message": "Innovation project created successfully",
        "project": {
            "id": project.id,
            "problem_id": project.problem_id,
            "university_id": project.university_id,
            "university_name": university.name,
            "title": project.title,
            "description": project.description,
            "objectives": project.objectives,
            "expected_solution": project.expected_solution,
            "status": project.status
        }
    }


@router.put("/projects/{project_id}/status")
def update_project_status(
    project_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    allowed_statuses = [
        "Proposal",
        "Team Formed",
        "Prototype",
        "Testing",
        "Pilot",
        "Deployed",
        "Resolved"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed statuses: {allowed_statuses}"
        )

    current_status = project.status

    # Define the correct project lifecycle order
    status_order = {
        "Proposal": 1,
        "Team Formed": 2,
        "Prototype": 3,
        "Testing": 4,
        "Pilot": 5,
        "Deployed": 6,
        "Resolved": 7
    }

    # Prevent moving backwards
    if status_order[status] < status_order[current_status]:
        raise HTTPException(
            status_code=400,
            detail="Project status cannot move backwards"
        )

    project.status = status

    # Keep the linked problem status synchronized
    problem = db.query(Problem).filter(
        Problem.id == project.problem_id
    ).first()

    if problem:

        problem_status_map = {
            "Proposal": "Project Created",
            "Team Formed": "Team Formed",
            "Prototype": "Prototype",
            "Testing": "Testing",
            "Pilot": "Pilot",
            "Deployed": "Deployed",
            "Resolved": "Resolved"
        }

        problem.status = problem_status_map[status]

    db.commit()
    db.refresh(project)

    return {
        "message": "Project status updated successfully",
        "project": {
            "id": project.id,
            "problem_id": project.problem_id,
            "university_id": project.university_id,
            "title": project.title,
            "status": project.status
        }
    }

@router.post("/projects/{project_id}/milestones")
def create_milestone(
    project_id: int,
    title: str,
    description: str,
    db: Session = Depends(get_db)
):
    # Check whether project exists
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Create milestone
    milestone = Milestone(
        project_id=project_id,
        title=title,
        description=description,
        status="Pending",
        progress=0
    )

    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    return {
        "message": "Milestone created successfully",
        "milestone": {
            "id": milestone.id,
            "project_id": milestone.project_id,
            "title": milestone.title,
            "description": milestone.description,
            "status": milestone.status,
            "progress": milestone.progress
        }
    }

@router.put("/projects/milestones/{milestone_id}")
def update_milestone(
    milestone_id: int,
    status: str,
    progress: int,
    db: Session = Depends(get_db)
):
    # --------------------------------------
    # Check milestone
    # --------------------------------------

    milestone = db.query(Milestone).filter(
        Milestone.id == milestone_id
    ).first()

    if not milestone:
        raise HTTPException(
            status_code=404,
            detail="Milestone not found"
        )

    # --------------------------------------
    # Validate milestone status
    # --------------------------------------

    allowed_statuses = [
        "Pending",
        "In Progress",
        "Completed"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed statuses: {allowed_statuses}"
        )

    # --------------------------------------
    # Validate progress
    # --------------------------------------

    if progress < 0 or progress > 100:
        raise HTTPException(
            status_code=400,
            detail="Progress must be between 0 and 100"
        )

    # --------------------------------------
    # Automatically adjust progress
    # --------------------------------------

    if status == "Completed":
        progress = 100

    if status == "Pending":
        progress = 0

    # --------------------------------------
    # Update milestone
    # --------------------------------------

    milestone.status = status
    milestone.progress = progress

    # --------------------------------------
    # Get related project
    # --------------------------------------

    project = db.query(Project).filter(
        Project.id == milestone.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # --------------------------------------
    # Get all milestones of the project
    # --------------------------------------

    milestones = db.query(Milestone).filter(
        Milestone.project_id == project.id
    ).all()

    # --------------------------------------
    # Detect lifecycle stage
    # --------------------------------------

    detected_status = "Proposal"

    for item in milestones:

        title = (item.title or "").lower()

        # Deployment
        if (
            "deploy" in title
            and item.status in ["In Progress", "Completed"]
        ):
            detected_status = "Deployed"

        # Pilot
        elif (
            "pilot" in title
            and item.status in ["In Progress", "Completed"]
            and detected_status not in ["Deployed"]
        ):
            detected_status = "Pilot"

        # Testing
        elif (
            "test" in title
            and item.status in ["In Progress", "Completed"]
            and detected_status not in ["Pilot", "Deployed"]
        ):
            detected_status = "Testing"

        # Prototype
        elif (
            "prototype" in title
            and item.status in ["In Progress", "Completed"]
            and detected_status not in ["Testing", "Pilot", "Deployed"]
        ):
            detected_status = "Prototype"

        # Team formation
        elif (
            "team" in title
            and item.status in ["In Progress", "Completed"]
            and detected_status not in [
                "Prototype",
                "Testing",
                "Pilot",
                "Deployed"
            ]
        ):
            detected_status = "Team Formed"

    # --------------------------------------
    # Lifecycle order
    # --------------------------------------

    status_order = {
        "Proposal": 1,
        "Team Formed": 2,
        "Prototype": 3,
        "Testing": 4,
        "Pilot": 5,
        "Deployed": 6,
        "Resolved": 7
    }

    current_order = status_order.get(
        project.status,
        1
    )

    detected_order = status_order.get(
        detected_status,
        1
    )

    # --------------------------------------
    # Never move project backwards
    # --------------------------------------

    if detected_order > current_order:
        project.status = detected_status

    # --------------------------------------
    # Synchronize problem status
    # --------------------------------------

    problem = db.query(Problem).filter(
        Problem.id == project.problem_id
    ).first()

    if problem:

        problem_status_map = {
            "Proposal": "Project Created",
            "Team Formed": "Team Formed",
            "Prototype": "Prototype",
            "Testing": "Testing",
            "Pilot": "Pilot",
            "Deployed": "Deployed",
            "Resolved": "Resolved"
        }

        problem.status = problem_status_map.get(
            project.status,
            problem.status
        )

    # --------------------------------------
    # Save everything
    # --------------------------------------

    db.commit()

    db.refresh(milestone)
    db.refresh(project)

    # --------------------------------------
    # Calculate overall project progress
    # --------------------------------------

    all_milestones = db.query(Milestone).filter(
        Milestone.project_id == project.id
    ).all()

    if all_milestones:

        total_progress = sum(
            item.progress or 0
            for item in all_milestones
        )

        overall_progress = (
            total_progress / len(all_milestones)
        )

    else:
        overall_progress = 0

    # --------------------------------------
    # Response
    # --------------------------------------

    return {
        "message": "Milestone updated successfully",

        "milestone": {
            "id": milestone.id,
            "project_id": milestone.project_id,
            "title": milestone.title,
            "description": milestone.description,
            "status": milestone.status,
            "progress": milestone.progress
        },

        "project": {
            "id": project.id,
            "title": project.title,
            "status": project.status,
            "overall_progress": round(
                overall_progress,
                2
            )
        }
    }

@router.get("/projects/{project_id}/progress")
def get_project_progress(
    project_id: int,
    db: Session = Depends(get_db)
):
    # Check whether project exists
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Get all milestones
    milestones = db.query(Milestone).filter(
        Milestone.project_id == project_id
    ).all()

    # No milestones yet
    if not milestones:
        return {
            "project_id": project.id,
            "project_title": project.title,
            "total_milestones": 0,
            "completed_milestones": 0,
            "overall_progress": 0,
            "milestones": []
        }

    total_progress = 0
    completed_count = 0
    milestone_list = []

    for milestone in milestones:

        total_progress += milestone.progress or 0

        if milestone.status == "Completed":
            completed_count += 1

        milestone_list.append({
            "id": milestone.id,
            "title": milestone.title,
            "status": milestone.status,
            "progress": milestone.progress
        })

    overall_progress = total_progress / len(milestones)

    return {
        "project_id": project.id,
        "project_title": project.title,
        "project_status": project.status,
        "total_milestones": len(milestones),
        "completed_milestones": completed_count,
        "overall_progress": round(overall_progress, 2),
        "milestones": milestone_list
    }


@router.get("/impact/all")
def get_all_impacts(
    db: Session = Depends(get_db)
):
    impacts = db.query(Impact).order_by(Impact.created_at.desc()).all()
    result = []
    for impact in impacts:
        result.append({
            "id": impact.id,
            "project_id": impact.project_id,
            "metric_name": impact.metric_name,
            "metric_unit": impact.metric_unit,
            "direction": impact.direction,
            "baseline_value": impact.baseline_value,
            "current_value": impact.current_value,
            "target_value": impact.target_value,
            "beneficiaries": impact.beneficiaries,
            "people_impacted": impact.beneficiaries or 0,
            "areas_covered": 1 if impact.location else 0,
            "location": impact.location,
            "evidence": impact.evidence,
            "notes": impact.notes,
            "created_at": impact.created_at
        })
    return result


@router.post("/projects/{project_id}/impact")
def create_impact_metric(
    project_id: int,
    metric_name: str,
    metric_unit: str | None = None,
    direction: str = "increase",
    baseline_value: float = None,
    current_value: float = None,
    target_value: float = None,
    beneficiaries: int | None = None,
    location: str | None = None,
    evidence: str | None = None,
    notes: str | None = None,
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if direction not in ["increase", "decrease"]:
        raise HTTPException(
            status_code=400,
            detail="Direction must be either 'increase' or 'decrease'"
        )

    impact = Impact(
        project_id=project_id,
        metric_name=metric_name,
        metric_unit=metric_unit,
        direction=direction,
        baseline_value=baseline_value,
        current_value=current_value,
        target_value=target_value,
        beneficiaries=beneficiaries,
        location=location,
        evidence=evidence,
        notes=notes
    )

    db.add(impact)
    db.commit()
    db.refresh(impact)

    return {
        "message": "Impact metric created successfully",
        "impact": {
            "id": impact.id,
            "project_id": impact.project_id,
            "metric_name": impact.metric_name,
            "metric_unit": impact.metric_unit,
            "direction": impact.direction,
            "baseline_value": impact.baseline_value,
            "current_value": impact.current_value,
            "target_value": impact.target_value,
            "beneficiaries": impact.beneficiaries,
            "location": impact.location,
            "evidence": impact.evidence,
            "notes": impact.notes
        }
    }


@router.get("/projects/{project_id}/impact")
def get_project_impact(
    project_id: int,
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        return []

    impacts = db.query(Impact).filter(
        Impact.project_id == project_id
    ).all()

    result = []

    for impact in impacts:

        improvement = None
        target_progress = None



        # -----------------------------------------------------
        # CALCULATE IMPROVEMENT
        # -----------------------------------------------------

        if (
            impact.baseline_value is not None
            and impact.current_value is not None
            and impact.baseline_value != 0
        ):

            if impact.direction == "increase":

                improvement = (
                    (
                        impact.current_value
                        - impact.baseline_value
                    )
                    / abs(impact.baseline_value)
                ) * 100

            else:

                improvement = (
                    (
                        impact.baseline_value
                        - impact.current_value
                    )
                    / abs(impact.baseline_value)
                ) * 100

        # -----------------------------------------------------
        # CALCULATE TARGET PROGRESS
        # -----------------------------------------------------

        if (
            impact.baseline_value is not None
            and impact.current_value is not None
            and impact.target_value is not None
        ):

            if impact.direction == "increase":

                difference = (
                    impact.target_value
                    - impact.baseline_value
                )

                if difference != 0:

                    target_progress = (
                        (
                            impact.current_value
                            - impact.baseline_value
                        )
                        / difference
                    ) * 100

            else:

                difference = (
                    impact.baseline_value
                    - impact.target_value
                )

                if difference != 0:

                    target_progress = (
                        (
                            impact.baseline_value
                            - impact.current_value
                        )
                        / difference
                    ) * 100

        # -----------------------------------------------------
        # LIMIT TARGET PROGRESS
        # -----------------------------------------------------

        if target_progress is not None:

            target_progress = max(
                0,
                min(100, target_progress)
            )

        result.append({

            "id": impact.id,

            "metric_name": impact.metric_name,

            "metric_unit": impact.metric_unit,

            "direction": impact.direction,

            "baseline_value": impact.baseline_value,

            "current_value": impact.current_value,

            "target_value": impact.target_value,

            "improvement_percentage": (
                round(improvement, 2)
                if improvement is not None
                else None
            ),

            "target_progress_percentage": (
                round(target_progress, 2)
                if target_progress is not None
                else None
            ),

            "beneficiaries": impact.beneficiaries,

            "location": impact.location,

            "evidence": impact.evidence,

            "notes": impact.notes
        })

    return {
        "project_id": project.id,
        "project_title": project.title,
        "impact_metrics": result
    }

@router.get("/projects/{project_id}/impact/summary")
def get_impact_summary(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    impacts = db.query(Impact).filter(
        Impact.project_id == project_id
    ).all()

    total_beneficiaries = sum(
        impact.beneficiaries or 0
        for impact in impacts
    )

    completed_targets = 0

    impact_details = []

    for impact in impacts:

        baseline = impact.baseline_value
        current = impact.current_value
        target = impact.target_value

        improvement_percentage = None
        target_progress = None

        if (
            baseline is not None
            and current is not None
            and baseline != 0
        ):
            if impact.direction == "decrease":
                improvement_percentage = (
                    (baseline - current)
                    / abs(baseline)
                ) * 100
            else:
                improvement_percentage = (
                    (current - baseline)
                    / abs(baseline)
                ) * 100

        if (
            baseline is not None
            and current is not None
            and target is not None
            and target != baseline
        ):
            if impact.direction == "decrease":
                target_progress = (
                    (baseline - current)
                    / (baseline - target)
                ) * 100
            else:
                target_progress = (
                    (current - baseline)
                    / (target - baseline)
                ) * 100

            target_progress = max(
                0,
                min(100, target_progress)
            )

            if target_progress >= 100:
                completed_targets += 1

        impact_details.append({
            "id": impact.id,
            "metric_name": impact.metric_name,
            "metric_unit": impact.metric_unit,
            "direction": impact.direction,
            "baseline": baseline,
            "current": current,
            "target": target,
            "improvement_percentage": (
                round(improvement_percentage, 2)
                if improvement_percentage is not None
                else None
            ),
            "target_progress": (
                round(target_progress, 2)
                if target_progress is not None
                else None
            ),
            "beneficiaries": impact.beneficiaries,
            "location": impact.location,
            "evidence": impact.evidence,
            "notes": impact.notes
        })

    total_metrics = len(impacts)

    average_improvement = 0

    improvement_values = [
        item["improvement_percentage"]
        for item in impact_details
        if item["improvement_percentage"] is not None
    ]

    if improvement_values:
        average_improvement = (
            sum(improvement_values)
            / len(improvement_values)
        )

    average_target_progress = 0

    target_values = [
        item["target_progress"]
        for item in impact_details
        if item["target_progress"] is not None
    ]

    if target_values:
        average_target_progress = (
            sum(target_values)
            / len(target_values)
        )

    return {
        "project": {
            "id": project.id,
            "title": project.title,
            "status": project.status
        },

        "summary": {
            "total_metrics": total_metrics,
            "completed_targets": completed_targets,
            "total_beneficiaries": total_beneficiaries,
            "average_improvement": round(
                average_improvement,
                2
            ),
            "average_target_progress": round(
                average_target_progress,
                2
            )
        },

        "impact_metrics": impact_details
    }
# ============================================================
# INDUSTRY MATCHING
# ============================================================

@router.get("/{problem_id}/industries")
def get_matching_industries(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    saved_matches = db.query(IndustryMatch).filter(
        IndustryMatch.problem_id == problem_id
    ).all()

    results = []
    for match in saved_matches:
        industry = db.query(Industry).filter(
            Industry.id == match.industry_id
        ).first()

        if not industry:
            continue

        results.append({
            "id": match.id,
            "match_id": match.id,
            "industry_id": industry.id,
            "industry_name": industry.name,
            "domain": industry.domain,
            "location": industry.location,
            "match_score": match.match_score,
            "expertise_score": match.expertise_score,
            "matched_capabilities": match.matched_capabilities or [],
            "missing_capabilities": match.missing_capabilities or [],
            "matched_expertise": match.matched_expertise or [],
            "status": match.status
        })

    return {
        "problem_id": problem.id,
        "problem_title": problem.title,
        "industry_matches": results,
        "matches": results
    }


@router.post("/{problem_id}/industries/generate")
def generate_industry_matches(
    problem_id: int,
    db: Session = Depends(get_db)
):

    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    if problem.validation_status != "Validated":
        raise HTTPException(
            status_code=400,
            detail="Problem must be validated before industry matching"
        )

    # Delete previous matches
    db.query(IndustryMatch).filter(
        IndustryMatch.problem_id == problem_id
    ).delete()

    db.commit()

    # Generate new matches
    matches = find_matching_industries(
        problem,
        db,
        limit=5
    )

    saved_matches = []

    for match in matches:

        industry_match = IndustryMatch(
            problem_id=problem.id,
            industry_id=match["industry_id"],
            match_score=match["match_score"],
            expertise_score=match["expertise_score"],
            domain_match=match["domain_match"],
            capability_match=match["capability_match"],
            matched_expertise=match["matched_expertise"],
            missing_expertise=match["missing_expertise"],
            matched_capabilities=match["matched_capabilities"],
            missing_capabilities=match["missing_capabilities"],
            status="Pending"
        )

        db.add(industry_match)

        saved_matches.append(industry_match)

    db.commit()

    for match in saved_matches:
        db.refresh(match)

    return {
        "message": "Industry matches generated successfully",
        "problem_id": problem.id,
        "matches": [
            {
                "match_id": match.id,
                "industry_id": match.industry_id,
                "match_score": match.match_score,
                "expertise_score": match.expertise_score,
                "domain_match": match.domain_match,
                "capability_match": match.capability_match,
                "matched_expertise": match.matched_expertise,
                "missing_expertise": match.missing_expertise,
                "matched_capabilities": match.matched_capabilities,
                "missing_capabilities": match.missing_capabilities,
                "status": match.status
            }
            for match in saved_matches
        ]
    }


@router.put("/industries/{match_id}/accept")
def accept_industry_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    match = db.query(IndustryMatch).filter(
        IndustryMatch.id == match_id
    ).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail="Industry match not found"
        )

    if match.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending matches can be accepted"
        )

    # Get the problem
    problem = db.query(Problem).filter(
        Problem.id == match.problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    # Get the industry
    industry = db.query(Industry).filter(
        Industry.id == match.industry_id
    ).first()

    if not industry:
        raise HTTPException(
            status_code=404,
            detail="Industry not found"
        )

    # Accept the industry match
    match.status = "Accepted"

    db.commit()
    db.refresh(match)

    # ------------------------------------------------
    # NOTIFICATION 1: Notify Industry
    # ------------------------------------------------

    create_notification(
        db=db,
        recipient_type="Industry",
        recipient_id=industry.id,
        recipient_name=industry.name,
        notification_type="Industry Partnership Accepted",
        title="Industry Partnership Accepted",
        message=(
            f"Your organization has been selected to collaborate "
            f"on the problem '{problem.title}'."
        ),
        problem_id=problem.id
    )

    # ------------------------------------------------
    # NOTIFICATION 2: Notify University
    # ------------------------------------------------

    create_notification(
        db=db,
        recipient_type="University",
        recipient_name="Assigned University",
        notification_type="Industry Partner Joined",
        title="Industry Partner Joined",
        message=(
            f"{industry.name} has been accepted as an industry "
            f"partner for the problem '{problem.title}'."
        ),
        problem_id=problem.id
    )

    # ------------------------------------------------
    # NOTIFICATION 3: Notify Government
    # ------------------------------------------------

    create_notification(
        db=db,
        recipient_type="Government",
        recipient_name="Government",
        notification_type="Industry Partnership Accepted",
        title="Industry Partner Accepted",
        message=(
            f"{industry.name} has been accepted as an industry "
            f"partner for the problem '{problem.title}'."
        ),
        problem_id=problem.id
    )

    return {
        "message": "Industry partnership accepted",
        "match_id": match.id,
        "industry_id": match.industry_id,
        "industry_name": industry.name,
        "problem_id": match.problem_id,
        "status": match.status
    }


@router.put("/industries/{match_id}/reject")
def reject_industry_match(
    match_id: int,
    db: Session = Depends(get_db)
):

    match = db.query(IndustryMatch).filter(
        IndustryMatch.id == match_id
    ).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail="Industry match not found"
        )

    if match.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending matches can be rejected"
        )

    match.status = "Rejected"

    db.commit()
    db.refresh(match)

    return {
        "message": "Industry partnership rejected",
        "match_id": match.id,
        "industry_id": match.industry_id,
        "problem_id": match.problem_id,
        "status": match.status
    }


@router.get("/industries/{industry_id}/problems")
def get_industry_problems(
    industry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("industry", "government")),
):
    assert_org_access(current_user, industry_id, "industry")

    industry = db.query(Industry).filter(
        Industry.id == industry_id
    ).first()

    if not industry:
        raise HTTPException(
            status_code=404,
            detail="Industry not found"
        )

    matches = db.query(IndustryMatch).filter(
        IndustryMatch.industry_id == industry_id,
        IndustryMatch.status.in_(["Pending", "Accepted"])
    ).all()

    problems = []

    for match in matches:

        problem = db.query(Problem).filter(
            Problem.id == match.problem_id
        ).first()

        if problem:
            problems.append({
                "id": match.id,
                "match_id": match.id,
                "problem_id": problem.id,
                "title": problem.title,
                "description": problem.description,
                "location": problem.location,
                "category": problem.category,
                "status": problem.status,
                "match_status": match.status,
                "match_score": match.match_score,
                "matched_capabilities": match.matched_capabilities or []
            })

    return {
        "industry_id": industry.id,
        "industry_name": industry.name,
        "problems": problems
    }

# ============================================================
# INDUSTRY PARTNERSHIPS
# ============================================================


@router.post("/{problem_id}/partnerships")
def create_partnership(
    problem_id: int,
    industry_id: int,
    contribution_type: str,
    description: str | None = None,
    project_id: int | None = None,
    db: Session = Depends(get_db)
):

    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    industry = db.query(Industry).filter(
        Industry.id == industry_id
    ).first()

    if not industry:
        raise HTTPException(
            status_code=404,
            detail="Industry not found"
        )

    # Check whether industry was accepted for this problem
    accepted_match = db.query(IndustryMatch).filter(
        IndustryMatch.problem_id == problem_id,
        IndustryMatch.industry_id == industry_id,
        IndustryMatch.status == "Accepted"
    ).first()

    if not accepted_match:
        raise HTTPException(
            status_code=400,
            detail="Industry must be accepted before creating a partnership"
        )

    # If project_id is provided, verify the project
    project = None

    if project_id is not None:

        project = db.query(Project).filter(
            Project.id == project_id
        ).first()

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

        if project.problem_id != problem_id:
            raise HTTPException(
                status_code=400,
                detail="Project does not belong to this problem"
            )

    allowed_contributions = [
        "Mentoring",
        "Funding",
        "Prototyping",
        "Testing",
        "Pilot Deployment",
        "Technology Transfer",
        "Community Outreach"
    ]

    if contribution_type not in allowed_contributions:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid contribution type",
                "allowed_types": allowed_contributions
            }
        )

    partnership = Partnership(
        problem_id=problem_id,
        project_id=project_id,
        industry_id=industry_id,
        contribution_type=contribution_type,
        description=description,
        status="Proposed"
    )

    db.add(partnership)
    db.commit()
    db.refresh(partnership)

    return {
        "message": "Industry partnership created successfully",
        "partnership": {
            "id": partnership.id,
            "problem_id": partnership.problem_id,
            "project_id": partnership.project_id,
            "industry_id": partnership.industry_id,
            "contribution_type": partnership.contribution_type,
            "description": partnership.description,
            "status": partnership.status
        }
    }


@router.put("/{problem_id}/confirm-collaboration")
def confirm_collaboration(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("government")),
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    uni_match = db.query(UniversityMatch).filter(
        UniversityMatch.problem_id == problem_id,
        UniversityMatch.status == "Accepted"
    ).first()

    ind_match = db.query(IndustryMatch).filter(
        IndustryMatch.problem_id == problem_id,
        IndustryMatch.status == "Accepted"
    ).first()

    # Update problem status
    problem.status = "Collaboration Confirmed"
    problem.validation_status = "Validated"

    # Create project if not exists
    project = db.query(Project).filter(Project.problem_id == problem_id).first()
    if not project:
        project = Project(
            problem_id=problem_id,
            title=f"Project: {problem.title}",
            description=f"Quad-Helix joint execution workspace for problem '{problem.title}'.",
            status="Active",
            lead_university_id=uni_match.university_id if uni_match else None,
            lead_industry_id=ind_match.industry_id if ind_match else None,
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    # Create partnership record if ind_match exists
    if ind_match:
        existing_part = db.query(Partnership).filter(
            Partnership.problem_id == problem_id,
            Partnership.industry_id == ind_match.industry_id
        ).first()
        if not existing_part:
            partnership = Partnership(
                problem_id=problem_id,
                project_id=project.id,
                industry_id=ind_match.industry_id,
                contribution_type="Pilot Deployment",
                description="Government confirmed Quad-Helix partnership.",
                status="Accepted"
            )
            db.add(partnership)

    db.commit()
    db.refresh(problem)

    # Notifications
    create_notification(
        db=db,
        recipient_type="Community",
        recipient_name=problem.affected or "Community",
        notification_type="Collaboration Confirmed",
        title="Quad-Helix Collaboration Confirmed!",
        message=f"Government officially confirmed Quad-Helix partnership for '{problem.title}'. Joint project workspace activated.",
        problem_id=problem.id,
        project_id=project.id
    )

    return {
        "message": "Collaboration officially confirmed by Government!",
        "problem_id": problem.id,
        "project_id": project.id,
        "status": problem.status
    }


@router.get("/{problem_id}/partnerships")
def get_problem_partnerships(
    problem_id: int,
    db: Session = Depends(get_db)
):

    problem = db.query(Problem).filter(
        Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    partnerships = db.query(Partnership).filter(
        Partnership.problem_id == problem_id
    ).all()

    result = []

    for partnership in partnerships:

        industry = db.query(Industry).filter(
            Industry.id == partnership.industry_id
        ).first()

        result.append({
            "partnership_id": partnership.id,
            "industry_id": partnership.industry_id,
            "industry_name": (
                industry.name
                if industry
                else None
            ),
            "project_id": partnership.project_id,
            "contribution_type": partnership.contribution_type,
            "description": partnership.description,
            "status": partnership.status
        })

    return {
        "problem_id": problem_id,
        "partnerships": result
    }


@router.put("/partnerships/{partnership_id}/accept")
def accept_partnership(
    partnership_id: int,
    db: Session = Depends(get_db)
):

    partnership = db.query(Partnership).filter(
        Partnership.id == partnership_id
    ).first()

    if not partnership:
        raise HTTPException(
            status_code=404,
            detail="Partnership not found"
        )

    if partnership.status != "Proposed":
        raise HTTPException(
            status_code=400,
            detail="Only proposed partnerships can be accepted"
        )

    partnership.status = "Active"

    db.commit()
    db.refresh(partnership)

    return {
        "message": "Industry partnership activated",
        "partnership_id": partnership.id,
        "industry_id": partnership.industry_id,
        "project_id": partnership.project_id,
        "contribution_type": partnership.contribution_type,
        "status": partnership.status
    }


@router.put("/partnerships/{partnership_id}/complete")
def complete_partnership(
    partnership_id: int,
    db: Session = Depends(get_db)
):

    partnership = db.query(Partnership).filter(
        Partnership.id == partnership_id
    ).first()

    if not partnership:
        raise HTTPException(
            status_code=404,
            detail="Partnership not found"
        )

    if partnership.status != "Active":
        raise HTTPException(
            status_code=400,
            detail="Only active partnerships can be completed"
        )

    partnership.status = "Completed"

    db.commit()
    db.refresh(partnership)

    return {
        "message": "Industry partnership completed",
        "partnership_id": partnership.id,
        "industry_id": partnership.industry_id,
        "project_id": partnership.project_id,
        "contribution_type": partnership.contribution_type,
        "status": partnership.status
    }


@router.get("/partnerships/{partnership_id}")
def get_partnership(
    partnership_id: int,
    db: Session = Depends(get_db)
):

    partnership = db.query(Partnership).filter(
        Partnership.id == partnership_id
    ).first()

    if not partnership:
        raise HTTPException(
            status_code=404,
            detail="Partnership not found"
        )

    industry = db.query(Industry).filter(
        Industry.id == partnership.industry_id
    ).first()

    return {
        "partnership_id": partnership.id,
        "problem_id": partnership.problem_id,
        "project_id": partnership.project_id,
        "industry_id": partnership.industry_id,
        "industry_name": (
            industry.name
            if industry
            else None
        ),
        "contribution_type": partnership.contribution_type,
        "description": partnership.description,
        "status": partnership.status
    }

@router.put("/partnerships/{partnership_id}/project")
def attach_partnership_to_project(
    partnership_id: int,
    project_id: int,
    db: Session = Depends(get_db)
):

    partnership = db.query(Partnership).filter(
        Partnership.id == partnership_id
    ).first()

    if not partnership:
        raise HTTPException(
            status_code=404,
            detail="Partnership not found"
        )

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Partnership and project must belong to same problem
    if partnership.problem_id != project.problem_id:
        raise HTTPException(
            status_code=400,
            detail="Partnership and project belong to different problems"
        )

    partnership.project_id = project.id

    db.commit()
    db.refresh(partnership)

    return {
        "message": "Industry partnership attached to project",
        "partnership": {
            "id": partnership.id,
            "problem_id": partnership.problem_id,
            "project_id": partnership.project_id,
            "industry_id": partnership.industry_id,
            "contribution_type": partnership.contribution_type,
            "status": partnership.status
        }
    }

@router.get("/projects/{project_id}/partnerships")
def get_project_partnerships(
    project_id: int,
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    partnerships = db.query(Partnership).filter(
        Partnership.project_id == project_id
    ).all()

    result = []

    for partnership in partnerships:

        industry = db.query(Industry).filter(
            Industry.id == partnership.industry_id
        ).first()

        result.append({
            "partnership_id": partnership.id,
            "industry_id": partnership.industry_id,
            "industry_name": (
                industry.name
                if industry
                else None
            ),
            "contribution_type": partnership.contribution_type,
            "description": partnership.description,
            "status": partnership.status
        })

    return {
        "project_id": project.id,
        "project_title": project.title,
        "partnerships": result
    }

@router.post("/projects/{project_id}/collaboration")
def create_collaboration_message(
    project_id: int,
    sender_type: str,
    sender_name: str,
    message: str,
    message_type: str = "Update",
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    allowed_sender_types = [
        "Government",
        "University",
        "Industry"
    ]

    if sender_type not in allowed_sender_types:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid sender type",
                "allowed_types": allowed_sender_types
            }
        )

    allowed_message_types = [
        "Update",
        "Comment",
        "Decision"
    ]

    if message_type not in allowed_message_types:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid message type",
                "allowed_types": allowed_message_types
            }
        )

    collaboration = Collaboration(
        project_id=project_id,
        sender_type=sender_type,
        sender_name=sender_name,
        message_type=message_type,
        message=message
    )

    db.add(collaboration)
    db.commit()
    db.refresh(collaboration)

    return {
        "message": "Collaboration message created successfully",
        "collaboration": {
            "id": collaboration.id,
            "project_id": collaboration.project_id,
            "sender_type": collaboration.sender_type,
            "sender_name": collaboration.sender_name,
            "message_type": collaboration.message_type,
            "message": collaboration.message,
            "created_at": collaboration.created_at
        }
    }

@router.get("/projects/{project_id}/collaboration")
def get_project_collaboration(
    project_id: int,
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    messages = db.query(Collaboration).filter(
        Collaboration.project_id == project_id
    ).order_by(
        Collaboration.created_at.asc()
    ).all()

    return {
        "project_id": project.id,
        "project_title": project.title,
        "messages": [
            {
                "id": item.id,
                "sender_type": item.sender_type,
                "sender_name": item.sender_name,
                "message_type": item.message_type,
                "message": item.message,
                "created_at": item.created_at
            }
            for item in messages
        ]
    }



@router.post("/evidence/upload")
def upload_evidence(
    file: UploadFile = File(...),
    problem_id: int | None = None,
    project_id: int | None = None,
    milestone_id: int | None = None,
    impact_id: int | None = None,
    description: str | None = None,
    uploaded_by: str | None = None,
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # CHECK THAT AT LEAST ONE RECORD IS PROVIDED
    # ---------------------------------------------------------

    if not any([
        problem_id,
        project_id,
        milestone_id,
        impact_id
    ]):
        raise HTTPException(
            status_code=400,
            detail="Evidence must be linked to a problem, project, milestone, or impact"
        )

    # ---------------------------------------------------------
    # CHECK PROBLEM
    # ---------------------------------------------------------

    if problem_id is not None:

        problem = db.query(Problem).filter(
            Problem.id == problem_id
        ).first()

        if not problem:
            raise HTTPException(
                status_code=404,
                detail="Problem not found"
            )

    # ---------------------------------------------------------
    # CHECK PROJECT
    # ---------------------------------------------------------

    if project_id is not None:

        project = db.query(Project).filter(
            Project.id == project_id
        ).first()

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

    # ---------------------------------------------------------
    # CHECK MILESTONE
    # ---------------------------------------------------------

    if milestone_id is not None:

        milestone = db.query(Milestone).filter(
            Milestone.id == milestone_id
        ).first()

        if not milestone:
            raise HTTPException(
                status_code=404,
                detail="Milestone not found"
            )

    # ---------------------------------------------------------
    # CHECK IMPACT
    # ---------------------------------------------------------

    if impact_id is not None:

        impact = db.query(Impact).filter(
            Impact.id == impact_id
        ).first()

        if not impact:
            raise HTTPException(
                status_code=404,
                detail="Impact record not found"
            )

    # ---------------------------------------------------------
    # CHECK FILE
    # ---------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )

    allowed_extensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".mp4",
        ".mov"
    ]

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    # ---------------------------------------------------------
    # CREATE UPLOAD DIRECTORY
    # ---------------------------------------------------------

    upload_directory = "uploads"

    os.makedirs(
        upload_directory,
        exist_ok=True
    )

    # ---------------------------------------------------------
    # CREATE UNIQUE FILE NAME
    # ---------------------------------------------------------

    import uuid

    unique_filename = (
        str(uuid.uuid4())
        + extension
    )

    file_path = os.path.join(
        upload_directory,
        unique_filename
    )

    # ---------------------------------------------------------
    # SAVE FILE
    # ---------------------------------------------------------

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # ---------------------------------------------------------
    # GET FILE SIZE
    # ---------------------------------------------------------

    file_size = os.path.getsize(
        file_path
    )

    # ---------------------------------------------------------
    # SAVE DATABASE RECORD
    # ---------------------------------------------------------

    evidence = Evidence(
        problem_id=problem_id,
        project_id=project_id,
        milestone_id=milestone_id,
        impact_id=impact_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file_size,
        description=description,
        uploaded_by=uploaded_by
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return {
        "message": "Evidence uploaded successfully",
        "evidence": {
            "id": evidence.id,
            "file_name": evidence.file_name,
            "file_type": evidence.file_type,
            "file_size": evidence.file_size,
            "problem_id": evidence.problem_id,
            "project_id": evidence.project_id,
            "milestone_id": evidence.milestone_id,
            "impact_id": evidence.impact_id,
            "description": evidence.description,
            "uploaded_by": evidence.uploaded_by
        }
    }


@router.get("/projects/{project_id}/proposal")
def get_project_proposal(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    proposal = db.query(Proposal).filter(
        Proposal.project_id == project_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    return proposal

@router.post("/projects/{project_id}/proposal")
def create_proposal(
    project_id: int,
    title: str,
    problem_understanding: str = None,
    proposed_approach: str = None,
    technology: str = None,
    objectives: str = None,
    expected_outcome: str = None,
    timeline: str = None,
    budget: float = None,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    existing_proposal = db.query(Proposal).filter(
        Proposal.project_id == project_id
    ).first()

    if existing_proposal:
        raise HTTPException(
            status_code=400,
            detail="Proposal already exists for this project"
        )

    proposal = Proposal(
        project_id=project_id,
        title=title,
        problem_understanding=problem_understanding,
        proposed_approach=proposed_approach,
        technology=technology,
        objectives=objectives,
        expected_outcome=expected_outcome,
        timeline=timeline,
        budget=budget,
        status="Draft"
    )

    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    return {
        "message": "Proposal created successfully",
        "proposal": proposal
    }

@router.put("/projects/proposals/{proposal_id}")
def update_proposal(
    proposal_id: int,
    title: str = None,
    problem_understanding: str = None,
    proposed_approach: str = None,
    technology: str = None,
    objectives: str = None,
    expected_outcome: str = None,
    timeline: str = None,
    budget: float = None,
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    if proposal.status not in ["Draft", "Changes Requested"]:
        raise HTTPException(
            status_code=400,
            detail="Proposal cannot be edited in its current status"
        )

    if title is not None:
        proposal.title = title

    if problem_understanding is not None:
        proposal.problem_understanding = problem_understanding

    if proposed_approach is not None:
        proposal.proposed_approach = proposed_approach

    if technology is not None:
        proposal.technology = technology

    if objectives is not None:
        proposal.objectives = objectives

    if expected_outcome is not None:
        proposal.expected_outcome = expected_outcome

    if timeline is not None:
        proposal.timeline = timeline

    if budget is not None:
        proposal.budget = budget

    db.commit()
    db.refresh(proposal)

    return {
        "message": "Proposal updated successfully",
        "proposal": proposal
    }

@router.put("/projects/proposals/{proposal_id}/submit")
def submit_proposal(
    proposal_id: int,
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    if proposal.status != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft proposals can be submitted"
        )

    project = db.query(Project).filter(
        Project.id == proposal.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    proposal.status = "Submitted"

    db.commit()
    db.refresh(proposal)

    # Notify Government
    create_notification(
        db=db,
        recipient_type="Government",
        recipient_name="Government",
        notification_type="Proposal Submitted",
        title="Proposal Submitted",
        message=(
            f"The proposal '{proposal.title}' for project "
            f"'{project.title}' has been submitted for review."
        ),
        problem_id=project.problem_id,
        project_id=project.id
    )

    # Notify University
    create_notification(
        db=db,
        recipient_type="University",
        recipient_name="Assigned University",
        notification_type="Proposal Submitted",
        title="Proposal Submitted",
        message=(
            f"Proposal '{proposal.title}' has been submitted "
            f"for review."
        ),
        problem_id=project.problem_id,
        project_id=project.id
    )

    return {
        "message": "Proposal submitted successfully",
        "proposal_id": proposal.id,
        "status": proposal.status
    }

@router.put("/projects/proposals/{proposal_id}/review")
def review_proposal(
    proposal_id: int,
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    if proposal.status != "Submitted":
        raise HTTPException(
            status_code=400,
            detail="Only submitted proposals can be reviewed"
        )

    proposal.status = "Under Review"

    db.commit()
    db.refresh(proposal)

    return {
        "message": "Proposal is now under review",
        "proposal_id": proposal.id,
        "status": proposal.status
    }

@router.put("/projects/proposals/{proposal_id}/approve")
def approve_proposal(
    proposal_id: int,
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    if proposal.status != "Under Review":
        raise HTTPException(
            status_code=400,
            detail="Only proposals under review can be approved"
        )

    project = db.query(Project).filter(
        Project.id == proposal.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    proposal.status = "Approved"
    project.status = "Prototype"

    db.commit()
    db.refresh(proposal)
    db.refresh(project)

    # Notify University
    create_notification(
        db=db,
        recipient_type="University",
        recipient_name="Assigned University",
        notification_type="Proposal Approved",
        title="Proposal Approved",
        message=(
            f"The proposal '{proposal.title}' has been approved. "
            f"The project can now move into the prototype stage."
        ),
        problem_id=project.problem_id,
        project_id=project.id
    )

    # Notify Government
    create_notification(
        db=db,
        recipient_type="Government",
        recipient_name="Government",
        notification_type="Proposal Approved",
        title="Proposal Approved",
        message=(
            f"The proposal '{proposal.title}' has been approved "
            f"and project '{project.title}' has entered the prototype stage."
        ),
        problem_id=project.problem_id,
        project_id=project.id
    )

    return {
        "message": "Proposal approved successfully",
        "proposal_id": proposal.id,
        "status": proposal.status,
        "project_status": project.status
    }


@router.put("/projects/proposals/{proposal_id}/reject")
def reject_proposal(
    proposal_id: int,
    review_comments: str = None,
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    if proposal.status != "Under Review":
        raise HTTPException(
            status_code=400,
            detail="Only proposals under review can be rejected"
        )

    project = db.query(Project).filter(
        Project.id == proposal.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    proposal.status = "Rejected"
    proposal.review_comments = review_comments

    db.commit()
    db.refresh(proposal)

    create_notification(
        db=db,
        recipient_type="University",
        recipient_name="Assigned University",
        notification_type="Proposal Rejected",
        title="Proposal Rejected",
        message=(
            f"The proposal '{proposal.title}' has been rejected. "
            f"Review comments: {review_comments or 'No comments provided.'}"
        ),
        problem_id=project.problem_id,
        project_id=project.id
    )

    return {
        "message": "Proposal rejected",
        "proposal_id": proposal.id,
        "status": proposal.status,
        "review_comments": proposal.review_comments
    }


@router.put("/projects/proposals/{proposal_id}/request-changes")
def request_proposal_changes(
    proposal_id: int,
    review_comments: str,
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
        detail="Proposal not found"
        )

    if proposal.status != "Under Review":
        raise HTTPException(
            status_code=400,
            detail="Only proposals under review can have changes requested"
        )

    project = db.query(Project).filter(
        Project.id == proposal.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    proposal.status = "Changes Requested"
    proposal.review_comments = review_comments

    db.commit()
    db.refresh(proposal)

    create_notification(
        db=db,
        recipient_type="University",
        recipient_name="Assigned University",
        notification_type="Proposal Changes Requested",
        title="Changes Requested",
        message=(
            f"Changes have been requested for proposal "
            f"'{proposal.title}'. Comments: {review_comments}"
        ),
        problem_id=project.problem_id,
        project_id=project.id
    )

    return {
        "message": "Changes requested for proposal",
        "proposal_id": proposal.id,
        "status": proposal.status,
        "review_comments": proposal.review_comments
    }