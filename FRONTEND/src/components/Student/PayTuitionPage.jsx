import React, { useState, useEffect } from 'react';
import api  from '../../services/api';
import FullScreenLoader from '../Common/FullScreenLoader';
import { FaMoneyBillWave, FaCheckCircle, FaExclamationCircle, FaCalendarAlt, FaHashtag, FaFileInvoiceDollar } from 'react-icons/fa';
import './PayTuitionPage.css';
import { notifyError } from '../../services/notificationService';

const PayTuitionPage = () => {
    const [tuitionInfo, setTuitionInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTuitionInfo = async () => {
            try {
                const response = await api.get('/student/tuition/me');
                setTuitionInfo(response.data.data);
            } catch (err) {
                const message = err.response?.status === 404 
                    ? 'Hiện tại không có công nợ học phí nào.'
                    : 'Không thể tải thông tin học phí.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchTuitionInfo();
    }, []);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const response = await api.post('/student/tuition/create-payment-url');
            const { paymentUrl } = response.data.data;
            
            if (paymentUrl) {
                window.location.href = paymentUrl;
            }
        } catch (err) {
            notifyError('Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.');
            setIsProcessing(false);
        }
    };

    if (loading) return <FullScreenLoader loading={true} />;

    return (
        <div className="tuition-page-container">
            <header className="tuition-header">
                <h1><FaFileInvoiceDollar /> Thanh toán học phí</h1>
            </header>

            {error ? (
                <div className="info-message">{error}</div>
            ) : tuitionInfo ? (
                <div className="tuition-card">
                    <div className="tuition-card-header">
                        <h2>Học phí học kỳ {tuitionInfo.semesterNo}</h2>
                        <span className={`status-badge status-${tuitionInfo.status}`}>
                            {tuitionInfo.status === 'paid' ? <><FaCheckCircle/> Đã thanh toán</> : <><FaExclamationCircle/> Chưa thanh toán</>}
                        </span>
                    </div>
                    <div className="tuition-details-grid">
                        <div className="detail-item">
                            <FaHashtag />
                            <div>
                                <span>Tổng số tiền</span>
                                <p>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionInfo.totalAmount)}</p>
                            </div>
                        </div>
                        <div className="detail-item paid">
                            <FaCheckCircle />
                            <div>
                                <span>Đã thanh toán</span>
                                <p>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionInfo.amountPaid)}</p>
                            </div>
                        </div>
                        <div className="detail-item remaining">
                            <FaMoneyBillWave />
                            <div>
                                <span>Còn lại phải đóng</span>
                                <p>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionInfo.totalAmount - tuitionInfo.amountPaid)}</p>
                            </div>
                        </div>
                        <div className="detail-item deadline">
                            <FaCalendarAlt />
                            <div>
                                <span>Hạn nộp</span>
                                <p>{new Date(tuitionInfo.deadline).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="tuition-card-footer">
                        {tuitionInfo.status === 'unpaid' && (
                            <button onClick={handlePayment} disabled={isProcessing} className="btn-pay">
                                {isProcessing ? 'Đang xử lý...' : 'Thanh toán qua VNPay'}
                            </button>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default PayTuitionPage;