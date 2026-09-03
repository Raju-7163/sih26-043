/**
 * Shared role-dashboard loader.
 * Each dashboard page sets document.body.dataset.role.
 */

const ROLE_NAV = {
  citizen: [
    { href: 'dashboard-citizen.html', label: 'Overview', id: 'overview' },
    { href: 'submit.html', label: 'Submit a Problem', id: 'submit' },
  ],
  government: [
    { href: 'dashboard-government.html', label: 'Overview', id: 'overview' },
    { href: 'government.html', label: 'Pending Validation', id: 'pending' },
  ],
  university: [
    { href: 'dashboard-university.html', label: 'Overview', id: 'overview' },
  ],
  industry: [
    { href: 'dashboard-industry.html', label: 'Overview', id: 'overview' },
  ],
};

const ROLE_COPY = {
  citizen: {
    title: 'Citizen Workspace',
    welcome: 'Track the journey of the societal problems you report — from AI analysis to government validation, collaboration and impact.',
  },
  government: {
    title: 'Government Workspace',
    welcome: 'Validate citizen-reported problems, oversee partner matching, and track collaborations through to deployment.',
  },
  university: {
    title: 'University Workspace',
    welcome: 'Review matched innovation requests, accept opportunities that fit your expertise, and participate in collaborative projects.',
  },
  industry: {
    title: 'Industry Workspace',
    welcome: 'Review implementation and CSR opportunities, accept requests that match your capabilities, and join project teams.',
  },
};


function statusBadge(status) {
  const value = String(status || 'Unknown');
  const map = {
    Pending: 'badge-amber',
    Submitted: 'badge-blue',
    Validated: 'badge-green',
    Rejected: 'badge-red',
    Accepted: 'badge-green',
    PartnerMatching: 'badge-purple',
  };
  const cls = map[value] || 'badge-blue';
  return `<span class="badge ${cls}">${escapeHtml(value)}</span>`;
}


function escapeHtml(value) {
  const el = document.createElement('div');
  el.textContent = String(value ?? '');
  return el.innerHTML;
}


function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}


function showState(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}


function renderShell(role, user) {
  const copy = ROLE_COPY[role];
  const nav = ROLE_NAV[role] || [];
  const org = user.organization_name ? ` · ${escapeHtml(user.organization_name)}` : '';

  document.getElementById('dashBrand').innerHTML = 'Solve<span>X</span>';
  document.getElementById('dashRoleChip').textContent = `${copy.title}${org}`;
  document.getElementById('dashPageTitle').textContent = copy.title;
  document.getElementById('dashWelcomeTitle').textContent = `Welcome, ${user.name}`;
  document.getElementById('dashWelcomeBody').textContent = copy.welcome;

  document.getElementById('dashNav').innerHTML = nav.map((item) => {
    const current = window.location.pathname.endsWith(item.href);
    return `<a href="${item.href}" class="${current ? 'active' : ''}">${item.label}</a>`;
  }).join('');

  document.getElementById('dashUserName').textContent = user.name;
}


function renderNotifications(items) {
  const wrap = document.getElementById('dashNotifications');
  if (!wrap) return;
  if (!items.length) {
    wrap.innerHTML = `<div class="empty-state" style="padding:28px 16px;">
      <p style="font-weight:600;">No notifications yet.</p>
      <p style="font-size:13px;color:var(--text-muted);margin-top:4px;">Updates about requests, validation and projects will appear here.</p>
    </div>`;
    return;
  }
  wrap.innerHTML = items.slice(0, 6).map((item) => `
    <div class="dash-row">
      <div>
        <div class="dash-row-title">${escapeHtml(item.title)}</div>
        <div class="dash-row-meta">${escapeHtml(item.message || '')}</div>
      </div>
      ${item.is_read ? '<span class="badge">Read</span>' : '<span class="badge badge-brand">New</span>'}
    </div>
  `).join('');
}


function renderProblemRows(problems, emptyMessage) {
  const wrap = document.getElementById('dashPrimaryList');
  if (!wrap) return;
  if (!problems.length) {
    wrap.innerHTML = `<div class="empty-state" style="padding:36px 16px;">
      <p style="font-weight:600;">${escapeHtml(emptyMessage)}</p>
    </div>`;
    return;
  }
  wrap.innerHTML = problems.slice(0, 8).map((p) => {
    const title = p.title || 'Untitled problem';
    const location = p.location || 'Location not specified';
    const status = p.validation_status || p.status || 'Submitted';
    return `<div class="dash-row">
      <div>
        <div class="dash-row-title">${escapeHtml(title)}</div>
        <div class="dash-row-meta">${escapeHtml(location)} · ${escapeHtml(p.category || 'Uncategorised')}</div>
      </div>
      ${statusBadge(status)}
    </div>`;
  }).join('');
}


