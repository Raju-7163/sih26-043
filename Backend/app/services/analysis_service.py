import re

from app.services.ai_service import analyze_problem as gemini_analyze_problem


# ---------------------------------------------------------
# CATEGORY CONFIGURATION
# ---------------------------------------------------------

CATEGORY_RULES = {
    "Water & Disaster Management": {
        "keywords": [
            "flood",
            "flooding",
            "waterlogging",
            "heavy rain",
            "rainfall",
            "drought",
            "drainage",
            "water shortage",
            "water supply",
            "storm",
            "cyclone",
            "landslide",
        ],
        "department": "Water Resources / Disaster Management",
        "expertise": [
            "Hydrology",
            "Flood Management",
            "GIS",
            "Remote Sensing",
            "Civil Engineering",
            "IoT"
        ],
        "solutions": [
            "Flood Monitoring System",
            "Smart Drainage",
            "Early Warning System",
            "Water Level Sensors",
            "Flood Risk Mapping"
        ]
    },

    "Agriculture": {
        "keywords": [
            "farmer",
            "farm",
            "crop",
            "agriculture",
            "irrigation",
            "soil",
            "pest",
            "fertilizer",
            "harvest",
            "farming",
            "livestock"
        ],
        "department": "Agriculture Department",
        "expertise": [
            "Agricultural Engineering",
            "Agronomy",
            "IoT",
            "Machine Learning",
            "Soil Science",
            "Remote Sensing"
        ],
        "solutions": [
            "Smart Irrigation",
            "Crop Monitoring",
            "Soil Monitoring",
            "Pest Detection",
            "Precision Agriculture"
        ]
    },

    "Healthcare": {
        "keywords": [
            "hospital",
            "health",
            "healthcare",
            "doctor",
            "medicine",
            "patient",
            "disease",
            "clinic",
            "ambulance",
            "medical",
            "treatment"
        ],
        "department": "Health Department",
        "expertise": [
            "Healthcare Technology",
            "Medical Engineering",
            "Artificial Intelligence",
            "Data Science",
            "IoT"
        ],
        "solutions": [
            "Telemedicine",
            "Health Monitoring",
            "Disease Detection",
            "Emergency Response System",
            "Digital Health Records"
        ]
    },

    "Education": {
        "keywords": [
            "school",
            "college",
            "education",
            "student",
            "teacher",
            "classroom",
            "learning",
            "exam",
            "dropout"
        ],
        "department": "Education Department",
        "expertise": [
            "Education Technology",
            "Artificial Intelligence",
            "Software Engineering",
            "Data Science",
            "Human Computer Interaction"
        ],
        "solutions": [
            "Digital Learning Platform",
            "Student Tracking",
            "AI Learning Assistant",
            "School Management System",
            "Personalized Learning"
        ]
    },

    "Transportation & Road Safety": {
        "keywords": [
            "road",
            "traffic",
            "accident",
            "transport",
            "vehicle",
            "bus",
            "bridge",
            "pothole",
            "highway",
            "congestion"
        ],
        "department": "Transport / Public Works Department",
        "expertise": [
            "Civil Engineering",
            "Transportation Engineering",
            "GIS",
            "IoT",
            "Artificial Intelligence"
        ],
        "solutions": [
            "Smart Traffic Management",
            "Road Condition Monitoring",
            "Pothole Detection",
            "Accident Detection",
            "Intelligent Transport System"
        ]
    },

    "Waste Management": {
        "keywords": [
            "waste",
            "garbage",
            "trash",
            "litter",
            "dump",
            "plastic",
            "recycling",
            "sanitation",
            "dirty"
        ],
        "department": "Municipal / Urban Development Department",
        "expertise": [
            "Environmental Engineering",
            "IoT",
            "Waste Management",
            "Data Science",
            "Urban Planning"
        ],
        "solutions": [
            "Smart Waste Collection",
            "Waste Classification",
            "Garbage Monitoring",
            "Recycling Management",
            "Smart Bins"
        ]
    },

    "Environment": {
        "keywords": [
            "pollution",
            "air quality",
            "deforestation",
            "forest",
            "wildlife",
            "climate",
            "emissions",
            "carbon",
            "river pollution",
            "soil erosion"
        ],
        "department": "Ministry of Environment & Forests",
        "expertise": [
            "Environmental Engineering",
            "Ecology",
            "Remote Sensing",
            "Data Science",
            "Biotechnology"
        ],
        "solutions": [
            "Air Quality Monitoring",
            "Afforestation Tracking",
            "Pollution Sensor Network",
            "Biodiversity Conservation"
        ]
    },

    "Energy": {
        "keywords": [
            "electricity",
            "power",
            "energy",
            "solar",
            "electric",
            "blackout",
            "transformer",
            "street light"
        ],
        "department": "Energy Department",
        "expertise": [
            "Electrical Engineering",
            "Renewable Energy",
            "IoT",
            "Energy Management",
            "Smart Grid"
        ],
        "solutions": [
            "Smart Energy Monitoring",
            "Solar Power",
            "Energy Optimization",
            "Smart Street Lighting",
            "Power Monitoring"
        ]
    }
}


