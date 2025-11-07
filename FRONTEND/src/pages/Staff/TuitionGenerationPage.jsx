import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { FaPaperPlane } from 'react-icons/fa';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
import dayjs from 'dayjs';

const TuitionGenerationPage = () => {
    const [semesters, setSemesters] = useState([]);
    const [majors, setMajors] = useState([]);
    const [generatedBatches, setGeneratedBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedMajor, setSelectedMajor] = useState('');
    const [selectedSemesterNo, setSelectedSemesterNo] = useState('');
    const [payableFrom, setPayableFrom] = useState(dayjs());
    const [deadline, setDeadline] = useState(dayjs().add(14, 'day'));
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [semRes, majRes, batchRes] = await Promise.all([
                    api.get('/staff/semesters'),
                    api.get('/staff/majors'),
                    api.get('/staff/tuition/generated-batches')
                ]);
                setSemesters(semRes.data.data);
                setMajors(majRes.data.data);
                setGeneratedBatches(batchRes.data.data);
            } catch (err) {
                notifyError('Lỗi tải dữ liệu.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Logic "ẩn lựa chọn đã dùng" của bạn
    const isCombinationUsed = (semesterId, majorId, semesterNo) => {
        if (!semesterId || !majorId || semesterNo === '') return false;
        return generatedBatches.some(batch => 
            batch.semesterId === semesterId &&
            batch.majorId === majorId &&
            batch.semesterNo === Number(semesterNo)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await api.post('/staff/tuition/generate-fees', {
                semesterId: selectedSemester,
                majorId: selectedMajor,
                semesterNo: Number(selectedSemesterNo),
                payableFrom: payableFrom.toISOString(),
                deadline: deadline.toISOString()
            });
            notifySuccess('Tạo khoản thu hàng loạt thành công!');
            // Tải lại danh sách batch đã tạo
            const batchRes = await api.get('/staff/tuition/generated-batches');
            setGeneratedBatches(batchRes.data.data);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Tạo thất bại.');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="md" sx={{ py: 3 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight={600} mb={2}>Tạo Đợt thu Học phí Mới</Typography>
                    <Typography variant="body2" color="textSecondary" mb={3}>
                        Hệ thống sẽ tìm tất cả sinh viên khớp với (Chuyên ngành) và (Kỳ số) được chọn, sau đó tạo khoản thu cho họ dựa trên Bảng giá đã cấu hình.
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <FormControl fullWidth required>
                                <InputLabel>1. Chọn Học kỳ (ví dụ: SP27)</InputLabel>
                                <Select value={selectedSemester} label="1. Chọn Học kỳ (ví dụ: SP27)" onChange={(e) => setSelectedSemester(e.target.value)}>
                                    {semesters.map(s => <MenuItem key={s._id} value={s._id}>{s.semesterName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth required>
                                <InputLabel>2. Chọn Chuyên ngành</InputLabel>
                                <Select value={selectedMajor} label="2. Chọn Chuyên ngành" onChange={(e) => setSelectedMajor(e.target.value)}>
                                    {majors.map(m => <MenuItem key={m._id} value={m._id}>{m.majorName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth required>
                                <InputLabel>3. Áp dụng cho Sinh viên Kỳ số</InputLabel>
                                <Select value={selectedSemesterNo} label="3. Áp dụng cho Sinh viên Kỳ số" onChange={(e) => setSelectedSemesterNo(e.target.value)}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                                        const isDisabled = isCombinationUsed(selectedSemester, selectedMajor, num);
                                        return (
                                            <MenuItem key={num} value={num} disabled={isDisabled}>
                                                Kỳ {num} {isDisabled && "(Đã tạo đợt thu)"}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                            <DatePicker
                                label="4. Ngày bắt đầu thu"
                                value={payableFrom}
                                onChange={(newValue) => setPayableFrom(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            <DatePicker
                                label="5. Hạn chót (Deadline)"
                                value={deadline}
                                onChange={(newValue) => setDeadline(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={isCreating}
                                startIcon={isCreating ? <CircularProgress size={24} color="inherit" /> : <FaPaperPlane />}
                            >
                                {isCreating ? 'Đang xử lý...' : 'Tạo Đợt thu & Gửi Thông báo'}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Container>
        </LocalizationProvider>
    );
};

export default TuitionGenerationPage;