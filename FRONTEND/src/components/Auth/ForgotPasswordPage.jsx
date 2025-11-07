import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import './Auth2.css';
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');
    try {
      const response = await api.post('/account/forgot-password', { email });
      // notifySuccess(response.data.message);
      notifySuccess('Yêu cầu đã được gửi!');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="auth2-container">
      <form onSubmit={handleSubmit} className="auth2-form">
        <h2>Quên mật khẩu</h2>
        <p>Nhập email tài khoản của bạn để nhận link đặt lại mật khẩu.</p>
        <input
          type="email"
          placeholder="Nhập email .edu.vn của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />


        <button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Đang gửi...' : 'Gửi link reset'}
        </button>

        <div className="auth2-links">
          <Link to="/">Quay lại Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;