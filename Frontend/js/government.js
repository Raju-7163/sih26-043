/*
 * government.js — Government validation dashboard
 *
 * Uses new HTML element IDs: loadingMsg, errorMsg, problemList,
 * emptyMsg, statPending, statCritical, statHigh,
 * pendingCountBadge, reviewModal, reviewContent,
 * modalValidateBtn, modalRejectBtn, closeModal.
 */

let selectedProblemId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('government')) return;
    loadDashboard();
});


async function loadDashboard() {
    const loadingMsg = document.getElementById('loadingMsg');
    const errorMsg   = document.getElementById('errorMsg');
    const emptyMsg   = document.getElementById('emptyMsg');

    try {
        const result   = await getPendingProblems();
        const problems = result.problems || result || [];

        loadingMsg.style.display = 'none';

        if (!Array.isArray(problems)) {
            throw new Error('Invalid response from server.');
        }

        updateStats(problems);

        if (problems.length === 0) {
            emptyMsg.style.display = 'block';
        } else {
            renderProblems(problems);
        }

    } catch (err) {
        console.error(err);
        loadingMsg.style.display = 'none';
        errorMsg.style.display   = 'block';
        errorMsg.textContent     = err.message || 'Failed to load dashboard.';
    }

    bindModalEvents();
}


// ── Statistics ────────────────────────────────────────────────────────────────
function updateStats(problems) {
    const pending  = problems.length;
    const critical = problems.filter(p => String(p.urgency || '').toLowerCase() === 'critical').length;
    const high     = problems.filter(p => Number(p.priority_score || 0) >= 70).length;

    document.getElementById('statPending').textContent  = pending;
    document.getElementById('statCritical').textContent = critical;
    document.getElementById('statHigh').textContent     = high;

    const badge = document.getElementById('pendingCountBadge');
    badge.textContent = `${pending} pending`;
    badge.className   = pending > 0 ? 'badge badge-amber' : 'badge badge-green';
}


// ── Render problems list ──────────────────────────────────────────────────────
function renderProblems(problems) {
    const list = document.getElementById('problemList');
    list.innerHTML = '';

    problems.forEach(p => {
        const urgencyBadgeClass = {
            Critical: 'badge-red',
            High:     'badge-amber',
            Medium:   'badge-blue',
            Low:      'badge-green',
        }[p.urgency] || 'badge-neutral';

        const card = document.createElement('div');
        card.className = 'problem-row-card';
        card.onclick   = () => openReview(p.id);

        card.innerHTML = `
          <div class="problem-row-top">
            <div>
              <div class="problem-row-title">${escapeHTML(p.title || 'Untitled Problem')}</div>
              <div class="problem-row-meta">
                📍 ${escapeHTML(p.location || 'Location not provided')}
                &nbsp;·&nbsp; Submitted ${formatDate(p.created_at)}
              </div>
            </div>
            <span class="badge ${urgencyBadgeClass}">${escapeHTML(p.urgency || 'Medium')}</span>
          </div>

          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${escapeHTML(p.description || 'No description.')}
          </p>

          <div class="problem-row-analysis">
            <div class="analysis-cell">
              <div class="cell-label">Category</div>
              <div class="cell-value">${escapeHTML(p.category || p.detected_category || '—')}</div>
            </div>
            <div class="analysis-cell">
              <div class="cell-label">Department</div>
              <div class="cell-value">${escapeHTML(p.department || p.detected_department || '—')}</div>
            </div>
            <div class="analysis-cell">
              <div class="cell-label">Priority Score</div>
              <div class="cell-value" style="color:var(--brand-primary);font-weight:700;">
                ${p.priority_score ?? '—'}<span style="font-size:11px;color:var(--text-muted);font-weight:400;">/100</span>
              </div>
            </div>
          </div>

          <div class="problem-row-actions">
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openReview(${p.id})">
              🔍 Review Details
            </button>
            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); quickValidate(${p.id})">
              ✓ Validate
            </button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); quickReject(${p.id})">
              ✕ Reject
            </button>
          </div>
        `;

        list.appendChild(card);
    });
}


