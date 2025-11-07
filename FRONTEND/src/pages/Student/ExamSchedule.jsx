import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function fmtDate(d) {
    try {
        return new Date(d).toLocaleString('vi-VN');
    } catch (e) { return d; }
}

export default function ExamSchedule() {
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [student, setStudent] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        Promise.allSettled([
            api.get('student/profile'),
            api.get('student/schedules/my-week'),
            api.get('student/exams')
        ])
            .then(results => {
                if (!mounted) return;
                const [profileRes, weekRes, examsRes] = results;

                if (profileRes.status === 'fulfilled') {
                    setStudent(profileRes.value.data);
                }

                if (weekRes.status === 'fulfilled') {
                    const t = weekRes.value.data?.timetable || weekRes.value.data || [];
                    setTimetable(t);
                }

                if (examsRes.status === 'fulfilled') {
                    const arr = examsRes.value.data?.examSchedule || examsRes.value.data?.data || examsRes.value.data || [];
                    setSchedules(arr);
                }

                if (profileRes.status !== 'fulfilled' && weekRes.status !== 'fulfilled' && examsRes.status !== 'fulfilled') {
                    const err = (examsRes.reason || profileRes.reason || weekRes.reason);
                    throw err;
                }
            })
            .catch(err => {
                console.error('Failed to load exam schedule/profile/timetable', err);
                setError(err?.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu sinh viên');
            })
            .finally(() => mounted && setLoading(false));
        return () => mounted = false;
    }, []);

    if (loading) return <Box sx={{ p: 3 }}><Typography>Đang tải...</Typography></Box>;
    if (error) return <Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>;

    return (
        <Box sx={{ p: 3, position: 'relative' }}>
            {/* Thanh tiêu đề + nút back */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton
                    component={Link}
                    to="/student/dashboard"
                    sx={{ color: '#1976d2' }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, color: '#1976d2' }}
                >
                    Lịch thi
                </Typography>
            </Box>

            {/* Thông tin sinh viên */}
            {student && (
                <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <img
                                src={student.studentAvatar || '/UAP.png'}
                                alt="avatar"
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 8,
                                    objectFit: 'cover'
                                }}
                            />
                        </Grid>
                        <Grid item xs>
                            <Typography variant="h6">
                                {student.firstName} {student.lastName}
                            </Typography>
                            <Typography variant="body2">
                                MSSV: {student.studentCode || '-'}
                            </Typography>
                            <Typography variant="body2">
                                Ngành: {student.majorId?.majorName || '-'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Thời khóa biểu tóm tắt */}
            {timetable && timetable.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }} elevation={0}>
                    <Typography variant="subtitle1">Thời khóa biểu (Tóm tắt)</Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                        {timetable.map((t, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Paper sx={{ p: 1 }} elevation={1}>
                                    <Typography variant="body2">
                                        <strong>{t.subjectName || (t.className && t.className.subjectName) || 'Môn'}</strong>
                                    </Typography>
                                    <Typography variant="caption">
                                        {t.className || t.classId?.className || ''}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Ngày: {fmtDate(t.time || t.startTime)}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Slot: {t.slot}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Lịch thi */}
            {schedules.length === 0 && <Typography>Không có lịch thi.</Typography>}

            <Grid container spacing={2} sx={{ mt: 1, justifyContent: 'flex-start' }}>
                {schedules.map((s, idx) => {
                    const sched = s.examSchedule || s.scheduleId || s;
                    const isExamShape = !!s.examSchedule;
                    const title = isExamShape
                        ? (sched.courseName || 'Môn học')
                        : (sched.classId?.subjectId?.subjectName || sched.subjectId?.subjectName || sched.subjectName || 'Môn học');
                    const room = isExamShape
                        ? (sched.room || sched.roomId?.roomName)
                        : (sched.roomId?.roomName || sched.room || sched.roomId);
                    const startTime = isExamShape
                        ? (sched.examDate || sched.time)
                        : (sched.date || sched.time || sched.startTime);
                    const endTime = isExamShape
                        ? null
                        : (sched.endTime || sched.finishTime);
                    const note = sched.note;
                    const attendStatus = s.attendStatus || s.attendance || null;

                    return (
                        <Grid item xs={12} sm={6} md={2.4} key={idx}>
                            <Paper sx={{ p: 2, height: '100%' }} elevation={1}>
                                <Typography variant="h6">{title}</Typography>
                                <Typography variant="body2">Phòng: {room || '-'}</Typography>
                                <Typography variant="body2">Thời gian: {fmtDate(startTime)}</Typography>
                                {endTime && (
                                    <Typography variant="body2">
                                        Thời gian kết thúc: {fmtDate(endTime)}
                                    </Typography>
                                )}
                                {note && (
                                    <Typography variant="body2">
                                        Ghi chú: {note}
                                    </Typography>
                                )}
                                {attendStatus && (
                                    <Typography variant="body2">
                                        Trạng thái điểm danh: {attendStatus}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
