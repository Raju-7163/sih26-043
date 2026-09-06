"""
Full database seed for SolveX on Neon.
Run: python seed_all.py

Seeds:
  - 4 demo user accounts (all roles)
  - 8 universities
  - 8 industry partners
"""

from dotenv import load_dotenv
load_dotenv()

from app.database.connection import SessionLocal, Base, engine
from app.models.user import User
from app.models.university import University
from app.models.industry import Industry
from passlib.context import CryptContext

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Tables ready.\n")

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
db  = SessionLocal()


# ============================================================
# DEMO USERS
# ============================================================

print("Seeding demo users...")

users = [
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
        "organization_name": "Ministry of Science & Technology",
    },
    {
        "name":              "Demo University",
        "email":             "uni@demo.com",
        "password":          "demo123",
        "role":              "university",
        "organization_name": "IIT Bombay",
    },
    {
        "name":              "Demo Industry",
        "email":             "industry@demo.com",
        "password":          "demo123",
        "role":              "industry",
        "organization_name": "Tata Consultancy Services",
    },
]

for d in users:
    existing = db.query(User).filter(User.email == d["email"]).first()
    if existing:
        existing.hashed_password = pwd.hash(d["password"])
        existing.is_active = True
        db.commit()
        print(f"  Updated : {d['email']}")
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
        print(f"  Created : {d['email']} ({d['role']})")


# ============================================================
# UNIVERSITIES
# ============================================================

print("\nSeeding universities...")

universities = [
    {
        "name": "IIT Bombay",
        "location": "Mumbai, Maharashtra",
        "institution_type": "IIT",
        "disciplines": ["Engineering", "Technology", "Science", "Management"],
        "expertise": ["Artificial Intelligence", "IoT", "Data Science", "Robotics",
                      "Environmental Engineering", "Water Resources", "Civil Engineering",
                      "Electrical Engineering", "Computer Science"],
        "facilities": ["AI Lab", "IoT Lab", "Water Testing Lab", "Robotics Lab",
                       "High Performance Computing", "3D Printing"],
        "innovation_centres": ["Society for Innovation and Entrepreneurship (SINE)"],
        "incubation_facilities": ["SINE Incubator", "Technology Business Incubator"],
        "description": "Premier technical institute with world-class research in AI, IoT, and environmental engineering.",
    },
    {
        "name": "IIT Delhi",
        "location": "New Delhi, Delhi",
        "institution_type": "IIT",
        "disciplines": ["Engineering", "Technology", "Design", "Management"],
        "expertise": ["Machine Learning", "Smart Agriculture", "Embedded Systems",
                      "Renewable Energy", "Healthcare Technology", "Nanotechnology",
                      "Transportation Systems", "Data Analytics"],
        "facilities": ["Smart Agriculture Lab", "Energy Research Centre", "Medical Device Lab",
                       "Transportation Lab", "Design Innovation Centre"],
        "innovation_centres": ["Foundation for Innovation and Technology Transfer (FITT)"],
        "incubation_facilities": ["IIT Delhi Incubation Centre"],
        "description": "Top-ranked institution excelling in smart systems, agriculture tech, and renewable energy research.",
    },
    {
        "name": "IIT Madras",
        "location": "Chennai, Tamil Nadu",
        "institution_type": "IIT",
        "disciplines": ["Engineering", "Science", "Technology", "Humanities"],
        "expertise": ["Ocean Technology", "Rural Technology", "Waste Management",
                      "Structural Engineering", "Biotechnology", "Healthcare",
                      "Remote Sensing", "GIS"],
        "facilities": ["Ocean Engineering Lab", "Rural Technology Centre", "Biotech Lab",
                       "GIS & Remote Sensing Lab", "Waste Treatment Plant"],
        "innovation_centres": ["Centre for Innovation (CFI)", "Nirmaan Incubator"],
        "incubation_facilities": ["IIT Madras Research Park", "Nirmaan Incubator"],
        "description": "Leader in rural tech, ocean engineering, and biotechnology with strong industry connections.",
    },
    {
        "name": "NIT Warangal",
        "location": "Warangal, Telangana",
        "institution_type": "NIT",
        "disciplines": ["Engineering", "Science", "Management"],
        "expertise": ["Civil Engineering", "Water Resources", "Environmental Science",
                      "Mining Engineering", "Chemical Engineering", "IoT",
                      "Flood Management", "Disaster Management"],
        "facilities": ["Hydraulics Lab", "Environmental Testing Lab", "Chemical Lab",
                       "Geotechnical Lab"],
        "innovation_centres": ["Centre for Innovation and Entrepreneurship"],
        "incubation_facilities": ["NIT Warangal Technology Incubation Centre"],
        "description": "Strong focus on civil, water resources, and environmental engineering in southern India.",
    },
    {
        "name": "Anna University",
        "location": "Chennai, Tamil Nadu",
        "institution_type": "State University",
        "disciplines": ["Engineering", "Technology", "Architecture", "Applied Sciences"],
        "expertise": ["Transportation Engineering", "Road Safety", "Urban Planning",
                      "Solid Waste Management", "Environmental Engineering",
                      "Computer Science", "Information Technology"],
        "facilities": ["Traffic Engineering Lab", "Waste Management Research Centre",
                       "Urban Planning Studio", "Environmental Lab"],
        "innovation_centres": ["Centre for Entrepreneurship Development"],
        "incubation_facilities": ["Anna University Incubator"],
        "description": "Largest technical university in India, strong in transportation, urban planning and waste management.",
    },
    {
        "name": "Amrita Vishwa Vidyapeetham",
        "location": "Coimbatore, Tamil Nadu",
        "institution_type": "Deemed University",
        "disciplines": ["Engineering", "Medicine", "Science", "Management", "Arts"],
        "expertise": ["Healthcare Technology", "Telemedicine", "Biomedical Engineering",
                      "Cybersecurity", "AI in Healthcare", "Agriculture Technology",
                      "Rural Development"],
        "facilities": ["Amrita Hospital", "Biomedical Lab", "Cybersecurity Centre",
                       "Smart Agriculture Lab", "Telemedicine Unit"],
        "innovation_centres": ["Amrita TBI", "Centre for Cybersecurity Systems"],
        "incubation_facilities": ["Amrita Technology Business Incubator"],
        "description": "Multi-campus institution excelling in healthcare tech, telemedicine, and rural development.",
    },
    {
        "name": "TERI School of Advanced Studies",
        "location": "New Delhi, Delhi",
        "institution_type": "Deemed University",
        "disciplines": ["Environmental Science", "Energy", "Sustainability", "Policy"],
        "expertise": ["Renewable Energy", "Climate Change", "Waste Management",
                      "Water Conservation", "Environmental Policy", "Green Technology",
                      "Carbon Management", "Solar Energy"],
        "facilities": ["Energy Research Lab", "Water Conservation Centre",
                       "Climate Research Centre", "Green Building Lab"],
        "innovation_centres": ["TERI Innovation Centre"],
        "incubation_facilities": ["TERI Incubation Network"],
        "description": "Specialized institution focused on energy, environment, and sustainable development.",
    },
    {
        "name": "BITS Pilani",
        "location": "Pilani, Rajasthan",
        "institution_type": "Deemed University",
        "disciplines": ["Engineering", "Science", "Pharmacy", "Management"],
        "expertise": ["Software Engineering", "Embedded Systems", "Robotics",
                      "Pharmaceutical Technology", "Manufacturing", "Supply Chain",
                      "Data Science", "Automation"],
        "facilities": ["Robotics Lab", "Pharmacy Research Centre", "Manufacturing Lab",
                       "Software Development Centre", "Embedded Systems Lab"],
        "innovation_centres": ["BITS Technology Incubation Forum"],
        "incubation_facilities": ["BITS TIF Incubator"],
        "description": "Premier institute known for industry-ready graduates in software, robotics and embedded systems.",
    },
]

