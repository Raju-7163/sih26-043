const API_BASE_URL = "http://127.0.0.1:8000";


/* =========================================================
   AUTH HELPER
   ─────────────────────────────────────────────────────────
   authFetch() is a drop-in replacement for fetch() that
   automatically adds the Authorization header when the user
   is logged in.  All new API calls should use this instead
   of raw fetch().
========================================================= */

function authFetch(url, options = {}) {
    const token = (typeof getToken === 'function') ? getToken() : localStorage.getItem('sx_token');

    const headers = {
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for JSON bodies (not FormData)
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, { ...options, headers });
}


/* =========================================================
   PROBLEM APIs
========================================================= */


/*
 * Create a new problem
 */
async function createProblem(problemData) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(problemData)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to create problem"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Problem creation failed:",
            error
        );

        throw error;
    }
}


/*
 * Get a single problem
 */
async function getProblem(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to fetch problem"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Failed to fetch problem:",
            error
        );

        throw error;
    }
}


/*
 * Get all problems
 */
async function getProblems() {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to fetch problems"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Failed to fetch problems:",
            error
        );

        throw error;
    }
}


/*
 * Get pending problems
 *
 * Used by:
 * government.html
 */
async function getPendingProblems() {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/pending`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load pending problems"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Failed to fetch pending problems:",
            error
        );

        throw error;
    }
}


/*
 * Get AI analysis of a problem
 */
async function getProblemAnalysis(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/analysis`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load problem analysis"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Failed to fetch analysis:",
            error
        );

        throw error;
    }
}



/* =========================================================
   UNIVERSITY MATCHING APIs
========================================================= */


/*
 * Get university matches for a problem
 */
async function getUniversityMatches(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/universities`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load university matches"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ University matching failed:",
            error
        );

        throw error;
    }
}


/*
 * Generate and save university matches
 */
async function generateUniversityMatches(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/universities/generate`,
            {
                method: "POST"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to generate university matches"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ University match generation failed:",
            error
        );

        throw error;
    }
}


/*
 * Accept a university match
 */
async function acceptUniversityMatch(matchId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/matches/${matchId}/accept`,
            {
                method: "PUT"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to accept university"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ University acceptance failed:",
            error
        );

        throw error;
    }
}



/* =========================================================
   INDUSTRY MATCHING APIs
========================================================= */


/*
 * Get industry matches for a problem
 */
async function getIndustryMatches(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/industries`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load industry matches"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Industry matching failed:",
            error
        );

        throw error;
    }
}


/*
 * Generate and save industry matches
 */
async function generateIndustryMatches(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/industries/generate`,
            {
                method: "POST"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to generate industry matches"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Industry match generation failed:",
            error
        );

        throw error;
    }
}


/*
 * Accept an industry match
 */
async function acceptIndustryMatch(matchId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/industries/${matchId}/accept`,
            {
                method: "PUT"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to accept industry partner"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Industry acceptance failed:",
            error
        );

        throw error;
    }
}



/* =========================================================
   GOVERNMENT APIs
========================================================= */


/*
 * Validate a problem
 */
async function validateProblemAPI(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/validate`,
            {
                method: "PUT"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to validate problem"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Problem validation failed:",
            error
        );

        throw error;
    }
}


/* =========================================================
   PROJECT APIs
========================================================= */


/*
 * Create a project for a validated, university-assigned problem.
 * The backend auto-detects the accepted university and uses
 * sensible defaults for title/description — no extra params needed.
 */
async function createProject(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/projects`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Failed to create project"
            );
        }

        return data;

    } catch (error) {

        console.error(
            "❌ Project creation failed:",
            error
        );

        throw error;
    }
}


/*
 * Get full project workspace data by project ID.
 * Returns: { project, problem, university, industry, team, milestones, proposal }
 */
async function getProject(projectId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/projects/${projectId}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Failed to fetch project"
            );
        }

        return data;

    } catch (error) {

        console.error(
            "❌ Failed to fetch project:",
            error
        );

        throw error;
    }
}


/*
 * Reject a problem
 */
async function rejectProblemAPI(problemId) {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/${problemId}/reject`,
            {
                method: "PUT"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to reject problem"
            );

        }


        return data;

    } catch (error) {

        console.error(
            "❌ Problem rejection failed:",
            error
        );

        throw error;
    }
}


/* =========================================================
   CITIZEN — MY PROBLEMS
========================================================= */

/*
 * Get the logged-in citizen's own problems
 * Requires auth token.
 */
async function getMyProblems() {

    try {

        const response = await authFetch(
            `${API_BASE_URL}/api/problems/my`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Failed to fetch your problems"
            );
        }

        return data;

    } catch (error) {

        console.error(
            "❌ Failed to fetch my problems:",
            error
        );

        throw error;
    }
}


async function getPublicStats() {
    const response = await fetch(`${API_BASE_URL}/api/problems/stats/public`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load public statistics");
    }
    return data;
}


async function getGovernmentDashboardStats() {
    const response = await authFetch(`${API_BASE_URL}/api/problems/dashboard/government`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load government dashboard");
    }
    return data;
}


/* =========================================================
   GOVERNMENT — AWAITING CONFIRMATION
========================================================= */

/*
 * Get problems that have accepted university/industry partners
 * and are awaiting government's final confirmation.
 */
async function getAwaitingConfirmation() {
    const response = await authFetch(
        `${API_BASE_URL}/api/problems/awaiting-confirmation`
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load awaiting confirmation list");
    }
    return data;
}


/*
 * Government confirms the collaboration — creates the project
 * and sends notifications to all parties.
 */
async function confirmCollaboration(problemId) {
    const response = await authFetch(
        `${API_BASE_URL}/api/problems/${problemId}/confirm-collaboration`,
        { method: "PUT" }
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to confirm collaboration");
    }
    return data;
}


async function getUniversityDashboard(universityId) {
    const response = await authFetch(
        `${API_BASE_URL}/api/problems/dashboard/university/${universityId}`
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load university dashboard");
    }
    return data;
}


async function getIndustryDashboard(industryId) {
    const response = await authFetch(
        `${API_BASE_URL}/api/problems/dashboard/industry/${industryId}`
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load industry dashboard");
    }
    return data;
}


async function getUniversityInbox() {
    const response = await authFetch(`${API_BASE_URL}/api/problems/inbox/university`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load university requests");
    }
    return data;
}


async function getIndustryInbox() {
    const response = await authFetch(`${API_BASE_URL}/api/problems/inbox/industry`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load industry opportunities");
    }
    return data;
}


async function getMyNotifications() {
    const response = await authFetch(`${API_BASE_URL}/api/problems/notifications`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load notifications");
    }
    return data;
}


async function uploadProblemEvidence(problemId, fileObj, description = "") {
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('problem_id', problemId);
    if (description) formData.append('description', description);

    const response = await authFetch(`${API_BASE_URL}/api/problems/evidence/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to upload evidence");
    }
    return data;
}

