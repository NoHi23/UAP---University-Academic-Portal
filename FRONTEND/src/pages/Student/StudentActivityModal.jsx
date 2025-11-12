import React from 'react';
import { Dialog, DialogTitle, IconButton, DialogContent, Box, Card, CardContent, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import NotificationsIcon from '@mui/icons-material/Notifications'; // Thay icon cho phù hợp
import { useNavigate } from 'react-router-dom';

const StudentActivityModal = ({ open, onClose, schedule }) => {
    const navigate = useNavigate();

    // Lấy thông tin một cách an toàn
    const subjectName = schedule?.subjectId?.subjectName || '';
    const subjectCode = schedule?.subjectId?.subjectCode || '';
    const className = schedule?.classId?.className || '';
    const room = schedule?.roomId?.roomName || '';
    const time = `${schedule?.startTime || ''} - ${schedule?.endTime || ''}`;
    const lecture = `${schedule?.lecturerId?.lastName || ''} ${schedule?.lecturerId?.firstName || ''} (${schedule?.lecturerId?.lecturerCode || ''})`;
    // Lấy ID một cách an toàn
    const classId = schedule?.classId?._id;
    const scheduleId = schedule?._id;

    // Hàm xử lý điều hướng cho "Danh sách lớp"
    const handleClassmatesClick = () => {
        onClose(); // Đóng modal trước
        if (classId) {
            navigate(`/student/classmates/${classId}`); // Điều hướng đến trang danh sách lớp
        } else {
            console.warn('No classId to navigate');
        }
    };

    // Hàm xử lý điều hướng cho "Thông báo"
    const handleNotificationClick = () => {
        onClose(); // Đóng modal trước
        if (scheduleId) {
            navigate(`/student/notifications/slot/${scheduleId}`); // Điều hướng đến trang thông báo
        } else {
            console.warn('No scheduleId to navigate');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>Thông tin buổi học</Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>

                        {/* === BÊN TRÁI: DANH SÁCH LỚP === */}
                        <Card sx={{ flex: 1, cursor: 'pointer' }} onClick={handleClassmatesClick}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <Box sx={{ width: 96, height: 96, mb: 1, borderRadius: 2, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GroupIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Danh sách lớp</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                    Xem các bạn học cùng lớp {className}
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* === BÊN PHẢI: THÔNG BÁO SLOT === */}
                        <Card sx={{ flex: 1, cursor: 'pointer' }} onClick={handleNotificationClick}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <Box sx={{ width: 96, height: 96, mb: 1, borderRadius: 2, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <NotificationsIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Thông báo</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                    Xem thông báo của giảng viên cho buổi học này
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Thông tin chung của buổi học */}
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{subjectName} ({subjectCode})</Typography>
                        <Typography color="textSecondary" variant="body2">Lớp: {className}</Typography>
                        <Typography color="textSecondary" variant="body2">Phòng: {room} | Thời gian: {time}</Typography>
                        <Typography color="textSecondary" variant="body2">Giảng viên: {lecture}</Typography>

                    </Box>

                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default StudentActivityModal;