/*
 * government.js — Government validation + partner confirmation dashboard
 *
 * Two tabs:
 *   Tab 1 — Pending Validation  : validate / reject submitted problems
 *   Tab 2 — Partner Responses   : confirm collaboration after uni/industry accept
 */

let selectedProblemId    = null;
let selectedConfirmProblem = null;
let currentTab           = 'validation';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('government')) return;
    loadBoth();
    bindModalEvents();
});


// ── Load both tabs in parallel ────────────────────────────────────────────────
async function loadBoth() {
    await Promise.allSettled([
        loadValidationTab(),
        loadConfirmationTab(),
    ]);
}


// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab) {
    currentTab = tab;

    document.getElementById('sectionValidation').style.display  = tab === 'validation'  ? 'block' : 'none';
    document.getElementById('sectionConfirmation').style.display = tab === 'confirmation' ? 'block' : 'none';

    document.getElementById('tabValidation').classList.toggle('active',  tab === 'validation');
    document.getElementById('tabConfirmation').classList.toggle('active', tab === 'confirmation');
}


// ══════════════════════════════════════════════════════════════════
// TAB 1 — PENDING VALIDATION
// ══════════════════════════════════════════════════════════════════

async function loadValidationTab() {
    const loadingMsg = document.getElementById('loadingMsg');
    const errorMsg   = document.getElementById('errorMsg');
    const emptyMsg   = document.getElementById('emptyMsg');

    loadingMsg.style.display = 'flex';
    errorMsg.style.display   = 'none';
    emptyMsg.style.display   = 'none';
    document.getElementById('problemList').innerHTML = '';

    try {
        const result   = await getPendingProblems();
        const problems = result.problems || result || [];

        loadingMsg.style.display = 'none';

        if (!Array.isArray(problems)) throw new Error('Invalid response from server.');

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
        errorMsg.textContent     = err.message || 'Failed to load.';
    }
}


function updateStats(problems) {
    const pending  = problems.length;
    const critical = problems.filter(p => String(p.urgency || '').toLowerCase() === 'critical').length;
    const high     = problems.filter(p => Number(p.priority_score || 0) >= 70).length;

    document.getElementById('statPending').textContent  = pending;
    document.getElementById('statCritical').textContent = critical;
    document.getElementById('statHigh').textContent     = high;

    const badge = document.getElementById('pendingCountBadge');
    badge.textContent = pending > 0 ? `${pending} pending` : 'None';
    badge.className   = pending > 0 ? 'badge badge-amber' : 'badge badge-green';

    document.getElementById('tabValidationBadge').textContent = pending;
    document.getElementById('tabValidationBadge').className   =
        pending > 0 ? 'badge badge-amber' : 'badge badge-green';
}


function renderProblems(problems) {
    const list = document.getElementById('problemList');
    list.innerHTML = '';

    problems.forEach(p => {
        const urgencyClass = { Critical:'badge-red', High:'badge-amber', Medium:'badge-blue', Low:'badge-green' }[p.urgency] || 'badge-neutral';

        const card = document.createElement('div');
        card.className = 'problem-row-card';
        card.onclick   = () => openReview(p.id);

        card.innerHTML = `
          <div class="problem-row-top">
            <div>
              <div class="problem-row-title">${escapeHTML(p.title || 'Untitled')}</div>
              <div class="problem-row-meta">📍 ${escapeHTML(p.location || '—')} &nbsp;·&nbsp; ${formatDate(p.created_at)}</div>
            </div>
            <span class="badge ${urgencyClass}">${escapeHTML(p.urgency || 'Medium')}</span>
          </div>

          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:14px;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${escapeHTML(p.description || '—')}
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
              <div class="cell-label">Priority</div>
              <div class="cell-value" style="color:var(--brand-primary);font-weight:700;">
                ${p.priority_score ?? '—'}<span style="font-size:11px;color:var(--text-muted);font-weight:400;">/100</span>
              </div>
            </div>
          </div>

          <div class="problem-row-actions">
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openReview(${p.id})">🔍 Full Review</button>
            <button class="btn btn-success btn-sm"   onclick="event.stopPropagation();quickValidate(${p.id})">✓ Validate</button>
            <button class="btn btn-danger btn-sm"    onclick="event.stopPropagation();quickReject(${p.id})">✕ Reject</button>
          </div>
        `;

        list.appendChild(card);
    });
}


