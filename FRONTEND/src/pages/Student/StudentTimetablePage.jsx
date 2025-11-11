import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
    Paper, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Container, CircularProgress,
    IconButton, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { ChevronLeft, ChevronRight, LocationOn, Schedule as ScheduleIcon, School } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import isBetween from 'dayjs/plugin/isBetween';
import './StudentTimetablePage.css';
import api from '../../services/api';
import { generateWeeksOfYearSimple } from '../Lecturer/ScheduleLecturePages/functionCreatWeek';
import StudentActivityModal from './StudentActivityModal';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';

dayjs.locale('vi');
dayjs.extend(isBetween);

const StudentTimetablePage = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentDate, setCurrentDate] = useState(dayjs());

    const [year, setYear] = useState(dayjs().year());
    const [weeks, setWeeks] = useState(() => generateWeeksOfYearSimple(dayjs().year()));
    const { user } = useContext(AuthContext);
    const [showModal, setShowModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    useEffect(() => {
        setWeeks(generateWeeksOfYearSimple(year));
    }, [year]);

    useEffect(() => {
        const fetchTimetable = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/student/schedules/my-week', {
                    params: { date: currentDate.format('YYYY-MM-DD') }
                });
                setTimetable(response.data.data || []);
            } catch (err) {
                setError('Không thể tải thời khóa biểu.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTimetable();
        }
    }, [user, currentDate]);

    const timeSlots = [
        { slot: 1, time: '7:30-9:50' }, { slot: 2, time: '10:00-12:20' },
        { slot: 3, time: '12:50-15:10' }, { slot: 4, time: '15:20-17:40' },
        { slot: 5, time: '18:00-20:20' }, { slot: 6, time: '20:30-22:50' }
    ];

    const startOfWeek = currentDate.startOf('week');
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

    const currentWeekInfo = weeks.find(w =>
        currentDate.isBetween(dayjs(w.from, 'DD/MM/YYYY'), dayjs(w.to, 'DD/MM/YYYY'), 'day', '[]')
    );

    const organizeScheduleGrid = (data) => {
        const grid = Array(timeSlots.length).fill(null).map(() => Array(7).fill(null));
        data.forEach(item => {
            const itemDate = dayjs(item.date);
            const dayIndex = daysOfWeek.findIndex(day => day.isSame(itemDate, 'day'));
            const slotIndex = timeSlots.findIndex(ts => ts.slot === item.slot);
            if (dayIndex !== -1 && slotIndex !== -1) {
                grid[slotIndex][dayIndex] = item;
            }
        });
        return grid;
    };

    const getCardClass = (status) => {
        switch (status) {
            case 'Present':
                return 'present';
            case 'Absent':
                return 'absent';
            case 'Excused':
                return 'excused';
            case 'Not Yet':
            default:
                return 'not-yet';
        }
    };

    const scheduleGrid = organizeScheduleGrid(timetable);

    if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    if (error) return <Container sx={{ textAlign: 'center', mt: 5 }}><Typography color="error">{error}</Typography></Container>;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>

            <Paper elevation={3} sx={{ p: 3 }}>
                <IconButton
                    component={Link}
                    to="/student/dashboard"
                    sx={{ mb: 2, position: 'absolute', top: 26, left: 30 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <br />
                <Typography variant="h4" fontWeight={600} mb={3}>Thời khóa biểu theo tuần</Typography>

                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <InputLabel>Năm</InputLabel>
                        <Select
                            label="Năm"
                            value={year}
                            onChange={(e) => {
                                const newYear = Number(e.target.value);
                                setYear(newYear);
                                setCurrentDate(dayjs().year(newYear).startOf('year')); // Cập nhật currentDate về đầu năm mới
                            }}
                        >
                            {Array.from({ length: 5 }).map((_, i) => {
                                const y = dayjs().year() - 2 + i;
                                return <MenuItem key={y} value={y}>{y}</MenuItem>;
                            })}
                        </Select>
                    </FormControl>
                    <IconButton onClick={() => setCurrentDate(currentDate.subtract(1, 'week'))}><ChevronLeft /></IconButton>
                    <FormControl size="small" sx={{ minWidth: 320 }}>
                        <InputLabel>Tuần</InputLabel>
                        <Select
                            label="Tuần"
                            value={currentWeekInfo ? currentWeekInfo.week : ''}
                            onChange={(e) => {
                                const selectedWk = weeks.find(w => w.week === e.target.value);
                                if (selectedWk) {
                                    // Cập nhật `currentDate` để trigger useEffect gọi lại API
                                    setCurrentDate(dayjs(selectedWk.from, 'DD/MM/YYYY'));
                                }
                            }}
                        >
                            {weeks.map(w => <MenuItem key={w.week} value={w.week}>{w.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <IconButton onClick={() => setCurrentDate(currentDate.add(1, 'week'))}><ChevronRight /></IconButton>
                </Box>

                {/* --- BẢNG THỜI KHÓA BIỂU --- */}
                <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
                    <Table sx={{ minWidth: 1000 }} size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 'bold', width: '10%', textAlign: 'center' }}>SLOT</TableCell>
                                {daysOfWeek.map(day => (
                                    <TableCell key={day.format('ddd')} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        {day.format('ddd').toUpperCase()}<br />{day.format('DD/MM')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {timeSlots.map((slotInfo, slotIndex) => (
                                <TableRow key={slotInfo.slot}>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
                                        Slot {slotInfo.slot}<br />
                                        <Typography variant="caption">{slotInfo.time}</Typography>
                                    </TableCell>
                                    {daysOfWeek.map((day, dayIndex) => {
                                        const scheduleItem = scheduleGrid[slotIndex][dayIndex];
                                        return (
                                            <TableCell key={dayIndex} className="schedule-cell">
                                                {scheduleItem && (
                                                    <Card className={`schedule-card ${getCardClass(scheduleItem.attendanceStatus)}`} onClick={() => { setSelectedSchedule(scheduleItem); setShowModal(true); }}>
                                                        <CardContent>
                                                            <Typography className="card-code">{scheduleItem.subjectId.subjectCode}</Typography>
                                                            <Typography className="card-time"><ScheduleIcon /> {scheduleItem.startTime} - {scheduleItem.endTime}</Typography>
                                                            <Typography className="card-room"><LocationOn /> {scheduleItem.roomId.roomName}</Typography>
                                                            <Typography className="card-room"><School />
                                                                {scheduleItem?.lecturerId?.lastName || ''} {scheduleItem?.lecturerId?.firstName || ''} ({scheduleItem?.lecturerId?.lecturerCode || ''})
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Trạng thái:</Typography>
                    <Chip size="small" label="Có mặt" className="legend-chip present" />
                    <Chip size="small" label="Vắng" className="legend-chip absent" />
                    <Chip size="small" label="Chưa điểm danh / Sắp tới" className="legend-chip not-yet" />
                </Box>
                <StudentActivityModal open={showModal} onClose={() => setShowModal(false)} schedule={selectedSchedule} />
            </Paper>
        </Container>
    );
};

export default StudentTimetablePage;
