import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress,
    Alert, Divider, Chip
} from '@mui/material';
import { FaMoneyBillWave, FaFileInvoiceDollar } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import dayjs from 'dayjs';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const PayTuitionPage = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payingId, setPayingId] = useState(null); // State loading cho từng nút

    const fetchFees = async () => {
        setLoading(true);
        try {
            // API này chỉ trả về các khoản CHƯA ĐÓNG và CÒN HẠN
            const response = await api.get('/student/tuition/my-fees');
            setFees(response.data.data);
        } catch (err) {
            setError('Không thể tải các khoản phí. Lịch học của bạn có thể đã bị khóa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const handlePayment = async (feeId) => {
        setPayingId(feeId); // Bắt đầu loading cho nút này
        try {
            // 1. Gọi API backend để lấy link VNPAY
            const response = await api.post('/student/tuition/create-payment-url', { feeId });
            
            if (response.data.paymentUrl) {
                // 2. Chuyển hướng người dùng sang trang VNPAY
                window.location.href = response.data.paymentUrl;
            } else {
                notifyError('Không thể tạo link thanh toán.');
            }
        } catch (err) {
            notifyError(err.response?.data?.message || 'Thanh toán thất bại.');
            setPayingId(null); // Dừng loading
        }
        // Không cần `finally` ở đây vì trang sẽ chuyển hướng
    };

    if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    if (error) return <Container sx={{ textAlign: 'center', mt: 5 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <FaFileInvoiceDollar size={32} color="#1976d2" />
                    <Typography variant="h5" fontWeight={600}>
                        Thanh toán Học phí
                    </Typography>
                </Box>

                {fees.length === 0 ? (
                    <Box sx={{ textAlign: 'center', my: 5 }}>
                        <Typography variant="h6">Bạn không có khoản thu nào cần thanh toán.</Typography>
                        <Typography color="textSecondary">Các khoản phí đã đóng hoặc quá hạn sẽ nằm trong Lịch sử Giao dịch.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {fees.map(fee => (
                            <Paper key={fee._id} variant="outlined" sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>
                                            Học phí {fee.semesterId?.semesterName}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Hạn chót: {dayjs(fee.deadline).format('DD/MM/YYYY')}
                                        </Typography>
                                    </Box>
                                    <Chip label={fee.status} color="warning" variant="outlined" />
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography color="textSecondary">Tổng cộng:</Typography>
                                        <Typography variant="h5" fontWeight={700} color="error.main">
                                            {formatCurrency(fee.amount)}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        disabled={payingId === fee._id}
                                        startIcon={payingId === fee._id ? <CircularProgress size={20} color="inherit" /> : <FaMoneyBillWave />}
                                        onClick={() => handlePayment(fee._id)}
                                    >
                                        {payingId === fee._id ? 'Đang xử lý...' : 'Thanh toán ngay'}
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default PayTuitionPage;