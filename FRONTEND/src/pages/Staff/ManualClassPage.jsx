import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Paper, Typography, Box, Button, CircularProgress,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox,
    Divider, FormControlLabel, Switch
} from '@mui/material';
import { FaPlayCircle, FaSearch, FaPlusCircle } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';

const ManualClassPage = () => {
    const [majors, setMajors] = useState([]);
    const [allLecturers, setAllLecturers] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(true);

    const [filterMajor, setFilterMajor] = useState('');
    const [filterSemesterNo, setFilterSemesterNo] = useState('');
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedLecturer, setSelectedLecturer] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [className, setClassName] = useState('');
    const [numberOfSlots, setNumberOfSlots] = useState(20);
    const [isCreating, setIsCreating] = useState(false);

    const [subjectsForDropdown, setSubjectsForDropdown] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [isNewSubject, setIsNewSubject] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');
    const [newSubjectNoCredit, setNewSubjectNoCredit] = useState(0);
    const lecturersForMajor = useMemo(() => {
        if (!filterMajor) return allLecturers;
        return allLecturers.filter(l => l.majorId?._id === filterMajor);
    }, [filterMajor, allLecturers]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [majRes, lecRes, roomRes, semRes] = await Promise.all([
                    api.get('/staff/majors3'),
                    api.get('/manage/users/lecturers'),
                    api.get('/staff/rooms'),
                    api.get('/staff/semesters')
                ]);
                setMajors(majRes.data.data);
                setAllLecturers(lecRes.data.data);
                setAllRooms(roomRes.data.data);
                setSemesters(semRes.data.data);
            } catch (err) {
                notifyError('Lỗi tải dữ liệu ban đầu (GV, Phòng, Môn học...).');
            } finally {
                setLoadingInitial(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchFilteredSubjects = async () => {
            if (!filterMajor || filterSemesterNo === '') {
                setSubjectsForDropdown([]);
                setSelectedSubject(''); 
                return;
            }
            setLoadingSubjects(true);
            setSelectedSubject('');
            try {
                const response = await api.get('/staff/subjects/filter-by-semester', {
                    params: { majorId: filterMajor, semesterNo: filterSemesterNo }
                });
                setSubjectsForDropdown(response.data.data);
            } catch (err) {
                notifyError('Không thể tải danh sách môn học cho kỳ này.');
                setSubjectsForDropdown([]);
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchFilteredSubjects();
    }, [filterMajor, filterSemesterNo]); 

    const handleFilterStudents = async () => {
        if (!filterMajor) {
            notifyError('Vui lòng chọn chuyên ngành để lọc.');
            return;
        }
        setLoadingStudents(true);
        setSelectedStudentIds([]);
        try {
            const response = await api.get('/staff/students/filter', {
                params: { majorId: filterMajor, semesterNo: filterSemesterNo }
            });
            setFilteredStudents(response.data.data);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Lỗi khi lọc sinh viên.');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = filteredStudents.map(s => s._id);
            setSelectedStudentIds(allIds);
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (studentId) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();

        if (selectedStudentIds.length === 0) {
            notifyError('Bạn phải chọn ít nhất 1 sinh viên.'); return;
        }
        if (!selectedSemester || !selectedLecturer || !selectedRoom || !className || !numberOfSlots || !filterMajor) {
            notifyError('Vui lòng điền đầy đủ thông tin Lớp (Kỳ, GV, Phòng, Tên, Số buổi, Chuyên ngành).'); return;
        }
        let finalSubjectId = selectedSubject;
        if (isNewSubject) {
            if (!newSubjectName || !newSubjectCode || newSubjectNoCredit <= 0) {
                notifyError('Vui lòng nhập Tên, Mã và Số tín chỉ (lớn hơn 0) cho môn học mới.'); return;
            }
            finalSubjectId = 'NEW';
        } else if (!finalSubjectId) {
            notifyError('Vui lòng chọn một môn học.'); return;
        }

        setIsCreating(true);
        try {
            const payload = {
                semesterId: selectedSemester,
                lecturerId: selectedLecturer,
                roomId: selectedRoom,
                className: className,
                studentIds: selectedStudentIds,
                numberOfSlots: Number(numberOfSlots),
                majorId: filterMajor,

                subjectId: finalSubjectId,
                newSubjectName: isNewSubject ? newSubjectName : undefined,
                newSubjectCode: isNewSubject ? newSubjectCode : undefined,
            };

            const response = await api.post('/staff/schedule-manual-class', payload);
            notifySuccess(response.data.message);
            setSelectedStudentIds([]);
            setFilteredStudents([]);
            setClassName('');
        } catch (err) {
            notifyError(err.response?.data?.message || 'Tạo lịch thủ công thất bại.');
            console.error(err.response?.data?.logs);
        } finally {
            setIsCreating(false);
        }
    };

    if (loadingInitial) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <form onSubmit={handleCreateSchedule}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight={600} mb={3}>
                        Xếp lớp và Lên lịch Thủ công
                    </Typography>

                    <Typography variant="h6" gutterBottom>1. Lọc và Chọn Sinh viên</Typography>

                    {/* --- KHU VỰC 1: LỌC SINH VIÊN (SỬA LAYOUT DÙNG BOX) --- */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <FormControl fullWidth size="small" sx={{ flex: 5 }}>
                            <InputLabel>Lọc theo Chuyên ngành</InputLabel>
                            <Select value={filterMajor} label="Lọc theo Chuyên ngành" onChange={(e) => setFilterMajor(e.target.value)}>
                                {majors.map(m => <MenuItem key={m._id} value={m._id}>{m.majorName} ({m.majorCode})</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small" sx={{ flex: 5 }}>
                            <InputLabel>Lọc theo Kỳ học (semesterNo)</InputLabel>
                            <Select value={filterSemesterNo} label="Lọc theo Kỳ học (semesterNo)" onChange={(e) => setFilterSemesterNo(e.target.value)}>
                                <MenuItem value="">Tất cả các kỳ</MenuItem>
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <MenuItem key={n} value={n}>Kỳ {n} {n === 0 ? '(Mới)' : ''}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={handleFilterStudents}
                            disabled={loadingStudents}
                            startIcon={loadingStudents ? <CircularProgress size={20} color="inherit" /> : <FaSearch />}
                            sx={{ flex: 2, height: '40px' }}
                        >
                            Lọc
                        </Button>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedStudentIds.length > 0 && selectedStudentIds.length < filteredStudents.length}
                                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Mã SV</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Họ tên</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Kỳ học</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingStudents ? (
                                    <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} align="center">Chưa có dữ liệu sinh viên. Vui lòng nhấn "Lọc".</TableCell></TableRow>
                                ) : (
                                    filteredStudents.map(student => (
                                        <TableRow
                                            key={student._id}
                                            hover
                                            onClick={() => handleSelectStudent(student._id)}
                                            role="checkbox"
                                            selected={selectedStudentIds.includes(student._id)}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={selectedStudentIds.includes(student._id)} />
                                            </TableCell>
                                            <TableCell>{student.studentCode}</TableCell>
                                            <TableCell>{student.lastName} {student.firstName}</TableCell>
                                            <TableCell>{student.semesterNo}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Đã chọn: {selectedStudentIds.length} sinh viên
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>2. Cấu hình Lớp học</Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 2
                        }}
                    >
                        <FormControl fullWidth size="small" required>
                            <InputLabel>Học kỳ</InputLabel>
                            <Select value={selectedSemester} label="Học kỳ" onChange={(e) => setSelectedSemester(e.target.value)}>
                                {semesters.map(s => <MenuItem key={s._id} value={s._id}>{s.semesterName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Tên Lớp (ví dụ: LOP-HOC-LAI-PRF192)"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            size="small"
                            fullWidth
                            required
                        />

                        <FormControlLabel
                            control={<Switch checked={isNewSubject} onChange={(e) => setIsNewSubject(e.target.checked)} />}
                            label="Tạo môn học mới (chưa có trong DB)?"
                            sx={{ gridColumn: '1 / -1' }}
                        />
                        {isNewSubject ? (
                            <>
                                <TextField label="Mã môn học MỚI (ví dụ: WS01)" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} size="small" fullWidth required={isNewSubject} />
                                <TextField label="Tên môn học MỚI (ví dụ: Workshop Kỹ năng mềm)" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} size="small" fullWidth required={isNewSubject} />
                                <TextField
                                    label="Số tín chỉ"
                                    type="number"
                                    value={newSubjectNoCredit}
                                    onChange={(e) => setNewSubjectNoCredit(Number(e.target.value))}
                                    size="small"
                                    fullWidth
                                    required={isNewSubject}
                                    InputProps={{ inputProps: { min: 0, max: 15 } }}
                                />
                            </>
                        ) : (
                            <FormControl fullWidth size="small" required={!isNewSubject} disabled={!filterMajor || filterSemesterNo === '' || loadingSubjects}>
                                <InputLabel>Môn học (theo Chuyên ngành & Kỳ)</InputLabel>
                                <Select
                                    value={selectedSubject}
                                    label="Môn học (theo Chuyên ngành & Kỳ)"
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                >
                                    {loadingSubjects ? (
                                        <MenuItem disabled><em>Đang tải môn học...</em></MenuItem>
                                    ) : subjectsForDropdown.length === 0 ? (
                                        <MenuItem disabled><em>Không có môn học cho kỳ/chuyên ngành này.</em></MenuItem>
                                    ) : (
                                        subjectsForDropdown.map(s => <MenuItem key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</MenuItem>)
                                    )}
                                </Select>
                            </FormControl>
                        )}

                        <FormControl fullWidth size="small" required disabled={!filterMajor}>
                            <InputLabel>Giảng viên (theo chuyên ngành đã lọc)</InputLabel>
                            <Select value={selectedLecturer} label="Giảng viên (theo chuyên ngành đã lọc)" onChange={(e) => setSelectedLecturer(e.target.value)}>
                                {lecturersForMajor.map(l => <MenuItem key={l._id} value={l._id}>{l.lastName} {l.firstName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small" required>
                            <InputLabel>Phòng học</InputLabel>
                            <Select value={selectedRoom} label="Phòng học" onChange={(e) => setSelectedRoom(e.target.value)}>
                                {allRooms.map(r => <MenuItem key={r._id} value={r._id}>{r.roomName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Tổng số buổi học (ví dụ: 20)"
                            type="number"
                            value={numberOfSlots}
                            onChange={(e) => setNumberOfSlots(Number(e.target.value))}
                            size="small"
                            fullWidth
                            required
                        />
                        <Box></Box>
                    </Box>

                    <Box sx={{ mt: 4, textAlign: 'right' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={isCreating || loadingStudents}
                            startIcon={isCreating ? <CircularProgress size={24} color="inherit" /> : <FaPlayCircle />}
                        >
                            {isCreating ? 'Đang xếp lịch...' : 'Tạo Lớp và Xếp lịch Thủ công'}
                        </Button>
                    </Box>
                </Paper>
            </form>
        </Container>
    );
};

export default ManualClassPage;