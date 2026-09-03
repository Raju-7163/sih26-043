import re
from difflib import SequenceMatcher


# ==========================================
# SIMILARITY THRESHOLD
# ==========================================

SIMILARITY_THRESHOLD = 0.55


# ==========================================
# CREATE TEXT FOR COMPARISON
# ==========================================

def create_problem_text(problem):

    title = problem.title or ""
    description = problem.description or ""
    location = problem.location or ""
    category = problem.category or ""

    return (
        f"{title} "
        f"{description} "
        f"{location} "
        f"{category}"
    ).lower()


def tokenize(text: str) -> set:
    stop_words = {
        "a",
        "an",
        "and",
        "are",
        "for",
        "in",
        "is",
        "of",
        "on",
        "or",
        "the",
        "to",
        "with"
    }

    return {
        word
        for word in re.findall(r"[a-z0-9]+", text.lower())
        if word not in stop_words
    }


# ==========================================
# CALCULATE SIMILARITY
# ==========================================

def calculate_similarity(problem1, problem2):

    text1 = create_problem_text(problem1)
    text2 = create_problem_text(problem2)

    words1 = tokenize(text1)
    words2 = tokenize(text2)

    if not words1 or not words2:

        similarity = SequenceMatcher(
            None,
            text1,
            text2
        ).ratio()

    else:

        overlap_score = len(
            words1.intersection(words2)
        ) / len(
            words1.union(words2)
        )

        sequence_score = SequenceMatcher(
            None,
            text1,
            text2
        ).ratio()

        similarity = (
            overlap_score * 0.7
            + sequence_score * 0.3
        )

    return round(
        float(similarity),
        2
    )


# ==========================================
# FIND DUPLICATE
# ==========================================

def find_duplicate(
    new_problem,
    existing_problems
):

    best_match = None
    best_similarity = 0

    for existing_problem in existing_problems:

        # Don't compare with itself
        if existing_problem.id == new_problem.id:
            continue

        similarity = calculate_similarity(
            new_problem,
            existing_problem
        )

        if similarity > best_similarity:

            best_similarity = similarity

            best_match = existing_problem

    # No sufficiently similar problem
    if (
        best_match is None
        or best_similarity < SIMILARITY_THRESHOLD
    ):

        return {
            "is_duplicate": False,
            "duplicate_of": None,
            "similarity": best_similarity
        }

    return {
        "is_duplicate": True,
        "duplicate_of": best_match.id,
        "similarity": best_similarity
    }
