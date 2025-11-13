import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentResult.css'; // file CSS riêng

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const success = params.get('success') === 'true';
  const message = params.get('message');

  // Tự động chuyển về Dashboard sau 3 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/student/dashboard');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="payment-result-container">
      <div className={`payment-card ${success ? 'success' : 'failed'}`}>
        <div className="icon">{success ? '🎉' : '❌'}</div>
        <h2>{success ? 'Thanh toán thành công!' : 'Thanh toán thất bại!'}</h2>
        <p className="message">{message}</p>
        <p className="note">Chuyển về Dashboard sau 3 giây...</p>
      </div>
    </div>
  );
};

export default PaymentResult;