// ── Open review modal ─────────────────────────────────────────────────────────
async function openReview(problemId) {
    selectedProblemId = problemId;
    const modal   = document.getElementById('reviewModal');
    const content = document.getElementById('reviewContent');
    modal.style.display = 'flex';

    content.innerHTML = `<div class="loading-state" style="padding:30px 0;"><div class="spinner"></div><span>Loading…</span></div>`;

    try {
        const p = await getProblem(problemId);
        const problem = p.problem || p;

        const urgencyClass = { Critical:'badge-red', High:'badge-amber', Medium:'badge-blue', Low:'badge-green' }[problem.urgency] || 'badge-neutral';

        content.innerHTML = `
          <div style="margin-bottom:18px;">
            <h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">${escapeHTML(problem.title || '—')}</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span class="badge ${urgencyClass}">${escapeHTML(problem.urgency || 'Medium')}</span>
              <span class="badge badge-neutral">📍 ${escapeHTML(problem.location || '—')}</span>
            </div>
          </div>

          <div style="margin-bottom:18px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Description</div>
            <div style="background:var(--bg-subtle);border-left:3px solid var(--brand-primary);padding:14px 16px;border-radius:0 var(--radius-md) var(--radius-md) 0;font-size:14px;line-height:1.7;color:var(--text-secondary);">
              ${escapeHTML(problem.description || '—')}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;">
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Priority</div>
              <div style="font-size:22px;font-weight:800;color:var(--brand-primary);">${problem.priority_score ?? '—'}<span style="font-size:11px;color:var(--text-muted);">/100</span></div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Impact</div>
              <div style="font-size:22px;font-weight:800;">${problem.impact_score ?? '—'}<span style="font-size:11px;color:var(--text-muted);">/10</span></div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Confidence</div>
              <div style="font-size:22px;font-weight:800;">${problem.department_confidence ?? '—'}<span style="font-size:11px;color:var(--text-muted);">%</span></div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:12px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">Category</div>
              <div style="font-size:13px;font-weight:600;">${escapeHTML(problem.category || problem.detected_category || '—')}</div>
            </div>
            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:12px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">Department</div>
              <div style="font-size:13px;font-weight:600;">${escapeHTML(problem.department || problem.detected_department || '—')}</div>
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Required Expertise</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${renderTagChips(problem.required_expertise)}</div>
          </div>

          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Suggested Solution Areas</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${renderTagChips(problem.suggested_solution_areas)}</div>
          </div>
        `;

    } catch (err) {
        content.innerHTML = `<div class="error-state">${escapeHTML(err.message || 'Failed to load.')}</div>`;
    }
}


async function quickValidate(problemId) {
    if (!confirm('Validate this problem?')) return;
    try {
        await validateProblemAPI(problemId);
        showToast('✓ Problem validated', 'success');
        await loadBoth();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
}

async function quickReject(problemId) {
    if (!confirm('Reject this problem?')) return;
    try {
        await rejectProblemAPI(problemId);
        showToast('Problem rejected', '');
        await loadValidationTab();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
}

async function validateSelected() {
    if (!selectedProblemId) return;
    const btn = document.getElementById('modalValidateBtn');
    btn.disabled = true; btn.textContent = 'Validating…';
    try {
        await validateProblemAPI(selectedProblemId);
        closeReviewModal();
        showToast('✓ Problem validated', 'success');
        await loadBoth();
    } catch (err) {
        showToast(err.message || 'Failed', 'error');
        btn.disabled = false; btn.textContent = '✓ Validate Problem';
    }
}

async function rejectSelected() {
    if (!selectedProblemId) return;
    if (!confirm('Reject this problem?')) return;
    const btn = document.getElementById('modalRejectBtn');
    btn.disabled = true; btn.textContent = 'Rejecting…';
    try {
        await rejectProblemAPI(selectedProblemId);
        closeReviewModal();
        showToast('Problem rejected', '');
        await loadValidationTab();
    } catch (err) {
        showToast(err.message || 'Failed', 'error');
        btn.disabled = false; btn.textContent = '✕ Reject Problem';
    }
}

function bindModalEvents() {
    document.getElementById('closeModal').onclick       = closeReviewModal;
    document.getElementById('modalValidateBtn').onclick = validateSelected;
    document.getElementById('modalRejectBtn').onclick   = rejectSelected;
    document.getElementById('reviewModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeReviewModal();
    });
    document.getElementById('confirmModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeConfirmModal();
    });
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    selectedProblemId = null;
}


