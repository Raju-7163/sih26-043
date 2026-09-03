from app.database.connection import SessionLocal
from app.models.industry import Industry


industries = [

    {
        "name": "AgriTech Solutions India",
        "location": "Ranchi, Jharkhand",
        "organization_type": "Startup",
        "domains": [
            "Agriculture",
            "Artificial Intelligence",
            "IoT"
        ],
        "expertise": [
            "Artificial Intelligence",
            "Machine Learning",
            "IoT",
            "Agricultural Technology",
            "Data Science",
            "Remote Sensing"
        ],
        "capabilities": [
            "Mentoring",
            "Prototyping",
            "Testing",
            "Pilot Deployment"
        ],
        "funding_capacity": "Medium",
        "description": "Agritech startup working on smart farming, IoT monitoring and AI-based agricultural solutions."
    },

    {
        "name": "RuralTech Innovations",
        "location": "Jamshedpur, Jharkhand",
        "organization_type": "Startup",
        "domains": [
            "Rural Development",
            "Agriculture",
            "Water Management"
        ],
        "expertise": [
            "IoT",
            "GIS",
            "Water Management",
            "Rural Technology",
            "Data Analytics"
        ],
        "capabilities": [
            "Mentoring",
            "Prototyping",
            "Field Testing",
            "Pilot Deployment"
        ],
        "funding_capacity": "Medium",
        "description": "Technology startup focused on rural infrastructure, water management and community technology."
    },

    {
        "name": "HealthTech Innovations",
        "location": "Bengaluru, Karnataka",
        "organization_type": "Startup",
        "domains": [
            "Healthcare",
            "Artificial Intelligence",
            "Digital Health"
        ],
        "expertise": [
            "Artificial Intelligence",
            "Machine Learning",
            "Healthcare Technology",
            "Data Science",
            "Software Engineering"
        ],
        "capabilities": [
            "Mentoring",
            "Software Development",
            "Prototyping",
            "Testing"
        ],
        "funding_capacity": "High",
        "description": "Digital health startup developing AI-enabled healthcare and diagnostic technologies."
    },

    {
        "name": "Smart Infrastructure Technologies",
        "location": "New Delhi, Delhi",
        "organization_type": "MSME",
        "domains": [
            "Transportation",
            "Infrastructure",
            "Smart Cities"
        ],
        "expertise": [
            "IoT",
            "Smart Infrastructure",
            "Civil Engineering",
            "GIS",
            "Artificial Intelligence",
            "Data Analytics"
        ],
        "capabilities": [
            "Mentoring",
            "Prototyping",
            "Testing",
            "Pilot Deployment"
        ],
        "funding_capacity": "High",
        "description": "Technology company developing IoT-enabled infrastructure and smart-city solutions."
    },

    {
        "name": "CleanTech Energy Systems",
        "location": "Hyderabad, Telangana",
        "organization_type": "Industry",
        "domains": [
            "Energy",
            "Renewable Energy",
            "Environment"
        ],
        "expertise": [
            "Renewable Energy",
            "Electrical Engineering",
            "IoT",
            "Energy Management",
            "Artificial Intelligence"
        ],
        "capabilities": [
            "Mentoring",
            "Prototyping",
            "Testing",
            "Pilot Deployment"
        ],
        "funding_capacity": "High",
        "description": "Clean technology company working on renewable energy and smart energy management."
    },

    {
        "name": "EcoWaste Technologies",
        "location": "Kolkata, West Bengal",
        "organization_type": "MSME",
        "domains": [
            "Waste Management",
            "Environment",
            "Smart Cities"
        ],
        "expertise": [
            "Waste Management",
            "Environmental Engineering",
            "IoT",
            "Artificial Intelligence",
            "Data Science"
        ],
        "capabilities": [
            "Mentoring",
            "Prototyping",
            "Testing",
            "Field Deployment"
        ],
        "funding_capacity": "Medium",
        "description": "Environmental technology company developing smart waste collection and monitoring solutions."
    },

    {
        "name": "Digital Learning Foundation",
        "location": "Pune, Maharashtra",
        "organization_type": "CSR Organization",
        "domains": [
            "Education",
            "Digital Learning",
            "Rural Development"
        ],
        "expertise": [
            "Education Technology",
            "Artificial Intelligence",
            "Software Engineering",
            "Data Science",
            "Human Computer Interaction"
        ],
        "capabilities": [
            "Mentoring",
            "Funding",
            "Pilot Deployment",
            "Community Outreach"
        ],
        "funding_capacity": "High",
        "description": "CSR organization supporting digital education and technology access in underserved communities."
    },

    {
        "name": "Disaster Response Technologies",
        "location": "Bhubaneswar, Odisha",
        "organization_type": "Industry",
        "domains": [
            "Disaster Management",
            "Water Management",
            "Environment"
        ],
        "expertise": [
            "Flood Management",
            "GIS",
            "Remote Sensing",
            "IoT",
            "Artificial Intelligence",
            "Civil Engineering"
        ],
        "capabilities": [
            "Mentoring",
            "Prototyping",
            "Testing",
            "Pilot Deployment"
        ],
        "funding_capacity": "High",
        "description": "Technology organization developing disaster monitoring, flood prediction and emergency response systems."
    },

    {
        "name": "Social Impact Ventures",
        "location": "Mumbai, Maharashtra",
        "organization_type": "CSR Organization",
        "domains": [
            "Social Innovation",
            "Healthcare",
            "Education",
            "Rural Development"
        ],
        "expertise": [
            "Social Innovation",
            "Project Management",
            "Data Analytics",
            "Digital Technology"
        ],
        "capabilities": [
            "Funding",
            "Mentoring",
            "Pilot Deployment",
            "Community Outreach"
        ],
        "funding_capacity": "High",
        "description": "Social impact organization supporting technology-driven community development projects."
    }

]


def seed_industries():

    db = SessionLocal()

    try:

        for data in industries:

            existing = db.query(Industry).filter(
                Industry.name == data["name"]
            ).first()

            if existing:

                existing.location = data["location"]
                existing.organization_type = data["organization_type"]
                existing.domains = data["domains"]
                existing.expertise = data["expertise"]
                existing.capabilities = data["capabilities"]
                existing.funding_capacity = data["funding_capacity"]
                existing.description = data["description"]

                print(
                    f"Updated: {data['name']}"
                )

            else:

                industry = Industry(
                    name=data["name"],
                    location=data["location"],
                    organization_type=data["organization_type"],
                    domains=data["domains"],
                    expertise=data["expertise"],
                    capabilities=data["capabilities"],
                    funding_capacity=data["funding_capacity"],
                    description=data["description"]
                )

                db.add(industry)

                print(
                    f"Added: {data['name']}"
                )

        db.commit()

        print("\nIndustry seeding completed successfully!")

    except Exception as e:

        db.rollback()

        print(
            f"\nError while seeding industries: {e}"
        )

    finally:

        db.close()


if __name__ == "__main__":
    seed_industries()