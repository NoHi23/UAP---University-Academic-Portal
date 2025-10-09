import React, { useState, useEffect } from 'react';
import  api  from '../../services/api';
import FullScreenLoader from '../Common/FullScreenLoader';
import { FaPaperPlane, FaPlusCircle, FaTimesCircle, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa';
import './RequestsPage.css';
import { notifySuccess, notifyError } from '../../services/notificationService';

// Modal component for the new request form
const NewRequestModal = ({ isOpen, onClose, onSubmit }) => {
    const [requestType, setRequestType] = useState('Xin nghỉ học');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ requestType, title, description });
            // Reset form and close modal is handled by parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Tạo yêu cầu mới</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Loại yêu cầu</label>
                        <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                            <option value="Xin nghỉ học">Xin nghỉ học</option>
                            <option value="Phúc khảo điểm">Phúc khảo điểm</option>
                            <option value="Cấp lại thẻ sinh viên">Cấp lại thẻ sinh viên</option>
                            <option value="Xác nhận sinh viên">Xác nhận sinh viên</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tiêu đề</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Nội dung chi tiết</label>
                        <textarea rows="5" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/student/requests/me');
            setRequests(response.data.data);
        } catch (err) {
            setError('Không thể tải danh sách yêu cầu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleNewRequestSubmit = async (formData) => {
        try {
            await api.post('/student/requests', formData);
            notifySuccess('Gửi yêu cầu thành công!');
            setIsModalOpen(false);
            setLoading(true);
            fetchRequests(); // Tải lại danh sách sau khi gửi thành công
        } catch (err) {
            notifyError(err.response?.data?.message || 'Gửi yêu cầu thất bại.');
        }
    };
    
    const renderStatus = (status) => {
        switch (status) {
            case 'Approved':
                return <span className="req-status status-approved"><FaCheckCircle /> Đã duyệt</span>;
            case 'Rejected':
                return <span className="req-status status-rejected"><FaTimesCircle /> Đã từ chối</span>;
            case 'Pending':
            default:
                return <span className="req-status status-pending"><FaHourglassHalf /> Chờ xử lý</span>;
        }
    };


    if (loading) return <FullScreenLoader loading={true} />;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="requests-page-container">
            <NewRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleNewRequestSubmit} />
            <header className="requests-header">
                <h1><FaPaperPlane /> Đơn từ & Yêu cầu</h1>
                <button className="btn-new-request" onClick={() => setIsModalOpen(true)}>
                    <FaPlusCircle /> Tạo yêu cầu mới
                </button>
            </header>
            
            {requests.length === 0 ? (
                <div className="info-message">Bạn chưa gửi yêu cầu nào.</div>
            ) : (
                <div className="requests-list">
                    {requests.map(req => (
                        <div key={req._id} className="request-card">
                            <div className="request-card-header">
                                <h3>{req.title}</h3>
                                {renderStatus(req.status)}
                            </div>
                            <div className="request-card-body">
                                <p className="req-type"><strong>Loại:</strong> {req.requestType}</p>
                                <p className="req-desc">{req.description}</p>
                                {req.response && <p className="req-response"><strong>Phản hồi:</strong> {req.response}</p>}
                            </div>
                            <div className="request-card-footer">
                                <span>Ngày gửi: {new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RequestsPage;