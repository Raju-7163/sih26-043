"""
Fix demo university and industry accounts — link their org_id
to the actual University and Industry records in the DB.

Run once: python fix_demo_org_ids.py
"""

from dotenv import load_dotenv
load_dotenv()

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.university import University
from app.models.industry import Industry

db = SessionLocal()

# ── Find first university record (IIT Bombay, id=1 typically) ─────────────────
iit_bombay = db.query(University).filter(
    University.name == "IIT Bombay"
).first()

if not iit_bombay:
    iit_bombay = db.query(University).first()

# ── Find first industry record (TCS, id=1 typically) ─────────────────────────
tcs = db.query(Industry).filter(
    Industry.name == "Tata Consultancy Services"
).first()

if not tcs:
    tcs = db.query(Industry).first()

print(f"University to link: {iit_bombay.name} (id={iit_bombay.id})" if iit_bombay else "No university found!")
print(f"Industry to link:   {tcs.name} (id={tcs.id})" if tcs else "No industry found!")

if not iit_bombay or not tcs:
    print("ERROR: Seed universities/industries first: python seed_all.py")
    db.close()
    exit(1)

# ── Update uni@demo.com ────────────────────────────────────────────────────────
uni_user = db.query(User).filter(User.email == "uni@demo.com").first()
if uni_user:
    uni_user.org_id            = iit_bombay.id
    uni_user.organization_name = iit_bombay.name
    db.commit()
    print(f"✓ uni@demo.com  → org_id={iit_bombay.id} ({iit_bombay.name})")
else:
    print("✗ uni@demo.com not found — run seed_all.py first")

# ── Update industry@demo.com ───────────────────────────────────────────────────
ind_user = db.query(User).filter(User.email == "industry@demo.com").first()
if ind_user:
    ind_user.org_id            = tcs.id
    ind_user.organization_name = tcs.name
    db.commit()
    print(f"✓ industry@demo.com → org_id={tcs.id} ({tcs.name})")
else:
    print("✗ industry@demo.com not found — run seed_all.py first")

# ── Verify all 4 accounts ─────────────────────────────────────────────────────
print("\nFinal account state:")
print("-" * 60)
for email in ["citizen@demo.com", "govt@demo.com", "uni@demo.com", "industry@demo.com"]:
    u = db.query(User).filter(User.email == email).first()
    if u:
        print(f"  {u.email:30s} role={u.role:12s} org_id={u.org_id}")
    else:
        print(f"  {email:30s} NOT FOUND")

db.close()
print("\nDone. University and industry dashboard requests will now load correctly.")