// ══════════════════════════════════════════════════════════════════
// TAB 2 — PARTNER RESPONSES / AWAITING CONFIRMATION
// ══════════════════════════════════════════════════════════════════

async function loadConfirmationTab() {
    const loadingEl = document.getElementById('confirmationLoading');
    const errorEl   = document.getElementById('confirmationError');
    const listEl    = document.getElementById('confirmationList');
    const emptyEl   = document.getElementById('confirmationEmpty');

    loadingEl.style.display = 'flex';
    errorEl.style.display   = 'none';
    emptyEl.style.display   = 'none';
    listEl.innerHTML        = '';

    try {
        const data     = await getAwaitingConfirmation();
        const problems = data.problems || [];

        loadingEl.style.display = 'none';

        // Update sidebar stat
        document.getElementById('statAwaitingConfirm').textContent = problems.length;

        // Update tab badge
        const badge = document.getElementById('tabConfirmationBadge');
        badge.textContent = problems.length;
        badge.className   = problems.length > 0 ? 'badge badge-brand' : 'badge badge-neutral';

        // Update sidebar confirmation badge
        const confirmBadge = document.getElementById('confirmationCountBadge');
        if (confirmBadge) {
            confirmBadge.textContent = problems.length > 0 ? `${problems.length} awaiting` : 'None';
            confirmBadge.className   = problems.length > 0 ? 'badge badge-brand' : 'badge badge-green';
        }

        if (problems.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }

        problems.forEach(p => renderConfirmationCard(p, listEl));

    } catch (err) {
        console.error(err);
        loadingEl.style.display = 'none';
        errorEl.style.display   = 'block';
        errorEl.textContent     = err.message || 'Failed to load partner responses.';
    }
}


function renderConfirmationCard(p, container) {
    const card = document.createElement('div');
    card.className = 'confirmation-card';

    const urgencyClass = { Critical:'badge-red', High:'badge-amber', Medium:'badge-blue', Low:'badge-green' }[p.urgency] || 'badge-neutral';

    const uniHtml = p.university
        ? `<span class="partner-chip uni">🎓 ${escapeHTML(p.university.name)} &nbsp;${p.university.match_score ? Math.round(p.university.match_score) + '% match' : ''}</span>`
        : '<span class="partner-chip pending">🎓 No university assigned yet</span>';

    const indHtml = p.industry
        ? `<span class="partner-chip ind">🏭 ${escapeHTML(p.industry.name)} &nbsp;${p.industry.match_score ? Math.round(p.industry.match_score) + '% match' : ''}</span>`
        : `<span class="partner-chip pending">🏭 ${p.pending_industry_responses > 0 ? p.pending_industry_responses + ' pending response(s)' : 'No industry partner yet'}</span>`;

    card.innerHTML = `
      <!-- Problem header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
        <div style="flex:1;">
          <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${escapeHTML(p.title)}</div>
          <div style="font-size:13px;color:var(--text-muted);">
            📍 ${escapeHTML(p.location || '—')} &nbsp;·&nbsp;
            ${escapeHTML(p.category || '—')} &nbsp;·&nbsp;
            <span style="color:var(--brand-primary);font-weight:600;">Priority: ${p.priority_score ?? '—'}/100</span>
          </div>
        </div>
        <span class="badge ${urgencyClass}">${escapeHTML(p.urgency || 'Medium')}</span>
      </div>

      <!-- Partner status -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        ${uniHtml}
        ${indHtml}
      </div>

      <!-- Info note -->
      <div style="background:var(--bg-subtle);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:16px;font-size:12px;color:var(--text-secondary);">
        ${p.industry
            ? '✅ Both university and industry partners have accepted. Ready for collaboration confirmation.'
            : '⚠️ University has accepted. Industry partner optional — you can confirm collaboration now or wait for industry response.'
        }
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button
          class="btn btn-primary"
          onclick="openConfirmModal(${JSON.stringify(p).split('"').join('&quot;')})"
          style="flex:1;justify-content:center;min-width:180px;"
        >
          🚀 Confirm Collaboration
        </button>
        <button
          class="btn btn-secondary btn-sm"
          onclick="window.open('matching.html?id=${p.problem_id}','_blank')"
        >
          View Matching →
        </button>
      </div>
    `;

    container.appendChild(card);
}


