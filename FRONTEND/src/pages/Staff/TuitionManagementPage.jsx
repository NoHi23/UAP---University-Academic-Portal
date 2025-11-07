import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Chip,
    FormControl, InputLabel, Select, MenuItem, IconButton, Switch
} from '@mui/material';
import { FaBell, FaEyeSlash, FaEye } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import dayjs from 'dayjs';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const TuitionManagementPage = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dữ liệu cho bộ lọc
    const [semesters, setSemesters] = useState([]);
    const [majors, setMajors] = useState([]);
    
    // State bộ lọc
    const [filterSemester, setFilterSemester] = useState('');
    const [filterMajor, setFilterMajor] = useState('');
    const [filterStatus, setFilterStatus] = useState('unpaid'); // Mặc định xem ai chưa đóng

    const fetchDropdownData = async () => {
        try {
            const [semRes, majRes] = await Promise.all([
                api.get('/staff/semesters'),
                api.get('/staff/majors')
            ]);
            setSemesters(semRes.data.data);
            setMajors(majRes.data.data);
        } catch (err) {
            notifyError('Lỗi tải dữ liệu lọc.');
        }
    };

    const fetchFees = async () => {
        setLoading(true);
        try {
            const response = await api.get('/staff/tuition/fees', {
                params: {
                    semesterId: filterSemester,
                    majorId: filterMajor,
                    status: filterStatus
                }
            });
            setFees(response.data.data);
        } catch (err) {
            setError('Không thể tải danh sách khoản thu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdownData();
        fetchFees(); // Tải lần đầu với filter mặc định
    }, []); // Chỉ chạy 1 lần

    // Gọi lại khi nhấn nút Lọc
    const handleFilter = () => {
        fetchFees();
    };
    
    // Xử lý ẩn/hiện lớp
    const handleToggleVisibility = async (feeId, currentVisibility) => {
        try {
            await api.post('/staff/tuition/toggle-class-visibility', { 
                feeId: feeId, 
                isClassHidden: !currentVisibility 
            });
            notifySuccess(!currentVisibility ? 'Đã ẩn lịch học!' : 'Đã hiện lại lịch học.');
            fetchFees(); // Tải lại danh sách
        } catch (err) {
            notifyError('Cập nhật thất bại.');
        }
    };

    // Xử lý gửi nhắc nhở
    const handleSendReminder = async (feeId) => {
        const message = prompt('Nhập nội dung nhắc nhở (để trống nếu dùng mẫu):');
        if (message === null) return; // Người dùng nhấn Hủy

        try {
            const response = await api.post('/staff/tuition/remind', { feeId, message });
            notifySuccess(response.data.message);
            fetchFees();
        } catch (err) {
             notifyError('Gửi nhắc nhở thất bại.');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={2}>Quản lý Tình trạng Học phí</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Học kỳ</InputLabel>
                        <Select value={filterSemester} label="Học kỳ" onChange={(e) => setFilterSemester(e.target.value)}>
                            <MenuItem value="">Tất cả</MenuItem>
                            {semesters.map(s => <MenuItem key={s._id} value={s._id}>{s.semesterName}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Chuyên ngành</InputLabel>
                        <Select value={filterMajor} label="Chuyên ngành" onChange={(e) => setFilterMajor(e.target.value)}>
                            <MenuItem value="">Tất cả</MenuItem>
                            {majors.map(m => <MenuItem key={m._id} value={m._id}>{m.majorName}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="unpaid">Chưa đóng</MenuItem>
                            <MenuItem value="paid">Đã đóng</MenuItem>
                            <MenuItem value="overdue">Quá hạn</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={handleFilter}>Lọc</Button>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Sinh viên</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Số tiền</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Hạn chót</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Khóa lịch?</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Hành động</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fees.map(fee => (
                                    <TableRow key={fee._id}>
                                        <TableCell>
                                            {fee.studentId.lastName} {fee.studentId.firstName}
                                            <Typography variant="caption" display="block">{fee.studentId.studentCode}</Typography>
                                        </TableCell>
                                        <TableCell>{fee.studentId.accountId?.email}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={fee.status} 
                                                color={fee.status === 'paid' ? 'success' : fee.status === 'unpaid' ? 'warning' : 'error'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(fee.amount)}</TableCell>
                                        <TableCell>{dayjs(fee.deadline).format('DD/MM/YYYY')}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={fee.isClassHidden ? 'Đang khóa lịch' : 'Lịch đang hiển thị'}>
                                                <Switch
                                                    checked={fee.isClassHidden}
                                                    onChange={() => handleToggleVisibility(fee._id, fee.isClassHidden)}
                                                    color="error"
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                            {fee.status === 'unpaid' && (
                                                <Tooltip title="Gửi email nhắc nhở">
                                                    <IconButton size="small" onClick={() => handleSendReminder(fee._id)}>
                                                        <FaBell />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

export default TuitionManagementPage;