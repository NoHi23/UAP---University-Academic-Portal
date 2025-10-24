import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import api from '../../services/api';

function fmtDate(d) {
    try {
        return new Date(d).toLocaleString('vi-VN');
    } catch (e) { return d; }
}

export default function ExamSchedule() {
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        api.get('student/exams')
            .then(res => {
                if (!mounted) return;
                const arr = res.data?.examSchedule || res.data?.data || res.data || [];
                setSchedules(arr);
            })
            .catch(err => {
                console.error('Failed to load exam schedule', err);
                setError(err?.response?.data?.message || err.message || 'Lỗi khi tải lịch thi');
            })
            .finally(() => mounted && setLoading(false));
        return () => mounted = false;
    }, []);

    if (loading) return <Box sx={{ p: 3 }}><Typography>Đang tải...</Typography></Box>;
    if (error) return <Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Lịch thi</Typography>
            {schedules.length === 0 && <Typography>Không có lịch thi.</Typography>}

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {schedules.map((s, idx) => {
                    // If populated via ScheduleOfStudent, s.scheduleId may hold details
                    const sched = s.scheduleId || s;
                    const subject = sched.classId?.subjectId || sched.subjectId || (sched.classId && sched.classId.subjectId) || {};
                    const room = sched.roomId?.roomName || sched.room || sched.roomId;
                    const className = sched.classId?.className || sched.className || sched.classId;
                    return (
                        <Grid item xs={12} md={6} key={idx}>
                            <Paper sx={{ p: 2 }} elevation={1}>
                                <Typography variant="h6">{subject.subjectName || subject.subjectCode || sched.subjectName || 'Môn học'}</Typography>
                                <Typography variant="body2">Mã môn: {subject.subjectCode || sched.subjectCode || '-'}</Typography>
                                <Typography variant="body2">Lớp: {className || '-'}</Typography>
                                <Typography variant="body2">Phòng: {room || '-'}</Typography>
                                <Typography variant="body2">Thời gian bắt đầu: {fmtDate(sched.date || sched.time || sched.startTime)}</Typography>
                                <Typography variant="body2">Thời gian kết thúc: {fmtDate(sched.endTime || sched.finishTime)}</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Button size="small" variant="outlined" href="#">Chi tiết</Button>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
