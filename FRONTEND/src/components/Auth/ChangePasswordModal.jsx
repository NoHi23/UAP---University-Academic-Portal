import React, { useState } from 'react';
import './ChangePasswordModal.css';
import { notifyError } from '../../services/notificationService';
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

const ChangePasswordModal = ({ isOpen, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const [strength, setStrength] = useState(0);

  const calculateStrength = (password) => {
    let score = 0;
    if (!password) {
      setStrength(0);
      return;
    }

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^a-zA-Z0-9]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    if (password.length > 12) {
      score++;
    }

    setStrength(score);
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    calculateStrength(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notifyError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (strength < 3) {
      notifyError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      return;
    }

    setError('');
    setIsProcessing(true);
    try {
      await onSubmit(newPassword);
    } catch (err) {
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  return (
    <div className="modal-overlay-forced">
      <div className="modal-content-forced">
        <h2>Tạo Mật Khẩu Mới</h2>
        <p>Vì đây là lần đăng nhập đầu tiên, bạn phải tạo một mật khẩu mới để tiếp tục.</p>
        <form onSubmit={handleSubmit}>
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
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div className="password-match-status">
            {passwordsMatch && (
              <div className="password-match">
                <FaCheckCircle className="status-icon pop-in" />
                <span>Mật khẩu đã khớp</span>
              </div>
            )}
            {passwordsMismatch && (
              <div className="password-mismatch">
                <FaTimesCircle className="status-icon pop-in" />
                <span>Mật khẩu không khớp</span>
              </div>
            )}
          </div>
          <button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận và Tiếp tục'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;