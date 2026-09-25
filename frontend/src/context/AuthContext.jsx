import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'sax_access_token';
const USER_KEY = 'sax_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);

  // ── Axios Interceptor: attach access token ─────────────────────────────────
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
          config.headers['x-csrf-token'] = csrfToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, [accessToken, csrfToken]);

  // ── Axios Interceptor: auto-refresh on 401 ─────────────────────────────────
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isRefreshUrl = originalRequest?.url?.includes('/api/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && accessToken && !isRefreshUrl) {
          originalRequest._retry = true;
          try {
            const { data } = await authService.refresh();
            const newToken = data.accessToken;
            setAccessToken(newToken);
            localStorage.setItem(TOKEN_KEY, newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch {
            logoutUser();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(responseInterceptor);
  }, [accessToken]);

  // ── Initialize: fetch CSRF token on mount ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await authService.getCsrfToken();
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const loginUser = useCallback((userData, token, csrf) => {
    setUser(userData);
    setAccessToken(token);
    if (csrf) setCsrfToken(csrf);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      if (accessToken) await authService.logout();
    } catch {
      // silent
    } finally {
      setUser(null);
      setAccessToken(null);
      setCsrfToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [accessToken]);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const isAuthenticated = !!user && !!accessToken;
  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        csrfToken,
        isLoading,
        isAuthenticated,
        isAdmin,
        loginUser,
        logoutUser,
        updateUser,
        setCsrfToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
