import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Select, MenuItem, TextField, IconButton, CircularProgress, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const STATUS_OPTIONS = [
  { value: 'Not Yet', label: 'Chưa điểm danh' },
  { value: 'Absent', label: 'Vắng' },
  { value: 'Present', label: 'Có mặt' },
];

const AttendancePage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const disableEditAfterDay = !!(location?.state?.disableEditAfterDay);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    // Fetch schedule first to get classId, then call studentsbyclass with scheduleId to reuse backend logic
    api.get(`lecturer/schedules/${scheduleId}`)
      .then(res => {
        const sch = res.data?.data || null;
        setSchedule(sch);

        // Prevent direct URL access to attendance for upcoming sessions
        try {
          const now = dayjs();
          const scheduleDate = sch?.date ? dayjs(sch.date) : null;
          if (scheduleDate) {
            if (sch?.startTime) {
              const parts = String(sch.startTime).split(':').map(p => Number(p));
              const start = scheduleDate.hour(parts[0] || 0).minute(parts[1] || 0).second(0);
              if (now.isBefore(start)) {
                toast.error('Buổi học chưa diễn ra');
                navigate('/lecturer/view-teaching-schedule');
                return Promise.reject('redirected');
              }
            } else {
              if (now.isBefore(scheduleDate.startOf('day'))) {
                toast.error('Buổi học chưa diễn ra');
                navigate('/lecturer/view-teaching-schedule');
                return Promise.reject('redirected');
              }
            }
          }
        } catch (e) {
          // ignore errors in redirect logic
        }

        const classId = sch?.classId?._id || sch?.classId;
        if (!classId) throw new Error('classId not found on schedule');
        return api.get(`lecturer/studentsbyclass/${classId}?scheduleId=${scheduleId}`);
      })
      .then(res2 => {
        const studentsData = res2.data?.data || [];
        const normalizeStatus = (st) => {
          if (!st) return 'Not Yet';
          if (st === 'NotYet') return 'Not Yet';
          return st;
        };
        const roster = studentsData.map(s => {
          const status = normalizeStatus(s.attendance?.status);
          const note = s.attendance?.note || '';
          return ({
            ...s,
            statusLocal: status,
            noteLocal: note,
            // store originals to know if row is dirty
            originalStatus: status,
            originalNote: note,
          });
        });
        setStudents(roster);
      })
      .catch(err => {
        if (err === 'redirected') return; // we already redirected and showed a toast
        console.error(err);
        toast.error('Không thể tải dữ liệu điểm danh');
      })
      .finally(() => setLoading(false));
  }, [scheduleId, navigate]);

  const handleChange = (studentId, field, value) => {
    setStudents(prev => prev.map(s => s._id === studentId ? { ...s, [field === 'status' ? 'statusLocal' : 'noteLocal']: value } : s));
  };

  const saveAttendance = async (student) => {
    try {
      await api.post('lecturer/attendance/mark', {
        scheduleId,
        studentId: student._id,
        status: student.statusLocal,
        note: student.noteLocal,
        date: schedule?.date || new Date().toISOString()
      });
      toast.success('Đã lưu');
      // update original values so row is no longer dirty
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, originalStatus: s.statusLocal, originalNote: s.noteLocal } : s));
    } catch (err) {
      console.error(err);
      toast.error('Lưu thất bại');
    }
  };

  const saveAll = async () => {
    try {
      // only send changed rows
      const normalize = (st) => (st === 'NotYet' ? 'Not Yet' : st);
      const dirtyStudents = students.filter(s => (normalize(s.statusLocal) !== normalize(s.originalStatus)) || ( (s.noteLocal || '') !== (s.originalNote || '') ));
      if (dirtyStudents.length === 0) {
        toast.info('Không có thay đổi để lưu');
        return;
      }
      const payload = dirtyStudents.map(s => ({
        scheduleId,
        studentId: s._id,
        status: s.statusLocal,
        note: s.noteLocal,
        date: schedule?.date || new Date().toISOString()
      }));
      const res = await api.post('lecturer/attendance/mark', payload);
      if (res.data?.success) {
        toast.success('Hoàn tất lưu toàn bộ');
        // update originals for all saved students
        setStudents(prev => prev.map(s => {
          const isDirty = dirtyStudents.find(d => d._id === s._id);
          if (isDirty) return { ...s, originalStatus: s.statusLocal, originalNote: s.noteLocal };
          return s;
        }));
      } else {
        toast.error('Lưu toàn bộ thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lưu toàn bộ thất bại');
    }
  };

  // helper to check dirty state
  const isDirty = (s) => {
    const normalize = (st) => (st === 'NotYet' ? 'Not Yet' : st);
    return (normalize(s.statusLocal) !== normalize(s.originalStatus)) || ((s.noteLocal || '') !== (s.originalNote || ''));
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
        <Typography variant="h5">Điểm danh: {schedule?.subjectId?.subjectName || schedule?.classId?.className || 'Slot'}</Typography>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={saveAll} disabled={!students.some(isDirty) || disableEditAfterDay}>Lưu toàn bộ</Button>
      </Box>

      {disableEditAfterDay && (
        <Box sx={{ mb: 2 }}>
          <Typography color="warning.main">Chú ý: thời điểm danh đã hết vào lúc 24h00 trong ngày — giảng viên không thể chỉnh sửa trạng thái sau thời gian này.</Typography>
        </Box>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50, textAlign: 'center' }}>#</TableCell>
                <TableCell sx={{ width: 220, textAlign: 'center' }}>Sinh viên</TableCell>
                <TableCell sx={{ width: 420, textAlign: 'center' }}>Email</TableCell>
                <TableCell sx={{ width: 160, textAlign: 'center' }}>Trạng thái</TableCell>
                <TableCell sx={{ width: 300, textAlign: 'center' }}>Ghi chú</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s, idx) => (
                <TableRow key={s._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={s.studentAvatar || undefined}
                        alt={`${s.firstName} ${s.lastName}`}
                        sx={{ width: 80, height: 80, borderRadius: '8px', objectFit: 'cover' }}
                      >
                        {(!s.studentAvatar && `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`) || ''}
                      </Avatar>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 600, display: 'block' }}>{s.firstName} {s.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.studentCode}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                     <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <ToggleButtonGroup
                        exclusive
                        value={s.statusLocal === 'Not Yet' ? '' : s.statusLocal}
                        onChange={(e, newVal) => handleChange(s._id, 'status', newVal || 'Not Yet')}
                        size="small"
                        sx={{ gap: 1, minHeight: 36 }}
                        disabled={disableEditAfterDay}
                      >
                     
                        <ToggleButton
                          value="Absent"
                          sx={{ px: 1, height: 36, minWidth: 72, borderRadius: 1, '&.Mui-selected': { bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } } }}
                        >
                          Vắng 
                        </ToggleButton>
                           <ToggleButton
                          value="Present"
                          sx={{ px: 1, height: 36, minWidth: 72, borderRadius: 1, '&.Mui-selected': { bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } } }}
                        >
                          Có mặt
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField fullWidth size="small" value={s.noteLocal} onChange={(e) => handleChange(s._id, 'note', e.target.value)} disabled={disableEditAfterDay} />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" onClick={() => saveAttendance(s)} disabled={!isDirty(s) || disableEditAfterDay}>Lưu</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AttendancePage;