def detect_language_backend(text: str) -> str:
    """Detect language based on Unicode script ranges."""
    if not text:
        return "English"

    devanagari = len(re.findall(r"[\u0900-\u097F]", text))
    bengali = len(re.findall(r"[\u0980-\u09FF]", text))
    gurmukhi = len(re.findall(r"[\u0A00-\u0A7F]", text))
    gujarati = len(re.findall(r"[\u0A80-\u0AFF]", text))
    odia = len(re.findall(r"[\u0B00-\u0B7F]", text))
    tamil = len(re.findall(r"[\u0B80-\u0BFF]", text))
    telugu = len(re.findall(r"[\u0C00-\u0C7F]", text))
    kannada = len(re.findall(r"[\u0C80-\u0CFF]", text))
    malayalam = len(re.findall(r"[\u0D00-\u0D7F]", text))

    counts = [
        ("Hindi", devanagari),
        ("Bengali", bengali),
        ("Punjabi", gurmukhi),
        ("Gujarati", gujarati),
        ("Odia", odia),
        ("Tamil", tamil),
        ("Telugu", telugu),
        ("Kannada", kannada),
        ("Malayalam", malayalam),
    ]

    counts.sort(key=lambda x: x[1], reverse=True)
    if counts[0][1] > 0:
        return counts[0][0]

    return "English"



# ---------------------------------------------------------
# URGENCY
# ---------------------------------------------------------

URGENCY_SCORE = {
    "Low": 25,
    "Medium": 50,
    "High": 80,
    "Critical": 100
}


CRITICAL_KEYWORDS = [
    "severe",
    "critical",
    "emergency",
    "life threatening",
    "death",
    "deaths",
    "fatal",
    "dangerous",
    "disaster",
    "collapsed",
    "collapse",
    "outbreak",
    "contamination"
]


HIGH_KEYWORDS = [
    "flood",
    "flooding",
    "fire",
    "accident",
    "landslide",
    "cyclone",
    "drought",
    "shortage",
    "unsafe",
    "hundreds",
    "thousands",
    "large number"
]


# ---------------------------------------------------------
# TEXT UTILITIES
# ---------------------------------------------------------

def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = str(text).lower()
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def count_keyword_matches(text: str, keywords: list) -> int:
    count = 0

    for keyword in keywords:
        if keyword.lower() in text:
            count += 1

    return count


# ---------------------------------------------------------
# RULE-BASED CATEGORY DETECTION
# ---------------------------------------------------------

def detect_category(
    title: str,
    description: str,
    given_category: str = None
):

    text = normalize_text(
        f"{title} {description}"
    )

    scores = {}

    for category, config in CATEGORY_RULES.items():

        score = count_keyword_matches(
            text,
            config["keywords"]
        )

        scores[category] = score

    best_category = max(
        scores,
        key=scores.get
    )

    best_score = scores[best_category]

    if best_score == 0 and given_category:

        category_text = normalize_text(given_category)

        for category in CATEGORY_RULES:

            if normalize_text(category) in category_text:

                best_category = category
                break

    return best_category


# ---------------------------------------------------------
# RULE-BASED URGENCY
# ---------------------------------------------------------

def detect_urgency(
    title: str,
    description: str,
    user_urgency: str = "Medium"
):

    text = normalize_text(
        f"{title} {description}"
    )

    critical_matches = count_keyword_matches(
        text,
        CRITICAL_KEYWORDS
    )

    high_matches = count_keyword_matches(
        text,
        HIGH_KEYWORDS
    )

    if critical_matches >= 2:
        return "Critical"

    if critical_matches >= 1 and high_matches >= 1:
        return "Critical"

    if high_matches >= 2:
        return "High"

    valid_urgencies = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ]

    if user_urgency in valid_urgencies:
        return user_urgency

    return "Medium"


