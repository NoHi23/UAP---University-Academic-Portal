import React, { useState, useEffect } from 'react';
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
  TableRow
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  LocationOn,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../../../../services/api';
import { generateWeeksOfYearSimple, buildDaysOfWeek } from '../functionCreatWeek';
import ClassActivityModal from './ClassActivityModal';
dayjs.locale('vi');

const WeekTimeTable = () => {
  // Hàm xác định thứ trong tuần từ ngày bất kỳ
  const getDayOfWeek = (date) => {
    // date: dayjs object hoặc string
    const d = dayjs(date);
    // JS: Chủ nhật = 0, Thứ 2 = 1, ... Thứ 7 = 6
    // Trả về số thứ (0-6) và tên thứ tiếng Việt
    const daysVN = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return { num: d.day(), name: daysVN[d.day()] };
  };

  // week helper functions moved to ../functionCreatWeek

  // Log ngày hiện tại và thứ hiện tại
  const today = dayjs();
  const todayInfo = getDayOfWeek(today);
  console.log('[WEEK TABLE] Hôm nay:', today.format('YYYY-MM-DD'), '| Thứ:', todayInfo.num, todayInfo.name);
  const theme = useTheme();
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [weeksOfYear, setWeeksOfYear] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate week range
  const getWeekRange = (date) => {
    // Compute Monday..Sunday deterministically using numeric day to avoid locale-dependent startOf('week')
    const d = dayjs(date);
    const day = d.day(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = day === 0 ? -6 : 1 - day; // if Sun -> go back 6 days, else 1 - day
    const monday = d.add(diffToMonday, 'day').startOf('day');
    const sunday = monday.add(6, 'day').endOf('day');
    return {
      from: monday.format('YYYY-MM-DD'),
      to: sunday.format('YYYY-MM-DD'),
      label: `${monday.format('DD/MM')} - ${sunday.format('DD/MM')}`
    };
  };

  // Fetch schedule from API (POST, form-data)
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!weeksOfYear || weeksOfYear.length === 0) return;
        const week = weeksOfYear[selectedWeekIndex] || weeksOfYear[0];
        console.log('[WEEK API CALL]', { from: week.from, to: week.to, label: week.label });
        const res = await api.post('/lecturer/schedules/my-week', { from: week.from, to: week.to });
        setScheduleData(res.data.data || []);
      } catch (err) {
        setError('Không thể tải thời khóa biểu');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [weeksOfYear, selectedWeekIndex]);

  const dataToUse = scheduleData;

  // Time slots definition
  const timeSlots = [
    { slot: 1, time: '7:30-9:50' },
    { slot: 2, time: '10:00-12:20' },
    { slot: 3, time: '10:50-12:20' },
    { slot: 4, time: '15:20-17:40' },
    { slot: 5, time: '18:00-20:20' },
    { slot: 6, time: '20:30-22:50' },

  ];

  // Prepare header days for the current week so JSX can render labels/dates
  // build weeks list when selectedYear changes and pick default week (today's week if same year)
  useEffect(() => {
    const yearNum = parseInt(selectedYear, 10);
    const weeks = generateWeeksOfYearSimple(yearNum);
    setWeeksOfYear(weeks);
    const today = dayjs();
    if (today.year() === yearNum) {
      const idx = weeks.findIndex(w => {
        const from = dayjs(w.from);
        const to = dayjs(w.to);
        return (today.isSame(from, 'day') || (today.isAfter(from, 'day') && today.isBefore(to, 'day')) || today.isSame(to, 'day'));
      });
      setSelectedWeekIndex(idx >= 0 ? idx : 0);
    } else {
      setSelectedWeekIndex(0);
    }
  }, [selectedYear]);

  // dòng này có nghĩa là nếu mà weeksOfYear tồn tại và có độ dài > 0 thì gán weekRangeVar bằng weeksOfYear[selectedWeekIndex], nếu không thì gán bằng kết quả của getWeekRange(dayjs())
  const weekRangeVar = (weeksOfYear && weeksOfYear.length) ? weeksOfYear[selectedWeekIndex] : getWeekRange(dayjs());
  const daysOfWeek = buildDaysOfWeek(weekRangeVar.from);


  // Organize schedule data into grid
  const organizeScheduleByWeek = (data) => {
    const weekGrid = Array(13).fill(null).map(() => Array(7).fill(null));

    data.forEach(item => {
      // Sử dụng item.date (kiểu Date) thay vì item.time
      const date = dayjs(item.date);
      let dayIndex = date.day() - 1; // Convert to 0-6 (Mon-Sun)
      if (dayIndex === -1) dayIndex = 6; // Sunday becomes 6

      const slotIndex = item.slot;

      if (slotIndex >= 0 && slotIndex < 8 && dayIndex >= 0 && dayIndex < 7) {
        weekGrid[slotIndex][dayIndex] = {
          ...item,
          dayName: date.format('dddd'),
          // Hiển thị giờ học từ startTime/endTime nếu có, fallback nếu thiếu
          timeDisplay: (item.startTime && item.endTime)
            ? `${item.startTime}-${item.endTime}`
            : (date.isValid() ? date.format('HH:mm') : '')
        };
      }
    });

    return weekGrid;
  };

  const weekGrid = organizeScheduleByWeek(dataToUse);

  // (removed unused getStatusColor helper)

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
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const chooseActionForClass = (schedule) => () => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };


  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={600} mb={3} color="primary">
        Thời khóa biểu theo tuần
      </Typography>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>


        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setSelectedWeekIndex(i => Math.max(0, i - 1))}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="body1" sx={{ minWidth: 200, textAlign: 'center' }}>
            {weekRangeVar.label}
          </Typography>
          <IconButton size="small" onClick={() => setSelectedWeekIndex(i => Math.min(weeksOfYear.length - 1, i + 1))}>
            <ChevronRight />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ ml: 'auto', cursor: 'pointer', color: 'primary.main' }}>
          📥 Nhập vào lịch
        </Typography>
      </Box>

      {/* Week selector */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
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
              <MenuItem key={`${w.from}-${idx}`} value={idx}>{w.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Typography color="info.main" sx={{ mb: 2 }}>Đang tải thời khóa biểu...</Typography>
      )}
      {error && (
        <Typography color="error.main" sx={{ mb: 2 }}>{error}</Typography>
      )}

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
                    Slot {slot.slot}
                  </Typography>
                  {slot.time && (
                    <Typography variant="caption" color="text.secondary">
                      {slot.time}
                    </Typography>
                  )}
                </TableCell>

                {/* Day Columns */}
                {weekGrid[(slot.slot)].map((scheduleItem, dayIndex) => (
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
                      (() => {
                        const attendance = scheduleItem.attendanceSummary || {};
                        const status = attendance.statusOfAttendance || 'upcoming';
                        // decide colors according to new mapping requested by user:
                        // - 'upcoming' (chưa đến slot) => green (success)
                        // - 'complete' (đã điểm danh) => primary (purple/dark)
                        // - 'incomplete' (chưa điểm danh / bỏ lỡ) => white (default background)
                        let cardBg = 'background.paper';
                        let textColor = 'text.primary';
                        if (status === 'upcoming') {
                          cardBg = theme.palette.success.main;
                          textColor = 'white';
                        } else if (status === 'complete') {
                          cardBg = theme.palette.primary.main;
                          textColor = theme.palette.primary.contrastText || 'white';
                        } else {
                          // incomplete => default white background, dark text
                          cardBg = 'background.paper';
                          textColor = theme.palette.text.primary || '#333';
                        }

                        return (
                          <Card
                            sx={{
                              height: 55,
                              backgroundColor: cardBg,
                              color: textColor,
                              border: 0,
                              borderColor: 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={chooseActionForClass(scheduleItem)}
                          >

                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, height: '100%' }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: textColor,
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
                                      color: textColor,
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {scheduleItem.subjectId?.subjectCode || 'test'}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                      color: textColor,
                                      fontSize: '0.5rem'
                                    }}
                                  >
                                    <ScheduleIcon sx={{ fontSize: 6, color: textColor }} />
                                    {scheduleItem.timeDisplay}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                      color: textColor,
                                      fontSize: '0.5rem'
                                    }}
                                  >
                                    <LocationOn sx={{ fontSize: 6, color: textColor }} />
                                    {scheduleItem.roomId?.roomName || 'Phòng TBD'}
                                  </Typography>
                                </Box>
                                {status === 'incomplete' && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: theme.palette.warning.main || 'orange', fontSize: '0.6rem' }}
                                  >
                                    ●
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })()
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

      {/* Class activity modal: opened when a schedule cell is clicked */}
      <ClassActivityModal open={showModal} onClose={() => setShowModal(false)} schedule={selectedSchedule} />

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip size="small" label="Chưa đến" sx={{ backgroundColor: theme.palette.success.main, color: 'white', fontSize: '0.75rem' }} />
        <Chip size="small" label="Đã điểm danh" sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontSize: '0.75rem' }} />
        <Chip size="small" label="Chưa điểm danh / Bỏ lỡ" sx={{ backgroundColor: theme.palette.background.paper, border: 1, borderColor: 'grey.300', color: theme.palette.text.primary, fontSize: '0.75rem' }} />

        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, backgroundColor: theme.palette.success.main, borderRadius: '50%' }} />
            <Typography variant="caption" color="text.secondary">Chưa đến</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, backgroundColor: theme.palette.primary.main, borderRadius: '50%' }} />
            <Typography variant="caption" color="text.secondary">Đã điểm danh</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, backgroundColor: theme.palette.background.paper, border: '1px solid', borderColor: 'grey.300', borderRadius: '50%' }} />
            <Typography variant="caption" color="text.secondary">Chưa điểm danh / Bỏ lỡ</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default WeekTimeTable;