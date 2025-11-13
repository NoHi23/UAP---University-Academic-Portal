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
    IconButton
} from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AttendanceReport = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [detailData, setDetailData] = useState(null);

    useEffect(() => {
        const fetchAttendanceSummary = async () => {
            try {
                setLoading(true);
                const res = await axios.get('http://localhost:9999/api/student/attendance/summary', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAttendanceData(res.data.data || []);
            } catch (err) {
                console.error('Error fetching attendance summary', err);
                setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải dữ liệu điểm danh');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceSummary();
    }, []);

    const openDetailForClass = async (classIdRaw) => {
        try {
            setDetailLoading(true);
            setDetailError(null);
            setDetailData(null);

            let classId = null;
            if (!classIdRaw) {
                setDetailError('Không xác định được lớp để xem chi tiết');
                setDetailOpen(true);
                return;
            }
            if (typeof classIdRaw === 'string') classId = classIdRaw;
            else if (typeof classIdRaw === 'object') classId = classIdRaw._id || classIdRaw.id || String(classIdRaw);
            else classId = String(classIdRaw);

            if (!classId || classId === '[object Object]') {
                setDetailError('ID lớp không hợp lệ');
                setDetailOpen(true);
                return;
            }

            const res = await axios.get(`http://localhost:9999/api/attendance/student/${classId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDetailData(res.data.data || null);
            setDetailOpen(true);
        } catch (err) {
            console.error('Error fetching class attendance details', err?.response || err);
            setDetailError(err.response?.data?.message || err.message || 'Lỗi khi tải chi tiết điểm danh');
            setDetailOpen(true);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setDetailData(null);
        setDetailError(null);
    };

    const getAttendanceColor = (rate) => (rate >= 80 ? '#4caf50' : '#f44336');

    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );

    if (error)
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </Container>
        );

    return (
        <Container sx={{ position: 'relative' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton
                    component={Link}
                    to="/student/dashboard"
                    sx={{ color: '#1976d2' }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 600, color: '#1976d2' }}
                >
                    Báo Cáo Điểm Danh
                </Typography>
            </Box>

            {/* Attendance Summary */}
            {attendanceData.length === 0 ? (
                <Alert severity="info">Chưa có dữ liệu điểm danh để hiển thị.</Alert>
            ) : (
                attendanceData.map((semObj, sIdx) => (
                    <Box key={sIdx} sx={{ mb: 5 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                            {semObj.semester?.semesterName ||
                                `Kỳ học ${new Date(semObj.semester?.startDate).getFullYear()}`}
                        </Typography>

                        <Grid
                            container
                            spacing={2}
                            sx={{
                                justifyContent: 'flex-start',
                                alignItems: 'stretch'
                            }}
                        >
                            {semObj.subjects.map((subj, idx) => (
                                <Grid item xs={12} sm={6} md={2.4} key={idx}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            boxShadow: 3,
                                            p: 2,
                                            background:
                                                'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography
                                                variant="h9"
                                                gutterBottom
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {subj.subjectName || 'Không có tên môn'}
                                            </Typography>

                                            <Typography
                                                variant="subtitle1"
                                                sx={{ mb: 2, color: '#555' }}
                                            >
                                                {subj.subjectCode} - {subj.className}
                                            </Typography>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 2
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'relative',
                                                        display: 'inline-flex',
                                                        mr: 2
                                                    }}
                                                >
                                                    <CircularProgress
                                                        variant="determinate"
                                                        value={subj.attendanceRate || 0}
                                                        size={80}
                                                        thickness={4.5}
                                                        sx={{
                                                            color: getAttendanceColor(
                                                                subj.attendanceRate
                                                            )
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
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body1"
                                                            sx={{ fontWeight: 600 }}
                                                        >
                                                            {`${Math.round(
                                                                subj.attendanceRate || 0
                                                            )}%`}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box>
                                                    <Typography variant="body2">
                                                        <strong>Tổng buổi:</strong>{' '}
                                                        {subj.totalSlots || 0}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Vắng:</strong>{' '}
                                                        {subj.absentSlots || 0}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {subj.attendanceRate < 80 && (
                                                <Alert severity="error" sx={{ mt: 2 }}>
                                                    ⚠️ Cảnh báo: Vắng quá 20% buổi học.
                                                </Alert>
                                            )}
                                        </CardContent>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => openDetailForClass(subj.classId)}
                                            startIcon={<KeyboardArrowDown />}
                                            sx={{
                                                mt: 2,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 500
                                            }}
                                        >
                                            Xem Chi Tiết
                                        </Button>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                ))
            )}

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                    Chi Tiết Điểm Danh
                </DialogTitle>
                <DialogContent>
                    {detailLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                            <CircularProgress />
                        </Box>
                    ) : detailError ? (
                        <Alert severity="error">{detailError}</Alert>
                    ) : detailData ? (
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
                                    {Array.isArray(detailData.attendanceDetails) &&
                                        detailData.attendanceDetails.length > 0 ? (
                                        detailData.attendanceDetails.map((d, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell>{detailData.className}</TableCell>
                                                <TableCell>
                                                    <Typography
                                                        sx={{
                                                            color:
                                                                d.status === 'Present'
                                                                    ? '#4caf50'
                                                                    : d.status === 'Absent'
                                                                        ? '#f44336'
                                                                        : '#ffa726',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {d.status === 'Present'
                                                            ? 'Có mặt'
                                                            : d.status === 'Absent'
                                                                ? 'Vắng mặt'
                                                                : 'Chưa điểm danh'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{d.note || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <Typography align="center">
                                                    Không có bản ghi điểm danh
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info">Không có dữ liệu chi tiết.</Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={closeDetail} variant="outlined" color="primary" sx={{ borderRadius: 2 }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AttendanceReport;
