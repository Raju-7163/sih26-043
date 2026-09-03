/*
 * matching.js — Partner matching page
 *
 * Fixes applied:
 * 1. Industry GET endpoint returns { problem_id, problem_title, industry_matches: [...] }
 *    — normalise by checking `industry_matches` key in addition to `matches`/`industries`
 * 2. match_id is only present in DB-stored records (after generate).
 *    If GET returns records without match_id, we trigger generate automatically.
 * 3. goToProject() now navigates to project.html (which we create) and only
 *    enables after a university is accepted.
 */

const params    = new URLSearchParams(window.location.search);
const problemId = params.get('id');

let universityAccepted = false;  // tracks if any university was accepted this session


// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
    if (!problemId) {
        showError('No problem ID in URL. Go back and select a problem.');
        return;
    }

    // Show page content (spinner shown inside each section)
    document.getElementById('pageLoading').style.display = 'none';
    document.getElementById('pageContent').style.display  = 'block';

    // Load in parallel — problem first, then matches
    try {
        const problem = await getProblem(problemId);
        renderProblemSummary(problem);

        // Check if a university is already accepted
        universityAccepted = problem.status === 'University Assigned' ||
                             problem.validation_status === 'Validated' &&
                             problem.status !== 'Submitted' &&
                             problem.status !== 'Validated';
    } catch (err) {
        showError('Failed to load problem: ' + (err.message || err));
        return;
    }

    // Load universities and industries in parallel
    await Promise.allSettled([
        loadUniversities(),
        loadIndustries(),
    ]);
}


// ── Render problem summary card ───────────────────────────────────────────────
function renderProblemSummary(problem) {
    setText('problemTitle',       problem.title || 'Untitled Problem');
    setText('problemDescription', problem.description || '—');
    setText('problemCategory',    problem.detected_category || problem.category || '—');
    setText('problemLocation',    problem.location || '—');
    setText('problemDepartment',  problem.detected_department || problem.department || '—');
}


// ── Load Universities ─────────────────────────────────────────────────────────
async function loadUniversities() {
    const loadingEl = document.getElementById('universityLoading');
    const listEl    = document.getElementById('universityList');
    const emptyEl   = document.getElementById('universityEmpty');
    const countEl   = document.getElementById('universityCount');

    try {
        let universities = [];

        // Try saved matches first
        try {
            const data = await getUniversityMatches(problemId);
            universities = normaliseUniversities(data);
            console.log('✅ Loaded saved university matches:', universities.length);
        } catch {
            // No saved matches → generate
            console.log('Generating university matches…');
            const data = await generateUniversityMatches(problemId);
            universities = normaliseUniversities(data);
            console.log('✅ Generated university matches:', universities.length);
        }

        loadingEl.style.display = 'none';

        if (universities.length === 0) {
            emptyEl.style.display = 'block';
            countEl.textContent   = '0 matches';
            return;
        }

        countEl.textContent    = `${universities.length} matches`;
        listEl.style.display   = 'grid';
        renderUniversityCards(universities, listEl);

        // Check if any already accepted
        const accepted = universities.find(u => u.status === 'Accepted');
        if (accepted) enableProjectButton();

    } catch (err) {
        loadingEl.style.display = 'none';
        listEl.style.display    = 'block';
        listEl.innerHTML = `<div class="error-state" style="grid-column:1/-1;">${escapeHTML(err.message || 'Failed to load university matches.')}</div>`;
    }
}


// ── Load Industries ───────────────────────────────────────────────────────────
async function loadIndustries() {
    const loadingEl = document.getElementById('industryLoading');
    const listEl    = document.getElementById('industryList');
    const emptyEl   = document.getElementById('industryEmpty');
    const countEl   = document.getElementById('industryCount');

    try {
        let industries = [];

        // Try to get saved matches (generate will always have match_id)
        // The live GET endpoint doesn't return match_id, so always generate if no match_id
        try {
            const data = await generateIndustryMatches(problemId);
            industries = normaliseIndustries(data);
            console.log('✅ Generated industry matches:', industries.length);
        } catch (genErr) {
            // Maybe already generated — try GET
            try {
                const data = await getIndustryMatches(problemId);
                industries = normaliseIndustries(data);
                console.log('✅ Loaded industry matches:', industries.length);
            } catch {
                throw genErr;
            }
        }

        loadingEl.style.display = 'none';

        if (industries.length === 0) {
            emptyEl.style.display = 'block';
            countEl.textContent   = '0 matches';
            return;
        }

        countEl.textContent  = `${industries.length} matches`;
        listEl.style.display = 'grid';
        renderIndustryCards(industries, listEl);

    } catch (err) {
        loadingEl.style.display = 'none';
        listEl.style.display    = 'block';
        listEl.innerHTML = `<div class="error-state" style="grid-column:1/-1;">${escapeHTML(err.message || 'Failed to load industry matches.')}</div>`;
    }
}