# ---------------------------------------------------------
# IMPACT SCORE
# ---------------------------------------------------------

def calculate_impact(
    title: str,
    description: str,
    affected: str = ""
):

    text = normalize_text(
        f"{title} {description} {affected}"
    )

    score = 50

    if "hundreds" in text:
        score += 20

    if "thousands" in text:
        score += 30

    if "many people" in text:
        score += 15

    if "entire village" in text:
        score += 20

    if "entire district" in text:
        score += 30

    if "community" in text:
        score += 10

    if any(word in text for word in [
        "hospital",
        "school",
        "drinking water",
        "healthcare"
    ]):
        score += 10

    return min(score, 100)


# ---------------------------------------------------------
# CHALLENGES
# ---------------------------------------------------------

def build_challenges(
    category: str,
    urgency: str,
    impact_score: int
):

    challenges = [
        f"Requires coordination with "
        f"{CATEGORY_RULES.get(category, {}).get('department', 'the responsible department')}.",

        "Needs reliable field data to validate the problem scope."
    ]

    if urgency in ["High", "Critical"]:

        challenges.append(
            "High urgency means response time and resource availability are important."
        )

    if impact_score >= 70:

        challenges.append(
            "Large community impact may require phased implementation and monitoring."
        )

    return challenges


# ---------------------------------------------------------
# PRIORITY SCORE
# ---------------------------------------------------------

def calculate_priority(
    urgency: str,
    impact_score: int,
    title: str,
    description: str
):

    text = normalize_text(
        f"{title} {description}"
    )

    urgency_score = URGENCY_SCORE.get(
        urgency,
        50
    )

    emergency_score = 40

    if any(
        keyword in text
        for keyword in CRITICAL_KEYWORDS
    ):

        emergency_score = 100

    elif any(
        keyword in text
        for keyword in HIGH_KEYWORDS
    ):

        emergency_score = 80

    priority = (
        urgency_score * 0.45
        + impact_score * 0.35
        + emergency_score * 0.20
    )

    return min(
        round(priority),
        100
    )


# ---------------------------------------------------------
# AI RESULT VALIDATION
# ---------------------------------------------------------

def validate_ai_result(
    ai_result,
    title,
    description,
    affected,
    user_urgency
):

    if not isinstance(ai_result, dict):
        raise ValueError("Invalid Gemini analysis result")

    # -----------------------------------------
    # CATEGORY
    # -----------------------------------------

    category = ai_result.get("category")

    if not category:
        category = detect_category(
            title,
            description
        )

    # -----------------------------------------
    # DEPARTMENT
    # -----------------------------------------

    department = ai_result.get("department")

    if not department:

        config = CATEGORY_RULES.get(
            category,
            {}
        )

        department = config.get(
            "department",
            "General Administration"
        )

    # -----------------------------------------
    # URGENCY
    # -----------------------------------------

    urgency = ai_result.get(
        "urgency",
        "Medium"
    )

    valid_urgencies = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ]

    if urgency not in valid_urgencies:

        urgency = detect_urgency(
            title,
            description,
            user_urgency
        )

    # -----------------------------------------
    # IMPACT
    # -----------------------------------------

    impact_score = ai_result.get(
        "impact_score"
    )

    try:

        impact_score = int(
            impact_score
        )

    except (TypeError, ValueError):

        impact_score = calculate_impact(
            title,
            description,
            affected
        )

    impact_score = max(
        1,
        min(impact_score, 10)
    )

    # -----------------------------------------
    # AFFECTED POPULATION
    # -----------------------------------------

    affected_population = ai_result.get(
        "affected_population"
    )

    if not affected_population:

        affected_population = affected or "Not specified"

    # -----------------------------------------
    # EXPERTISE
    # -----------------------------------------

    expertise = ai_result.get(
        "required_expertise"
    )

    if not isinstance(expertise, list) or not expertise:

        expertise = CATEGORY_RULES.get(
            category,
            {}
        ).get(
            "expertise",
            []
        )

    # -----------------------------------------
    # SOLUTIONS
    # -----------------------------------------

    solutions = ai_result.get(
        "suggested_solution_areas"
    )

    if not isinstance(solutions, list) or not solutions:

        solutions = CATEGORY_RULES.get(
            category,
            {}
        ).get(
            "solutions",
            []
        )

    # -----------------------------------------
    # DEPARTMENT CONFIDENCE
    # -----------------------------------------

    department_confidence = ai_result.get(
        "department_confidence"
    )

    if department_confidence is None:

        department_confidence = 85

    try:

        department_confidence = float(
            department_confidence
        )

    except (TypeError, ValueError):

        department_confidence = 85

    department_confidence = max(
        0,
        min(department_confidence, 100)
    )

    # -----------------------------------------
    # PRIORITY
    # -----------------------------------------

    # Gemini impact is 1-10.
    # Convert it to 0-100 for priority calculation.

    impact_for_priority = impact_score * 10

    priority_score = calculate_priority(
        urgency,
        impact_for_priority,
        title,
        description
    )

    return {
        "category": category,
        "department": department,
        "department_confidence": round(
            department_confidence
        ),
        "urgency": urgency,
        "priority_score": priority_score,
        "impact_score": impact_score,
        "impact_level": (
            "High"
            if impact_score >= 8
            else "Medium"
            if impact_score >= 5
            else "Low"
        ),
        "affected_population": affected_population,
        "required_expertise": expertise,
        "suggested_solution_areas": solutions,
        "skills": expertise,
        "challenges": build_challenges(
            category,
            urgency,
            impact_for_priority
        )
    }


