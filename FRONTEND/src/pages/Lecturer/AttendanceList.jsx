import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Grid, Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, TableContainer, Paper, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemSecondaryAction, Chip } from '@mui/material';
import api from '../../services/api';
import DetailSlotModal from './ScheduleLecturePages/component/DetailSlotModal';

const AttendanceList = () => {
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filterMode, setFilterMode] = useState('class'); // 'class' or 'subject'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailScheduleId, setDetailScheduleId] = useState(null);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isNarrow = useMediaQuery('(max-width:800px)');
  const [scheduleListOpen, setScheduleListOpen] = useState(false);
  const [scheduleListSchedules, setScheduleListSchedules] = useState([]);
  const [scheduleListTitle, setScheduleListTitle] = useState('Danh sách buổi');

  useEffect(() => {
    // fetch semesters (use lecturer endpoint) on mount
    const fetchSemesters = async () => {
      try {
        const semRes = await api.get('lecturer/semesters');
        if (semRes?.data?.success) setSemesters(semRes.data.data || []);
        else if (Array.isArray(semRes?.data)) setSemesters(semRes.data);
        // if API returned currentSemesterId, preselect it
        if (semRes?.data?.currentSemesterId) setSelectedSemester(semRes.data.currentSemesterId);
      } catch (err) {
        console.error('Failed to load semesters', err);
        const msg = err?.response?.data?.message || err.message || 'Không thể tải dữ liệu học kỳ';
        setError(msg);
      }
    };
    fetchSemesters();
  }, []);

  const loadSummary = async () => {
    if (!selectedSemester) {
      setError('Vui lòng chọn học kỳ');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // backend endpoint may not exist yet
      const q = new URLSearchParams();
      q.set('semesterId', selectedSemester);
      if (filterMode === 'class' && selectedClass) q.set('classId', selectedClass);
      if (filterMode === 'subject' && selectedClass) q.set('subjectId', selectedClass);
      const res = await api.get(`lecturer/attendance/summary?${q.toString()}`);
      if (res?.data?.success) {
        setResults(res.data.data || []);
      } else {
        setResults(res?.data || []);
      }
    } catch (err) {
      console.error('loadSummary error', err);
      const msg = err?.response?.data?.message || err.message || 'Không thể tải báo cáo điểm danh (API có thể chưa được triển khai)';
      setError(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch classes/subjects for selected semester
  useEffect(() => {
    const fetchOptions = async () => {
      if (!selectedSemester) return;
      try {
        const res = await api.get(`lecturer/semester-options?semesterId=${selectedSemester}`);
        if (res?.data?.success) {
          setClasses(res.data.data.classes || []);
          // keep subjects in classes state too if needed
          // store combined subjects in classes variable when filterMode=subject
          setSubjectsList(res.data.data.subjects || []);
          // reset selection so empty = all
          setSelectedClass('');
        }
        } catch (err) {
          console.error('fetchOptions error', err);
          const msg = err?.response?.data?.message || err.message || null;
          if (msg) setError(msg);
        }
    };
    fetchOptions();
  }, [selectedSemester]);

  return (
<<<<<<< HEAD
    <div>
      <h2>Danh sách điểm danh</h2>
      <p>Danh sách điểm danh theo buổi/học phần</p>
    </div>
=======
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Danh sách điểm danh (theo học kỳ)</Typography>

      <Box sx={{ mb: 2 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth={isSmall} sx={{ minWidth: 240 }} size="small">
          <InputLabel id="semester-label">Học kỳ</InputLabel>
          <Select
            labelId="semester-label"
            value={selectedSemester}
            label="Học kỳ"
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <MenuItem value="">-- Chọn học kỳ --</MenuItem>
            {semesters.map(s => (
                  <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.semesterName} • {new Date(s.startDate).getFullYear()}</MenuItem>
            ))}
          </Select>
          </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth={isSmall} sx={{ minWidth: 160 }} size="small">
              <InputLabel id="filter-mode-label">Lọc theo</InputLabel>
              <Select
                labelId="filter-mode-label"
                value={filterMode}
                label="Lọc theo"
                onChange={(e) => {
                  setFilterMode(e.target.value);
                  // reset selected class/subject so empty means "all"
                  setSelectedClass('');
                }}
              >
                <MenuItem value={'class'}>Lớp</MenuItem>
                <MenuItem value={'subject'}>Học phần</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth={isSmall} sx={{ minWidth: 240 }} size="small">
              <InputLabel id="class-label">{filterMode === 'class' ? 'Lớp' : 'Học phần'}</InputLabel>
              <Select
                labelId="class-label"
                value={selectedClass}
                label={filterMode === 'class' ? 'Lớp' : 'Học phần'}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">-- Tất cả --</MenuItem>
                {filterMode === 'class' && classes.map(c => (
                  <MenuItem key={c.classId || c._id} value={c.classId || c._id}>{c.className}</MenuItem>
                ))}
                {filterMode === 'subject' && subjectsList.map(s => (
                  <MenuItem key={s.subjectId || s._id} value={s.subjectId || s._id}>{s.subjectName || s.subjectCode}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button fullWidth={isSmall} variant="contained" onClick={loadSummary} disabled={loading}>Tải báo cáo</Button>
            {loading && <Box sx={{ display: 'inline-block', ml: 1 }}><CircularProgress size={24} /></Box>}
          </Grid>
        </Grid>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {isNarrow ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {results.length === 0 && (
            <Typography align="center">Không có dữ liệu. Nhấn "Tải báo cáo" để lấy dữ liệu.</Typography>
          )}
          {results.map(row => {
            let classDisplay = row.className || (row.classId && row.classId.className) || '';
            if (!classDisplay && Array.isArray(row.schedules)) {
              const names = row.schedules.map(s => (s.classId && s.classId.className) || s.className || '').filter(Boolean);
              classDisplay = Array.from(new Set(names)).join(', ') || '—';
            }
            const subjectDisplay = row.subjectCode || row.subjectName || row.subject?.subjectName || '—';
            return (
              <Card key={row.classId || row.subjectId || Math.random()} variant="outlined" sx={{ maxWidth: 760, mx: 'auto' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>{subjectDisplay}</Typography>
                  <Typography variant="body2" color="text.secondary">Lớp: {classDisplay || '—'}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2">Tổng: <strong>{row.totalSlots ?? (row.schedules ? row.schedules.length : 0)}</strong></Typography>
                    <Typography variant="body2">Đã điểm danh: <strong>{row.taughtSlots ?? 0}</strong></Typography>
                    <Typography variant="body2">Chưa: <strong>{row.notTaughtSlots ?? ((row.totalSlots ?? (row.schedules ? row.schedules.length : 0)) - (row.taughtSlots ?? 0))}</strong></Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => {
                    setScheduleListSchedules(row.schedules || []);
                    setScheduleListTitle(subjectDisplay);
                    setScheduleListOpen(true);
                  }}>Xem chi tiết</Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: '60vh', overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Học phần</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell align="center">Tổng số buổi</TableCell>
                <TableCell align="center">Đã điểm danh</TableCell>
                <TableCell align="center">Chưa điểm danh</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Không có dữ liệu. Nhấn "Tải báo cáo" để lấy dữ liệu.</TableCell>
                </TableRow>
              )}
              {results.map(row => {
                let classDisplay = row.className || (row.classId && row.classId.className) || '';
                if (!classDisplay && Array.isArray(row.schedules)) {
                  const names = row.schedules.map(s => (s.classId && s.classId.className) || s.className || '').filter(Boolean);
                  classDisplay = Array.from(new Set(names)).join(', ') || '—';
                }
                const subjectDisplay = row.subjectCode || row.subjectName || row.subject?.subjectName || '—';

                return (
                  <TableRow key={row.classId || row.subjectId || Math.random()}>
                    <TableCell>{subjectDisplay}</TableCell>
                    <TableCell>{classDisplay || '—'}</TableCell>
                    <TableCell align="center">{row.totalSlots ?? (row.schedules ? row.schedules.length : '—')}</TableCell>
                    <TableCell align="center">{row.taughtSlots ?? 0}</TableCell>
                    <TableCell align="center">{row.notTaughtSlots ?? ( (row.totalSlots ?? (row.schedules ? row.schedules.length : 0)) - (row.taughtSlots ?? 0) )}</TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => {
                          setScheduleListSchedules(row.schedules || []);
                          setScheduleListTitle(subjectDisplay);
                          setScheduleListOpen(true);
                        }}>Xem chi tiết</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DetailSlotModal open={openDetail} onClose={() => setOpenDetail(false)} scheduleId={detailScheduleId} />
      <Dialog open={scheduleListOpen} onClose={() => setScheduleListOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{scheduleListTitle}</DialogTitle>
        <DialogContent dividers>
          {(!scheduleListSchedules || scheduleListSchedules.length === 0) && (
            <Typography>Không có buổi nào để hiển thị.</Typography>
          )}
          {Array.isArray(scheduleListSchedules) && scheduleListSchedules.length > 0 && (
            <List>
              {scheduleListSchedules.map(s => {
                const sid = s.scheduleId || s._id || '';
                const dateStr = s.date ? new Date(s.date).toLocaleDateString() : '';
                const taught = !!(s.taught === true || s.attendance === true);
                return (
                  <ListItem key={sid} divider button onClick={() => {
                    // open detail for this schedule
                    setDetailScheduleId(sid);
                    setOpenDetail(true);
                    setScheduleListOpen(false);
                  }}>
                    <ListItemText primary={`${dateStr} — Tiết ${s.slot || ''}`} secondary={s.room || ''} />
                    <ListItemSecondaryAction>
                      <Chip label={taught ? 'Đã điểm danh' : 'Chưa điểm danh'} color={taught ? 'success' : 'default'} size="small" />
                      <Button size="small" sx={{ ml: 1 }} onClick={(e) => {
                        e.stopPropagation();
                        const sid2 = s.scheduleId || s._id || '';
                        setDetailScheduleId(sid2);
                        setOpenDetail(true);
                        setScheduleListOpen(false);
                      }}>Xem</Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
>>>>>>> 345a50dcfb1b50bbf4f6c3dba8ad796e44230aee
  );
};

export default AttendanceList;
