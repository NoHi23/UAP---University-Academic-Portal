import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Container, CircularProgress,
  IconButton, Card, CardContent, useTheme
} from '@mui/material';
import { ChevronLeft, ChevronRight, LocationOn, Schedule as ScheduleIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import './StudentTimetablePage.css'; // File CSS mới
import api from '../../services/api'; // Đảm bảo import api service của bạn

dayjs.locale('vi');

const StudentTimetablePage = () => {
  const theme = useTheme();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true);
      setError('');
      try {
        // GỌI ĐÚNG API /schedules/my-week
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
  }, [user, currentDate]); // Chạy lại khi user hoặc tuần thay đổi

  const timeSlots = [
    { slot: 1, time: '7:30-9:50' }, { slot: 2, time: '10:00-12:20' },
    { slot: 3, time: '12:50-15:10' }, { slot: 4, time: '15:20-17:40' },
    { slot: 5, time: '18:00-20:20' }, { slot: 6, time: '20:30-22:50' }
  ];

  const startOfWeek = currentDate.startOf('week').add(1, 'day'); // Bắt đầu từ thứ 2
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

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

  const scheduleGrid = organizeScheduleGrid(timetable);

  if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ textAlign: 'center', mt: 5 }}><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={600} mb={3}>Thời khóa biểu theo tuần</Typography>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => setCurrentDate(currentDate.subtract(1, 'week'))}><ChevronLeft /></IconButton>
          <Typography variant="h6" sx={{ minWidth: 180, textAlign: 'center' }}>
            {startOfWeek.format('DD/MM')} - {startOfWeek.add(6, 'day').format('DD/MM/YYYY')}
          </Typography>
          <IconButton onClick={() => setCurrentDate(currentDate.add(1, 'week'))}><ChevronRight /></IconButton>
        </Box>
        <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
          <Table sx={{ minWidth: 1000 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>SLOT</TableCell>
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
                          <Card className="schedule-card success">
                            <CardContent>
                              <Typography className="card-code">{scheduleItem.subjectId.subjectCode}</Typography>
                              <Typography className="card-time"><ScheduleIcon /> {scheduleItem.startTime} - {scheduleItem.endTime}</Typography>
                              <Typography className="card-room"><LocationOn /> {scheduleItem.roomId.roomName}</Typography>
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
      </Paper>
    </Container>
  );
};

export default StudentTimetablePage;