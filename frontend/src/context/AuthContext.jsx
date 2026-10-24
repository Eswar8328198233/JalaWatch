import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin as apiAdminLogin, getAdminMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jalawatch_admin_token'));
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('jalawatch_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyExistingToken() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getAdminMe(token);
        setAdmin(data.admin);
        localStorage.setItem('jalawatch_admin_user', JSON.stringify(data.admin));
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyExistingToken();
  }, [token]);

  const login = async (username, password) => {
    const data = await apiAdminLogin(username, password);
    setToken(data.token);
    setAdmin(data.admin);
    localStorage.setItem('jalawatch_admin_token', data.token);
    localStorage.setItem('jalawatch_admin_user', JSON.stringify(data.admin));
    return data;
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('jalawatch_admin_token');
    localStorage.removeItem('jalawatch_admin_user');
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
