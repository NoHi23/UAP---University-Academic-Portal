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
    const [student, setStudent] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        // Fetch student profile, weekly timetable and exam schedule in parallel
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
                    // controller returns { timetable: [...] }
                    const t = weekRes.value.data?.timetable || weekRes.value.data || [];
                    setTimetable(t);
                }

                if (examsRes.status === 'fulfilled') {
                    const arr = examsRes.value.data?.examSchedule || examsRes.value.data?.data || examsRes.value.data || [];
                    setSchedules(arr);
                }

                // if all three failed, set error
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
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Lịch thi</Typography>

            {/* Student summary */}
            {student && (
                <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <img src={student.studentAvatar || '/UAP.png'} alt="avatar" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                        </Grid>
                        <Grid item xs>
                            <Typography variant="h6">{student.firstName} {student.lastName}</Typography>
                            <Typography variant="body2">MSSV: {student.studentCode || '-'}</Typography>
                            <Typography variant="body2">Ngành: {student.majorId?.majorName || '-'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Weekly timetable summary (compact) */}
            {timetable && timetable.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }} elevation={0}>
                    <Typography variant="subtitle1">Thời khóa biểu (Tóm tắt)</Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                        {timetable.map((t, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Paper sx={{ p: 1 }} elevation={1}>
                                    <Typography variant="body2"><strong>{t.subjectName || (t.className && t.className.subjectName) || 'Môn'}</strong></Typography>
                                    <Typography variant="caption">{t.className || t.classId?.className || ''}</Typography>
                                    <Typography variant="caption" display="block">Ngày: {fmtDate(t.time || t.startTime)}</Typography>
                                    <Typography variant="caption" display="block">Slot: {t.slot}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {schedules.length === 0 && <Typography>Không có lịch thi.</Typography>}

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {schedules.map((s, idx) => {
                    // API may return items in two shapes:
                    // - { examSchedule: { ... }, attendStatus }
                    // - or a populated Schedule-like object directly
                    const sched = s.examSchedule || s.scheduleId || s;

                    // If this is an examSchedule record, its primary fields are:
                    // courseName, examDate, time, room, note
                    const isExamShape = !!s.examSchedule;

                    const title = isExamShape ? (sched.courseName || 'Môn học') : (sched.classId?.subjectId?.subjectName || sched.subjectId?.subjectName || sched.subjectName || 'Môn học');
                    const code = isExamShape ? (sched.courseCode || '') : (sched.classId?.subjectId?.subjectCode || sched.subjectId?.subjectCode || sched.subjectCode || '-');
                    const room = isExamShape ? (sched.room || sched.roomId?.roomName) : (sched.roomId?.roomName || sched.room || sched.roomId);
                    const className = isExamShape ? (s.className || '') : (sched.classId?.className || sched.className || sched.classId);
                    const startTime = isExamShape ? (sched.examDate || sched.time) : (sched.date || sched.time || sched.startTime);
                    const endTime = isExamShape ? null : (sched.endTime || sched.finishTime);
                    const note = isExamShape ? sched.note : sched.note;
                    const attendStatus = s.attendStatus || s.attendance || null;

                    return (
                        <Grid item xs={12} md={6} key={idx}>
                            <Paper sx={{ p: 2 }} elevation={1}>
                                <Typography variant="h6">{title}</Typography>

                                <Typography variant="body2">Phòng: {room || '-'}</Typography>
                                <Typography variant="body2">Thời gian: {fmtDate(startTime)}</Typography>
                                {endTime && <Typography variant="body2">Thời gian kết thúc: {fmtDate(endTime)}</Typography>}
                                {note && <Typography variant="body2">Ghi chú: {note}</Typography>}
                                {attendStatus && <Typography variant="body2">Trạng thái điểm danh: {attendStatus}</Typography>}
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