async function loadCitizenDashboard() {
  const data = await getMyProblems();
  const problems = data.problems || [];
  const pending = problems.filter((p) => p.validation_status === 'Pending').length;
  const validated = problems.filter((p) => p.validation_status === 'Validated').length;
  const projects = problems.filter((p) => p.project_id).length;

  setText('statOne', problems.length);
  setText('statTwo', pending);
  setText('statThree', validated);
  setText('statFour', projects);
  renderProblemRows(problems, 'You have not submitted a problem yet.');
}


async function loadGovernmentDashboard() {
  const [stats, pending] = await Promise.all([
    getGovernmentDashboardStats(),
    getPendingProblems(),
  ]);
  setText('statOne', stats.problems?.pending ?? 0);
  setText('statTwo', stats.problems?.validated ?? 0);
  setText('statThree', stats.projects?.active ?? 0);
  setText('statFour', stats.partnerships?.active ?? 0);
  renderProblemRows(pending.problems || [], 'No problems awaiting validation.');
}


async function loadUniversityDashboard(user) {
  if (!user.org_id) {
    renderProblemRows([], 'This university account is not linked to an organisation record.');
    setText('statOne', '—');
    setText('statTwo', '—');
    setText('statThree', '—');
    setText('statFour', '—');
    return;
  }
  const [dash, inbox] = await Promise.all([
    getUniversityDashboard(user.org_id),
    getUniversityInbox().catch(() => ({ problems: [] })),
  ]);
  setText('statOne', dash.statistics?.assigned_problems ?? 0);
  setText('statTwo', (inbox.problems || []).length);
  setText('statThree', dash.statistics?.projects ?? 0);
  setText('statFour', dash.statistics?.team_members ?? 0);
  const rows = (inbox.problems || []).map((p) => ({
    title: p.title,
    location: p.location,
    category: p.category,
    validation_status: p.status || 'Request',
  }));
  renderProblemRows(rows, 'No university requests yet.');
}


async function loadIndustryDashboard(user) {
  if (!user.org_id) {
    renderProblemRows([], 'This industry account is not linked to an organisation record.');
    setText('statOne', '—');
    setText('statTwo', '—');
    setText('statThree', '—');
    setText('statFour', '—');
    return;
  }
  const [dash, inbox] = await Promise.all([
    getIndustryDashboard(user.org_id),
    getIndustryInbox().catch(() => ({ problems: [] })),
  ]);
  setText('statOne', dash.statistics?.matched_problems ?? 0);
  setText('statTwo', (inbox.problems || []).length);
  setText('statThree', dash.statistics?.partnerships ?? 0);
  setText('statFour', dash.statistics?.projects ?? 0);
  const rows = (inbox.problems || []).map((p) => ({
    title: p.title,
    location: p.location,
    category: p.category,
    validation_status: p.status || 'Opportunity',
  }));
  renderProblemRows(rows, 'No industry opportunities yet.');
}


document.addEventListener('DOMContentLoaded', async () => {
  const role = document.body.dataset.role;
  if (!requireAuth(role)) return;

  const user = getCurrentUser();
  renderShell(role, user);

  document.getElementById('dashMenuBtn')?.addEventListener('click', () => {
    document.querySelector('.dash-app')?.classList.toggle('sidebar-open');
  });

  showState('dashLoading', true);
  showState('dashError', false);

  try {
    if (role === 'citizen') await loadCitizenDashboard();
    if (role === 'government') await loadGovernmentDashboard();
    if (role === 'university') await loadUniversityDashboard(user);
    if (role === 'industry') await loadIndustryDashboard(user);

    const notifications = await getMyNotifications().catch(() => []);
    renderNotifications(Array.isArray(notifications) ? notifications : []);
    showState('dashLoading', false);
  } catch (err) {
    showState('dashLoading', false);
    showState('dashError', true);
    setText('dashError', err.message || 'Failed to load dashboard.');
  }
});
