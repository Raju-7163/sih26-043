/*
 * project.js — Project Workspace
 *
 * Accepts either:
 *   project.html?id=<project_id>       ← from matching.js after createProject
 *   project.html?problem_id=<id>       ← fallback if project creation failed
 *
 * Calls GET /api/problems/projects/{project_id}
 * which returns the full workspace snapshot:
 *   { project, problem, university, industry, team, milestones, proposal }
 */

const PROJECT_LIFECYCLE = [
  { key: 'Submitted',            label: 'Submitted' },
  { key: 'Validated',            label: 'Validated' },
  { key: 'University Assigned',  label: 'University Assigned' },
  { key: 'Project Created',      label: 'Project Created' },
  { key: 'Team Formed',          label: 'Team Formed' },
  { key: 'Proposal',             label: 'Proposal' },
  { key: 'Prototype',            label: 'Prototype' },
  { key: 'Testing',              label: 'Testing' },
  { key: 'Pilot',                label: 'Pilot' },
  { key: 'Deployed',             label: 'Deployed' },
  { key: 'Resolved',             label: 'Resolved' },
];

// Map problem.status → lifecycle index for progress calculation
const LIFECYCLE_INDEX = Object.fromEntries(
  PROJECT_LIFECYCLE.map((s, i) => [s.key, i])
);

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const params     = new URLSearchParams(window.location.search);
  const projectId  = params.get('id');
  const problemId  = params.get('problem_id');

  if (projectId) {
    await loadByProjectId(projectId);
  } else if (problemId) {
    await loadByProblemId(problemId);
  } else {
    showError('No project or problem ID found in the URL. Please go back to the matching page.');
  }
}


// ── Load by project ID ────────────────────────────────────────────────────────
async function loadByProjectId(projectId) {
  try {
    const data = await getProject(projectId);
    render(data);
  } catch (err) {
    console.error('Project load error:', err);
    showError(err.message || 'Failed to load project. The backend may be unavailable.');
  }
}


// ── Load by problem ID (fallback) ─────────────────────────────────────────────
async function loadByProblemId(problemId) {
  try {
    // Try to create / fetch the project for this problem
    const created = await createProject(problemId);
    const projectId = created?.project?.id;

    if (projectId) {
      // Replace URL so refresh works correctly
      window.history.replaceState({}, '', `project.html?id=${projectId}`);
      await loadByProjectId(projectId);
    } else {
      showError('Could not find or create a project for this problem. Make sure a university has been assigned.');
    }
  } catch (err) {
    console.error('Project init error:', err);
    showError(err.message || 'Could not load project workspace.');
  }
}


