import React, { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog, DialogTitle, IconButton, DialogContent, Box, Card, CardContent,
  Grid, Typography, Avatar, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Divider, useTheme, useMediaQuery
} from '@mui/material';
import api from '../../../../services/api';

const DetailSlotModal = ({ open, onClose, scheduleId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [students, setStudents] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!open || !scheduleId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`lecturer/schedules/${scheduleId}`);
        if (!res.data || !res.data.success) throw new Error(res.data?.message || 'Không thể lấy dữ liệu lịch');
        const sch = res.data.data;
        if (!mounted) return;
        setSchedule(sch);

        if (sch.classId && sch.classId._id) {
        const studentsRes = await api.get(`/lecturer/studentsbyclass/${sch.classId._id}`);
        // backend may return either an envelope { success, data: [...] } or a raw array => normalize
        const rawStudents = studentsRes.data?.data ?? studentsRes.data ?? [];
        // sanitize studentAvatar (remove accidental surrounding quotes/spaces) and log for debug
        const normalized = (Array.isArray(rawStudents) ? rawStudents : [])
          .map(s => ({
              ...s,
              studentAvatar: typeof s?.studentAvatar === 'string'
                ? s.studentAvatar.replace(/^['"]|['"]$/g, '').trim()
                : s?.studentAvatar || null
            }));
        setStudents(normalized);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [open, scheduleId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { maxHeight: '85vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>Chi tiết tiết học</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 0, py: 0, overflowX: 'auto', overflowY: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>
        ) : error ? (
          <Box p={2}><Typography color="error">{error}</Typography></Box>
        ) : !schedule ? (
          <Box p={2}><Typography>Không tìm thấy thông tin tiết học.</Typography></Box>
        ) : (
          <Box p={3} sx={{ minWidth: { xs: 'auto', md: 720 } }}>
            <Card elevation={3}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" gutterBottom>{schedule.subjectId?.subjectName || '—'}</Typography>
                    <Typography color="textSecondary">Mã môn: {schedule.subjectId?.subjectCode || '—'}</Typography>
                    <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                      <Typography><strong>Lớp:</strong> {schedule.classId?.className || '—'}</Typography>
                      <Typography><strong>Phòng:</strong> {schedule.roomId?.roomName || schedule.roomId?.roomCode || '—'}</Typography>
                      <Typography><strong>Ngày:</strong> {schedule.date ? new Date(schedule.date).toLocaleDateString() : '—'}</Typography>
                      <Typography><strong>Giờ:</strong> {schedule.startTime ? `${schedule.startTime} - ${schedule.endTime}` : '—'}</Typography>
                      <Typography><strong>Slot:</strong> {schedule.slot || '—'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 72, height: 72 }}>{(schedule.lecturerId?.firstName?.[0] || '') + (schedule.lecturerId?.lastName?.[0] || '')}</Avatar>
                      <Box>
                        <Typography variant="subtitle1">{schedule.lecturerId ? `${schedule.lecturerId.firstName || ''} ${schedule.lecturerId.lastName || ''}` : '—'}</Typography>
                        <Typography color="textSecondary">{schedule.lecturerId?.email || ''}</Typography>
                        {/* Hiển thị mã giảng viên nếu model có trường lecturerCode */}
                        <Typography color="textSecondary">Mã giảng viên: {schedule.lecturerId?.lecturerCode || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Danh sách sinh viên ({students.length})</Typography>
                {students.length === 0 ? (
                  <Typography color="textSecondary">Không có sinh viên trong lớp này.</Typography>
                ) : isMobile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {students.map((s, idx) => (
                      <Card key={s._id} variant="outlined">
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item>
                              <Avatar
                                src={s.studentAvatar || null}
                                alt={`${s.firstName || ''} ${s.lastName || ''}`}
                                sx={{ width: 100, height: 125, borderRadius: '8px', bgcolor: !s.studentAvatar ? 'grey.200' : 'transparent' }}
                                imgProps={{ style: { objectFit: 'cover' }, onLoad: (e) => { const img = e.currentTarget; if (img.naturalWidth === 1 && img.naturalHeight === 1) img.src = ''; }, onError: (e) => { e.currentTarget.src = ''; } }}
                              >
                                {(s.firstName?.[0] || '') + (s.lastName?.[0] || '')}
                              </Avatar>
                            </Grid>
                            <Grid item xs>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</Typography>
                              <Typography color="textSecondary">Mã SV: {s.studentCode || s._id}</Typography>
                              <Typography color="textSecondary">{s.email || s.phone || '—'}</Typography>
                            </Grid>
                            <Grid item>
                              <Typography color="textSecondary">#{idx + 1}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 720 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ảnh</TableCell>
                          <TableCell>STT</TableCell>
                          <TableCell>Mã SV</TableCell>
                          <TableCell>Họ tên</TableCell>
                          <TableCell>Thông tin liên hệ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((s, idx) => (
                          <TableRow key={s._id} hover>
                            <TableCell>
                              <Avatar
                                src={s.studentAvatar || null}
                                alt={`${s.firstName || ''} ${s.lastName || ''}`}
                                sx={{ width: 120, height: 150, borderRadius: '8px', bgcolor: !s.studentAvatar ? 'grey.200' : 'transparent' }}
                                imgProps={{ style: { objectFit: 'cover' }, onLoad: (e) => { const img = e.currentTarget; if (img.naturalWidth === 1 && img.naturalHeight === 1) img.src = ''; }, onError: (e) => { e.currentTarget.src = ''; } }}
                              >
                                {(s.firstName?.[0] || '') + (s.lastName?.[0] || '')}
                              </Avatar>
                            </TableCell>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{s.studentCode || s._id}</TableCell>
                            <TableCell>{s.firstName} {s.lastName}</TableCell>
                            <TableCell>{s.email || s.phone || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetailSlotModal;
