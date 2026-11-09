import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          localStorage.setItem('stockflow_user', JSON.stringify(data.user));
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('stockflow_token', data.token);
    localStorage.setItem('stockflow_user', JSON.stringify(data.user));
    return data;
  };

  const signup = async (email, password, confirmPassword, organizationName) => {
    const data = await api.signup(email, password, confirmPassword, organizationName);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('stockflow_token', data.token);
    localStorage.setItem('stockflow_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
  };

  const updateOrg = (newOrgData) => {
    if (user && user.organization) {
      const updatedUser = {
        ...user,
        organization: {
          ...user.organization,
          ...newOrgData,
        },
      };
      setUser(updatedUser);
      localStorage.setItem('stockflow_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organization: user?.organization || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        signup,
        logout,
        updateOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