// ── Main render ───────────────────────────────────────────────────────────────
function render(data) {
  const { project, problem, university, industry, team, milestones, proposal } = data;

  // ── Hero banner ────────────────────────────────────────────────────────────
  setText('projectTitle',       project.title || 'Untitled Project');
  setText('projectDescription', project.description || '');

  const heroMeta = document.getElementById('projectHeroMeta');
  heroMeta.innerHTML = `
    <div class="ph-badge">📊 ${escapeHTML(project.status || '—')}</div>
    ${university ? `<div class="ph-badge">🎓 ${escapeHTML(university.name)}</div>` : ''}
    ${industry   ? `<div class="ph-badge">🏭 ${escapeHTML(industry.name)}</div>`   : ''}
    ${problem    ? `<div class="ph-badge">📍 ${escapeHTML(problem.location || '—')}</div>` : ''}
  `;

  // Back link
  if (problem) {
    document.getElementById('backToMatchingLink').href = `matching.html?id=${problem.id}`;
    document.getElementById('linkProblem').href        = `problem.html?id=${problem.id}`;
    document.getElementById('linkMatching').href       = `matching.html?id=${problem.id}`;
  }

  // ── Problem card ───────────────────────────────────────────────────────────
  if (problem) {
    setText('problemDescription', problem.description || 'No description.');
    setText('problemLocation',    problem.location    || '—');
    setText('problemCategory',    problem.category    || '—');
    setText('problemDepartment',  problem.department  || '—');
    setText('problemPriority',    problem.priority_score ? `${problem.priority_score} / 100` : '—');

    const urgencyClasses = { Critical: 'badge-red', High: 'badge-amber', Medium: 'badge-blue', Low: 'badge-green' };
    const urgencyBadge = document.getElementById('problemUrgencyBadge');
    urgencyBadge.textContent = problem.urgency || '—';
    urgencyBadge.className   = 'badge ' + (urgencyClasses[problem.urgency] || 'badge-neutral');

    setText('sideValidation',   problem.validation_status || '—');
    setText('sideProblemStatus', problem.status           || '—');
  }

  // ── Project details ────────────────────────────────────────────────────────
  const statusClasses = {
    Proposal:   'badge-purple', 'Team Formed': 'badge-purple',
    Prototype:  'badge-amber',  Testing:       'badge-amber',
    Pilot:      'badge-amber',  Deployed:      'badge-green',
    Resolved:   'badge-green',
  };
  const statusBadge = document.getElementById('projectStatusBadge');
  statusBadge.textContent = project.status || '—';
  statusBadge.className   = 'badge ' + (statusClasses[project.status] || 'badge-neutral');

  setText('projectObjectives', project.objectives       || 'To be defined.');
  setText('projectExpected',   project.expected_solution || 'To be defined.');
  setText('sideProjectStatus', project.status            || '—');

  // ── Progress sidebar ───────────────────────────────────────────────────────
  renderProgress(problem, project);

  // ── University card ────────────────────────────────────────────────────────
  if (university) {
    setText('universityName', university.name);
    setText('universityMeta', `${university.institution_type || 'University'} · ${university.location || '—'}`);
  } else {
    setText('universityName', 'Not assigned');
    setText('universityMeta', '—');
  }

  // ── Industry card ──────────────────────────────────────────────────────────
  if (industry) {
    document.getElementById('industryCard').style.display = 'block';
    setText('industryName', industry.name);
    setText('industryMeta', `${industry.organization_type || 'Industry'} · ${industry.location || '—'}`);
  }

  // ── Team members ───────────────────────────────────────────────────────────
  renderTeam(team || []);

  // ── Milestones ─────────────────────────────────────────────────────────────
  renderMilestones(milestones || []);

  // ── Proposal ───────────────────────────────────────────────────────────────
  if (proposal) renderProposal(proposal);

  // Show content
  document.getElementById('loadingState').style.display  = 'none';
  document.getElementById('projectContent').style.display = 'block';
}


// ── Progress sidebar ──────────────────────────────────────────────────────────
function renderProgress(problem, project) {
  const currentStatus = problem?.status || project?.status || 'Submitted';
  const currentIdx    = LIFECYCLE_INDEX[currentStatus] ?? 0;

  // Overall percentage based on how far through the lifecycle
  const pct = Math.round((currentIdx / (PROJECT_LIFECYCLE.length - 1)) * 100);

  document.getElementById('progressPct').textContent  = `${pct}%`;
  document.getElementById('progressBar').style.width  = `${pct}%`;

  const stepsContainer = document.getElementById('progressSteps');
  stepsContainer.innerHTML = '';

  PROJECT_LIFECYCLE.forEach((step, idx) => {
    const isDone   = idx < currentIdx;
    const isActive = idx === currentIdx;
    const state    = isDone ? 'done' : isActive ? 'active' : 'pending';

    const row = document.createElement('div');
    row.className = 'progress-step-row';
    row.innerHTML = `
      <div class="ps-icon ${state}">
        ${isDone ? '✓' : isActive ? '●' : '○'}
      </div>
      <span class="ps-label ${state}">${escapeHTML(step.label)}</span>
    `;
    stepsContainer.appendChild(row);
  });
}


