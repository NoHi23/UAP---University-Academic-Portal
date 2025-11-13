import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress, Alert,
    Tabs, Tab, TextField, FormControl, InputLabel, Select, MenuItem,
    Accordion, AccordionSummary, AccordionDetails, Chip, Rating,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { FaStar, FaListAlt, FaHistory, FaChevronDown } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import dayjs from 'dayjs';

// Component con cho 1 Form đánh giá
const EvaluationForm = ({ classInfo, onSuccessfulSubmit }) => {
    const [knowledge, setKnowledge] = useState(0);
    const [teaching, setTeaching] = useState(0);
    const [respect, setRespect] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (knowledge === 0 || teaching === 0 || respect === 0) {
            return notifyError('Vui lòng chọn đủ 3 tiêu chí đánh giá (số sao).');
        }

        setIsSubmitting(true);
        try {
            await api.post('/student/evaluations/submit', {
                classId: classInfo._id,
                criteria_knowledge: knowledge,
                criteria_teaching: teaching,
                criteria_respect: respect,
                comment: comment
            });
            notifySuccess('Gửi đánh giá thành công!');
            onSuccessfulSubmit(); // Gọi hàm của cha để tải lại
        } catch (err) {
            notifyError(err.response?.data?.message || 'Gửi thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Box>
                <Typography component="legend">1. Kiến thức & Chuyên môn của Giảng viên</Typography>
                <Rating value={knowledge} onChange={(e, newValue) => setKnowledge(newValue)} />
            </Box>
            <Box>
                <Typography component="legend">2. Kỹ năng Truyền đạt & Phương pháp Giảng dạy</Typography>
                <Rating value={teaching} onChange={(e, newValue) => setTeaching(newValue)} />
            </Box>
            <Box>
                <Typography component="legend">3. Thái độ Tôn trọng & Hỗ trợ Sinh viên</Typography>
                <Rating value={respect} onChange={(e, newValue) => setRespect(newValue)} />
            </Box>
            <TextField
                label="Ý kiến đóng góp khác (tùy chọn)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
            />
            <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ alignSelf: 'flex-end' }}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
                Nộp đánh giá
            </Button>
        </Box>
    );
};

// Trang chính
const EvaluationPage = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [toDoList, setToDoList] = useState([]);
    const [submittedList, setSubmittedList] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const fetchToDo = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student/evaluations/to-do');
            setToDoList(response.data.data);
        } catch (err) { notifyError('Không thể tải danh sách cần đánh giá.'); }
        finally { setLoading(false); }
    };

    const fetchSubmitted = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student/evaluations/submitted');
            setSubmittedList(response.data.data);
        } catch (err) { notifyError('Không thể tải lịch sử đánh giá.'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (tabIndex === 0) {
            fetchToDo();
        } else {
            fetchSubmitted();
        }
    }, [tabIndex]); // Tải lại khi chuyển tab

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabIndex} onChange={handleTabChange}>
                        <Tab label={`Cần đánh giá (${toDoList.length})`} icon={<FaStar />} iconPosition="start" />
                        <Tab label="Lịch sử đánh giá" icon={<FaHistory />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* --- TAB 0: CẦN ĐÁNH GIÁ --- */}
                {tabIndex === 0 && (
                    <Box>
                        {loading ? <CircularProgress /> : toDoList.length === 0 ? (
                            <Alert severity="success">Bạn đã hoàn thành tất cả đánh giá. Cảm ơn bạn!</Alert>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {toDoList.map(cls => (
                                    <Accordion key={cls._id}>
                                        <AccordionSummary expandIcon={<FaChevronDown />}>
                                            <Box>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {cls.subjectId?.subjectName} ({cls.subjectId?.subjectCode})
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Lớp: {cls.className} - GV: {cls.lecturerId?.lastName} {cls.lecturerId?.firstName}
                                                </Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ borderTop: '1px solid #eee' }}>
                                            <EvaluationForm classInfo={cls} onSuccessfulSubmit={fetchToDo} />
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* --- TAB 1: ĐÃ ĐÁNH GIÁ --- */}
                {tabIndex === 1 && (
                    <Box>
                        {loading ? <CircularProgress /> : submittedList.length === 0 ? (
                            <Alert severity="info">Bạn chưa nộp đánh giá nào.</Alert>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Lớp (Môn)</TableCell>
                                            <TableCell>Giảng viên</TableCell>
                                            <TableCell align="center">Kiến thức</TableCell>
                                            <TableCell align="center">Truyền đạt</TableCell>
                                            <TableCell align="center">Thái độ</TableCell>
                                            <TableCell>Ngày nộp</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {submittedList.map(evalDoc => (
                                            <TableRow key={evalDoc._id}>
                                                <TableCell>
                                                    {evalDoc.classId?.className} ({evalDoc.classId?.subjectId?.subjectCode})
                                                </TableCell>
                                                <TableCell>{evalDoc.lecturerId?.lastName} {evalDoc.lecturerId?.firstName}</TableCell>
                                                <TableCell align="center">{evalDoc.criteria_knowledge} <FaStar size={10} color="#faaf00" /></TableCell>
                                                <TableCell align="center">{evalDoc.criteria_teaching} <FaStar size={10} color="#faaf00" /></TableCell>
                                                <TableCell align="center">{evalDoc.criteria_respect} <FaStar size={10} color="#faaf00" /></TableCell>
                                                <TableCell>{dayjs(evalDoc.createdAt).format('DD/MM/YYYY')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default EvaluationPage;