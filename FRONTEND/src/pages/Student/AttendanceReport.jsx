import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Card,
    CardContent,
    Grow
} from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import axios from 'axios';

const AttendanceReport = () => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            try {
                const classId = '68fee22ee2c0d91b734657dc';
                const response = await axios.get(
                    `http://localhost:9999/api/attendance/student/${classId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                setAttendanceData(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu điểm danh');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, []);

    const handleOpen = () => setDialogOpen(true);
    const handleClose = () => setDialogOpen(false);

    const getAttendanceColor = (rate) => (rate >= 80 ? '#4caf50' : '#f44336');

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container>
            <Typography variant="h4" component="h1" sx={{ my: 4, fontWeight: 600, color: '#1976d2' }}>
                Báo Cáo Điểm Danh
            </Typography>


            <Grid container spacing={3} justifyContent="left">
                <Grid item xs={12} md={8}>
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: 3,
                            p: 2,
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Tổng Quan
                            </Typography>
                            {attendanceData?.className && (
                                <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
                                    {attendanceData.className}
                                </Typography>
                            )}

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2,
                                }}
                            >
                                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 3 }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={attendanceData?.attendanceRate || 0}
                                        size={110}
                                        thickness={4.5}
                                        sx={{
                                            color: getAttendanceColor(attendanceData?.attendanceRate),
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            position: 'absolute',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {`${Math.round(attendanceData?.attendanceRate || 0)}%`}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
                                        <strong>Tổng số buổi:</strong> {attendanceData?.totalSlots || 0}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                                        <strong>Số buổi vắng:</strong> {attendanceData?.absentSlots || 0}
                                    </Typography>
                                </Box>
                            </Box>

                            {attendanceData?.isFailed && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    ⚠️ Cảnh báo: Bạn đã vắng quá 20% số buổi học. Điểm cuối kỳ sẽ bị 0.
                                </Alert>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={handleOpen}
                                startIcon={<KeyboardArrowDown />}
                                sx={{
                                    mt: 2,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Xem Chi Tiết
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Popup chi tiết */}
            <Dialog
                open={dialogOpen}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                TransitionComponent={Grow}
                TransitionProps={{ in: dialogOpen }}
            >
                <DialogTitle sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                    Chi Tiết Điểm Danh - {attendanceData.className}
                </DialogTitle>
                <DialogContent>
                    <TableContainer sx={{ mt: 1 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                    <TableCell><strong>Buổi</strong></TableCell>
                                    <TableCell><strong>Lớp</strong></TableCell>
                                    <TableCell><strong>Trạng Thái</strong></TableCell>
                                    <TableCell><strong>Ghi Chú</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendanceData?.attendanceDetails?.map((detail, index) => (
                                    <TableRow
                                        key={detail.scheduleId || index}
                                        hover
                                        sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}
                                    >
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{attendanceData.className}</TableCell>
                                        <TableCell>
                                            <Typography
                                                sx={{
                                                    color:
                                                        detail.status === 'Present'
                                                            ? '#4caf50'
                                                            : detail.status === 'Absent'
                                                                ? '#f44336'
                                                                : '#ffa726',
                                                    fontWeight: 'bold',
                                                }} y
                                            >
                                                {detail.status === 'Present'
                                                    ? 'Có mặt'
                                                    : detail.status === 'Absent'
                                                        ? 'Vắng mặt'
                                                        : 'Chưa điểm danh'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{detail.note || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} variant="outlined" color="primary" sx={{ borderRadius: 2 }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AttendanceReport;