// ── Team members ─────────────────────────────────────────────────────────────
function renderTeam(members) {
  const list  = document.getElementById('memberList');
  const empty = document.getElementById('noMembers');
  const count = document.getElementById('memberCount');

  count.textContent = members.length;

  if (members.length === 0) {
    list.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }

  list.innerHTML = '';

  const typeColors = {
    Faculty:         'var(--brand-primary)',
    Student:         'var(--blue)',
    Researcher:      'var(--purple)',
    Mentor:          'var(--green)',
    'Industry Expert': 'var(--amber)',
  };

  members.forEach(m => {
    const initials = (m.name || '?')
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const color = typeColors[m.member_type] || 'var(--brand-primary)';

    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="member-avatar" style="background:${color};">${escapeHTML(initials)}</div>
      <div class="member-info" style="flex:1;">
        <div class="member-name">${escapeHTML(m.name || 'Unknown')}</div>
        <div class="member-role">${escapeHTML(m.role || m.member_type || '—')}${m.department ? ' · ' + escapeHTML(m.department) : ''}</div>
      </div>
      <span class="badge badge-neutral" style="font-size:11px;">${escapeHTML(m.member_type || '—')}</span>
    `;
    list.appendChild(row);
  });
}


// ── Milestones ────────────────────────────────────────────────────────────────
function renderMilestones(milestones) {
  const list  = document.getElementById('milestoneList');
  const empty = document.getElementById('noMilestones');
  const count = document.getElementById('milestoneCount');

  const done  = milestones.filter(m => m.status === 'Completed').length;
  count.textContent = `${done}/${milestones.length}`;

  if (milestones.length === 0) {
    list.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }

  list.innerHTML = '';

  milestones.forEach(m => {
    const statusBadgeClass = {
      Completed:   'badge-green',
      'In Progress': 'badge-amber',
      Pending:     'badge-neutral',
    }[m.status] || 'badge-neutral';

    const progress = m.progress || 0;

    const item = document.createElement('div');
    item.className = 'milestone-item';
    item.innerHTML = `
      <div class="milestone-top">
        <span class="milestone-title">${escapeHTML(m.title || 'Untitled Milestone')}</span>
        <span class="badge ${statusBadgeClass}">${escapeHTML(m.status || 'Pending')}</span>
      </div>
      ${m.description
        ? `<div class="milestone-body">${escapeHTML(m.description)}</div>`
        : ''}
      <div class="milestone-progress">
        <div class="milestone-progress-bar">
          <div class="milestone-progress-fill" style="width:${progress}%;"></div>
        </div>
        <span style="flex-shrink:0;">${progress}%</span>
      </div>
    `;
    list.appendChild(item);
  });
}


// ── Proposal ──────────────────────────────────────────────────────────────────
function renderProposal(proposal) {
  const card   = document.getElementById('proposalCard');
  const body   = document.getElementById('proposalBody');
  const badge  = document.getElementById('proposalStatusBadge');

  card.style.display = 'block';

  const statusClasses = {
    Draft:             'badge-neutral',
    Submitted:         'badge-blue',
    'Under Review':    'badge-amber',
    Approved:          'badge-green',
    Rejected:          'badge-red',
    'Changes Requested': 'badge-amber',
  };

  badge.textContent = proposal.status || 'Draft';
  badge.className   = 'badge ' + (statusClasses[proposal.status] || 'badge-neutral');

  body.innerHTML = `
    <div class="info-grid info-grid-1" style="gap:14px;">
      <div class="info-item">
        <div class="info-label">Proposal Title</div>
        <div class="info-value">${escapeHTML(proposal.title || '—')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">${escapeHTML(proposal.status || 'Draft')}</div>
      </div>
      ${proposal.review_comments ? `
      <div class="info-item" style="border-left:3px solid var(--amber); border-radius:0 var(--radius-md) var(--radius-md) 0;">
        <div class="info-label" style="color:var(--amber);">Reviewer Comments</div>
        <div class="info-value" style="font-weight:400; line-height:1.7;">${escapeHTML(proposal.review_comments)}</div>
      </div>
      ` : ''}
    </div>
  `;
}


// ── Error state ───────────────────────────────────────────────────────────────
function showError(msg) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display   = 'block';
  document.getElementById('errorMsg').textContent        = msg;
}


// ── Utilities ─────────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val ?? '');
}

function escapeHTML(val) {
  const d = document.createElement('div');
  d.textContent = String(val ?? '');
  return d.innerHTML;
}