// ── Confirmation modal ────────────────────────────────────────────────────────
function openConfirmModal(problemData) {
    // problemData can be a string (from inline onclick) or an object
    const p = typeof problemData === 'string' ? JSON.parse(problemData.replace(/&quot;/g, '"')) : problemData;
    selectedConfirmProblem = p;

    const modal   = document.getElementById('confirmModal');
    const content = document.getElementById('confirmModalContent');
    modal.style.display = 'flex';

    const uniName = p.university?.name || 'Not assigned';
    const indName = p.industry?.name   || 'Not yet assigned';

    content.innerHTML = `
      <div style="margin-bottom:20px;padding:16px;background:var(--brand-light);border-radius:var(--radius-md);border:1px solid rgba(91,94,244,0.2);">
        <div style="font-size:13px;font-weight:700;color:var(--brand-primary);margin-bottom:6px;">You are confirming:</div>
        <div style="font-size:15px;font-weight:800;">${escapeHTML(p.title)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
        <div style="background:var(--bg-subtle);border-radius:var(--radius-md);padding:14px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;">🎓</span>
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">University Partner</div>
            <div style="font-size:14px;font-weight:700;">${escapeHTML(uniName)}</div>
          </div>
        </div>
        <div style="background:var(--bg-subtle);border-radius:var(--radius-md);padding:14px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;">🏭</span>
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Industry Partner</div>
            <div style="font-size:14px;font-weight:700;">${escapeHTML(indName)}</div>
          </div>
        </div>
      </div>

      <div style="background:var(--amber-bg);border:1px solid var(--amber);border-radius:var(--radius-md);padding:12px 14px;font-size:13px;color:var(--amber);">
        <strong>This action will:</strong>
        <ul style="margin:6px 0 0;padding-left:16px;line-height:1.8;">
          <li>Mark the problem as <strong>Collaboration Confirmed</strong></li>
          <li>Create the <strong>Project Workspace</strong></li>
          <li>Notify all parties (citizen, university, industry)</li>
        </ul>
      </div>
    `;

    document.getElementById('confirmBtn').onclick = () => doConfirm(p.problem_id);
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    selectedConfirmProblem = null;
}

async function doConfirm(problemId) {
    const btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Confirming…';

    try {
        const result = await confirmCollaboration(problemId);

        closeConfirmModal();
        showToast('🚀 Collaboration confirmed! Project workspace created.', 'success');

        // Reload both tabs
        await loadBoth();

        // Optionally redirect to project
        if (result.project_id) {
            setTimeout(() => {
                if (confirm('Project workspace created! Open it now?')) {
                    window.location.href = `project.html?id=${result.project_id}`;
                }
            }, 800);
        }

    } catch (err) {
        showToast(err.message || 'Confirmation failed', 'error');
        btn.disabled = false;
        btn.textContent = '🚀 Confirm & Activate Project';
    }
}


// ── Shared helpers ────────────────────────────────────────────────────────────
function renderTagChips(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '<span class="tag-chip">Not available</span>';
    }
    return items.map(i => `<span class="tag-chip">${escapeHTML(i)}</span>`).join('');
}

function showToast(msg, type) {
    const t = document.createElement('div');
    t.className   = 'toast' + (type ? ' toast-' + type : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

function formatDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
    catch { return '—'; }
}

function escapeHTML(val) {
    const d = document.createElement('div');
    d.textContent = String(val ?? '');
    return d.innerHTML;
}
