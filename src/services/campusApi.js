const DEFAULT_BASE = '/api';

const resolveBase = () => {
  const envBase = import.meta.env?.VITE_CAMPUS_API_BASE_URL?.trim();
  if (!envBase) return DEFAULT_BASE;
  return envBase.replace(/\/$/, '');
};

const buildCampusUrl = (path = '') => {
  const base = resolveBase();
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${sanitizedPath}`;
};

const campusFetch = (path, options) => fetch(buildCampusUrl(path), options);

const campusFetchJson = async (path, { method = 'GET', headers = {}, body } = {}) => {
  const res = await campusFetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
};

const campusUploadFormData = async (path, formData, options = {}) => {
  const res = await campusFetch(path, {
    method: 'POST',
    body: formData,
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
};

export {
  buildCampusUrl,
  campusFetch,
  campusFetchJson,
  campusUploadFormData
};

export default {
  buildCampusUrl,
  fetch: campusFetch,
  fetchJson: campusFetchJson,
  uploadFormData: campusUploadFormData
};
