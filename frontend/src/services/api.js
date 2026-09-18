const API_BASE_URL = 'http://localhost:8000';

export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export function clearAuth() {
  try {
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
    sessionStorage.clear();
  } catch (e) {
    console.error('Error clearing auth storage:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
}

export function getStoredToken() {
  const token = localStorage.getItem('civic_token') || '';
  if (!token) return '';
  if (!isTokenValid(token)) {
    clearAuth();
    return '';
  }
  return token;
}

export function setStoredToken(token) {
  if (token && isTokenValid(token)) {
    localStorage.setItem('civic_token', token);
  } else if (!token) {
    localStorage.removeItem('civic_token');
  }
}

export function getStoredUser() {
  const token = getStoredToken();
  if (!token) return null;
  const user = localStorage.getItem('civic_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('civic_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('civic_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const redirectPath = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?sessionExpired=true&redirectTo=${redirectPath}`);
      }
    }
    const errorMsg = data?.detail || `HTTP Error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}


export const api = {
  // Health
  checkHealth: () => request('/'),

  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => request('/api/auth/me'),

  // Complaints Workflow Helpers
  createComplaint: (payload) => request('/api/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  listComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/complaints${query ? `?${query}` : ''}`);
  },
  getComplaint: (id) => request(`/api/complaints/${id}`),
  updateComplaint: (id, payload) => request(`/api/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateStatus: (id, payload) => request(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  assignCrew: (id, payload) => {
    const assigned_team = payload.assigned_team || payload.assigned_to || '';
    const assigned_to = payload.assigned_to || payload.assigned_team || '';
    const assigned_crew_id = payload.assigned_crew_id || 'CREW-101';
    return request(`/api/complaints/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...payload,
        assigned_to,
        assigned_team,
        assigned_crew_id
      })
    });
  },
  startWork: (id, note = "Work started by crew") => request(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: "IN_PROGRESS", note }) }),


  completeWork: (id, { completion_photo, completion_note }) => request(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: "COMPLETED", completion_photo, completion_note }) }),
  verifyResolution: (id, note = "Verified by Municipal Officer") => request(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: "RESOLVED", note }) }),
  rejectWork: (id, note = "Work verification rejected by officer - Rework required") => request(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: "REJECTED", note }) }),
  addComment: (id, payload) => request(`/api/complaints/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  getComments: (id) => request(`/api/complaints/${id}/comments`),

  // Analytics & AI
  getAnalytics: () => request('/api/analytics'),
  classifyAI: (text) => request('/api/ai/classify', { method: 'POST', body: JSON.stringify({ text }) }),
  analyzeComplaint: (description) => request('/complaints/analyze', { method: 'POST', body: JSON.stringify({ description }) }),
  seedDataset: () => request('/api/seed', { method: 'POST' }),
};
