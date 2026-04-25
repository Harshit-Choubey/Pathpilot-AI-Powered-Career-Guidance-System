import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once on mount - validate existing token
    if (initialized.current) return;
    initialized.current = true;

    const validateToken = async () => {
      const stored = localStorage.getItem('token');
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const res = await authService.getMe();
        setUser(res.data);
        setToken(stored);
      } catch (err) {
        // Token expired or invalid — clear it
        console.warn('Token validation failed, clearing session:', err?.response?.status);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  // Listen for 401 auto-logout events dispatched by the axios response interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = async (credentials) => {
    // Login call — if this throws, the error propagates to the Login page
    const res = await authService.login(credentials);
    const newToken = res.data.access_token;

    // Persist immediately
    localStorage.setItem('token', newToken);
    setToken(newToken);

    // Fetch user profile (fire and forget — don't block login on this)
    try {
      const userRes = await authService.getMe();
      setUser(userRes.data);
    } catch (e) {
      console.warn('Could not fetch user profile after login:', e);
      // Still consider login successful — token is valid
    }
  };

  const register = async (userData) => {
    await authService.register(userData);
    await login({ email: userData.email, password: userData.password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  // Show children immediately — don't block on loading to prevent blank screens
  // Pages that need auth can check isAuthenticated themselves
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
