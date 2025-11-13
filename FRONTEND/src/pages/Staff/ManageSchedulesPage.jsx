import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { FaArrowsAltV } from 'react-icons/fa';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import dayjs from 'dayjs';

const ManageSchedulesPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [allLecturers, setAllLecturers] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allClasses, setAllClasses] = useState([]);

  const [filterSemester, setFilterSemester] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterLecturer, setFilterLecturer] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editData, setEditData] = useState({ newDate: null, newSlot: '', newRoomId: '', newLecturerId: '' });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [semRes, lecRes, roomRes, classRes] = await Promise.all([
          api.get('/staff/semesters'),
          api.get('/manage/users/lecturers'),
          api.get('/staff/rooms'),
          api.get('/staff/classes')
        ]);
        setSemesters(semRes.data.data);
        setAllLecturers(lecRes.data.data);
        setAllRooms(roomRes.data.data);
        setAllClasses(classRes.data.data);
      } catch (err) { notifyError('Lỗi tải dữ liệu filters.'); }
    };
    fetchFilters();
  }, []);

  const lecturersForSelectedMajor = useMemo(() => {
    if (!selectedSchedule) return allLecturers;

    let majorId = selectedSchedule.lecturerId?.majorId?._id;

    if (!majorId) {
      const classInfo = allClasses.find(c => c._id === selectedSchedule.classId?._id);
      majorId = classInfo?.majorId;
    }

    if (majorId) {
      return allLecturers.filter(l => l.majorId?._id === majorId);
    }

    return allLecturers;
  }, [selectedSchedule, allLecturers, allClasses]);

  const handleFilter = async () => {
    if (!filterSemester && !filterClass && !filterLecturer) {
      return notifyError('Vui lòng chọn ít nhất một bộ lọc.');
    }
    setLoading(true);
    try {
      const response = await api.get('/scheduling/schedules/filter', {
        params: {
          semesterId: filterSemester,
          classId: filterClass,
          lecturerId: filterLecturer
        }
      });
      setSchedules(response.data.data);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Lỗi khi lọc TKB.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (schedule) => {
    setSelectedSchedule(schedule);
    setEditData({
      newDate: dayjs(schedule.date),
      newSlot: schedule.slot,
      newRoomId: schedule.roomId?._id || '',
      newLecturerId: schedule.lecturerId?._id || ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSchedule(null);
  };

  const handleSaveMove = async () => {
    setIsSaving(true);
    try {
      await api.put(`/scheduling/schedules/${selectedSchedule._id}/move`, {
        newDate: editData.newDate.toISOString(),
        newSlot: editData.newSlot,
        newRoomId: editData.newRoomId,
        newLecturerId: editData.newLecturerId
      });
      notifySuccess('Di chuyển buổi học thành công!');
      handleCloseModal();
      handleFilter();
    } catch (err) {
      notifyError(err.response?.data?.message || 'Di chuyển thất bại (có thể bị trùng lịch).');
    } finally {
      setIsSaving(false);
    }
  };

  const slots = [1, 2, 3, 4, 5, 6];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} mb={2}>Quản lý Thời khóa biểu (Move Slot)</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Học kỳ</InputLabel>
              <Select value={filterSemester} label="Học kỳ" onChange={(e) => setFilterSemester(e.target.value)}>
                <MenuItem value="">Bỏ chọn</MenuItem>
                {semesters.map(s => <MenuItem key={s._id} value={s._id}>{s.semesterName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Lớp học</InputLabel>
              <Select value={filterClass} label="Lớp học" onChange={(e) => setFilterClass(e.target.value)}>
                <MenuItem value="">Bỏ chọn</MenuItem>
                {allClasses.map(c => <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Giảng viên</InputLabel>
              <Select value={filterLecturer} label="Giảng viên" onChange={(e) => setFilterLecturer(e.target.value)}>
                <MenuItem value="">Bỏ chọn</MenuItem>
                {allLecturers.map(l => <MenuItem key={l._id} value={l._id}>{l.lastName} {l.firstName}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleFilter}>Lọc</Button>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          {loading ? <CircularProgress /> : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ngày</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Slot</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Môn học (Lớp)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Giảng viên</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Phòng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map(sch => (
                    <TableRow key={sch._id}>
                      <TableCell>{dayjs(sch.date).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{sch.slot}</TableCell>
                      <TableCell>{sch.subjectId?.subjectCode} ({sch.classId?.className})</TableCell>
                      <TableCell>{sch.lecturerId ? `${sch.lecturerId.lastName} ${sch.lecturerId.firstName}` : 'N/A'}</TableCell>
                      <TableCell>{sch.roomId?.roomName || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Di chuyển buổi học này (Move Slot)">
                          <IconButton size="small" onClick={() => handleOpenModal(sch)}>
                            <FaArrowsAltV />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* --- Modal Di chuyển Slot --- */}
        <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
          <DialogTitle>Di chuyển Buổi học</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <DatePicker
                label="Ngày học mới"
                value={editData.newDate}
                onChange={(newValue) => setEditData(p => ({ ...p, newDate: newValue }))}
              />
              <FormControl fullWidth>
                <InputLabel>Slot mới</InputLabel>
                <Select value={editData.newSlot} label="Slot mới" onChange={(e) => setEditData(p => ({ ...p, newSlot: e.target.value }))}>
                  {slots.map(s => (
                    <MenuItem key={s} value={s}>Slot {s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Giảng viên mới (Đã lọc theo chuyên ngành)</InputLabel>
                <Select value={editData.newLecturerId} label="Giảng viên mới (Đã lọc theo chuyên ngành)" onChange={(e) => setEditData(p => ({ ...p, newLecturerId: e.target.value }))}>
                  {lecturersForSelectedMajor.map(l => ( // <-- SỬA Ở ĐÂY
                    <MenuItem key={l._id} value={l._id}>{l.lastName} {l.firstName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Phòng học mới</InputLabel>
                <Select value={editData.newRoomId} label="Phòng học mới" onChange={(e) => setEditData(p => ({ ...p, newRoomId: e.target.value }))}>
                  {allRooms.map(r => (
                    <MenuItem key={r._id} value={r._id}>{r.roomName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="secondary">Hủy</Button>
            <Button onClick={handleSaveMove} variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} /> : 'Kiểm tra & Lưu'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default ManageSchedulesPage;