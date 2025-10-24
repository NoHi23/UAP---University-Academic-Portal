import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Container, CircularProgress,
  IconButton, Card, CardContent, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ChevronLeft, ChevronRight, LocationOn, Schedule as ScheduleIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import './StudentTimetablePage.css'; // File CSS mới
import api from '../../services/api'; // Đảm bảo import api service của bạn
import { generateWeeksOfYearSimple } from '../../pages/Lecturer/ScheduleLecturePages/functionCreatWeek';

dayjs.locale('vi');

const StudentTimetablePage = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [year, setYear] = useState(dayjs().year());
  const [weeks, setWeeks] = useState(() => generateWeeksOfYearSimple(dayjs().year()));
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const wks = generateWeeksOfYearSimple(dayjs().year());
    return wks.find(w => {
      const now = dayjs().valueOf();
      return now >= w.fromTs && now <= w.toTs;
    }) || wks[0];
  });
  const [firstDayInWeek, setFirstDayInWeek] = useState('');
  const [lastDayInWeek, setLastDayInWeek] = useState('');
  const { user } = useContext(AuthContext);

  // When year changes, regenerate weeks and pick a sensible default week
  useEffect(() => {
    const wks = generateWeeksOfYearSimple(year);
    setWeeks(wks);
    const curTs = dayjs(currentDate).valueOf();
    const found = wks.find(w => curTs >= w.fromTs && curTs <= w.toTs) || wks[0];
    setSelectedWeek(found);
  }, [year, currentDate]);

  // Keep first/last day variables in sync with selectedWeek
  useEffect(() => {
    if (selectedWeek) {
      setFirstDayInWeek(selectedWeek.from);
      setLastDayInWeek(selectedWeek.to);
    }
  }, [selectedWeek]);

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
    <Container maxWidth="xl" sx={{ py: 3 }} data-firstday={firstDayInWeek} data-lastday={lastDayInWeek}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={600} mb={3}>Thời khóa biểu theo tuần</Typography>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel id="year-select-label">Năm</InputLabel>
              <Select
                labelId="year-select-label"
                label="Năm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = dayjs().year() - 2 + i;
                  return <MenuItem key={y} value={y}>{y}</MenuItem>;
                })}
              </Select>
            </FormControl>

            <IconButton onClick={() => {
              if (!weeks || !selectedWeek) return;
              const idx = weeks.findIndex(w => w.week === selectedWeek.week);
              if (idx > 0) setSelectedWeek(weeks[idx - 1]);
            }}>
              <ChevronLeft />
            </IconButton>

            <FormControl size="small" sx={{ minWidth: 320 }}>
              <InputLabel id="week-select-label">Tuần</InputLabel>
              <Select
                labelId="week-select-label"
                label="Tuần"
                value={selectedWeek ? selectedWeek.week : ''}
                onChange={(e) => {
                  const wk = weeks.find(w => w.week === e.target.value);
                  if (wk) setSelectedWeek(wk);
                }}
              >
                {weeks.map(w => (
                  <MenuItem key={w.week} value={w.week}>{w.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton onClick={() => {
              if (!weeks || !selectedWeek) return;
              const idx = weeks.findIndex(w => w.week === selectedWeek.week);
              if (idx < weeks.length - 1) setSelectedWeek(weeks[idx + 1]);
            }}>
              <ChevronRight />
            </IconButton>
          </Box>
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