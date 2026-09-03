from app.models.university import University


# ---------------------------------------------------------
# TEXT NORMALIZATION
# ---------------------------------------------------------

def normalize_text(text):
    if text is None:
        return ""

    return (
        str(text)
        .strip()
        .lower()
        .replace("-", " ")
        .replace("_", " ")
    )


def normalize_list(items):
    if not items:
        return []

    result = []

    for item in items:
        if item is None:
            continue

        normalized = normalize_text(item)

        if normalized:
            result.append(normalized)

    return result


# ---------------------------------------------------------
# CATEGORY RELATIONSHIPS
# ---------------------------------------------------------

CATEGORY_RELATIONSHIPS = {

    "water & disaster management": [
        "water",
        "water resources",
        "water management",
        "water resources engineering",
        "hydrology",
        "flood management",
        "disaster management",
        "civil engineering",
        "environmental engineering",
        "gis",
        "remote sensing",
        "urban drainage",
        "stormwater"
    ],

    "agriculture": [
        "agriculture",
        "agricultural engineering",
        "agricultural technology",
        "soil science",
        "irrigation",
        "horticulture",
        "data science",
        "artificial intelligence",
        "iot",
        "remote sensing",
        "gis"
    ],

    "healthcare": [
        "healthcare",
        "health",
        "medical",
        "medicine",
        "biomedical",
        "biomedical engineering",
        "public health",
        "artificial intelligence",
        "data science",
        "software engineering",
        "iot"
    ],

    "education": [
        "education",
        "education technology",
        "computer science",
        "artificial intelligence",
        "data science",
        "software engineering",
        "information technology",
        "human computer interaction"
    ],

    "environment": [
        "environment",
        "environmental engineering",
        "environmental science",
        "environmental monitoring",
        "gis",
        "remote sensing",
        "civil engineering",
        "water management",
        "renewable energy"
    ],

    "transportation & road safety": [
        "transportation",
        "transportation engineering",
        "civil engineering",
        "road engineering",
        "traffic engineering",
        "smart infrastructure",
        "gis",
        "iot",
        "artificial intelligence",
        "data science"
    ],

    "waste management": [
        "waste management",
        "solid waste management",
        "environmental engineering",
        "environmental science",
        "civil engineering",
        "iot",
        "artificial intelligence",
        "data science",
        "recycling"
    ],

    "energy": [
        "energy",
        "electrical engineering",
        "renewable energy",
        "solar energy",
        "power systems",
        "energy efficiency",
        "iot",
        "artificial intelligence",
        "data science"
    ]
}


# ---------------------------------------------------------
# EXPERTISE MATCH
# ---------------------------------------------------------

def calculate_expertise_match(required_expertise, university_expertise):
    required = normalize_list(required_expertise)
    available = normalize_list(university_expertise)

    if not required:
        return {
            "score": 0,
            "matched": [],
            "missing": []
        }

    matched = []
    missing = []

    for required_item in required:

        found = False

        for available_item in available:

            if required_item == available_item:
                found = True
                break

            if (
                required_item in available_item
                or available_item in required_item
            ):
                found = True
                break

        if found:
            matched.append(required_item)
        else:
            missing.append(required_item)

    score = (len(matched) / len(required)) * 100

    return {
        "score": round(score),
        "matched": matched,
        "missing": missing
    }


# ---------------------------------------------------------
# CATEGORY / DISCIPLINE MATCH
# ---------------------------------------------------------

def calculate_category_match(problem_category, university_disciplines):

    category = normalize_text(problem_category)

    disciplines = normalize_list(university_disciplines)

    if not category:
        return False

    related_fields = CATEGORY_RELATIONSHIPS.get(
        category,
        [category]
    )

    for discipline in disciplines:

        for related_field in related_fields:

            if (
                discipline == related_field
                or discipline in related_field
                or related_field in discipline
            ):
                return True

    return False


# ---------------------------------------------------------
# FACILITY MATCH
# ---------------------------------------------------------

def calculate_facility_match(
    required_expertise,
    university_facilities
):

    required = normalize_list(required_expertise)

    facilities = normalize_list(university_facilities)

    if not required or not facilities:
        return 0

    matched_count = 0

    for required_item in required:

        for facility in facilities:

            if (
                required_item in facility
                or facility in required_item
            ):
                matched_count += 1
                break

    score = (matched_count / len(required)) * 100

    return round(score)


