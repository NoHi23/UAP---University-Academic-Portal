import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { Box, Card, CardContent, Grid, Typography, Avatar, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Divider } from '@mui/material';

const DetailSlotPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`lecturer/schedules/${id}`);
        if (!res.data || !res.data.success) throw new Error(res.data?.message || 'Không thể lấy dữ liệu lịch');
        const sch = res.data.data;
        setSchedule(sch);

        if (sch.classId && sch.classId._id) {
          const studentsRes = await api.get(`lecturer/studentsbyclass/${sch.classId._id}`);
          setStudents(studentsRes.data || []);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>;
  if (error) return <Box p={2}><Typography color="error">{error}</Typography></Box>;
  if (!schedule) return <Box p={2}><Typography>Không tìm thấy thông tin tiết học.</Typography></Box>;

  const { subjectId, classId, roomId, lecturerId, date, slot, startTime, endTime } = schedule;

  return (
    <Box p={3}>
      <Card elevation={3}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>{subjectId?.subjectName || '—'}</Typography>
              <Typography color="textSecondary">Mã môn: {subjectId?.subjectCode || '—'}</Typography>
              <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                <Typography><strong>Lớp:</strong> {classId?.className || '—'}</Typography>
                <Typography><strong>Phòng:</strong> {roomId?.roomName || roomId?.roomCode || '—'}</Typography>
                <Typography><strong>Ngày:</strong> {date ? new Date(date).toLocaleDateString() : '—'}</Typography>
                <Typography><strong>Giờ:</strong> {startTime ? `${startTime} - ${endTime}` : '—'}</Typography>
                <Typography><strong>Slot:</strong> {slot || '—'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 72, height: 72 }}>{(lecturerId?.firstName?.[0] || '') + (lecturerId?.lastName?.[0] || '')}</Avatar>
                <Box>
                  <Typography variant="subtitle1">{lecturerId ? `${lecturerId.firstName || ''} ${lecturerId.lastName || ''}` : '—'}</Typography>
                  <Typography color="textSecondary">{lecturerId?.email || ''}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>Danh sách sinh viên ({students.length})</Typography>
          {students.length === 0 ? (
            <Typography color="textSecondary">Không có sinh viên trong lớp này.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Mã SV</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, idx) => (
                  <TableRow key={s._id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{s.studentCode || s._id}</TableCell>
                    <TableCell>{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.email || s.phone || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DetailSlotPage;
