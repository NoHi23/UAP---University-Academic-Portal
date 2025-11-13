import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField, Pagination, Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { FaEdit, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';

const ManageClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [allLecturers, setAllLecturers] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [newLecturerId, setNewLecturerId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, lecRes, roomRes] = await Promise.all([
        api.get('/staff/classes'),
        api.get('/manage/users/lecturers'),
        api.get('/staff/rooms'),
      ]);
      setClasses(classRes.data.data);
      setAllLecturers(lecRes.data.data);
      setAllRooms(roomRes.data.data);
    } catch (err) {
      notifyError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);





  const lecturersForSelectedMajor = useMemo(() => {
    if (!selectedClass || !selectedClass.majorId) {
      return allLecturers;
    }
    return allLecturers.filter(l => l.majorId?._id === selectedClass.majorId);
  }, [selectedClass, allLecturers]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery) {
      return classes;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return classes.filter(cls =>
      cls.className.toLowerCase().includes(lowerCaseQuery) ||
      cls.subjectId?.subjectCode.toLowerCase().includes(lowerCaseQuery) ||
      (cls.lecturerId && `${cls.lecturerId.lastName} ${cls.lecturerId.firstName}`.toLowerCase().includes(lowerCaseQuery))
    );
  }, [searchQuery, classes]);


  useEffect(() => {
    setPage(1);
  }, [searchQuery, rowsPerPage]);

  const total = filteredClasses.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  const handleOpenModal = (cls) => {
    setSelectedClass(cls);
    setNewLecturerId(cls.lecturerId?._id || '');
    setNewRoomId(cls.roomId?._id || '');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedClass(null);
  };

  const handleSaveReassignment = async () => {
    if (!newLecturerId && !newRoomId) {
      return notifyError('Phải chọn ít nhất Giảng viên hoặc Phòng mới.');
    }
    setIsSaving(true);
    try {
      await api.put(`/staff/classes/${selectedClass._id}/reassign`, {
        newLecturerId: newLecturerId,
        newRoomId: newRoomId
      });
      notifySuccess('Phân công lại lớp thành công!');
      handleCloseModal();
      fetchData();
    } catch (err) {
      notifyError(err.response?.data?.message || 'Phân công thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2}>Quản lý Phân công Lớp học (Move Lớp)</Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo Tên lớp, Mã môn, hoặc Tên Giảng viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên Lớp</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Môn học</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giảng viên Hiện tại</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Phòng học Hiện tại</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClasses.map(cls => (
                <TableRow key={cls._id}>
                  <TableCell>{cls.className}</TableCell>
                  <TableCell>{cls.subjectId?.subjectCode}</TableCell>
                  <TableCell>{cls.lecturerId ? `${cls.lecturerId.lastName} ${cls.lecturerId.firstName}` : 'N/A'}</TableCell>
                  <TableCell>{cls.roomId?.roomName || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Phân công lại (Move Lớp)">
                      <IconButton size="small" onClick={() => handleOpenModal(cls)}>
                        <FaEdit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2">Số dòng/trang:</Typography>
            <FormControl size="small">
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2">{`Hiển thị ${Math.min(startIndex + 1, total)}-${Math.min(endIndex, total)} của ${total}`}</Typography>
          </Box>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      </Paper>

      {/* --- Modal Sửa --- */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>Phân công lại Lớp: {selectedClass?.className}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Giảng viên Mới (Đã lọc theo chuyên ngành)</InputLabel>
              <Select value={newLecturerId} label="Giảng viên Mới (Đã lọc theo chuyên ngành)" onChange={(e) => setNewLecturerId(e.target.value)}>
                {lecturersForSelectedMajor.map(l => ( // <-- SỬA Ở ĐÂY
                  <MenuItem key={l._id} value={l._id}>{l.lastName} {l.firstName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Phòng học Mới</InputLabel>
              <Select value={newRoomId} label="Phòng học Mới" onChange={(e) => setNewRoomId(e.target.value)}>
                {allRooms.map(r => (
                  <MenuItem key={r._id} value={r._id}>{r.roomName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="warning">
              Lưu ý: Hành động này sẽ ghi đè Giảng viên/Phòng học cho TẤT CẢ các buổi học của lớp này và không kiểm tra xung đột.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">Hủy</Button>
          <Button onClick={handleSaveReassignment} variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} /> : 'Lưu Thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageClassesPage;