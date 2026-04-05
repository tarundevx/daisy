import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('daisy_token');
    if (token) {
      const savedUser = JSON.parse(localStorage.getItem('daisy_user'));
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('daisy_token', token);
    localStorage.setItem('daisy_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const signup = async (email, password, name) => {
    const res = await api.post('/auth/signup', { email, password, name });
    const { token, user } = res.data;
    localStorage.setItem('daisy_token', token);
    localStorage.setItem('daisy_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('daisy_token');
    localStorage.removeItem('daisy_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
