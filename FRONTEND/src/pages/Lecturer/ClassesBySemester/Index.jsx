import React, { useEffect, useState } from 'react';
import { Box, Grid, Select, MenuItem, Typography, CircularProgress, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import lecturerAPI from '../../../api/lecturerAPI';
// ClassCard was used in the initial card layout but replaced by table view; removed import to avoid linter warning
import ClassDetailModal from './components/ClassDetailModal';

// Trang hiển thị danh sách lớp theo kỳ cho giảng viên
const ClassesBySemesterPage = () => {
  const [semesters, setSemesters] = useState([]);
  // default to empty string (means "Tất cả kỳ") to avoid null/uncontrolled Select
  const [currentSemesterId, setCurrentSemesterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]); // teaching-instances
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      const res = await lecturerAPI.getSemesters();
      // support two possible response shapes from backend:
      // 1) { data: [...], currentSemesterId }
      // 2) [ ... ] (array directly)
      if (Array.isArray(res)) {
        setSemesters(res);
        // default to first semester if exists, otherwise leave as '' (all semesters)
        setCurrentSemesterId((res[0] && res[0]._id) || '');
      } else if (res && res.data) {
        setSemesters(res.data);
        setCurrentSemesterId(res.currentSemesterId || (res.data[0] && res.data[0]._id) || '');
      }
    } catch (err) {
      console.error('loadSemesters', err);
    } finally {
      setLoading(false);
    }
  };

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Do not auto-fetch on selection anymore. User must click 'Tìm' to load data.
  const fetchClassesBySemester = async (semesterId, subjectId) => {
    try {
      setLoading(true);
      // Use backend aggregation endpoint that returns teaching-instances grouped
  // pass subjectId as query param if provided
  const resp = await lecturerAPI.getClassesBySemester(semesterId || '');
      const list = (resp && resp.data) || [];
      // normalize dates from backend (they are ISO strings) to Date objects if needed
      let normalized = list.map(g => ({
        ...g,
        startDate: g.startDate ? new Date(g.startDate) : null,
        endDate: g.endDate ? new Date(g.endDate) : null
      }));
      // If subject filter provided on client, also apply it (server may have filtered already if passed)
      if (subjectId && String(subjectId).trim() !== '') {
        normalized = normalized.filter(g => String(g.subjectId) === String(subjectId));
      }
      setGroups(normalized);
    } catch (err) {
      console.error('fetchSemesterOptions', err);
    } finally {
      setLoading(false);
    }
  };

  const openModalForGroup = (group) => {
    setSelectedGroup(group);
    setModalOpen(true);
  };






  

  // fetch subjects list when semester selection changes (for subject filter dropdown)
  useEffect(() => {
    const loadSubjects = async () => {
      // currentSemesterId === null -> haven't picked anything yet (leave empty)
      if (currentSemesterId === null) {
        setSubjects([]);
        setSelectedSubjectId('');
        return;
      }

      try {
        // If 'Tất cả kỳ' selected the value is empty string: fetch classes across all semesters
        if (currentSemesterId === '') {
          // request without semesterId so backend returns all teaching-instances
          const resp = await lecturerAPI.getClassesBySemester();
          const list = (resp && resp.data) || [];
          const map = {};
          list.forEach(i => {
            if (i.subjectId) {
              map[String(i.subjectId)] = { _id: i.subjectId, subjectName: i.subjectName, subjectCode: i.subjectCode };
            }
          });
          setSubjects(Object.values(map));
          setSelectedSubjectId('');
          return;
        }

        // Specific semester selected: use semester-options endpoint
        const resp = await lecturerAPI.getSemesterOptions(currentSemesterId);
        const subs = (resp.data && resp.data.subjects) || [];
        setSubjects(subs.map(s => ({ _id: s.subjectId, subjectName: s.subjectName, subjectCode: s.subjectCode })));
      } catch (err) {
        console.error('loadSubjects', err);
        setSubjects([]);
      }
    };
    loadSubjects();
  }, [currentSemesterId]);

  return (
    <Box p={3}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <Typography variant="h6">Danh sách lớp theo kỳ</Typography>
        </Grid>
          <Grid item>
            {loading ? <CircularProgress size={20} /> : (
              <>
                <Select
                displayEmpty
                  value={currentSemesterId || ''}
                  onChange={e => {
                    const v = e.target.value;
                    // debug: log what value is emitted by Select when user chooses
                    // especially to inspect the 'Tất cả kỳ' case
                    // eslint-disable-next-line no-console
                    
                    setCurrentSemesterId(String(v));
                  }}
                  size='small'
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value="">Tất cả kỳ</MenuItem>
                  {semesters.map(s => (
                    <MenuItem key={s._id} value={String(s._id)}>{s.semesterName && s.semesterName.trim() ? s.semesterName : 'Tất cả kỳ'}</MenuItem>
                  ))}
                </Select>

                {/* Debug info: show current value and counts to help diagnose the empty-label issue */}
              
              </>
            )}
          </Grid>
          <Grid item>
            <Select value={selectedSubjectId || ''} onChange={e => setSelectedSubjectId(e.target.value)} displayEmpty size="small" sx={{ minWidth: 200 }}>
              <MenuItem value="">Tất cả môn</MenuItem>
              {subjects.map(s => (
                <MenuItem key={s._id} value={s._id}>{s.subjectName || s.subjectCode}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={() => fetchClassesBySemester(currentSemesterId, selectedSubjectId)}>Tìm Kiếm</Button>
          </Grid>
      </Grid>

      <Box mt={3}>
        {loading && <CircularProgress />}
        {!loading && groups.length === 0 && <Typography>Nhấn tìm kiếm để nhận về lớp theo kỳ và môn học.</Typography>}

        {!loading && groups.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>STT</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell>Môn</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Số buổi</TableCell>
                <TableCell>Số sinh viên</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((g, idx) => (
                <TableRow key={g.classId + '::' + g.subjectId}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{g.className} {g.classCode ? `(${g.classCode})` : ''}</TableCell>
                  <TableCell>{g.subjectName} {g.subjectCode ? `(${g.subjectCode})` : ''}</TableCell>
                  <TableCell>{g.startDate ? g.startDate.toLocaleDateString() : '-'} — {g.endDate ? g.endDate.toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{g.totalSlots}</TableCell>
                  <TableCell>{g.studentCount}</TableCell>
                  <TableCell><Button size="small" onClick={() => openModalForGroup(g)}>Xem chi tiết</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {selectedGroup && (
        <ClassDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          group={selectedGroup}
        />
      )}
    </Box>
  );
};

  // fetch subjects list when semester selection changes (for subject filter dropdown)
  

export default ClassesBySemesterPage;