# ---------------------------------------------------------
# INNOVATION / INCUBATION MATCH
# ---------------------------------------------------------

def calculate_innovation_match(
    university,
    required_expertise
):

    expertise = normalize_list(required_expertise)

    innovation_centres = normalize_list(
        university.innovation_centres
    )

    incubation_facilities = normalize_list(
        university.incubation_facilities
    )

    score = 0

    # Having an innovation centre
    if innovation_centres:
        score += 50

    # Having an incubation facility
    if incubation_facilities:
        score += 50

    return min(score, 100)


# ---------------------------------------------------------
# LOCATION MATCH
# ---------------------------------------------------------

def calculate_location_match(
    problem_location,
    university_location
):

    problem_location = normalize_text(problem_location)

    university_location = normalize_text(
        university_location
    )

    if not problem_location or not university_location:
        return 0

    # Exact location match
    if problem_location == university_location:
        return 100

    # One location contains the other
    if (
        problem_location in university_location
        or university_location in problem_location
    ):
        return 100

    # Compare individual location words
    problem_words = set(problem_location.split())
    university_words = set(university_location.split())

    common_words = problem_words.intersection(
        university_words
    )

    # Ignore very short words
    common_words = {
        word for word in common_words
        if len(word) > 2
    }

    if common_words:
        return 50

    return 0


# ---------------------------------------------------------
# COMPLETE UNIVERSITY MATCH
# ---------------------------------------------------------

def calculate_university_match(problem, university):

    # ---------------------------------------------
    # 1. EXPERTISE
    # ---------------------------------------------

    expertise_result = calculate_expertise_match(
        problem.required_expertise,
        university.expertise
    )

    expertise_score = expertise_result["score"]


    # ---------------------------------------------
    # 2. CATEGORY
    # ---------------------------------------------

    problem_category = (
        problem.detected_category
        or problem.category
    )

    category_match = calculate_category_match(
        problem_category,
        university.disciplines
    )

    category_score = 100 if category_match else 0


    # ---------------------------------------------
    # 3. FACILITIES
    # ---------------------------------------------

    facility_score = calculate_facility_match(
        problem.required_expertise,
        university.facilities
    )


    # ---------------------------------------------
    # 4. INNOVATION / INCUBATION
    # ---------------------------------------------

    innovation_score = calculate_innovation_match(
        university,
        problem.required_expertise
    )


    # ---------------------------------------------
    # 5. LOCATION
    # ---------------------------------------------

    location_score = calculate_location_match(
        problem.location,
        university.location
    )


    # ---------------------------------------------
    # FINAL SCORE
    # ---------------------------------------------

    overall_score = (
        (expertise_score * 0.40)
        + (category_score * 0.20)
        + (facility_score * 0.15)
        + (innovation_score * 0.10)
        + (location_score * 0.15)
    )


    return {

        "match_score": round(overall_score),

        "expertise_score": expertise_score,

        "category_score": category_score,

        "category_match": category_match,

        "facility_score": facility_score,

        "innovation_score": innovation_score,

        "location_score": location_score,

        "matched_expertise":
            expertise_result["matched"],

        "missing_expertise":
            expertise_result["missing"]
    }


# ---------------------------------------------------------
# FIND TOP UNIVERSITIES
# ---------------------------------------------------------

def find_matching_universities(
    problem,
    db,
    limit=5
):

    universities = db.query(
        University
    ).all()

    matches = []

    for university in universities:

        result = calculate_university_match(
            problem,
            university
        )

        matches.append({

            "university_id":
                university.id,

            "university_name":
                university.name,

            "location":
                university.location,

            "institution_type":
                university.institution_type,

            "match_score":
                result["match_score"],

            "expertise_score":
                result["expertise_score"],

            "category_score":
                result["category_score"],

            "category_match":
                result["category_match"],

            "facility_score":
                result["facility_score"],

            "innovation_score":
                result["innovation_score"],

            "location_score":
                result["location_score"],

            "matched_expertise":
                result["matched_expertise"],

            "missing_expertise":
                result["missing_expertise"],

            "disciplines":
                university.disciplines or [],

            "facilities":
                university.facilities or [],

            "innovation_centres":
                university.innovation_centres or [],

            "incubation_facilities":
                university.incubation_facilities or [],

            "description":
                university.description
        })


    # Highest score first
    matches.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return matches[:limit]