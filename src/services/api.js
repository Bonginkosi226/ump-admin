// services/api.js
const API_BASE = (import.meta.env?.VITE_API_BASE_URL?.trim() || '/api').replace(/\/$/, '');
const ADMIN_BASE = '/admins';
const SESSION_LAST_ACTIVITY_KEY = 'sessionLastActivity';
const SESSION_TIMEOUT_ENABLED_KEY = 'sessionTimeoutEnabled';
const SESSION_TIMEOUT_MINUTES_KEY = 'sessionTimeoutMinutes';
const DEFAULT_TIMEOUT_MINUTES = 10;

const touchSession = () => {
  try {
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Unable to update session activity timestamp:', error);
  }
};

const ensureSessionTimeoutDefaults = () => {
  try {
    if (localStorage.getItem(SESSION_TIMEOUT_ENABLED_KEY) === null) {
      localStorage.setItem(SESSION_TIMEOUT_ENABLED_KEY, 'true');
    }
    if (localStorage.getItem(SESSION_TIMEOUT_MINUTES_KEY) === null) {
      localStorage.setItem(SESSION_TIMEOUT_MINUTES_KEY, DEFAULT_TIMEOUT_MINUTES.toString());
    }
  } catch (error) {
    console.warn('Unable to ensure session timeout defaults:', error);
  }
};

const parseStoredAdmin = () => {
  try {
    const admin = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('authToken') || null;
    return { admin, token };
  } catch (error) {
    console.warn('Unable to parse stored admin session:', error);
    return { admin: null, token: null };
  }
};

const persistSession = (admin, token) => {
  if (admin) {
    localStorage.setItem('user', JSON.stringify(admin));
    localStorage.setItem('isAuthenticated', 'true');
  }
  if (token) {
    localStorage.setItem('authToken', token);
  }

  if (admin || token) {
    ensureSessionTimeoutDefaults();
    touchSession();
    return;
  }

  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.setItem('isAuthenticated', 'false');
  localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
};

const buildHeaders = (isJson = true) => {
  const headers = isJson ? { 'Content-Type': 'application/json' } : {};
  const { token } = parseStoredAdmin();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const buildApiUrl = (path) => {
  const base = API_BASE.replace(/\/$/, '');
  let sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && sanitizedPath.startsWith('/api')) {
    sanitizedPath = sanitizedPath.replace(/^\/api(\/)?/, '/');
  }
  return `${base}${sanitizedPath}`;
};

const readJson = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // Ignore JSON parse errors; payload remains null
  }
  return payload;
};

const apiService = {
  loginAdmin: async ({ email, password }) => {
    try {
      const res = await fetch(buildApiUrl(`${ADMIN_BASE}/login`), {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ email, password })
      });

      const payload = await readJson(res);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Invalid email or password');
      }

      const { admin, token } = payload.data || {};
      if (admin && token) {
        persistSession(admin, token);
      }

      return { success: true, admin, token };
    } catch (error) {
      console.error('loginAdmin error:', error);
      return { success: false, message: error.message };
    }
  },

  registerAdmin: async ({ firstName, lastName, email, phone, department, password }) => {
    try {
      const res = await fetch(buildApiUrl(`${ADMIN_BASE}/register`), {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ firstName, lastName, email, phone, department, password })
      });

      const payload = await readJson(res);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to register administrator');
      }

      const { admin, token } = payload.data || {};
      if (admin && token) {
        persistSession(admin, token);
      }

      return { success: true, admin, token };
    } catch (error) {
      console.error('registerAdmin error:', error);
      return { success: false, message: error.message };
    }
  },

  logout: () => {
    persistSession(null, null);
  },

  ensureSessionTimeoutDefaults,
  touchSession,

  getCurrentUser: async () => {
    const { admin } = parseStoredAdmin();
    if (!admin?._id) {
      return { success: false, message: 'No administrator session found' };
    }

    try {
      const res = await fetch(buildApiUrl(`${ADMIN_BASE}/${admin._id}`), {
        headers: buildHeaders()
      });

      const payload = await readJson(res);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to fetch administrator profile');
      }

      persistSession(payload.data, parseStoredAdmin().token);
      return { success: true, data: payload.data };
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return { success: false, message: error.message, data: admin };
    }
  },

  updateCurrentUser: async (updateData = {}) => {
    const { admin } = parseStoredAdmin();
    if (!admin?._id) {
      return { success: false, message: 'No administrator session found' };
    }

    try {
      const res = await fetch(buildApiUrl(`${ADMIN_BASE}/${admin._id}`), {
        method: 'PUT',
        headers: buildHeaders(true),
        body: JSON.stringify(updateData)
      });

      const payload = await readJson(res);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to update administrator');
      }

      persistSession(payload.data, parseStoredAdmin().token);
      return { success: true, data: payload.data };
    } catch (error) {
      console.error('updateCurrentUser error:', error);
      return { success: false, message: error.message };
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const { admin } = parseStoredAdmin();
    if (!admin?._id) {
      return { success: false, message: 'No administrator session found' };
    }

    try {
      const res = await fetch(buildApiUrl(`${ADMIN_BASE}/${admin._id}/password`), {
        method: 'PUT',
        headers: buildHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const payload = await readJson(res);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to change password');
      }

      return { success: true, data: payload.data || null };
    } catch (error) {
      console.error('changePassword error:', error);
      return { success: false, message: error.message };
    }
  },

  getAdmins: async () => {
    try {
      const res = await fetch(buildApiUrl(ADMIN_BASE), {
        headers: buildHeaders()
      });

      const payload = await readJson(res);
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Failed to fetch administrators');
      }

      return { success: true, data: payload?.data || [] };
    } catch (error) {
      console.error('getAdmins error:', error);
      return { success: false, message: error.message, data: [] };
    }
  },

  deleteAdmin: async (adminId) => {
    try {
      const res = await fetch(buildApiUrl(`${ADMIN_BASE}/${adminId}`), {
        method: 'DELETE',
        headers: buildHeaders()
      });

      const payload = await readJson(res);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to delete administrator');
      }

      return { success: true };
    } catch (error) {
      console.error('deleteAdmin error:', error);
      return { success: false, message: error.message };
    }
  }
};

export const SESSION_TIMEOUT_CONSTANTS = {
  LAST_ACTIVITY_KEY: SESSION_LAST_ACTIVITY_KEY,
  ENABLED_KEY: SESSION_TIMEOUT_ENABLED_KEY,
  MINUTES_KEY: SESSION_TIMEOUT_MINUTES_KEY,
  DEFAULT_MINUTES: DEFAULT_TIMEOUT_MINUTES
};

export {
  SESSION_LAST_ACTIVITY_KEY,
  SESSION_TIMEOUT_ENABLED_KEY,
  SESSION_TIMEOUT_MINUTES_KEY,
  DEFAULT_TIMEOUT_MINUTES
};

export default apiService;
