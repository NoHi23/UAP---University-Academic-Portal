import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Container, CircularProgress,
  IconButton, Card, CardContent, FormControl, Select, MenuItem
} from '@mui/material';
import { ChevronLeft, ChevronRight, LocationOn, Schedule as ScheduleIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../../services/api';
import { generateWeeksOfYearSimple, buildDaysOfWeek } from '../Lecturer/ScheduleLecturePages/functionCreatWeek';

dayjs.locale('vi');

const StudentTimetablePage = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [weeksOfYear, setWeeksOfYear] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [timetable, setTimetable] = useState([]);

  // --- khi đổi năm thì sinh lại list tuần ---
  useEffect(() => {
    const yearNum = parseInt(selectedYear, 10);
    const weeks = generateWeeksOfYearSimple(yearNum);
    setWeeksOfYear(weeks);

    const today = dayjs();
    if (today.year() === yearNum) {
      const idx = weeks.findIndex(w => {
        const from = dayjs(w.from);
        const to = dayjs(w.to);
        return today.isAfter(from, 'day') && today.isBefore(to, 'day');
      });
      setSelectedWeekIndex(idx >= 0 ? idx : 0);
    } else {
      setSelectedWeekIndex(0);
    }
  }, [selectedYear]);

  // --- tuần đang chọn ---
  const weekRangeVar = (weeksOfYear && weeksOfYear.length)
    ? weeksOfYear[selectedWeekIndex]
    : { from: dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'), to: dayjs().endOf('week').format('YYYY-MM-DD'), label: '...' };

  const daysOfWeek = buildDaysOfWeek(weekRangeVar.from);

  // --- gọi API lấy thời khóa biểu ---
  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true);
      setError('');
      try {
        if (!user || !weekRangeVar?.from || !weekRangeVar?.to) return;
        const res = await api.post('/student/schedules/my-week', {
          from: weekRangeVar.from,
          to: weekRangeVar.to,
        });
        setTimetable(res.data.data || []);
      } catch (err) {
        setError('Không thể tải thời khóa biểu.');
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [user, weekRangeVar]);

  // --- slot thời gian cố định ---
  const timeSlots = [
    { slot: 1, time: '7:30-9:50' },
    { slot: 2, time: '10:00-12:20' },
    { slot: 3, time: '12:50-15:10' },
    { slot: 4, time: '15:20-17:40' },
    { slot: 5, time: '18:00-20:20' },
    { slot: 6, time: '20:30-22:50' },
  ];

  // --- sắp xếp thời khóa biểu thành lưới [slot][ngày] ---
  const organizeScheduleGrid = (data) => {
    const grid = Array(timeSlots.length).fill(null).map(() => Array(7).fill(null));
    data.forEach(item => {
      const date = dayjs(item.date);
      let dayIndex = date.day() - 1;
      if (dayIndex === -1) dayIndex = 6;
      const slotIndex = timeSlots.findIndex(ts => ts.slot === item.slot);
      if (dayIndex >= 0 && slotIndex >= 0) grid[slotIndex][dayIndex] = item;
    });
    return grid;
  };

  const scheduleGrid = organizeScheduleGrid(timetable);

  if (loading)
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  if (error)
    return <Container sx={{ textAlign: 'center', mt: 5 }}><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={3} color="primary">
          Thời khóa biểu theo tuần
        </Typography>

        {/* Bộ lọc chọn năm và tuần */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2026">2026</MenuItem>
              <MenuItem value="2027">2027</MenuItem>
              <MenuItem value="2028">2028</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 320 }}>
            <Select
              value={selectedWeekIndex}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
              displayEmpty
            >
              {(weeksOfYear || []).map((w, idx) => (
                <MenuItem key={`${w.from}-${idx}`} value={idx}>
                  {w.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setSelectedWeekIndex(i => Math.max(0, i - 1))}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body1" sx={{ minWidth: 180, textAlign: 'center' }}>
              {weekRangeVar.label}
            </Typography>
            <IconButton size="small" onClick={() => setSelectedWeekIndex(i => Math.min(weeksOfYear.length - 1, i + 1))}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* Bảng thời khóa biểu */}
        <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
          <Table sx={{ minWidth: 1000 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>SLOT</TableCell>
                {daysOfWeek.map((day, idx) => (
                  <TableCell key={idx} sx={{ fontWeight: 600, textAlign: 'center' }}>
                    {day.label}<br />
                    <Typography variant="caption" color="text.secondary">{day.date}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlots.map((slotInfo, slotIndex) => (
                <TableRow key={slotInfo.slot}>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
                    Slot {slotInfo.slot}<br />
                    <Typography variant="caption">{slotInfo.time}</Typography>
                  </TableCell>
                  {daysOfWeek.map((_, dayIndex) => {
                    const scheduleItem = scheduleGrid[slotIndex][dayIndex];
                    return (
                      <TableCell key={dayIndex} sx={{ p: 0.5, textAlign: 'center', verticalAlign: 'top' }}>
                        {scheduleItem && (
                          <Card sx={{
                            height: 60,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.9 }
                          }}>
                            <CardContent sx={{ p: 1 }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {scheduleItem.subjectId?.subjectCode || '---'}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ScheduleIcon sx={{ fontSize: 10, mr: 0.5 }} />
                                {scheduleItem.startTime} - {scheduleItem.endTime}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LocationOn sx={{ fontSize: 10, mr: 0.5 }} />
                                {scheduleItem.roomId?.roomName || 'Phòng TBD'}
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
      </Paper>
    </Container>
  );
};

export default StudentTimetablePage;
