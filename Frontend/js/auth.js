/**
 * auth.js — Client-side authentication helpers
 *
 * Token is stored in localStorage under "sx_token".
 * User profile is stored under "sx_user" (JSON string).
 *
 * Role → Dashboard mapping:
 *   citizen     → dashboard-citizen.html
 *   government  → dashboard-government.html
 *   university  → dashboard-university.html
 *   industry    → dashboard-industry.html
 */

const AUTH_TOKEN_KEY = 'sx_token';
const AUTH_USER_KEY  = 'sx_user';

const ROLE_DASHBOARDS = {
  citizen:    'dashboard-citizen.html',
  government: 'dashboard-government.html',
  university: 'dashboard-university.html',
  industry:   'dashboard-industry.html',
};


// ── Storage helpers ───────────────────────────────────────────────────────────

function apiErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail.length) {
    const first = data.detail[0];
    if (typeof first === 'string') return first;
    if (first && first.msg) return first.msg;
  }
  return fallback;
}

function saveSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY,  JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || null;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}


// ── Role guard ────────────────────────────────────────────────────────────────
/**
 * Call at the top of any role-restricted page.
 * Redirects to login if not logged in, or to home if wrong role.
 *
 * Usage:
 *   requireAuth('government');  // on government dashboard
 *   requireAuth();              // just needs to be logged in
 */
function requireAuth(expectedRole) {
  const user = getCurrentUser();
  if (!user || !getToken()) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.href)}`;
    return false;
  }
  if (expectedRole && user.role !== expectedRole) {
    // Redirect them to their own dashboard
    const dest = ROLE_DASHBOARDS[user.role] || 'index.html';
    window.location.href = dest;
    return false;
  }
  return true;
}


// ── Redirect after login ──────────────────────────────────────────────────────
function isSafeNextUrl(next) {
  if (!next) return false;
  try {
    const target = new URL(next, window.location.href);
    if (target.origin !== window.location.origin) return false;
    if (!target.protocol.startsWith('http')) return false;
    return true;
  } catch {
    return false;
  }
}

function redirectToDashboard(user) {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  if (isSafeNextUrl(next)) {
    window.location.href = next;
    return;
  }
  const dest = ROLE_DASHBOARDS[user.role] || 'index.html';
  window.location.href = dest;
}


// ── Register ──────────────────────────────────────────────────────────────────
async function register(name, email, password, role, organizationName, orgId) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      name,
      email,
      password,
      role,
      organization_name: organizationName || null,
      org_id:            orgId            || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(apiErrorMessage(data, 'Registration failed. Please check your inputs.'));
  }

  saveSession(data.access_token, data.user);
  return data;
}


// ── Login ─────────────────────────────────────────────────────────────────────
async function login(email, password, role) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(apiErrorMessage(data, 'Login failed. Please check your credentials.'));
  }

  saveSession(data.access_token, data.user);
  return data;
}



// ── Logout ────────────────────────────────────────────────────────────────────
async function logout() {
  const token = getToken();
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  } catch {
    // Client session is still cleared below.
  }
  clearSession();
  window.location.href = 'login.html';
}


// ── Refresh profile from server ───────────────────────────────────────────────
async function refreshMe() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const user = await response.json();
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}


// ── Theme Management ─────────────────────────────────────────────────────────
function getSavedTheme() {
  return localStorage.getItem('sx_theme') || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('sx_theme', theme);
  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  });
}

function toggleTheme() {
  const current = getSavedTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

// Immediately apply theme script to prevent flickering
(function() {
  const saved = localStorage.getItem('sx_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

// ── Render navbar auth state ──────────────────────────────────────────────────
/**
 * Call this from every page's navbar to show the correct
 * "Login" or "UserName + Logout" state + Theme Toggle.
 *
 * Expects the navbar to have:
 *   <div id="navAuthArea"></div>
 */
function renderNavAuth() {
  applyTheme(getSavedTheme());
  const area = document.getElementById('navAuthArea');
  if (!area) return;

  const user = getCurrentUser();
  const themeBtnHtml = `<button class="btn btn-ghost btn-sm theme-toggle-btn" onclick="toggleTheme()" type="button" style="gap:4px;padding:6px 10px;font-size:13px;border:1px solid var(--border-default);">
    ${getSavedTheme() === 'dark' ? '☀️ Light' : '🌙 Dark'}
  </button>`;

  if (user) {
    const roleLabel = {
      citizen:    '👤 Citizen',
      government: '🏛️ Government',
      university: '🎓 University',
      industry:   '🏭 Industry',
    }[user.role] || user.role;

    const dashboardUrl = ROLE_DASHBOARDS[user.role] || 'index.html';

    area.innerHTML = `
      ${themeBtnHtml}
      <a href="${dashboardUrl}" class="btn btn-ghost btn-sm" style="gap:6px;">
        ${roleLabel}
      </a>
      <span style="font-size:13px; font-weight:600; color:var(--text-primary); padding:0 4px;">
        ${escapeHTMLAuth(user.name)}
      </span>
      <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
    `;
  } else {
    area.innerHTML = `
      ${themeBtnHtml}
      <a href="login.html" class="btn btn-ghost btn-sm">Login</a>
      <a href="login.html?mode=register" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
}

// Small XSS helper local to auth.js
function escapeHTMLAuth(val) {
  const d = document.createElement('div');
  d.textContent = String(val ?? '');
  return d.innerHTML;
}


// ── Auto-render on DOMContentLoaded ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', renderNavAuth);

