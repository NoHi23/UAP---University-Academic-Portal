import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { FaHistory } from 'react-icons/fa';
import api from '../../services/api';
import dayjs from 'dayjs';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const TransactionHistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                // API này sẽ lấy cả giao dịch thành công và thất bại
                const response = await api.get('/student/tuition/transactions');
                setTransactions(response.data.data);
            } catch (err) {
                setError('Không thể tải lịch sử giao dịch.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    if (error) return <Container sx={{ textAlign: 'center', mt: 5 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <FaHistory size={28} color="#1976d2" />
                    <Typography variant="h5" fontWeight={600}>
                        Lịch sử Giao dịch
                    </Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Ngày giao dịch</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Mã giao dịch</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nội dung</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Số tiền</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Trạng thái</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Bạn chưa có giao dịch nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map(tx => (
                                    <TableRow key={tx._id}>
                                        <TableCell>{dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                                        <TableCell>{tx.transactionCode}</TableCell>
                                        <TableCell>Thanh toán học phí (VNPAY)</TableCell>
                                        <TableCell align="right">{formatCurrency(tx.amount)}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={tx.status} 
                                                color={tx.status === 'Success' ? 'success' : 'error'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default TransactionHistoryPage;