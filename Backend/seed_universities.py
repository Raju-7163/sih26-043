from app.database.connection import SessionLocal
from app.models.university import University


universities = [
    {
        "name": "IIT Roorkee",
        "location": "Roorkee, Uttarakhand",
        "institution_type": "IIT",

        "disciplines": [
            "Civil Engineering",
            "Water Resources",
            "Environmental Engineering",
            "Computer Science",
            "Artificial Intelligence",
            "Data Science"
        ],

        "expertise": [
            "Hydrology",
            "Flood Management",
            "GIS",
            "Remote Sensing",
            "Water Resources",
            "Disaster Management",
            "Civil Engineering",
            "Artificial Intelligence",
            "Data Science",
            "Software Engineering",
            "IoT"
        ],

        "facilities": [
            "Hydrology Laboratory",
            "GIS Laboratory",
            "Remote Sensing Laboratory",
            "Artificial Intelligence Laboratory",
            "Data Science Laboratory"
        ],

        "innovation_centres": [
            "Technology Innovation Centre"
        ],

        "incubation_facilities": [
            "Startup Incubation",
            "Technology Incubation"
        ],

        "description": (
            "Multidisciplinary engineering and technology "
            "research institution."
        )
    },

    {
        "name": "IIT Delhi",
        "location": "New Delhi, Delhi",
        "institution_type": "IIT",

        "disciplines": [
            "Civil Engineering",
            "Environmental Engineering",
            "Computer Science",
            "Electrical Engineering",
            "Artificial Intelligence",
            "Data Science",
            "Human Computer Interaction"
        ],

        "expertise": [
            "Civil Engineering",
            "Environmental Engineering",
            "Artificial Intelligence",
            "Machine Learning",
            "Data Science",
            "Software Engineering",
            "Human Computer Interaction",
            "Education Technology",
            "IoT",
            "Smart Infrastructure",
            "GIS",
            "Water Management"
        ],

        "facilities": [
            "Artificial Intelligence Laboratory",
            "Data Science Laboratory",
            "IoT Laboratory",
            "Human Computer Interaction Laboratory",
            "Smart Infrastructure Laboratory"
        ],

        "innovation_centres": [
            "Innovation and Technology Centre"
        ],

        "incubation_facilities": [
            "Startup Incubation",
            "Technology Transfer"
        ],

        "description": (
            "Research-focused multidisciplinary institution "
            "with strong engineering and technology capabilities."
        )
    },

    {
        "name": "NIT Srinagar",
        "location": "Srinagar, Jammu and Kashmir",
        "institution_type": "NIT",

        "disciplines": [
            "Civil Engineering",
            "Computer Science",
            "Electrical Engineering",
            "Artificial Intelligence",
            "Data Science"
        ],

        "expertise": [
            "Civil Engineering",
            "Water Resources",
            "Environmental Engineering",
            "GIS",
            "IoT",
            "Remote Sensing",
            "Artificial Intelligence",
            "Data Science",
            "Software Engineering"
        ],

        "facilities": [
            "Civil Engineering Laboratory",
            "Environmental Laboratory",
            "Computer Laboratory",
            "Artificial Intelligence Laboratory",
            "Data Science Laboratory"
        ],

        "innovation_centres": [
            "Innovation Centre"
        ],

        "incubation_facilities": [
            "Incubation Centre"
        ],

        "description": (
            "Engineering and technology institution "
            "with multidisciplinary research capabilities."
        )
    },

    {
        "name": "IIT (ISM) Dhanbad",
        "location": "Dhanbad, Jharkhand",
        "institution_type": "IIT",

        "disciplines": [
            "Environmental Engineering",
            "Mining Engineering",
            "Computer Science",
            "Civil Engineering",
            "Artificial Intelligence",
            "Data Science"
        ],

        "expertise": [
            "Environmental Engineering",
            "GIS",
            "Remote Sensing",
            "Water Management",
            "Environmental Monitoring",
            "IoT",
            "Artificial Intelligence",
            "Data Science",
            "Software Engineering",
            "Computer Science"
        ],

        "facilities": [
            "Environmental Laboratory",
            "Remote Sensing Laboratory",
            "IoT Laboratory",
            "Artificial Intelligence Laboratory",
            "Computer Laboratory"
        ],

        "innovation_centres": [
            "Innovation Centre"
        ],

        "incubation_facilities": [
            "Startup Incubation"
        ],

        "description": (
            "Research institution in Jharkhand with "
            "engineering, environmental and technology capabilities."
        )
    }
]


def seed_universities():

    db = SessionLocal()

    try:

        for university_data in universities:

            university = db.query(University).filter(
                University.name == university_data["name"]
            ).first()

            if university:

                # Update existing university
                university.location = university_data["location"]
                university.institution_type = university_data["institution_type"]
                university.disciplines = university_data["disciplines"]
                university.expertise = university_data["expertise"]
                university.facilities = university_data["facilities"]
                university.innovation_centres = university_data["innovation_centres"]
                university.incubation_facilities = university_data["incubation_facilities"]
                university.description = university_data["description"]

                print(
                    f"Updated: {university.name}"
                )

            else:

                # Create new university
                university = University(
                    name=university_data["name"],
                    location=university_data["location"],
                    institution_type=university_data["institution_type"],
                    disciplines=university_data["disciplines"],
                    expertise=university_data["expertise"],
                    facilities=university_data["facilities"],
                    innovation_centres=university_data["innovation_centres"],
                    incubation_facilities=university_data["incubation_facilities"],
                    description=university_data["description"]
                )

                db.add(university)

                print(
                    f"Added: {university.name}"
                )

        db.commit()

        print("\nUniversity data updated successfully.")

    except Exception as e:

        db.rollback()

        print("\nError:", e)

    finally:

        db.close()


if __name__ == "__main__":
    seed_universities()