const params = new URLSearchParams(
    window.location.search
);

const problemId = params.get("id");


async function loadAnalysis() {

    if (!problemId) {
        showError("No problem selected.");
        return;
    }

    try {

        console.log(
            `🔍 Loading analysis for problem ${problemId}...`
        );

        const data =
            await getProblemAnalysis(problemId);

        console.log(
            "✅ Analysis received:",
            data
        );

        displayAnalysis(data);

    } catch (error) {

        console.error(
            "❌ Analysis error:",
            error
        );

        showError(
            error.message ||
            "Unable to load problem analysis."
        );
    }
}


function displayAnalysis(data) {

    const problem =
        data.problem || {};

    const analysis =
        data.analysis || {};


    /*
     * Problem information
     */

    document.getElementById(
        "problemTitle"
    ).textContent =
        problem.title ||
        "Untitled problem";


    document.getElementById(
        "problemDescription"
    ).textContent =
        problem.description ||
        "-";


    document.getElementById(
        "problemLocation"
    ).textContent =
        problem.location ||
        "-";


    document.getElementById(
        "problemCategory"
    ).textContent =
        analysis.category ||
        problem.category ||
        "-";


    document.getElementById(
        "problemUrgency"
    ).textContent =
        analysis.urgency ||
        problem.urgency ||
        "-";


    document.getElementById(
        "problemAffected"
    ).textContent =
        problem.affected ||
        "-";


    /*
     * AI analysis information
     */

    document.getElementById(
        "priorityScore"
    ).textContent =
        `${analysis.priority_score ?? "--"}/100`;


    document.getElementById(
        "impactScore"
    ).textContent =
        `${analysis.impact_score ?? "--"}/100`;


    document.getElementById(
        "impactLevel"
    ).textContent =
        analysis.impact_level ||
        "-";


    /*
     * Challenges
     */

    const challengeList =
        document.getElementById(
            "challengeList"
        );

    challengeList.innerHTML = "";

    const challenges =
        analysis.challenges || [];


    if (challenges.length === 0) {

        const li =
            document.createElement("li");

        li.textContent =
            "No challenges were identified.";

        challengeList.appendChild(li);

    } else {

        challenges.forEach(
            challenge => {

                const li =
                    document.createElement("li");

                li.textContent =
                    challenge;

                challengeList.appendChild(li);
            }
        );
    }


    /*
     * Required skills
     */

    const skillList =
        document.getElementById(
            "skillList"
        );

    skillList.innerHTML = "";

    const skills =
        analysis.skills ||
        analysis.required_expertise ||
        [];


    if (skills.length === 0) {

        const span =
            document.createElement("span");

        span.textContent =
            "No skills identified";

        skillList.appendChild(span);

    } else {

        skills.forEach(
            skill => {

                const span =
                    document.createElement("span");

                span.textContent =
                    skill;

                skillList.appendChild(span);
            }
        );
    }
}


function showError(message) {

    const content =
        document.getElementById(
            "analysisContent"
        );

    if (content) {

        content.innerHTML = `
            <div class="error-message">
                ${message}
            </div>
        `;
    }
}


loadAnalysis();