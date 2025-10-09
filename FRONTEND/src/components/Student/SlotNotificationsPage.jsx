import React, { useState, useEffect } from 'react';
import  api  from '../../services/api';
import FullScreenLoader from '../Common/FullScreenLoader';
import { FaBullhorn, FaInfoCircle, FaCalendarDay, FaClock, FaBook } from 'react-icons/fa';
import './SlotNotificationsPage.css';

const SlotNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/student/notifications/slots');
                // Sắp xếp các thông báo theo ngày mới nhất
                const sortedData = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(sortedData);
            } catch (err) {
                setError('Không thể tải thông báo.');
                console.error(err);
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
                <h1><FaBullhorn /> Thông báo buổi học</h1>
            </header>

            {notifications.length === 0 ? (
                <div className="info-message">
                    <FaInfoCircle />
                    <p>Hiện tại không có thông báo nào.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map(noti => (
                        <div key={noti._id} className="notification-card">
                            <div className="notification-card-header">
                                <h3>{noti.title}</h3>
                                <span className="notification-date">
                                    {new Date(noti.createdAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div className="notification-card-body">
                                <p className="notification-content">{noti.content}</p>
                            </div>
                            <div className="notification-card-footer">
                                <div className="slot-info">
                                    <p><FaBook /> {noti.scheduleId?.subjectId?.subjectName} ({noti.scheduleId?.classId?.className})</p>
                                    <p><FaCalendarDay /> Ngày học: {new Date(noti.scheduleId?.weekId?.startDate).toLocaleDateString('vi-VN')}</p>
                                    <p><FaClock /> Slot: {noti.scheduleId?.timeSlotId?.slot}</p>
                                </div>
                                <span className="sender-info">
                                    Gửi bởi: {noti.senderId?.email}
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