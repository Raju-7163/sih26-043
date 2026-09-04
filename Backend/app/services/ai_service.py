import os
import json

from dotenv import load_dotenv
from google import genai


# Load environment variables
load_dotenv()


# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")


if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env")


# Create Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


def test_gemini_connection():
    """
    Simple test to check whether Gemini API is connected.
    """

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents="Reply with exactly: Gemini connection successful"
    )

    return response.text


def analyze_problem(problem_text):
    prompt = f"""
You are an AI assistant for a Societal Innovation Collaboration Portal.

Your job is to analyze a citizen's societal problem and convert it
into structured information that can be used to connect the problem
with government departments, universities, researchers, startups,
MSMEs and CSR organizations.

Analyze the following problem:

{problem_text}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "category": "",
    "department": "",
    "urgency": "",
    "impact_score": 0,
    "affected_population": "",
    "required_expertise": [],
    "suggested_solution_areas": []
}}

IMPORTANT CATEGORY RULE:

The category MUST be exactly ONE of the following:

1. "Water & Disaster Management"
2. "Agriculture"
3. "Healthcare"
4. "Education"
5. "Environment"
6. "Transportation & Road Safety"
7. "Waste Management"
8. "Energy"

Do NOT create a new category.

Examples:

Flooding, drainage problems, water shortage, drought,
water contamination, cyclone, landslide or disaster-related
problems should normally use:

"Water & Disaster Management"

Problems involving crops, farmers, irrigation for agriculture,
soil, agricultural productivity or farming should normally use:

"Agriculture"

Problems involving hospitals, healthcare access, diseases,
medical services or public health should normally use:

"Healthcare"

Problems involving schools, colleges, students, teachers,
education access or learning should normally use:

"Education"

Problems involving pollution, forests, climate, biodiversity,
air quality or environmental protection should normally use:

"Environment"

Problems involving roads, traffic, public transportation,
accidents, mobility or road safety should normally use:

"Transportation & Road Safety"

Problems involving garbage, solid waste, recycling,
waste collection or waste disposal should normally use:

"Waste Management"

Problems involving electricity, renewable energy,
power supply, solar energy or energy efficiency should normally use:

"Energy"

Rules:

1. category must be exactly one of the 8 categories listed above.
2. department should be the most relevant government department.
3. urgency must be one of:
   "Low", "Medium", "High", "Critical".
4. impact_score must be an integer from 1 to 10.
5. affected_population should describe who is affected.
6. required_expertise should contain 3 to 6 relevant expertise areas.
7. suggested_solution_areas should contain 2 to 5 possible solution areas.
8. Do not invent specific organizations.
9. Do not provide explanations outside the JSON.
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
    except Exception as e:
        print(f"⚠️ Primary Gemini model {GEMINI_MODEL} failed: {e}. Trying gemini-2.5-flash...")
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
        except Exception as e2:
            print(f"⚠️ gemini-2.5-flash failed: {e2}. Trying gemini-1.5-flash...")
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )

    response_text = response.text.strip()

    if response_text.startswith("```"):
        response_text = response_text.replace("```json", "")
        response_text = response_text.replace("```", "")
        response_text = response_text.strip()

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        raise ValueError(
            f"Gemini returned invalid JSON: {response_text}"
        )

    return result