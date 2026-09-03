/*
 * problem.js — Problem detail page
 *
 * Loads a single problem from GET /api/problems/{id}
 * and renders all fields including AI analysis.
 */

document.addEventListener('DOMContentLoaded', loadProblem);


async function loadProblem() {
    const loadingState  = document.getElementById('loadingState');
    const errorState    = document.getElementById('errorState');
    const errorMsg      = document.getElementById('errorMsg');
    const problemContent = document.getElementById('problemContent');

    try {
        const params    = new URLSearchParams(window.location.search);
        const problemId = params.get('id');

        if (!problemId) {
            throw new Error('Problem ID is missing from the URL.');
        }

        const problem = await getProblem(problemId);

        if (!problem) {
            throw new Error('Problem not found.');
        }

        displayProblem(problem);

        loadingState.style.display  = 'none';
        problemContent.style.display = 'block';

    } catch (err) {
        console.error('Problem load error:', err);
        loadingState.style.display = 'none';
        errorState.style.display   = 'block';
        errorMsg.textContent        = err.message || 'Failed to load problem details.';
    }
}


function displayProblem(problem) {
    // ── Title ─────────────────────────────────────────────
    document.getElementById('problemTitle').textContent =
        problem.title || 'Untitled Problem';

    // ── Header badges ─────────────────────────────────────
    const statusBadge      = document.getElementById('statusBadge');
    const validationBadge  = document.getElementById('validationBadge');
    const urgencyBadge     = document.getElementById('urgencyBadge');

    const statusClasses = {
        Submitted:          'badge-blue',
        Validated:          'badge-green',
        Duplicate:          'badge-neutral',
        Rejected:           'badge-red',
        'University Assigned': 'badge-purple',
        'Team Formed':      'badge-purple',
        Proposal:           'badge-purple',
        Prototype:          'badge-amber',
        Testing:            'badge-amber',
        Pilot:              'badge-amber',
        Deployed:           'badge-green',
        Resolved:           'badge-green',
    };

    const validationClasses = {
        Pending:   'badge-amber',
        Validated: 'badge-green',
        Rejected:  'badge-red',
    };

    const urgencyClasses = {
        Critical: 'badge-red',
        High:     'badge-amber',
        Medium:   'badge-blue',
        Low:      'badge-green',
    };

    const status     = problem.status || 'Submitted';
    const validation = problem.validation_status || 'Pending';
    const urgency    = problem.urgency || 'Medium';

    statusBadge.textContent  = status;
    statusBadge.className    = 'badge ' + (statusClasses[status] || 'badge-neutral');

    validationBadge.textContent = validation;
    validationBadge.className   = 'badge ' + (validationClasses[validation] || 'badge-neutral');

    urgencyBadge.textContent = urgency;
    urgencyBadge.className   = 'badge ' + (urgencyClasses[urgency] || 'badge-neutral');

    // ── Description ───────────────────────────────────────
    document.getElementById('problemDescription').textContent =
        problem.description || 'No description provided.';

    document.getElementById('problemLocation').textContent =
        problem.location || 'Not provided';

    document.getElementById('problemAffected').textContent =
        problem.affected || 'Not provided';

    document.getElementById('inputType').textContent =
        (problem.input_type || 'text').charAt(0).toUpperCase() +
        (problem.input_type || 'text').slice(1);

    document.getElementById('problemLanguage').textContent =
        problem.language || 'English';

    // ── AI scores ─────────────────────────────────────────
    document.getElementById('priorityScore').textContent =
        problem.priority_score ?? '—';

    document.getElementById('impactScore').textContent =
        problem.impact_score ?? '—';

    const conf = problem.department_confidence;
    document.getElementById('departmentConfidence').textContent =
        conf !== null && conf !== undefined ? conf : '—';

    // ── Category / Department ─────────────────────────────
    document.getElementById('detectedCategory').textContent =
        problem.detected_category || problem.category || 'Not available';

    document.getElementById('detectedDepartment').textContent =
        problem.detected_department || problem.department || 'Not available';

    // ── Affected population ───────────────────────────────
    document.getElementById('affectedPopulation').textContent =
        problem.affected_population || 'Not available';

    // ── Tags ──────────────────────────────────────────────
    renderTags('requiredExpertise', problem.required_expertise);
    renderTags('solutionAreas',     problem.suggested_solution_areas);

    // ── Sidebar status ────────────────────────────────────
    document.getElementById('sideValidation').textContent = validation;
    document.getElementById('sideStatus').textContent     = status;
    document.getElementById('sideDuplicate').textContent  =
        problem.duplicate_of ? `#${problem.duplicate_of}` : 'None';

    // ── Show matching button only for validated problems ──
    if (validation === 'Validated') {
        const matchingSection = document.getElementById('matchingSection');
        matchingSection.style.display = 'block';

        document.getElementById('matchingButton').addEventListener('click', () => {
            window.location.href = `matching.html?id=${problem.id}`;
        });
    }
}


function renderTags(elementId, items) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
        const chip = document.createElement('span');
        chip.className   = 'tag-chip';
        chip.textContent = 'Not available';
        container.appendChild(chip);
        return;
    }

    items.forEach(item => {
        const chip = document.createElement('span');
        chip.className   = 'tag-chip';
        chip.textContent = item;
        container.appendChild(chip);
    });
}
