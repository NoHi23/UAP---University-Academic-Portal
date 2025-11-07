import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress,
    Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Chip
} from '@mui/material';
import { FaGraduationCap } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import dayjs from 'dayjs';
import FullScreenLoader from '../../components/Common/FullScreenLoader';

const SemesterManagementPage = () => {
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMap, setLoadingMap] = useState({});
    const [error, setError] = useState(null);

    const fetchSemesters = async () => {
        setLoading(true);
        try {
            const response = await api.get('/staff/semesters2');
            const sorted = response.data.data.sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());
            setSemesters(sorted);
        } catch (err) {
            setError('Không thể tải danh sách học kỳ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSemesters();
    }, []);

    const handlePromote = async (semesterId, semesterName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn kết thúc học kỳ [${semesterName}] và "lên kỳ" cho tất cả sinh viên đã học? \n\nHành động này KHÔNG THỂ hoàn tác.`)) {
            return;
        }
        
        setLoadingMap(prev => ({ ...prev, [semesterId]: true }));
        try {
            const response = await api.post('/staff/semesters/promote', { semesterId });
            notifySuccess(response.data.message);
            // (Bạn có thể thêm logic để ẩn nút này sau khi đã promote, ví dụ: thêm 1 trường 'isPromoted' vào model Semester)
        } catch (err) {
            notifyError(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setLoadingMap(prev => ({ ...prev, [semesterId]: false }));
        }
    };

    const today = dayjs();

    if (loading) return <FullScreenLoader/>;
    if (error) return <Container sx={{ textAlign: 'center', mt: 5 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={3}>
                    Quản lý Học kỳ & Lên kỳ
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tên Học kỳ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Ngày bắt đầu</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Ngày kết thúc</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {semesters.map(sem => {
                                const isFinished = today.isAfter(dayjs(sem.endDate));
                                const isLoading = loadingMap[sem._id];

                                return (
                                    <TableRow key={sem._id}>
                                        <TableCell>{sem.semesterName}</TableCell>
                                        <TableCell>{dayjs(sem.startDate).format('DD/MM/YYYY')}</TableCell>
                                        <TableCell>{dayjs(sem.endDate).format('DD/MM/YYYY')}</TableCell>
                                        <TableCell>
                                            {isFinished 
                                                ? <Chip label="Đã kết thúc" color="error" size="small" variant="outlined" /> 
                                                : <Chip label="Đang diễn ra" color="success" size="small" variant="outlined" />}
                                        </TableCell>
                                        <TableCell align="center">
                                            {isFinished ? (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="primary"
                                                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <FaGraduationCap />}
                                                    onClick={() => handlePromote(sem._id, sem.semesterName)}
                                                    disabled={isLoading}
                                                >
                                                    Lên kỳ cho SV
                                                </Button>
                                            ) : (
                                                <Tooltip title="Chỉ có thể lên kỳ sau khi học kỳ đã kết thúc.">
                                                    <span>
                                                        <Button variant="contained" size="small" disabled>
                                                            Lên kỳ cho SV
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default SemesterManagementPage;