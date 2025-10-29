import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Select, MenuItem, FormControl, InputLabel, Button,
    List, ListItem, ListItemText, ListItemIcon, Checkbox, TextField, CircularProgress
} from '@mui/material';
import { FaUsers, FaPlusCircle, FaSearch } from 'react-icons/fa';
import  api  from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';

const ManualClassPage = () => {
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    
    const [className, setClassName] = useState('');
    const [selectedLecturer, setSelectedLecturer] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [semRes, subRes, lecRes, roomRes] = await Promise.all([
                    api.get('/staff/semesters'),
                    api.get('staff/subjects'),
                    api.get('/manage/users/lecturers'),
                    api.get('staff/rooms') 
                ]);
                setSemesters(semRes.data.data);
                setSubjects(subRes.data.data);
                setLecturers(lecRes.data.data);
                setRooms(roomRes.data.data);
                
                if (semRes.data.data.length > 0) setSelectedSemester(semRes.data.data[0]._id);
                if (subRes.data.data.length > 0) setSelectedSubject(subRes.data.data[0]._id);
                if (lecRes.data.data.length > 0) setSelectedLecturer(lecRes.data.data[0]._id);
                 if (roomRes.data.data.length > 0) setSelectedRoom(roomRes.data.data[0]._id);

            } catch (err) {
                notifyError('Lỗi tải dữ liệu ban đầu.');
            }
        };
        fetchInitialData();
    }, []);

    const handleFetchEligibleStudents = async () => {
        if (!selectedSemester || !selectedSubject) {
            notifyError('Vui lòng chọn học kỳ và môn học.');
            return;
        }
        setLoadingStudents(true);
        setSelectedStudents([]);
        try {
            const response = await api.get('/staff/eligible-students', {
                params: { subjectId: selectedSubject, semesterId: selectedSemester }
            });
            setEligibleStudents(response.data.data);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Lỗi khi tìm sinh viên.');
            setEligibleStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleStudentToggle = (studentId) => {
        const currentIndex = selectedStudents.indexOf(studentId);
        const newSelected = [...selectedStudents];

        if (currentIndex === -1) {
            if (newSelected.length < 30) {
                 newSelected.push(studentId);
            } else {
                notifyError('Chỉ có thể chọn tối đa 30 sinh viên.');
                return; 
            }
        } else {
            newSelected.splice(currentIndex, 1);
        }
        setSelectedStudents(newSelected);
    };

    const handleCreateAndEnroll = async () => {
        if (selectedStudents.length === 0) {
            notifyError('Vui lòng chọn ít nhất một sinh viên.');
            return;
        }
        if (!className || !selectedLecturer || !selectedRoom) {
             notifyError('Vui lòng điền đủ thông tin lớp.');
            return;
        }

        setIsCreating(true);
        try {
            const classResponse = await api.post('/staff/classes/manual', {
                className,
                subjectId: selectedSubject,
                roomId: selectedRoom,
                lecturerId: selectedLecturer
            });
            
            const newClassId = classResponse.data.data._id;
            
            await api.post(`/staff/classes/${newClassId}/enroll-manual`, {
                studentIds: selectedStudents
            });

            notifySuccess(`Tạo lớp ${className} và ghi danh ${selectedStudents.length} sinh viên thành công!`);
            setEligibleStudents([]);
            setSelectedStudents([]);
            setClassName('');

        } catch (err) {
             notifyError(err.response?.data?.message || 'Tạo lớp hoặc ghi danh thất bại.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight={600} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaPlusCircle /> Xếp lớp thủ công
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Học kỳ</InputLabel>
                        <Select value={selectedSemester} label="Học kỳ" onChange={(e) => setSelectedSemester(e.target.value)}>
                            {semesters.map(s => <MenuItem key={s._id} value={s._id}>{s.semesterName}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Môn học</InputLabel>
                        <Select value={selectedSubject} label="Môn học" onChange={(e) => setSelectedSubject(e.target.value)}>
                            {subjects.map(s => <MenuItem key={s._id} value={s._id}>{s.subjectCode} - {s.subjectName}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        onClick={handleFetchEligibleStudents}
                        disabled={loadingStudents}
                        startIcon={loadingStudents ? <CircularProgress size={20} color="inherit" /> : <FaSearch />}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Tìm Sinh viên
                    </Button>
                </Box>

                {eligibleStudents.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Sinh viên đủ điều kiện ({eligibleStudents.length})</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Đã chọn: {selectedStudents.length} / 30
                         </Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                            <List dense>
                                {eligibleStudents.map(student => (
                                    <ListItem
                                        key={student._id}
                                        button
                                        onClick={() => handleStudentToggle(student._id)}
                                        disabled={selectedStudents.length >= 30 && !selectedStudents.includes(student._id)}
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={selectedStudents.includes(student._id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${student.lastName} ${student.firstName}`}
                                            secondary={student.studentCode}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                )}

                {selectedStudents.length > 0 && (
                     <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>Thông tin lớp học mới</Typography>
                         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                            <TextField
                                label="Tên lớp học"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                size="small"
                                required
                            />
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Giảng viên</InputLabel>
                                <Select value={selectedLecturer} label="Giảng viên" onChange={(e) => setSelectedLecturer(e.target.value)}>
                                    {lecturers.map(l => <MenuItem key={l._id} value={l._id}>{l.lastName} {l.firstName}</MenuItem>)}
                                </Select>
                            </FormControl>
                             <FormControl fullWidth size="small" required>
                                <InputLabel>Phòng học</InputLabel>
                                <Select value={selectedRoom} label="Phòng học" onChange={(e) => setSelectedRoom(e.target.value)}>
                                    {rooms.map(r => <MenuItem key={r._id} value={r._id}>{r.roomName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateAndEnroll}
                            disabled={isCreating}
                            startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : <FaPlusCircle />}
                        >
                            Tạo Lớp và Ghi danh
                        </Button>
                    </Box>
                )}

            </Paper>
        </Container>
    );
};

export default ManualClassPage;