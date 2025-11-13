import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Chip,
    FormControl, InputLabel, Select, MenuItem, IconButton, Switch, Checkbox,
    TextField, Divider
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

    const [semesters, setSemesters] = useState([]);
    const [majors, setMajors] = useState([]);

    const [filterSemester, setFilterSemester] = useState('');
    const [filterMajor, setFilterMajor] = useState('');
    const [filterStatus, setFilterStatus] = useState('unpaid');

    const [bulkMessage, setBulkMessage] = useState('');
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);

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
                    status: filterStatus,
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
        fetchFees(); 
    }, []); 

    const handleFilter = () => {
        fetchFees();
    };

    const handleToggleVisibility = async (feeId) => {
        try {
            const response = await api.post('/staff/tuition/toggle-class-visibility', { feeId });
            notifySuccess(response.data.message);
            fetchFees(); 
        } catch (err) {
            notifyError('Cập nhật thất bại.');
        }
    };

    const handleSendReminder = async (feeId) => {
        const message = prompt('Nhập nội dung nhắc nhở (để trống nếu dùng mẫu):');
        if (message === null) return; 

        try {
            const response = await api.post('/staff/tuition/remind', { feeId, message });
            notifySuccess(response.data.message);
            fetchFees();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Gửi nhắc nhở thất bại.');
        }
    };

    const getFilterPayload = () => ({
        semesterId: filterSemester || undefined,
        majorId: filterMajor || undefined,
        status: filterStatus || 'unpaid', 
    });

    const handleBulkRemindByFilter = async () => {
        const filters = getFilterPayload();
        if (!filters.semesterId && !filters.majorId && !filters.status) {
            return notifyError('Vui lòng chọn ít nhất một bộ lọc (Kỳ, Ngành hoặc Trạng thái).');
        }
        if (!window.confirm(`Bạn có chắc muốn gửi thông báo cho TẤT CẢ sinh viên khớp bộ lọc?`)) return;

        setIsProcessingBulk(true);
        try {
            const response = await api.post('/staff/tuition/bulk-remind-by-filter', {
                ...filters,
                message: bulkMessage || undefined
            });
            notifySuccess(response.data.message);
            setBulkMessage('');
            fetchFees();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Gửi hàng loạt thất bại.');
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const handleBulkHideByFilter = async (isHidden) => {
        const filters = getFilterPayload();
        if (!filters.semesterId && !filters.majorId && !filters.status) {
            return notifyError('Vui lòng chọn ít nhất một bộ lọc (Kỳ, Ngành hoặc Trạng thái).');
        }
        const actionText = isHidden ? "KHÓA" : "MỞ";
        if (!window.confirm(`Bạn có chắc muốn ${actionText} lịch học của TẤT CẢ sinh viên khớp bộ lọc?`)) return;

        setIsProcessingBulk(true);
        try {
            const response = await api.post('/staff/tuition/bulk-toggle-visibility-by-filter', {
                ...filters,
                isClassHidden: isHidden
            });
            notifySuccess(response.data.message);
            fetchFees();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Cập nhật hàng loạt thất bại.');
        } finally {
            setIsProcessingBulk(false);
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
                {/* ------------------------------------------- */}
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                {/* --- KHU VỰC HÀNH ĐỘNG HÀNG LOẠT (THEO BỘ LỌC) --- */}
                <Box sx={{ p: 2, mb: 2, border: '1px solid #eee', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Hành động hàng loạt (Áp dụng cho bộ lọc hiện tại)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <TextField
                            label="Nội dung thông báo / nhắc nhở (tùy chọn)"
                            variant="outlined"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={bulkMessage}
                            onChange={(e) => setBulkMessage(e.target.value)}
                            disabled={isProcessingBulk}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleBulkRemindByFilter}
                                disabled={isProcessingBulk}
                                startIcon={isProcessingBulk ? <CircularProgress size={16} /> : <FaBell />}
                                sx={{ minWidth: '120px' }}
                            >
                                Gửi thông báo
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => handleBulkHideByFilter(true)} // Khóa
                                disabled={isProcessingBulk}
                                startIcon={isProcessingBulk ? <CircularProgress size={16} /> : <FaEyeSlash />}
                                sx={{ minWidth: '120px' }}
                            >
                                Khóa lịch
                            </Button>
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={() => handleBulkHideByFilter(false)} // Mở
                                disabled={isProcessingBulk}
                                startIcon={isProcessingBulk ? <CircularProgress size={16} /> : <FaEye />}
                                sx={{ minWidth: '120px' }}
                            >
                                Mở khóa
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    Danh sách chi tiết ({fees.length} kết quả)
                </Typography>

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
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Nhắc lẻ</TableCell>
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
                                            <Tooltip title={fee.isClassHidden ? 'Đang khóa lịch (Nhấn để Mở)' : 'Lịch đang hiển thị (Nhấn để Khóa)'}>
                                                <Switch
                                                    checked={fee.isClassHidden}
                                                    onChange={() => handleToggleVisibility(fee._id)}
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