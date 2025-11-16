import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService, { SESSION_TIMEOUT_CONSTANTS } from '../services/api';

const {
  LAST_ACTIVITY_KEY,
  ENABLED_KEY,
  MINUTES_KEY,
  DEFAULT_MINUTES
} = SESSION_TIMEOUT_CONSTANTS;

const ACTIVITY_EVENTS = [
  'click',
  'keydown',
  'mousedown',
  'mousemove',
  'scroll',
  'touchstart',
  'touchmove'
];

const AUTH_STORAGE_KEY = 'isAuthenticated';

const isAuthenticated = () => localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
const isTimeoutEnabled = () => localStorage.getItem(ENABLED_KEY) !== 'false';

const getTimeoutMinutes = () => {
  const stored = parseInt(localStorage.getItem(MINUTES_KEY) || '', 10);
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_MINUTES;
};

const publicPathPredicate = (pathname) =>
  pathname === '/login' ||
  pathname === '/register' ||
  pathname.startsWith('/reset-password');

const SessionWatcher = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectToLogin = useCallback(
    (reason) => {
      apiService.logout();

      if (publicPathPredicate(location.pathname)) {
        return;
      }

      navigate('/login', { replace: true, state: { reason } });
    },
    [location.pathname, navigate]
  );

  useEffect(() => {
    apiService.ensureSessionTimeoutDefaults();
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      if (!isAuthenticated() || !isTimeoutEnabled()) {
        return;
      }

      apiService.touchSession();
    };

    const checkTimeout = () => {
      if (!isAuthenticated() || !isTimeoutEnabled()) {
        return;
      }

      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      if (!lastActivity) {
        apiService.touchSession();
        return;
      }

      const timeoutMinutes = getTimeoutMinutes();
      if (Date.now() - lastActivity >= timeoutMinutes * 60 * 1000) {
        redirectToLogin('timeout');
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) =>
      document.addEventListener(eventName, handleActivity, true)
    );

    const intervalId = window.setInterval(checkTimeout, 30 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleStorage = (event) => {
      if (event.key === AUTH_STORAGE_KEY && event.newValue !== 'true') {
        redirectToLogin('logout');
      }

      if (event.key === ENABLED_KEY || event.key === MINUTES_KEY) {
        checkTimeout();
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleBeforeUnload = () => {
      if (isAuthenticated()) {
        apiService.logout();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    checkTimeout();

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        document.removeEventListener(eventName, handleActivity, true)
      );
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [redirectToLogin]);

  useEffect(() => {
    if (isAuthenticated() && isTimeoutEnabled()) {
      apiService.touchSession();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated() && !publicPathPredicate(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default SessionWatcher;
