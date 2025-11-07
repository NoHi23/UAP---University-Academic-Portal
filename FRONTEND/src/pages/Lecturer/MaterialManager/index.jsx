import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, Select, InputLabel, MenuItem } from '@mui/material';
import lecturerAPI from '../../../api/lecturerAPI';
import majorAPI from '../../../api/majorAPI';
import { notifyError } from '../../../services/notificationService';

export default function LecturerMaterialManager() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [majors, setMajors] = useState([]);
  const [majorFilter, setMajorFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTeachingInstances();
    loadMajors();
  }, []);

  const loadTeachingInstances = async () => {
    setLoading(true);
    try {
  // For lecturers we allow viewing materials of any subject.
  // Use lecturer-specific endpoint so the request is authorized for lecturers.
  const res = await lecturerAPI.getSubjects();
  const subjects = res?.data || [];
  setItems(Array.isArray(subjects) ? subjects : []);
    } catch (err) {
      console.error('loadTeachingInstances error', err);
      notifyError('Không tải được danh sách môn giảng dạy');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMajors = async () => {
    try {
      const res = await majorAPI.getAll();
      setMajors(res?.data || []);
    } catch (err) {
      setMajors([]);
    }
  };

  const handleView = (subjectId) => {
    // open the same SubjectDetail but in read-only mode under lecturer route
    navigate(`/lecturer/material/${subjectId}?readonly=true`);
  };

  if (loading) return <Container sx={{ py: 4 }}><CircularProgress /></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Tài liệu giảng dạy</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="major-filter-label" shrink>Lọc theo ngành</InputLabel>
            <Select
              labelId="major-filter-label"
              label="Lọc theo ngành"
              value={majorFilter}
              displayEmpty
              onChange={(e) => setMajorFilter(e.target.value)}
            >
              <MenuItem value=""><em>-- Tất cả ngành --</em></MenuItem>
              {majors.filter(m => m && m._id).map(m => (
                <MenuItem key={m._id} value={m._id}>{(m.majorName || m.majorCode || m._id)}{m.majorCode ? ` (${m.majorCode})` : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={loadTeachingInstances}>Refresh</Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Mã</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Tín chỉ</TableCell>
              <TableCell>Kỳ học</TableCell>
              <TableCell>Major</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items
              .filter(s => !majorFilter || (s.majorId && String(s.majorId._id) === String(majorFilter)))
              .map((s, idx) => (
              <TableRow key={s._id || idx}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{s.subjectCode || '-'}</TableCell>
                <TableCell>{s.subjectName || '-'}</TableCell>
                <TableCell>{s.subjectNoCredit ?? '-'}</TableCell>
                <TableCell>{s.semester !== undefined && s.semester !== null ? s.semester : 'Chưa cập nhật'}</TableCell>
                <TableCell>{s.majorId?.majorName || ''}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleView(s._id)}>Xem chi tiết</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
