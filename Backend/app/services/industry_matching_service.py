from app.models.industry import Industry


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


def calculate_expertise_match(
    required_expertise,
    industry_expertise
):

    required = normalize_list(
        required_expertise
    )

    available = normalize_list(
        industry_expertise
    )

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

    score = (
        len(matched) /
        len(required)
    ) * 100

    return {
        "score": round(score),
        "matched": matched,
        "missing": missing
    }


def calculate_domain_match(
    problem_category,
    industry_domains
):

    category = normalize_text(
        problem_category
    )

    domains = normalize_list(
        industry_domains
    )

    if not category:
        return False

    for domain in domains:

        if (
            category == domain
            or category in domain
            or domain in category
        ):
            return True

    # Related domains

    relationships = {

        "water & disaster management": [
            "water management",
            "disaster management",
            "environment",
            "infrastructure"
        ],

        "environment": [
            "environment",
            "waste management",
            "water management",
            "renewable energy"
        ],

        "education": [
            "education",
            "digital learning",
            "rural development"
        ],

        "agriculture": [
            "agriculture",
            "rural development",
            "iot"
        ],

        "healthcare": [
            "healthcare",
            "digital health"
        ],

        "energy": [
            "energy",
            "renewable energy",
            "environment"
        ],

        "waste management": [
            "waste management",
            "environment",
            "smart cities"
        ],

        "transportation & road safety": [
            "transportation",
            "infrastructure",
            "smart cities"
        ]
    }

    related_domains = relationships.get(
        category,
        []
    )

    for domain in domains:

        for related in related_domains:

            if (
                related == domain
                or related in domain
                or domain in related
            ):
                return True

    return False


def calculate_capability_match(
    required_capabilities,
    industry_capabilities
):

    required = normalize_list(
        required_capabilities
    )

    available = normalize_list(
        industry_capabilities
    )

    if not required:

        return {
            "matched": [],
            "missing": [],
            "score": 0
        }

    matched = []
    missing = []

    for required_item in required:

        found = False

        for available_item in available:

            if (
                required_item == available_item
                or required_item in available_item
                or available_item in required_item
            ):
                found = True
                break

        if found:
            matched.append(required_item)

        else:
            missing.append(required_item)

    score = (
        len(matched) /
        len(required)
    ) * 100

    return {
        "matched": matched,
        "missing": missing,
        "score": round(score)
    }


def calculate_industry_match(
    problem,
    industry
):

    # --------------------------------------
    # Expertise
    # --------------------------------------

    expertise_result = calculate_expertise_match(

        problem.required_expertise,

        industry.expertise
    )

    expertise_score = (
        expertise_result["score"]
    )

    # --------------------------------------
    # Domain
    # --------------------------------------

    problem_category = (
        problem.detected_category
        or problem.category
    )

    domain_match = calculate_domain_match(

        problem_category,

        industry.domains
    )

    # --------------------------------------
    # Required capabilities
    # --------------------------------------

    required_capabilities = [

        "Mentoring",
        "Prototyping",
        "Testing"
    ]

    capability_result = calculate_capability_match(

        required_capabilities,

        industry.capabilities
    )

    capability_score = (
        capability_result["score"]
    )

    # --------------------------------------
    # Calculate final score
    # --------------------------------------

    overall_score = (

        expertise_score * 0.60

        +

        (100 if domain_match else 0) * 0.25

        +

        capability_score * 0.15
    )

    return {

        "match_score": round(
            overall_score
        ),

        "expertise_score":
            expertise_score,

        "domain_match":
            domain_match,

        "capability_match":
            capability_result["score"] > 0,

        "matched_expertise":
            expertise_result["matched"],

        "missing_expertise":
            expertise_result["missing"],

        "matched_capabilities":
            capability_result["matched"],

        "missing_capabilities":
            capability_result["missing"]
    }


def find_matching_industries(
    problem,
    db,
    limit=5
):

    industries = db.query(
        Industry
    ).all()

    matches = []

    for industry in industries:

        result = calculate_industry_match(

            problem,

            industry
        )

        matches.append({

            "industry_id":
                industry.id,

            "industry_name":
                industry.name,

            "location":
                industry.location,

            "organization_type":
                industry.organization_type,

            "match_score":
                result["match_score"],

            "expertise_score":
                result["expertise_score"],

            "domain_match":
                result["domain_match"],

            "capability_match":
                result["capability_match"],

            "matched_expertise":
                result["matched_expertise"],

            "missing_expertise":
                result["missing_expertise"],

            "matched_capabilities":
                result["matched_capabilities"],

            "missing_capabilities":
                result["missing_capabilities"],

            "domains":
                industry.domains or [],

            "capabilities":
                industry.capabilities or [],

            "funding_capacity":
                industry.funding_capacity,

            "description":
                industry.description
        })

    matches.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return matches[:limit]