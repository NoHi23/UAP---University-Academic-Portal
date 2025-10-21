import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './Auth.css';
import { notifySuccess, notifyError, notifyInfo } from '../../services/notificationService';
import posterImage from '../../assets/UAPPT.png';
import FullScreenLoader from '../../components/Common/FullScreenLoader';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSuccess = (loggedInUser) => {
    notifySuccess(`Chào mừng ${loggedInUser.name} đã quay trở lại!`);

    switch (loggedInUser.role) {
      case 'admin':
        navigate('/admin/dashboard'); 
        break;
      case 'student':
        navigate('/student/dashboard');
        break;
      case 'lecture':
        navigate('/lecturer/dashboard');
        break;
      case 'staff':
        navigate('/staff/dashboard');
        break;
      default:
        navigate('/');
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const response = await login(email, password);
      handleLoginSuccess(response.data.user);
    } catch (err) {
      const message = err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.';
      notifyError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsProcessing(true);
    try {
      const response = await loginWithGoogle(credentialResponse.credential);
      handleLoginSuccess(response.data.user);
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập Google thất bại.';
      notifyError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleError = () => {
    notifyError('Xác thực Google thất bại. Vui lòng thử lại.');
  };

  return (
    <>
      <FullScreenLoader loading={isProcessing} />
      <div className="login-page">
        <div className="login-image-panel" style={{ backgroundImage: `url(${posterImage})` }}>
          {/* <div className="welcome-message">
            <h1>Chào mừng trở lại!</h1>
            <p>Hệ thống UAP - University Academic Portal của chúng tôi!</p>
          </div> */}
        </div>

        <div className="login-form-panel">
          <div className="auth-form-container">
            <div className="logo-container">
              <img src="/UAP.png" alt="Logo Dấu Ấn Kinh Kỳ" />
            </div>
            <h2>Đăng Nhập Tài Khoản</h2>
            <p className="subtitle">Sử dụng tài khoản của bạn để tiếp tục</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="input-group">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="form-options">
                <Link to="/forgot-password" className="forgot-password">Quên mật khẩu?</Link>
              </div>
              <button type="submit" className="btn-submit" disabled={isProcessing}>
                {isProcessing ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
            </form>

            <div className="social-login-divider">
              <span>HOẶC ĐĂNG NHẬP VỚI</span>
            </div>

            <div className="social-login-buttons">
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;