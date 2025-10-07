import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/users/profile');
          setUser(response.data); 
        } catch (error) {
          localStorage.removeItem('token');
          console.error("Token invalid, logging out.");
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/account/login', { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    setUser(userData);
    return response;
  };

  const register = async (userData) => {
    return await api.post('/account/register', userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }


  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/account/profile', userData);
      const { token, user: updatedUserData } = response.data;
      localStorage.setItem('token', token); 
      setUser(updatedUserData); 
      return response;
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      throw error; 
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};