import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore user from localStorage, then validate via refresh
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('vedas_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Try refreshing the access token to validate session
      try {
        const res = await api.post('/auth/refresh');
        if (res.data.success) {
          const userData = {
            username: res.data.username,
            role: res.data.role,
          };
          setUser(userData);
          localStorage.setItem('vedas_user', JSON.stringify(userData));
        }
      } catch {
        // No valid refresh token — clear everything
        setUser(null);
        localStorage.removeItem('vedas_user');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = {
          username: res.data.username,
          role: res.data.role,
        };
        setUser(userData);
        localStorage.setItem('vedas_user', JSON.stringify(userData));
        return { success: true };
      }
      const errMsg = res.data.message;
      return { success: false, error: typeof errMsg === 'string' ? errMsg : 'Login failed' };
    } catch (err) {
      const raw =
        err.response?.data?.message || err.response?.data?.error || 'Login failed';
      const msg = typeof raw === 'string' ? raw : (raw?.message || JSON.stringify(raw));
      return { success: false, error: msg };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
      });
      if (res.data.success) {
        return { success: true, code: res.data.code, message: res.data.message };
      }
      const errMsg = res.data.message;
      return { success: false, error: typeof errMsg === 'string' ? errMsg : 'Registration failed' };
    } catch (err) {
      const raw =
        err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      const msg = typeof raw === 'string' ? raw : (raw?.message || JSON.stringify(raw));
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the request fails, clear local state
    }
    setUser(null);
    localStorage.removeItem('vedas_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
