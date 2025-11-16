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

export {
  buildCampusUrl,
  campusFetch
};

export default {
  buildCampusUrl,
  fetch: campusFetch
};
