import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const TuitionConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho form tạo mới
  const [newMajorId, setNewMajorId] = useState('');
  const [newSemesterNo, setNewSemesterNo] = useState('');
  const [newBaseAmount, setNewBaseAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // State cho sửa (edit)
  const [isEditing, setIsEditing] = useState(null); // Lưu ID
  const [editAmount, setEditAmount] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, majorRes] = await Promise.all([
        api.get('/staff/tuition/config'),
        api.get('/staff/majors')
      ]);
      setConfigs(configRes.data.data);
      setMajors(majorRes.data.data);
    } catch (err) {
      setError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/staff/tuition/config', {
        majorId: newMajorId,
        semesterNo: Number(newSemesterNo),
        baseAmount: Number(newBaseAmount)
      });
      notifySuccess('Tạo mức thu thành công!');
      setNewMajorId(''); setNewSemesterNo(''); setNewBaseAmount('');
      fetchData(); // Tải lại
    } catch (err) {
      notifyError(err.response?.data?.message || 'Tạo thất bại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa mức thu này?')) {
      try {
        await api.delete(`/staff/tuition/config/${id}`);
        notifySuccess('Xóa thành công.');
        fetchData();
      } catch (err) {
        notifyError('Xóa thất bại.');
      }
    }
  };

  const handleEditSave = async (id) => {
    try {
      await api.put(`/staff/tuition/config/${id}`, { baseAmount: Number(editAmount) });
      notifySuccess('Cập nhật thành công.');
      setIsEditing(null);
      fetchData();
    } catch (err) {
      notifyError('Cập nhật thất bại.');
    }
  };

  if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ textAlign: 'center', mt: 5 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2}>Tạo Bảng giá Học phí mới</Typography>
        <form onSubmit={handleCreate}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ flex: 3 }}>
              <InputLabel>Chuyên ngành</InputLabel>
              <Select value={newMajorId} label="Chuyên ngành" onChange={(e) => setNewMajorId(e.target.value)}>
                {majors.map(m => <MenuItem key={m._id} value={m._id}>{m.majorName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Kỳ số</InputLabel>
              <Select value={newSemesterNo} label="Kỳ số" onChange={(e) => setNewSemesterNo(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Mức phí (VND)"
              type="number"
              size="small"
              value={newBaseAmount}
              onChange={(e) => setNewBaseAmount(e.target.value)}
              sx={{ flex: 2 }}
            />
            <Button type="submit" variant="contained" disabled={isCreating} startIcon={<FaPlus />}>
              Thêm
            </Button>
          </Box>
        </form>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2}>Bảng giá Học phí Hiện tại</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Chuyên ngành</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Kỳ số</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Mức phí (VND)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map(config => (
                <TableRow key={config._id}>
                  <TableCell>{config.majorId?.majorName || 'N/A'}</TableCell>
                  <TableCell align="center">{config.semesterNo}</TableCell>
                  <TableCell align="right">
                    {isEditing === config._id ? (
                      <TextField
                        size="small"
                        type="number"
                        defaultValue={config.baseAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                      />
                    ) : (
                      formatCurrency(config.baseAmount)
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {isEditing === config._id ? (
                      <>
                        <IconButton size="small" onClick={() => handleEditSave(config._id)}><FaSave color="green" /></IconButton>
                        <IconButton size="small" onClick={() => setIsEditing(null)}><FaTimes /></IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => { setIsEditing(config._id); setEditAmount(config.baseAmount); }}><FaEdit /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(config._id)}><FaTrash color="red" /></IconButton>
                      </>
                    )}
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

export default TuitionConfigPage;