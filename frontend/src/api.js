const BASE = '/api';
const SESSION_KEY = 'epiwork_session';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function readSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function currentUser() {
  return readSession()?.user ?? null;
}

function errorMessage(text) {
  try {
    const body = JSON.parse(text);
    return typeof body.error === 'string' ? body.error : body.error?.message;
  } catch {
    return text;
  }
}

function requestBody(options) {
  if (options.rawBody !== undefined) return options.rawBody;
  return options.body === undefined ? undefined : JSON.stringify(options.body);
}

async function request(path, options = {}) {
  const token = readSession()?.token;
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': options.contentType ?? 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: requestBody(options),
  });
  // A 401 while holding a token means the session is gone (logout elsewhere,
  // password reset, account deleted, reseeded database): start over at login.
  // /auth/* 401s are wrong credentials and must not wipe another tab's session.
  if (res.status === 401 && token && !path.startsWith('/auth/')) {
    saveSession(null);
    globalThis.location.assign('/login');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(errorMessage(text) || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function startSession(path, body) {
  const session = await request(path, { method: 'POST', body });
  saveSession(session);
  return session.user;
}

export const api = {
  lookupEmail: (email) => request('/auth/lookup', { method: 'POST', body: { email } }),
  login: (email, password) => startSession('/auth/login', { email, password }),
  signup: (email, password) => startSession('/auth/signup', { email, password }),
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST', body: {} });
    } catch {
      // The local session is cleared either way; a stale server session is harmless.
    }
    saveSession(null);
  },
  updateMe: async (data) => {
    const user = await request('/me', { method: 'PATCH', body: data });
    saveSession({ ...readSession(), user });
    return user;
  },
  updateAppearance: async (accentColor) => {
    const user = await request('/me/appearance', { method: 'PATCH', body: { accentColor } });
    saveSession({ ...readSession(), user });
    return user;
  },
  changePassword: (currentPassword, newPassword) =>
    request('/me/password', { method: 'POST', body: { currentPassword, newPassword } }),
  listAccounts: () => request('/accounts'),
  createAdmin: (data) => request('/accounts', { method: 'POST', body: data }),
  resetPassword: (id, password) => request(`/accounts/${id}/password`, { method: 'POST', body: { password } }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  listWorkshops: () => request('/workshops'),
  createWorkshop: (data) => request('/workshops', { method: 'POST', body: data }),
  updateWorkshop: (id, data) => request(`/workshops/${id}`, { method: 'PATCH', body: data }),
  deleteWorkshop: (id) => request(`/workshops/${id}`, { method: 'DELETE' }),
  updateStep: (id, data) => request(`/steps/${id}`, { method: 'PATCH', body: data }),
  deleteStep: (id) => request(`/steps/${id}`, { method: 'DELETE' }),
  getWorkshop: (id) => request(`/workshops/${id}`),
  createSection: (workshopId, title) => request(`/workshops/${workshopId}/sections`, { method: 'POST', body: { title } }),
  updateSection: (id, data) => request(`/sections/${id}`, { method: 'PATCH', body: data }),
  deleteSection: (id) => request(`/sections/${id}`, { method: 'DELETE' }),
  createStepInSection: (sectionId) => request(`/sections/${sectionId}/steps`, { method: 'POST', body: {} }),
  workshopDocs: (workshopId) => request(`/workshops/${workshopId}/docs`),
  createDocPage: (workshopId, data) => request(`/workshops/${workshopId}/docs`, { method: 'POST', body: data }),
  updateDocPage: (id, data) => request(`/docs/${id}`, { method: 'PATCH', body: data }),
  deleteDocPage: (id) => request(`/docs/${id}`, { method: 'DELETE' }),
  unlockSolution: (stepId, studentId) =>
    request(`/steps/${stepId}/unlock-solution`, { method: 'POST', body: { studentId } }),
  unlockSolutionForAll: (stepId) => request(`/steps/${stepId}/unlock-solution-all`, { method: 'POST', body: {} }),
  resolveQcm: (stepId, studentId) => request(`/steps/${stepId}/resolve-qcm`, { method: 'POST', body: { studentId } }),
  uploadImage: (file) => {
    if (file.size > MAX_UPLOAD_BYTES) return Promise.reject(new Error('Images must be 5 MB or smaller.'));
    return request('/uploads', { method: 'POST', rawBody: file, contentType: file.type });
  },
  myWorkshopProgress: (workshopId) => request(`/me/workshops/${workshopId}`),
  myWorkshops: () => request('/me/workshops'),
  myWorkshopRecap: (workshopId) => request(`/me/workshops/${workshopId}/recap`),
  myFeedback: (workshopId) => request(`/me/workshops/${workshopId}/feedback`),
  sendFeedback: (workshopId, data) => request(`/me/workshops/${workshopId}/feedback`, { method: 'POST', body: data }),
  submitStep: (stepId, answer) => request(`/steps/${stepId}/submit`, { method: 'POST', body: { answer } }),
  requestHelp: (stepId) => request(`/steps/${stepId}/help`, { method: 'POST', body: {} }),
  resolveHelp: (stepId, studentId) => request(`/steps/${stepId}/resolve-help`, { method: 'POST', body: { studentId } }),
  unlockStep: (stepId, studentId) => request(`/steps/${stepId}/unlock`, { method: 'POST', body: { studentId } }),
  workshopProgress: (workshopId) => request(`/workshops/${workshopId}/progress`),
  adminFeed: () => request('/admin/feed'),
  session: () => request('/session'),
  sessionProgress: () => request('/session/progress'),
  sessionEvents: () => request('/session/events'),
  listRuns: () => request('/runs'),
  getRun: (id) => request(`/runs/${id}`),
  launchWorkshop: (id) => request(`/workshops/${id}/launch`, { method: 'POST', body: {} }),
  endWorkshop: (id) => request(`/workshops/${id}/end`, { method: 'POST', body: {} }),
  checkJoinCode: (code) => request(`/join/${encodeURIComponent(code)}`),
  join: (code) => request('/join', { method: 'POST', body: { code } }),
};