# ---------------------------------------------------------
# MAIN AI ANALYSIS
# ---------------------------------------------------------

def analyze_problem(problem):

    title = getattr(
        problem,
        "title",
        ""
    )

    description = getattr(
        problem,
        "description",
        ""
    )

    affected = getattr(
        problem,
        "affected",
        ""
    )

    user_urgency = getattr(
        problem,
        "urgency",
        "Medium"
    )

    # -----------------------------------------
    # COMBINE USER INPUT
    # -----------------------------------------

    problem_text = f"""
Title: {title}

Description: {description}

Location: {getattr(problem, "location", "")}

Affected people: {affected}

User selected category: {getattr(problem, "category", "")}

User selected urgency: {user_urgency}
"""

    # -----------------------------------------
    # CALL GEMINI
    # -----------------------------------------

    try:

        ai_result = gemini_analyze_problem(
            problem_text
        )

        # -------------------------------------
        # VALIDATE GEMINI RESULT
        # -------------------------------------

        result = validate_ai_result(
            ai_result,
            title,
            description,
            affected,
            user_urgency
        )

        return result

    except Exception as error:

        # -------------------------------------
        # FALLBACK TO RULE-BASED SYSTEM
        # -------------------------------------

        print(
            f"⚠️ Gemini analysis failed: {error}"
        )

        category = detect_category(
            title,
            description,
            getattr(problem, "category", None)
        )

        config = CATEGORY_RULES.get(
            category,
            {}
        )

        department = config.get(
            "department",
            "General Administration"
        )

        expertise = config.get(
            "expertise",
            []
        )

        solutions = config.get(
            "solutions",
            []
        )

        urgency = detect_urgency(
            title,
            description,
            user_urgency
        )

        impact_score = calculate_impact(
            title,
            description,
            affected
        )

        # Existing rule-based impact is 0-100.
        # Convert it to 1-10 because our database
        # now uses Gemini's 1-10 impact scale.

        impact_10 = max(
            1,
            min(
                round(impact_score / 10),
                10
            )
        )

        priority_score = calculate_priority(
            urgency,
            impact_score,
            title,
            description
        )

        detected_language = detect_language_backend(f"{title} {description}")

        return {
            "language": detected_language,
            "category": category,
            "department": department,
            "department_confidence": 80,
            "urgency": urgency,
            "priority_score": priority_score,
            "impact_score": impact_10,
            "impact_level": (
                "High"
                if impact_10 >= 8
                else "Medium"
                if impact_10 >= 5
                else "Low"
            ),
            "affected_population": (
                affected or "Not specified"
            ),
            "required_expertise": expertise,
            "suggested_solution_areas": solutions,
            "skills": expertise,
            "challenges": build_challenges(
                category,
                urgency,
                impact_score
            )
        }