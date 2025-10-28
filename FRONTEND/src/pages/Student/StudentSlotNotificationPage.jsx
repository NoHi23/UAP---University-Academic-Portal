import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Paper, Typography, Box, CircularProgress, Alert, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api';
import dayjs from 'dayjs';

// Đây là logic từ modal cũ
const StudentSlotNotificationPage = () => {
    const { scheduleId } = useParams();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (scheduleId) {
            const fetchNotifications = async () => {
                setLoading(true); setError('');
                try {
                    const response = await api.get(`/student/notifications/slot/${scheduleId}`);
                    setNotifications(response.data.data || []);
                } catch (err) {
                    setError('Không thể tải thông báo.');
                } finally {
                    setLoading(false);
                }
            };
            fetchNotifications();
        }
    }, [scheduleId]);

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <IconButton component={Link} to="/student/schedule" sx={{ mb: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={600} mb={2}>Thông báo cho buổi học</Typography>
                
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                {!loading && !error && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {notifications.length === 0 ? (
                            <Typography color="textSecondary" align="center">Không có thông báo nào.</Typography>
                        ) : (
                            notifications.map(noti => (
                                <Paper key={noti._id} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="h6" fontSize="1rem" fontWeight="bold">{noti.title}</Typography>
                                    <Typography variant="body2" sx={{ my: 1 }}>{noti.content}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Gửi bởi: {noti.senderId?.email} - {dayjs(noti.createdAt).format('HH:mm DD/MM/YYYY')}
                                    </Typography>
                                </Paper>
                            ))
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default StudentSlotNotificationPage;