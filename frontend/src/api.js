const BASE = '/api';

export function currentUser() {
  const raw = localStorage.getItem('epiwork_user');
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('epiwork_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('epiwork_user');
  }
}

function errorMessage(text) {
  try {
    const body = JSON.parse(text);
    return typeof body.error === 'string' ? body.error : body.error?.message;
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const user = currentUser();
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { 'x-user-id': String(user.id) } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(errorMessage(text) || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listUsers: () => request('/users'),
  login: (userId) => request('/login', { method: 'POST', body: { userId } }),
  listWorkshops: () => request('/workshops'),
  createWorkshop: (data) => request('/workshops', { method: 'POST', body: data }),
  updateWorkshop: (id, data) => request(`/workshops/${id}`, { method: 'PATCH', body: data }),
  deleteWorkshop: (id) => request(`/workshops/${id}`, { method: 'DELETE' }),
  createStep: (workshopId, data) => request(`/workshops/${workshopId}/steps`, { method: 'POST', body: data }),
  updateStep: (id, data) => request(`/steps/${id}`, { method: 'PATCH', body: data }),
  deleteStep: (id) => request(`/steps/${id}`, { method: 'DELETE' }),
  myWorkshopProgress: (workshopId) => request(`/me/workshops/${workshopId}`),
  submitStep: (stepId, answer) => request(`/steps/${stepId}/submit`, { method: 'POST', body: { answer } }),
  requestHelp: (stepId) => request(`/steps/${stepId}/help`, { method: 'POST', body: {} }),
  resolveHelp: (stepId, studentId) => request(`/steps/${stepId}/resolve-help`, { method: 'POST', body: { studentId } }),
  unlockStep: (stepId, studentId) => request(`/steps/${stepId}/unlock`, { method: 'POST', body: { studentId } }),
  workshopProgress: (workshopId) => request(`/workshops/${workshopId}/progress`),
  adminFeed: () => request('/admin/feed'),
  session: () => request('/session'),
  sessionProgress: () => request('/session/progress'),
  launchWorkshop: (id) => request(`/workshops/${id}/launch`, { method: 'POST', body: {} }),
  endWorkshop: (id) => request(`/workshops/${id}/end`, { method: 'POST', body: {} }),
  checkJoinCode: (code) => request(`/join/${encodeURIComponent(code)}`),
  join: (code, email) => request('/join', { method: 'POST', body: { code, email } }),
};
