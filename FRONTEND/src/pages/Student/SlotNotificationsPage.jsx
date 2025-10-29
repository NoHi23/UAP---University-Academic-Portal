import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import { FaBullhorn, FaInfoCircle, FaCalendarDay, FaClock, FaBook } from 'react-icons/fa';
import './SlotNotificationsPage.css';

const SlotNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Fetch slot notifications and request notifications in parallel
                const [slotsRes, requestsRes] = await Promise.allSettled([
                    api.get('/student/notifications/slots'),
                    api.get('/student/notifications/requests'),
                ]);

                const slotData = (slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value?.data?.data))
                    ? slotsRes.value.data.data.map(n => ({
                        id: n._id,
                        type: 'slot',
                        title: n.title,
                        content: n.content,
                        createdAt: n.createdAt,
                        sender: n.senderId,
                        raw: n,
                    }))
                    : [];

                const requestData = (requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value?.data?.data))
                    ? requestsRes.value.data.data.map(n => ({
                        id: n._id,
                        type: 'request',
                        title: n.title || n.requestId?.title || 'Phản hồi yêu cầu',
                        content: n.content || n.requestId?.response || '',
                        createdAt: n.createdAt,
                        sender: n.senderId,
                        raw: n,
                    }))
                    : [];

                // If both calls failed, surface an error
                if (slotData.length === 0 && requestData.length === 0) {
                    setError('Không thể tải thông báo.');
                }

                const merged = [...slotData, ...requestData]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setNotifications(merged);
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
        <div className="notifications-page-container">
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
                        <div key={noti.id} className={`notification-card ${noti.type}`}>
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
                                        <p><FaCalendarDay /> Ngày học: {noti.raw?.scheduleId?.weekId?.startDate ? new Date(noti.raw.scheduleId.weekId.startDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        <p><FaClock /> Slot: {noti.raw?.scheduleId?.timeSlotId?.slot}</p>
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