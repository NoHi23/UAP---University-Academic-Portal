import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Chip,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Container,
    CircularProgress
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    LocationOn,
    Schedule as ScheduleIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const Timetable = () => {
    const theme = useTheme();
    const [selectedYear, setSelectedYear] = useState('2025');
    const [currentWeek, setCurrentWeek] = useState(dayjs());
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);

    // Fetch timetable data
    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:9999/api/student/timetable', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTimetable(data.timetable || []);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Lỗi khi tải thời khóa biểu');
            }
        } catch (error) {
            console.error('Error fetching timetable:', error);
            setError('Không thể kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTimetable();
        }
    }, [user]);

    // Use mock data if no real data
    const dataToUse = timetable.length > 0 ? timetable : [];

    // Time slots definition (similar to lecturer's schedule)
    const timeSlots = [
        { slot: 0, time: '' },
        { slot: 1, time: '7:30-9:50' },
        { slot: 2, time: '10:00-12:20' },
        { slot: 3, time: '10:50-12:20' },
        { slot: 4, time: '15:20-17:40' },
        { slot: 5, time: '' },
        { slot: 6, time: '' },
        { slot: 7, time: '' },
        { slot: 8, time: '' },
        { slot: 9, time: '' },
        { slot: 10, time: '' },
        { slot: 11, time: '' },
        { slot: 12, time: '' }
    ];

    // Days of week
    const daysOfWeek = [
        { key: 'MON', label: 'MON', date: '15/09' },
        { key: 'TUE', label: 'TUE', date: '16/09' },
        { key: 'WED', label: 'WED', date: '17/09' },
        { key: 'THU', label: 'THU', date: '18/09' },
        { key: 'FRI', label: 'FRI', date: '19/09' },
        { key: 'SAT', label: 'SAT', date: '20/09' },
        { key: 'SUN', label: 'SUN', date: '21/09' }
    ];

    // Organize schedule data into grid
    const organizeScheduleByWeek = (data) => {
        const weekGrid = Array(13).fill(null).map(() => Array(7).fill(null));

        data.forEach(item => {
            // Parse the date to get day of week
            const date = dayjs(item.time);
            let dayIndex = date.day() - 1; // Convert to 0-6 (Mon-Sun)
            if (dayIndex === -1) dayIndex = 6; // Sunday becomes 6

            const slotIndex = item.slot;

            if (slotIndex >= 0 && slotIndex < 13 && dayIndex >= 0 && dayIndex < 7) {
                weekGrid[slotIndex][dayIndex] = {
                    id: item.id,
                    courseCode: item.subjectCode || 'Unknown',
                    courseName: item.subjectName || 'Unknown Course',
                    room: item.room || 'Unknown',
                    className: item.className || 'Unknown',
                    timeDisplay: item.timeRange || timeSlots[slotIndex]?.time || '',
                    status: item.status || (item.attendance ? 'completed' : 'upcoming')
                };
            }
        });

        return weekGrid;
    };

    const weekGrid = organizeScheduleByWeek(dataToUse);

    // Status colors
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return theme.palette.success.main;
            case 'upcoming':
                return theme.palette.info.main;
            case 'absent':
                return theme.palette.error.main;
            default:
                return theme.palette.grey[300];
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return '●';
            case 'absent':
                return '●';
            default:
                return '●';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Đang tải thời khóa biểu...
                        </Typography>
                    </Box>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        ❌ {error}
                    </Typography>
                    <IconButton onClick={fetchTimetable} color="primary" size="large">
                        <RefreshIcon />
                    </IconButton>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={600} color="primary" gutterBottom>
                    📅 Thời Khóa Biểu Sinh Viên
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Lịch học và thông tin các môn học trong tuần
                </Typography>
            </Box>

            <Paper elevation={3} sx={{ p: 3, width: '100%', overflow: 'auto' }}>
                {/* Header */}
                <Typography variant="h5" fontWeight={600} mb={3} color="primary">
                    Thời khóa biểu theo tuần
                </Typography>

                {/* Controls */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            sx={{ backgroundColor: 'white' }}
                        >
                            <MenuItem value="2024">2024</MenuItem>
                            <MenuItem value="2025">2025</MenuItem>
                            <MenuItem value="2026">2026</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => setCurrentWeek(currentWeek.subtract(1, 'week'))}>
                            <ChevronLeft />
                        </IconButton>
                        <Typography variant="body1" sx={{ minWidth: 100, textAlign: 'center' }}>
                            15/09 - 21/09
                        </Typography>
                        <IconButton size="small" onClick={() => setCurrentWeek(currentWeek.add(1, 'week'))}>
                            <ChevronRight />
                        </IconButton>
                    </Box>

                    <IconButton onClick={fetchTimetable} color="primary" sx={{ ml: 'auto' }}>
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {/* Schedule Table */}
                <TableContainer component={Paper} sx={{ border: 2, borderColor: 'primary.main', borderRadius: 1 }}>
                    <Table sx={{ minWidth: 1000 }} size="small">
                        {/* Table Header */}
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 600, textAlign: 'center', borderRight: 1, borderColor: 'grey.300' }}>
                                    SLOT
                                </TableCell>
                                {daysOfWeek.map((day, index) => (
                                    <TableCell
                                        key={day.key}
                                        sx={{
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            borderRight: index < 6 ? 1 : 0,
                                            borderColor: 'grey.300'
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {day.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {day.date}
                                        </Typography>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        {/* Table Body */}
                        <TableBody>
                            {timeSlots.map((slot, slotIndex) => (
                                <TableRow key={slotIndex} sx={{ borderBottom: 1, borderColor: 'grey.300' }}>
                                    {/* Slot Column */}
                                    <TableCell
                                        sx={{
                                            borderRight: 1,
                                            borderColor: 'grey.300',
                                            backgroundColor: 'grey.50',
                                            textAlign: 'center',
                                            verticalAlign: 'middle',
                                            minHeight: 60,
                                            width: '12.5%'
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={500}>
                                            Slot {slotIndex}
                                        </Typography>
                                        {slot.time && (
                                            <Typography variant="caption" color="text.secondary">
                                                {slot.time}
                                            </Typography>
                                        )}
                                    </TableCell>

                                    {/* Day Columns */}
                                    {weekGrid[slotIndex].map((scheduleItem, dayIndex) => (
                                        <TableCell
                                            key={dayIndex}
                                            sx={{
                                                borderRight: dayIndex < 6 ? 1 : 0,
                                                borderColor: 'grey.300',
                                                p: 0.5,
                                                verticalAlign: 'top',
                                                minHeight: 60,
                                                width: '12.5%'
                                            }}
                                        >
                                            {scheduleItem ? (
                                                <Card
                                                    sx={{
                                                        height: 55,
                                                        backgroundColor: getStatusColor(scheduleItem.status),
                                                        color: 'white',
                                                        border: scheduleItem.status === 'absent' ? 2 : 0,
                                                        borderColor: 'error.main'
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: '100%' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, height: '100%' }}>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: scheduleItem.status === 'absent' ? 'error.main' : 'white',
                                                                    fontSize: '0.6rem'
                                                                }}
                                                            >
                                                                {getStatusIcon(scheduleItem.status)}
                                                            </Typography>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    fontWeight={600}
                                                                    sx={{
                                                                        fontSize: '0.75rem',
                                                                        color: scheduleItem.status === 'absent' ? 'error.main' : 'white',
                                                                        lineHeight: 1.2
                                                                    }}
                                                                >
                                                                    {scheduleItem.courseCode}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.3,
                                                                        color: scheduleItem.status === 'absent' ? 'error.main' : 'rgba(255,255,255,0.9)',
                                                                        fontSize: '0.5rem'
                                                                    }}
                                                                >
                                                                    <ScheduleIcon sx={{ fontSize: 6 }} />
                                                                    {scheduleItem.timeDisplay}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.3,
                                                                        color: scheduleItem.status === 'absent' ? 'error.main' : 'rgba(255,255,255,0.9)',
                                                                        fontSize: '0.5rem'
                                                                    }}
                                                                >
                                                                    <LocationOn sx={{ fontSize: 6 }} />
                                                                    {scheduleItem.room}
                                                                </Typography>
                                                            </Box>
                                                            {scheduleItem.status === 'absent' && (
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ color: 'error.main', fontSize: '0.6rem' }}
                                                                >
                                                                    ●
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <Box sx={{ height: 55 }} />
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Legend */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Trạng thái:
                    </Typography>
                    <Chip
                        size="small"
                        label="Đã học"
                        sx={{ backgroundColor: theme.palette.success.main, color: 'white', fontSize: '0.6rem' }}
                    />
                    <Chip
                        size="small"
                        label="Sắp học"
                        sx={{ backgroundColor: theme.palette.info.main, color: 'white', fontSize: '0.6rem' }}
                    />
                    <Chip
                        size="small"
                        label="Vắng mặt"
                        sx={{ backgroundColor: theme.palette.error.main, color: 'white', fontSize: '0.6rem' }}
                    />

                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">●</Typography>
                        <Typography variant="caption" color="success.main">Đã học</Typography>
                        <Typography variant="caption" color="text.secondary">●</Typography>
                        <Typography variant="caption" color="info.main">Sắp học</Typography>
                        <Typography variant="caption" color="text.secondary">●</Typography>
                        <Typography variant="caption" color="error.main">Vắng mặt</Typography>
                    </Box>
                </Box>

                {timetable.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            📚 Chưa có thời khóa biểu
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Bạn chưa được xếp lịch học nào trong tuần này.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default Timetable;