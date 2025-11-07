import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import './Auth2.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const PasswordStrengthMeter = ({ strength }) => {
  const strengthLabels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const strengthColors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];

  const getStrengthProps = () => {
    if (strength <= 1) return { label: strengthLabels[0], color: strengthColors[0], width: '20%' };
    if (strength === 2) return { label: strengthLabels[1], color: strengthColors[1], width: '40%' };
    if (strength === 3) return { label: strengthLabels[2], color: strengthColors[2], width: '60%' };
    if (strength === 4) return { label: strengthLabels[3], color: strengthColors[3], width: '80%' };
    if (strength >= 5) return { label: strengthLabels[4], color: strengthColors[4], width: '100%' };
    return { label: '', color: '#eee', width: '0%' };
  };

  const { label, color, width } = getStrengthProps();

  return (
    <div className="strength-meter-container">
      <div className="strength-bar-background">
        <div className="strength-bar-foreground" style={{ width, backgroundColor: color }}></div>
      </div>
      <span className="strength-text" style={{ color }}>{label}</span>
    </div>
  );
};

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState(null); 

  const calculateStrength = (password) => {
    let score = 0;
    if (!password) { setStrength(0); return; }

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^a-zA-Z0-9]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;
    if (password.length > 12) score++;
    setStrength(score);
  };
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    calculateStrength(password);
    setError(null); // Xóa lỗi khi người dùng gõ
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError(null); // Xóa lỗi khi người dùng gõ
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notifyError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (strength < 3) {
      setError('Mật khẩu quá yếu. Vui lòng thêm chữ hoa, số, hoặc ký tự đặc biệt.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post(`/account/reset-password/${token}`, { newPassword });
      notifySuccess(response.data.message);
      navigate('/'); // Chuyển về trang đăng nhập
    } catch (err) {
      notifyError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsProcessing(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  return (
    <div className="auth2-container">
      <form onSubmit={handleSubmit} className="auth2-form">
        <h2>Đặt lại mật khẩu</h2>
        <p>Nhập mật khẩu mới của bạn.</p>
        <input
          type="password"
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChange={handlePasswordChange}
          required
        />

        {newPassword && <PasswordStrengthMeter strength={strength} />}

        <input
          type="password"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
        />

        <div className="password-match-status">
          {passwordsMatch && (
            <span className="password-match"> <FaCheckCircle className="status-icon pop-in" /> Mật khẩu đã khớp</span>
          )}
          {passwordsMismatch && (
            <span className="password-mismatch"> <FaTimesCircle className="status-icon pop-in" /> Mật khẩu không khớp</span>
          )}
        </div>

        {error && <div className="auth2-message-error">{error}</div>}

        <button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;