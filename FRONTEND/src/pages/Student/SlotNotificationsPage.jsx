import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import announcementAPI from '../../api/annoucementAPI';
import api from '../../services/api';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FaBullhorn, FaInfoCircle, FaCalendarDay, FaClock, FaBook } from 'react-icons/fa';
import './SlotNotificationsPage.css';
import dayjs from 'dayjs';

const SlotNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Use announcements as the global notification source
                const res = await announcementAPI.getAll();
                const raw = Array.isArray(res?.data?.data) ? res.data.data : [];

                if (raw.length === 0) {
                    setNotifications([]);
                    return;
                }

                const mapped = raw.map(a => ({
                    id: a._id,
                    type: 'announcement',
                    title: a.title || 'Không có tiêu đề',
                    content: a.description || a.content || '',
                    createdAt: a.createdAt || a.updatedAt || a.created_at,
                    sender: { name: a.postBy || 'Hệ thống' },
                    raw: a
                }));

                const sorted = mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(sorted);
                const response = await api.get('/notifications/slots');
                const sortedData = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(sortedData);
            } catch (err) {
                console.error(err);
                setError('Không thể tải thông báo.');
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    if (loading) return <FullScreenLoader loading={true} />;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="notifications-page-container" style={{ position: 'relative' }}>
            <IconButton component={Link} to="/student/dashboard" sx={{ position: 'absolute', top: 12, left: 12 }}>
                <ArrowBackIcon />
            </IconButton>
            <header className="notifications-header">
                <h1><FaBullhorn /> Thông báo</h1>
            </header>

            {notifications.length === 0 ? (
                <div className="info-message">
                    <FaInfoCircle />
                    <p>Hiện tại không có thông báo nào.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map(noti => (
                        <div key={noti.id} className={`notification-card ${noti.type}`} onClick={() => navigate(`/student/announcements/${noti.id}`)} style={{ cursor: 'pointer' }}>
                            <div className="notification-card-header">
                                <h3>{noti.title}</h3>
                                <span className="notification-date">
                                    {new Date(noti.createdAt).toLocaleString('vi-VN')}
                                </span>
                            </div>

                            <div className="notification-card-body">
                                <p className="notification-content">{noti.content}</p>

                                {noti.type === 'slot' && (
                                    <div className="slot-info">
                                        <p><FaBook /> {noti.raw?.scheduleId?.subjectId?.subjectName} ({noti.raw?.scheduleId?.classId?.className})</p>
                                        <p><FaCalendarDay /> Ngày học: {noti.raw?.scheduleId?.date ? dayjs(noti.raw.scheduleId.date).format('DD/MM/YYYY') : 'N/A'}</p>
                                        <p><FaClock /> Slot: {noti.raw?.scheduleId?.slot || 'N/A'}</p>
                                    </div>
                                )}

                                {noti.type === 'request' && (
                                    <div className="request-info">
                                        <p><strong>Yêu cầu:</strong> {noti.raw?.requestId?.title || '—'}</p>
                                        <p><strong>Loại:</strong> {noti.raw?.requestId?.requestType || '—'}</p>
                                        <p><strong>Trạng thái:</strong> {noti.raw?.requestId?.status || '—'}</p>
                                        <p><strong>Phản hồi:</strong> {noti.raw?.requestId?.response || noti.content || '—'}</p>
                                    </div>
                                )}
                            </div>

                            <div className="notification-card-footer">
                                <div className="slot-info">
                                    <p><FaBook /> {noti.scheduleId?.subjectId?.subjectName} ({noti.scheduleId?.classId?.className})</p>
                                    <p><FaCalendarDay /> Ngày học: {noti.scheduleId?.date ? dayjs(noti.scheduleId.date).format('DD/MM/YYYY') : 'N/A'}</p>
                                    <p><FaClock /> Slot: {noti.scheduleId?.slot || 'N/A'}</p>
                                </div>
                                <span className="sender-info">
                                    Gửi bởi: {noti.sender?.email || noti.sender?.name || 'Hệ thống'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SlotNotificationsPage;