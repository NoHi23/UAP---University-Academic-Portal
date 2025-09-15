import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css'; // Sẽ tạo file CSS sau
import { notifySuccess, notifyError } from '../../services/notificationService';
import { showConfirmDialog } from '../../services/confirmationService';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Hứng kết quả trả về từ hàm login, trong đó có thông tin user
      const response = await login(email, password);
      const loggedInUser = response.data.user;

      notifySuccess(`Chào mừng ${loggedInUser.name} đã quay trở lại!`);

      // === PHÂN LUỒNG DỰA TRÊN VAI TRÒ (ROLE) ===
      if (loggedInUser.role === 'admin' || loggedInUser.role === 'moderator') {
        // Nếu là admin hoặc mod, chuyển đến trang quản lý đơn hàng
        navigate('/admin/orders');
      } else {
        // Nếu là user thường, về trang chủ
        navigate('/');
      }

    } catch (err) {
      notifyError('Email hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Đăng nhập</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mật khẩu</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Đăng nhập</button>
        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;