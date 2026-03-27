import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while hydrating

  // ─── Hydrate on mount (silent token refresh) ───────────
  useEffect(() => {
    async function hydrate() {
      try {
        // Attempt silent refresh — if a valid refresh token cookie exists,
        // this returns a new access token
        const { data } = await api.post('/auth/refresh');
        window.__accessToken = data.accessToken;

        const { data: meData } = await api.get('/auth/me');
        setUser(meData.user);
      } catch {
        // No valid session — that's fine
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, []);

  // ─── Listen for forced logout (from interceptor) ───────
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      window.__accessToken = null;
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ─── Actions ───────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    window.__accessToken = data.accessToken;
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    window.__accessToken = null;
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    try { await api.post('/auth/logout-all'); } catch (_) {}
    window.__accessToken = null;
    setUser(null);
  }, []);

  // Called after OAuth redirect lands on /oauth/callback
  const handleOAuthCallback = useCallback(async (token) => {
    window.__accessToken = token;
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    logoutAll,
    handleOAuthCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}