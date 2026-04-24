import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// All requests include cookies
axios.defaults.withCredentials = true;

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
        const res = await axios.post('/api/auth/refresh');
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
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const userData = {
          username: res.data.username,
          role: res.data.role,
        };
        setUser(userData);
        localStorage.setItem('vedas_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: res.data.message || 'Login failed' };
    } catch (err) {
      const msg =
        err.response?.data?.message || err.response?.data?.error || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });
      if (res.data.success) {
        return { success: true, code: res.data.code, message: res.data.message };
      }
      return { success: false, error: res.data.message || 'Registration failed' };
    } catch (err) {
      const msg =
        err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
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
