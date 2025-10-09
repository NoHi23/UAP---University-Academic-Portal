import React, { useState, useEffect } from 'react';
import  api  from '../../services/api';
import FullScreenLoader from '../Common/FullScreenLoader';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import './TransactionHistoryPage.css';

const TransactionHistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/student/transactions/me');
                setTransactions(response.data.data);
            } catch (err) {
                setError('Không thể tải lịch sử giao dịch.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const renderStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <span className="status-badge status-completed"><FaCheckCircle /> Thành công</span>;
            case 'failed':
                return <span className="status-badge status-failed"><FaTimesCircle /> Thất bại</span>;
            case 'pending':
                return <span className="status-badge status-pending"><FaHourglassHalf /> Đang chờ</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    if (loading) return <FullScreenLoader loading={true} />;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="history-page-container">
            <header className="history-header">
                <h1><FaHistory /> Lịch sử giao dịch</h1>
            </header>

            {transactions.length === 0 ? (
                <div className="info-message">Bạn chưa có giao dịch nào.</div>
            ) : (
                <div className="history-table-container">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Mã giao dịch</th>
                                <th>Học kỳ</th>
                                <th>Số tiền</th>
                                <th>Trạng thái</th>
                                <th>Ngày giao dịch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx._id}>
                                    <td data-label="Mã giao dịch">{tx.transactionCode}</td>
                                    <td data-label="Học kỳ">{tx.tuitionFeeId?.semesterNo || 'N/A'}</td>
                                    <td data-label="Số tiền" className="amount">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                                    </td>
                                    <td data-label="Trạng thái">{renderStatusIcon(tx.status)}</td>
                                    <td data-label="Ngày giao dịch">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryPage;