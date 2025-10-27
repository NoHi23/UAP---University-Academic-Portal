import React, { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Dialog, DialogTitle, IconButton, DialogContent, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Avatar, Typography, CircularProgress, Card, CardContent
} from '@mui/material';
import api from '../../../../services/api';

// Modal to show attendance list for a given scheduleId
// Props: open, onClose, scheduleId
export default function SlotAttendanceModal({ open, onClose, scheduleId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [scheduleInfo, setScheduleInfo] = useState(null);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!open || !scheduleId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setStudents([]);
        setScheduleInfo(null);

        // fetch schedule to get classId
        const schRes = await api.get(`lecturer/schedules/${scheduleId}`);
        if (!schRes?.data?.success) throw new Error(schRes?.data?.message || 'Không thể lấy thông tin buổi');
        const sch = schRes.data.data;
        if (!mounted) return;
        setScheduleInfo(sch);

        const classId = sch.classId?._id || sch.classId;
        if (!classId) {
          setError('Không xác định được lớp của buổi học');
          setStudents([]);
          return;
        }

        // fetch students of class including attendance for this schedule
        const stuRes = await api.get(`lecturer/studentsbyclass/${classId}?scheduleId=${scheduleId}`);
        const raw = stuRes?.data?.data ?? stuRes?.data ?? [];
        const normalized = (Array.isArray(raw) ? raw : []).map((s) => ({
          _id: s._id,
          studentCode: s.studentCode,
          studentAvatar: typeof s.studentAvatar === 'string' ? s.studentAvatar.replace(/^['"]|['"]$/g, '').trim() : (s.studentAvatar || null),
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          attendance: s.attendance || null
        }));
        if (!mounted) return;
        setStudents(normalized);
      } catch (err) {
        console.error('SlotAttendanceModal load error', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Lỗi khi tải danh sách sinh viên');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [open, scheduleId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { maxHeight: '85vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6">Danh sách điểm danh</Typography>
          <Typography variant="caption">{scheduleInfo ? `${scheduleInfo.subjectId?.subjectName || ''} • ${scheduleInfo.classId?.className || ''}` : ''}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          isSmall ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {students.map((s, idx) => (
                <Card key={s._id || idx} variant="outlined">
                  <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar src={s.studentAvatar || null} alt={`${s.firstName || ''} ${s.lastName || ''}`} sx={{ width: 100, height: 125, borderRadius: 1 }} imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%' } }} />
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</Typography>
                      <Typography variant="body2">Mã SV: {s.studentCode || s._id}</Typography>
                      <Typography variant="body2">Email: {s.email || '—'}</Typography>
                      <Typography variant="body2">STT: {idx + 1}</Typography>
                      <Typography variant="body2">Trạng thái: {s.attendance?.status || 'Not Yet'}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ảnh</TableCell>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã SV</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s, idx) => (
                    <TableRow key={s._id || idx} hover>
                      <TableCell>
                        <Avatar
                          src={s.studentAvatar || null}
                          alt={`${s.firstName || ''} ${s.lastName || ''}`}
                          sx={{ width: 100, height: 125, borderRadius: 1 }}
                          imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%' } }}
                        />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{s.studentCode || s._id}</TableCell>
                      <TableCell>{s.firstName} {s.lastName}</TableCell>
                      <TableCell>{s.email || '—'}</TableCell>
                      <TableCell>{s.attendance?.status || 'Not Yet'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