// ── Normalise response shapes ─────────────────────────────────────────────────
function normaliseUniversities(data) {
    if (Array.isArray(data)) return data;
    return data?.matches ?? data?.universities ?? [];
}

function normaliseIndustries(data) {
    if (Array.isArray(data)) return data;
    // Backend generate returns: { problem_id, problem_title, matches: [...] }
    // Backend GET returns:      { problem_id, problem_title, industry_matches: [...] }
    return data?.matches ?? data?.industry_matches ?? data?.industries ?? [];
}


// ── Render University Cards ───────────────────────────────────────────────────
function renderUniversityCards(universities, container) {
    container.innerHTML = '';

    universities.forEach(u => {
        const matchId  = u.match_id;
        const score    = Math.round(u.match_score ?? 0);
        const accepted = u.status === 'Accepted';

        const card = document.createElement('div');
        card.className = 'partner-card' + (accepted ? ' accepted' : '');

        card.innerHTML = `
          <div class="partner-card-head">
            <div style="flex:1;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px;">
                ${escapeHTML(u.institution_type || 'University')}
              </div>
              <div class="partner-name">${escapeHTML(u.university_name || 'University')}</div>
              <div class="partner-meta">📍 ${escapeHTML(u.location || '—')}</div>
            </div>
            <div class="match-score-badge">
              <span class="score-num">${score}</span>
              <span class="score-label">score</span>
            </div>
          </div>

          <p class="partner-desc">
            ${escapeHTML(u.description || 'Higher education institution with relevant research capabilities.')}
          </p>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <span class="badge ${u.category_match ? 'badge-green' : 'badge-neutral'}">
              ${u.category_match ? '✓' : '✗'} Category Match
            </span>
            <span class="badge badge-brand">
              Expertise ${u.expertise_score ?? 0}%
            </span>
          </div>

          <div style="margin-bottom:4px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:6px;">Matched Expertise</div>
            <div class="partner-tags">
              ${renderTagChips(u.matched_expertise, 'badge-brand')}
            </div>
          </div>

          ${u.missing_expertise?.length ? `
          <div style="margin-bottom:4px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:6px;">Missing Expertise</div>
            <div class="partner-tags">${renderTagChips(u.missing_expertise, 'badge-neutral')}</div>
          </div>` : ''}

          <div class="partner-footer">
            ${accepted
              ? `<button class="btn btn-full" style="background:var(--green-bg);color:var(--green);border:1px solid var(--green);justify-content:center;" disabled>✓ University Assigned</button>`
              : !matchId
              ? `<button class="btn btn-ghost btn-full" disabled>Match ID Missing — Regenerate</button>`
              : `<button class="btn btn-primary btn-full" onclick="selectUniversity(${matchId})">Assign This University →</button>`
            }
          </div>
        `;

        container.appendChild(card);
    });
}


