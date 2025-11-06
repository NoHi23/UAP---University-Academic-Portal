import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import ChangePasswordModal from '../components/Auth/ChangePasswordModal';
import FullScreenLoader from '../components/Common/FullScreenLoader';
import { useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError, notifyInfo } from '../services/notificationService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const navigate = useNavigate();

  const navigateToDashboard = (role) => {
    switch (role) {
      case 'admin': navigate('/admin/dashboard'); break;
      case 'student': navigate('/student/dashboard'); break;
      case 'lecturer': navigate('/lecturer/dashboard'); break;
      case 'staff': navigate('/staff/dashboard'); break;
      default: navigate('/'); break;
    }
  };

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/account/profile');
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
    const { token, user, passwordChangeRequired: isRequired } = response.data;

    localStorage.setItem('token', token);
    setUser(user);
    console.log("h: ", user);

    if (isRequired) {
      setPasswordChangeRequired(true);
    } else {
      notifySuccess(`Chào mừng ${user.name} đã quay trở lại!`);
      navigateToDashboard(user.role);
    }
    return response;
  };

  const handlePasswordChange = async (newPassword) => {

    try {
      console.log("123: ");

      await api.post('/account/change-password', { newPassword });
      setPasswordChangeRequired(false);
      
      notifySuccess('Đổi mật khẩu thành công!');
      navigateToDashboard(user.role);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
      throw err;
    }
  };
  const register = async (userData) => {
    return await api.post('/account/register', userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <FullScreenLoader />;
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
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile }}>
      <ChangePasswordModal
        isOpen={passwordChangeRequired}
        onSubmit={handlePasswordChange}
      />
      {children}
    </AuthContext.Provider>
  );
};