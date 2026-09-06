"""
Seed demo user accounts for all 4 roles.
Run once: python seed_demo_users.py
"""

from dotenv import load_dotenv
load_dotenv()

from app.database.connection import SessionLocal, Base, engine
from app.models.user import User
from passlib.context import CryptContext

# Ensure all tables exist
Base.metadata.create_all(bind=engine)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
db  = SessionLocal()

demos = [
    {
        "name":              "Demo Citizen",
        "email":             "citizen@demo.com",
        "password":          "demo123",
        "role":              "citizen",
        "organization_name": None,
    },
    {
        "name":              "Demo Government",
        "email":             "govt@demo.com",
        "password":          "demo123",
        "role":              "government",
        "organization_name": "Government of India",
    },
    {
        "name":              "Demo University",
        "email":             "uni@demo.com",
        "password":          "demo123",
        "role":              "university",
        "organization_name": "Demo University",
    },
    {
        "name":              "Demo Industry",
        "email":             "industry@demo.com",
        "password":          "demo123",
        "role":              "industry",
        "organization_name": "Demo Industry Pvt Ltd",
    },
]

for d in demos:
    existing = db.query(User).filter(User.email == d["email"]).first()
    if existing:
        # Refresh the password hash in case it was corrupted
        existing.hashed_password = pwd.hash(d["password"])
        existing.is_active = True
        db.commit()
        print("Updated :", d["email"], "->", d["role"])
    else:
        user = User(
            name              = d["name"],
            email             = d["email"],
            hashed_password   = pwd.hash(d["password"]),
            role              = d["role"],
            organization_name = d["organization_name"],
            is_active         = True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("Created :", d["email"], "->", d["role"])

db.close()
print("\nAll demo accounts ready.")
print("----------------------------")
print("citizen@demo.com   / demo123  (Citizen)")
print("govt@demo.com      / demo123  (Government)")
print("uni@demo.com       / demo123  (University)")
print("industry@demo.com  / demo123  (Industry)")