for u in universities:
    existing = db.query(University).filter(University.name == u["name"]).first()
    if existing:
        print(f"  Exists  : {u['name']}")
    else:
        uni = University(**u)
        db.add(uni)
        db.commit()
        print(f"  Created : {u['name']}")


# ============================================================
# INDUSTRIES
# ============================================================

print("\nSeeding industry partners...")

industries = [
    {
        "name": "Tata Consultancy Services",
        "location": "Mumbai, Maharashtra",
        "organization_type": "IT Company",
        "domains": ["Information Technology", "Digital Transformation", "AI Solutions",
                    "Smart Cities", "Healthcare IT", "Agriculture Tech"],
        "expertise": ["Artificial Intelligence", "IoT", "Data Analytics", "Cloud Computing",
                      "Blockchain", "Machine Learning", "Mobile Applications"],
        "capabilities": ["Prototyping", "Deployment", "Testing", "Mentoring",
                         "Technology Transfer", "Funding"],
        "funding_capacity": 5000000,
        "description": "India's largest IT company with expertise in AI, IoT and digital transformation for social good.",
    },
    {
        "name": "Infosys Foundation",
        "location": "Bengaluru, Karnataka",
        "organization_type": "CSR Organization",
        "domains": ["Rural Development", "Healthcare", "Education", "Sanitation",
                    "Women Empowerment", "Waste Management"],
        "expertise": ["Community Development", "Digital Literacy", "Healthcare Access",
                      "Clean Water Solutions", "Sanitation Technology"],
        "capabilities": ["Funding", "Mentoring", "Deployment", "CSR",
                         "Community Engagement"],
        "funding_capacity": 10000000,
        "description": "CSR arm of Infosys focused on rural development, healthcare access and community empowerment.",
    },
    {
        "name": "Bosch India",
        "location": "Bengaluru, Karnataka",
        "organization_type": "MSME/Company",
        "domains": ["Automotive", "Industrial IoT", "Smart Agriculture", "Energy",
                    "Water Management", "Mobility"],
        "expertise": ["IoT Sensors", "Embedded Systems", "Automation", "Robotics",
                      "Precision Agriculture", "Smart Manufacturing"],
        "capabilities": ["Prototyping", "Testing", "Deployment", "Technology Transfer"],
        "funding_capacity": 2000000,
        "description": "Global technology company with strong IoT and embedded systems capabilities for industrial applications.",
    },
    {
        "name": "Jain Irrigation Systems",
        "location": "Jalgaon, Maharashtra",
        "organization_type": "Company",
        "domains": ["Agriculture", "Water Management", "Food Processing",
                    "Renewable Energy", "Irrigation"],
        "expertise": ["Drip Irrigation", "Water Conservation", "Precision Farming",
                      "Solar Energy", "Agricultural Technology"],
        "capabilities": ["Prototyping", "Deployment", "Testing", "Funding"],
        "funding_capacity": 1500000,
        "description": "World's largest micro-irrigation company focused on water conservation and precision agriculture.",
    },
    {
        "name": "Ola Electric",
        "location": "Bengaluru, Karnataka",
        "organization_type": "Startup",
        "domains": ["Electric Vehicles", "Clean Energy", "Transportation",
                    "Battery Technology", "Smart Mobility"],
        "expertise": ["Battery Technology", "Electric Vehicles", "Charging Infrastructure",
                      "Route Optimization", "Smart Mobility"],
        "capabilities": ["Prototyping", "Testing", "Deployment", "Mentoring"],
        "funding_capacity": 3000000,
        "description": "Leading EV startup pioneering clean transportation and battery technology solutions in India.",
    },
    {
        "name": "Swachh Bharat Foundation",
        "location": "New Delhi, Delhi",
        "organization_type": "CSR Organization",
        "domains": ["Waste Management", "Sanitation", "Clean India", "Urban Development",
                    "Water & Sanitation"],
        "expertise": ["Solid Waste Management", "Composting", "Recycling",
                      "Community Sanitation", "Waste-to-Energy"],
        "capabilities": ["Deployment", "Community Engagement", "CSR", "Funding",
                         "Mentoring"],
        "funding_capacity": 800000,
        "description": "NGO focused on Swachh Bharat mission — waste management, community sanitation and clean city initiatives.",
    },
    {
        "name": "SatSure Analytics",
        "location": "Bengaluru, Karnataka",
        "organization_type": "Startup",
        "domains": ["Agriculture", "Remote Sensing", "Financial Services",
                    "Disaster Management", "Infrastructure"],
        "expertise": ["Satellite Imagery", "Remote Sensing", "GIS", "Data Analytics",
                      "Crop Monitoring", "Flood Mapping", "Disaster Risk Assessment"],
        "capabilities": ["Prototyping", "Testing", "Technology Transfer", "Mentoring"],
        "funding_capacity": 500000,
        "description": "Deep-tech startup using satellite data and AI for agriculture monitoring and disaster risk assessment.",
    },
    {
        "name": "Healthians",
        "location": "Gurugram, Haryana",
        "organization_type": "Startup",
        "domains": ["Healthcare", "Diagnostics", "Telemedicine", "Health Tech",
                    "Rural Healthcare"],
        "expertise": ["Diagnostic Testing", "Telemedicine", "Health Data Analytics",
                      "Mobile Healthcare", "Rural Health Access", "Preventive Healthcare"],
        "capabilities": ["Deployment", "Prototyping", "Testing", "Mentoring"],
        "funding_capacity": 1000000,
        "description": "Tech-enabled healthcare startup providing affordable diagnostics and telemedicine across India.",
    },
]

for ind in industries:
    existing = db.query(Industry).filter(Industry.name == ind["name"]).first()
    if existing:
        print(f"  Exists  : {ind['name']}")
    else:
        industry = Industry(**ind)
        db.add(industry)
        db.commit()
        print(f"  Created : {ind['name']}")


db.close()

print("\n" + "="*60)
print("DATABASE SEEDED SUCCESSFULLY")
print("="*60)
print("\nDEMO LOGIN CREDENTIALS:")
print("-"*40)
print("Role        | Email                | Password")
print("-"*40)
print("Citizen     | citizen@demo.com     | demo123")
print("Government  | govt@demo.com        | demo123")
print("University  | uni@demo.com         | demo123")
print("Industry    | industry@demo.com    | demo123")
print("-"*40)
print(f"\nUniversities : {len(universities)}")
print(f"Industries   : {len(industries)}")
print("="*60)
