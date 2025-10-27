import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import lecturerAPI from '../../../../api/lecturerAPI';
import StudentsTable from './StudentsTable';

// Modal hiển thị chi tiết lớp + danh sách sinh viên
const ClassDetailModal = ({ open, onClose, group }) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // build scheduleIds set for this teaching-instance
  const scheduleIds = useMemo(() => new Set((group.schedules || []).map(s => String(s.scheduleId || s._id || s.id))), [group]);
  const totalSlots = group.totalSlots || (group.schedules || []).length;

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      // We call studentsbyclass with classId; then compute attendance counts client-side
      const resp = await lecturerAPI.getStudentsByClass(group.classId);
      if (resp && resp.data) {
        const records = resp.data; // array of student objects with attendance array
        const normalize = s => (s || '').toString().trim().toLowerCase();
        const processed = records.map(r => {
          // r is already a student object returned by backend mapping
          const attendanceArr = Array.isArray(r.attendance) ? r.attendance : (r.attendance ? [r.attendance] : []);
          const attended = attendanceArr.filter(a => scheduleIds.has(String(a.scheduleId)) && ['present', 'excused'].includes(normalize(a.status))).length;
          return {
            _id: r._id,
            studentCode: r.studentCode,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email || null,
            studentAvatar: r.studentAvatar || null,
            attended
          };
        });
        setStudents(processed);
        setStudentCount(processed.length);
      }
    } catch (err) {
      console.error('loadStudents', err);
    } finally {
      setLoading(false);
    }
  }, [group.classId, scheduleIds]);

  useEffect(() => {
    if (open) loadStudents();
  }, [open, loadStudents, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">{group.className} {group.subjectName ? `- ${group.subjectName}` : ''}</Typography>
            <Typography variant="body2">Thời gian: {group.startDate ? new Date(group.startDate).toLocaleDateString() : '-'} — {group.endDate ? new Date(group.endDate).toLocaleDateString() : '-'}</Typography>
            <Typography variant="body2">Tổng buổi: {totalSlots} — Số sinh viên: {studentCount}</Typography>
          </Box>
          <Box>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '80vh', p: 2 }}>
        <Box mb={2} display="flex" gap={1}>
          <Button variant="outlined" onClick={handleRefresh} disabled={loading}>Làm mới</Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <StudentsTable students={students} totalSlots={totalSlots} />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassDetailModal;