// ── Open full review modal ────────────────────────────────────────────────────
async function openReview(problemId) {
    selectedProblemId = problemId;

    const modal   = document.getElementById('reviewModal');
    const content = document.getElementById('reviewContent');
    modal.style.display = 'flex';

    content.innerHTML = `
      <div class="loading-state" style="padding:30px 0;">
        <div class="spinner"></div>
        <span>Loading problem details…</span>
      </div>
    `;

    try {
        const result  = await getProblem(problemId);
        const problem = result.problem || result;

        const urgencyClass = {
            Critical: 'badge-red',
            High:     'badge-amber',
            Medium:   'badge-blue',
            Low:      'badge-green',
        }[problem.urgency] || 'badge-neutral';

        content.innerHTML = `
          <!-- Title & meta -->
          <div style="margin-bottom:20px;">
            <h3 style="font-size:19px;font-weight:800;margin-bottom:8px;line-height:1.3;">
              ${escapeHTML(problem.title || 'Untitled')}
            </h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span class="badge ${urgencyClass}">${escapeHTML(problem.urgency || 'Medium')}</span>
              <span class="badge badge-neutral">📍 ${escapeHTML(problem.location || '—')}</span>
            </div>
          </div>

          <!-- Description -->
          <div style="margin-bottom:20px;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Description</div>
            <div style="background:var(--bg-subtle);border-left:3px solid var(--brand-primary);padding:14px 16px;border-radius:0 var(--radius-md) var(--radius-md) 0;font-size:14px;line-height:1.7;color:var(--text-secondary);">
              ${escapeHTML(problem.description || 'No description.')}
            </div>
          </div>

          <!-- Scores -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Priority</div>
              <div style="font-size:22px;font-weight:800;color:var(--brand-primary);">${problem.priority_score ?? '—'}<span style="font-size:11px;color:var(--text-muted);font-weight:400;">/100</span></div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Impact</div>
              <div style="font-size:22px;font-weight:800;color:var(--text-primary);">${problem.impact_score ?? '—'}<span style="font-size:11px;color:var(--text-muted);font-weight:400;">/10</span></div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Confidence</div>
              <div style="font-size:22px;font-weight:800;color:var(--text-primary);">${problem.department_confidence ?? '—'}<span style="font-size:11px;color:var(--text-muted);font-weight:400;">%</span></div>
            </div>
          </div>

          <!-- AI fields -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Category</div>
              <div style="font-size:13px;font-weight:600;">${escapeHTML(problem.category || problem.detected_category || '—')}</div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Department</div>
              <div style="font-size:13px;font-weight:600;">${escapeHTML(problem.department || problem.detected_department || '—')}</div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Affected Population</div>
              <div style="font-size:13px;font-weight:600;">${escapeHTML(problem.affected_population || '—')}</div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Submitted By</div>
              <div style="font-size:13px;font-weight:600;">${escapeHTML(problem.affected || '—')}</div>
            </div>
          </div>

          <!-- Expertise tags -->
          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Required Expertise</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${renderTagChips(problem.required_expertise)}</div>
          </div>

          <!-- Solution areas -->
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Suggested Solution Areas</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${renderTagChips(problem.suggested_solution_areas)}</div>
          </div>
        `;

    } catch (err) {
        content.innerHTML = `<div class="error-state">${escapeHTML(err.message || 'Failed to load.')}</div>`;
    }
}


// ── Quick validate (from card, no modal) ─────────────────────────────────────
async function quickValidate(problemId) {
    if (!confirm('Validate this problem?')) return;
    try {
        await validateProblemAPI(problemId);
        showToast('✓ Problem validated successfully', 'success');
        await loadDashboard();
    } catch (err) {
        showToast(err.message || 'Validation failed', 'error');
    }
}

async function quickReject(problemId) {
    if (!confirm('Reject this problem? This action cannot be undone.')) return;
    try {
        await rejectProblemAPI(problemId);
        showToast('Problem rejected', '');
        await loadDashboard();
    } catch (err) {
        showToast(err.message || 'Rejection failed', 'error');
    }
}


// ── Modal validate / reject ───────────────────────────────────────────────────
async function validateSelected() {
    if (!selectedProblemId) return;
    const btn = document.getElementById('modalValidateBtn');
    btn.disabled    = true;
    btn.textContent = 'Validating…';
    try {
        await validateProblemAPI(selectedProblemId);
        closeReviewModal();
        showToast('✓ Problem validated successfully', 'success');
        await loadDashboard();
    } catch (err) {
        showToast(err.message || 'Validation failed', 'error');
        btn.disabled    = false;
        btn.textContent = '✓ Validate Problem';
    }
}

async function rejectSelected() {
    if (!selectedProblemId) return;
    if (!confirm('Reject this problem?')) return;
    const btn = document.getElementById('modalRejectBtn');
    btn.disabled    = true;
    btn.textContent = 'Rejecting…';
    try {
        await rejectProblemAPI(selectedProblemId);
        closeReviewModal();
        showToast('Problem rejected', '');
        await loadDashboard();
    } catch (err) {
        showToast(err.message || 'Rejection failed', 'error');
        btn.disabled    = false;
        btn.textContent = '✕ Reject Problem';
    }
}


// ── Modal events ──────────────────────────────────────────────────────────────
function bindModalEvents() {
    document.getElementById('closeModal').onclick       = closeReviewModal;
    document.getElementById('modalValidateBtn').onclick = validateSelected;
    document.getElementById('modalRejectBtn').onclick   = rejectSelected;

    document.getElementById('reviewModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeReviewModal();
    });
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    selectedProblemId = null;
}


// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type) {
    const t = document.createElement('div');
    t.className   = 'toast' + (type ? ' toast-' + type : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}


// ── Helpers ───────────────────────────────────────────────────────────────────
function renderTagChips(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '<span class="tag-chip">Not available</span>';
    }
    return items.map(i => `<span class="tag-chip">${escapeHTML(i)}</span>`).join('');
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    } catch { return '—'; }
}

function escapeHTML(val) {
    const d = document.createElement('div');
    d.textContent = String(val ?? '');
    return d.innerHTML;
}