// ── Render Industry Cards ─────────────────────────────────────────────────────
function renderIndustryCards(industries, container) {
    container.innerHTML = '';

    industries.forEach(ind => {
        const matchId  = ind.match_id;
        const score    = Math.round(ind.match_score ?? 0);
        const accepted = ind.status === 'Accepted';

        const card = document.createElement('div');
        card.className = 'partner-card' + (accepted ? ' accepted' : '');

        card.innerHTML = `
          <div class="partner-card-head">
            <div style="flex:1;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px;">
                ${escapeHTML(ind.organization_type || 'Industry')}
              </div>
              <div class="partner-name">${escapeHTML(ind.industry_name || 'Industry Partner')}</div>
              <div class="partner-meta">📍 ${escapeHTML(ind.location || '—')}</div>
            </div>
            <div class="match-score-badge">
              <span class="score-num">${score}</span>
              <span class="score-label">score</span>
            </div>
          </div>

          <p class="partner-desc">
            ${escapeHTML(ind.description || 'Organization with relevant technical and implementation capabilities.')}
          </p>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <span class="badge ${ind.domain_match ? 'badge-green' : 'badge-neutral'}">
              ${ind.domain_match ? '✓' : '✗'} Domain Match
            </span>
            <span class="badge badge-blue">
              Expertise ${ind.expertise_score ?? 0}%
            </span>
          </div>

          <div style="margin-bottom:4px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:6px;">Matched Expertise</div>
            <div class="partner-tags">${renderTagChips(ind.matched_expertise, 'badge-brand')}</div>
          </div>

          ${ind.matched_capabilities?.length ? `
          <div style="margin-bottom:4px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:6px;">Capabilities</div>
            <div class="partner-tags">${renderTagChips(ind.matched_capabilities, 'badge-blue')}</div>
          </div>` : ''}

          <div class="partner-footer">
            ${accepted
              ? `<button class="btn btn-full" style="background:var(--green-bg);color:var(--green);border:1px solid var(--green);justify-content:center;" disabled>✓ Partner Accepted</button>`
              : !matchId
              ? `<button class="btn btn-ghost btn-full" disabled>Match ID Missing — Regenerate</button>`
              : `<button class="btn btn-secondary btn-full" onclick="selectIndustry(${matchId})">Accept Industry Partner →</button>`
            }
          </div>
        `;

        container.appendChild(card);
    });
}


// ── Accept University ─────────────────────────────────────────────────────────
async function selectUniversity(matchId) {
    if (!matchId) { showToast('Match ID missing.', 'error'); return; }
    if (!confirm('Assign this university to the problem?')) return;

    try {
        showToast('Assigning university…', '');
        const result = await acceptUniversityMatch(matchId);
        showToast(result.message || '✓ University assigned!', 'success');
        enableProjectButton();
        await loadUniversities();
    } catch (err) {
        showToast(err.message || 'Assignment failed.', 'error');
    }
}


// ── Accept Industry ───────────────────────────────────────────────────────────
async function selectIndustry(matchId) {
    if (!matchId) { showToast('Match ID missing.', 'error'); return; }
    if (!confirm('Accept this industry partner?')) return;

    try {
        showToast('Accepting partner…', '');
        const result = await acceptIndustryMatch(matchId);
        showToast(result.message || '✓ Industry partner accepted!', 'success');
        await loadIndustries();
    } catch (err) {
        showToast(err.message || 'Acceptance failed.', 'error');
    }
}


// ── Enable project continue button ───────────────────────────────────────────
function enableProjectButton() {
    const btn  = document.getElementById('continueProjectBtn');
    const hint = document.getElementById('continueHint');
    if (btn) {
        btn.disabled           = false;
        btn.style.opacity      = '1';
        btn.style.cursor       = 'pointer';
    }
    if (hint) {
        hint.textContent = '✓ University assigned — you can now create the project workspace.';
        hint.style.color = 'var(--green)';
    }
}


// ── Navigate to project workspace ────────────────────────────────────────────
async function goToProject() {
    if (!problemId) return;

    const btn = document.getElementById('continueProjectBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating project…'; }

    try {
        // Create the project (idempotent — backend returns existing if already created)
        const result = await createProject(problemId);
        const projectId = result?.project?.id;

        if (projectId) {
            window.location.href = `project.html?id=${projectId}`;
        } else {
            // Fallback: go to project page with problem ID
            window.location.href = `project.html?problem_id=${problemId}`;
        }
    } catch (err) {
        showToast(err.message || 'Could not create project.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Continue to Project Workspace →'; }
    }
}


// ── Helpers ───────────────────────────────────────────────────────────────────
function renderTagChips(items, badgeClass = 'badge-neutral') {
    if (!Array.isArray(items) || items.length === 0) {
        return '<span class="tag-chip">None</span>';
    }
    return items.map(i => `<span class="badge ${badgeClass}">${escapeHTML(i)}</span>`).join('');
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function showError(msg) {
    document.getElementById('pageLoading').style.display = 'none';
    document.getElementById('pageContent').style.display  = 'block';
    document.getElementById('matchingMessage').textContent = msg;
    document.getElementById('matchingMessage').style.color = 'var(--red)';
}

function showToast(msg, type) {
    const t = document.createElement('div');
    t.className   = 'toast' + (type ? ' toast-' + type : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function escapeHTML(val) {
    const d = document.createElement('div');
    d.textContent = String(val ?? '');
    return d.innerHTML;
}
