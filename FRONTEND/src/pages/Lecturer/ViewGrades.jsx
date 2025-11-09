import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import lecturerAPI from '../../api/lecturerAPI';
import gradeComponentAPI from '../../api/gradeComponentAPI';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const ViewGrades = () => {
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const semRes = await lecturerAPI.getSemesters();
        // support response shapes used elsewhere in app
        const semList = Array.isArray(semRes) ? semRes : (semRes?.data || semRes || []);
        setSemesters(semList);
        // determine current semester id similar to EnterGrades logic
        let currentSemesterId = semRes?.currentSemesterId || semRes?.data?.currentSemesterId || (Array.isArray(semRes?.data) ? semRes.data[0]?._id : semRes?.data?.[0]?._id) || semRes?.[0]?._id;
        if (!currentSemesterId && semRes?.data && Array.isArray(semRes.data) && semRes.data.length > 0) currentSemesterId = semRes.data[0]._id;
        if (currentSemesterId) setSemesterId(currentSemesterId);
      } catch (e) {
        console.error('Could not load semesters', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!semesterId) {
        setSubjects([]);
        return;
      }
      try {
        // Prefer lecturer-specific semester options (subjects/classes assigned to this lecturer)
        const semOpt = await lecturerAPI.getSemesterOptions(semesterId);
        const semData = semOpt?.data || semOpt || {};
        const semSubjects = semData.subjects || [];
        if (Array.isArray(semSubjects) && semSubjects.length > 0) {
          // map to consistent shape: { _id: subjectId, code, name }
          setSubjects(semSubjects.map(s => ({ _id: s.subjectId, code: s.subjectCode || s.code || '', name: s.subjectName || s.name || '' })));
        } else {
          // fallback
          const resp = await lecturerAPI.getSubjects({ semesterId });
          const data = resp?.data || resp || [];
          const list = Array.isArray(data) ? data : (data?.data || []);
          setSubjects(list);
        }
      } catch (e) {
        console.error('Could not load subjects', e);
        setSubjects([]);
      }
    };
    loadSubjects();
  }, [semesterId]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!semesterId) {
        setClasses([]);
        return;
      }
      try {
        // Prefer lecturer-specific semester options first
        const semOpt = await lecturerAPI.getSemesterOptions(semesterId);
        const semData = semOpt?.data || semOpt || {};
        const semClasses = semData.classes || [];
        if (Array.isArray(semClasses) && semClasses.length > 0) {
          setClasses(semClasses.map(c => ({ _id: c.classId, code: c.classCode || c.code || '', name: c.className || c.name || '' })));
        } else {
          const resp = await lecturerAPI.getClassesBySemester(semesterId);
          const data = resp || [];
          setClasses(Array.isArray(data) ? data : (data?.data || []));
        }
      } catch (e) {
        console.error('Could not load classes', e);
      }
    };
    loadClasses();
  }, [semesterId]);

  const handleLoadGrades = async () => {
    setError('');
    if (!semesterId || !subjectId || !classId) {
      setError('Vui lòng chọn kỳ, môn và lớp trước.');
      return;
    }
    setLoading(true);
    try {
      // fetch components and students
      const compResp = await gradeComponentAPI.getAll(subjectId);
      const comps = compResp?.data?.data || compResp?.data || compResp || [];
      const compsSorted = (Array.isArray(comps) ? comps : []).slice().sort((a, b) => {
        const wa = Number(a?.weightPercentage ?? 0);
        const wb = Number(b?.weightPercentage ?? 0);
        if (wa === wb) return String(a.name || '').localeCompare(String(b.name || ''));
        return wa - wb;
      });

      const stuResp = await lecturerAPI.getStudentsByClass(classId);
      const students = stuResp?.data || stuResp || [];

      // try to fetch server-exported excel to populate current scores
      let gradeMap = {};
      try {
        // Use lecturer-only export endpoint to avoid staff fallback
        const params = { subjectId, classId };
        const resp = await api.get('lecturer/grades/export-class', { params, responseType: 'blob' });
        const blob = resp && resp.data ? resp.data : resp;
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (raw && raw.length > 0) {
            const hdrRow = raw[0].map(h => String(h).trim());
            // Try to locate which column contains studentCode (supports different export formats / languages)
            const studentCodeIdx = hdrRow.findIndex(h => /student\s*code|studentcode|mã\s*sinh\s*viên|ma\s*sinh\s*vien|mssv|mã\s*sinhviên/i.test(String(h).toLowerCase()));
            const scIdx = studentCodeIdx >= 0 ? studentCodeIdx : 0; // fallback to first column

            for (let i = 1; i < raw.length; i++) {
              const row = raw[i];
              const scode = String(row[scIdx] ?? '').trim();
              if (!scode) continue;
              gradeMap[scode] = gradeMap[scode] || {};
              for (let c = 0; c < hdrRow.length; c++) {
                // skip mapping the studentCode column into components
                if (c === scIdx) continue;
                const compNameRaw = hdrRow[c];
                const compName = String(compNameRaw).replace(/\s*\(\s*\d+(?:\.\d+)?%\s*\)\s*$/i, '').trim();
                gradeMap[scode][compName] = row[c] ?? '';
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch exported grades:', e);
      }

      const displayHeaders = ['STT', 'Họ và tên', 'Mã sinh viên', 'Gmail', ...compsSorted.map(c => `${c.name} (${c.weightPercentage ?? 0}%)`)];
      const rowsBuilt = (Array.isArray(students) ? students : []).map((s, idx) => {
        const fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim();
        const scode = s.studentCode || '';
        const mail = s.email || '';
        const row = { 'STT': idx + 1, 'Họ và tên': fullName, 'Mã sinh viên': scode, 'Gmail': mail };
        for (const comp of compsSorted) {
          const keyName = comp.name;
          const displayKey = `${comp.name} (${comp.weightPercentage ?? 0}%)`;
          row[displayKey] = (gradeMap[scode] && (gradeMap[scode][keyName] !== undefined)) ? gradeMap[scode][keyName] : '';
        }
        return row;
      });

      setHeaders(displayHeaders);
      setRows(rowsBuilt);
    } catch (err) {
      console.error('Load grades failed', err);
      setError('Không tải được điểm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Xem điểm sinh viên</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="semester-label">Kỳ</InputLabel>
          <Select labelId="semester-label" value={semesterId} label="Kỳ" onChange={e => setSemesterId(e.target.value)}>
            <MenuItem value="">-- Chọn kỳ --</MenuItem>
            {semesters.map(s => (
              <MenuItem key={s._id || s.id || s.idSemester} value={s._id || s.id || s.idSemester}>{s.name || s.title || s.label || s.semesterName}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel id="subject-label">Môn</InputLabel>
          <Select labelId="subject-label" value={subjectId} label="Môn" onChange={e => setSubjectId(e.target.value)}>
            <MenuItem value="">-- Chọn môn --</MenuItem>
            {subjects.map(s => (
              <MenuItem key={s._id || s.id} value={s._id || s.id}>{(s.code || s.subjectCode) ? `${s.code || s.subjectCode} - ${s.name || s.subjectName || ''}` : (s.name || s.subjectName || s.title || s._id)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="class-label">Lớp</InputLabel>
          <Select labelId="class-label" value={classId} label="Lớp" onChange={e => setClassId(e.target.value)}>
            <MenuItem value="">-- Chọn lớp --</MenuItem>
            {classes.map(c => (
              <MenuItem key={c._id || c.id || c.classId} value={c._id || c.id || c.classId}>{(c.code || c.classCode) ? `${c.code || c.classCode} - ${c.name || c.className || ''}` : (c.name || c.className || c.label || c._id)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleLoadGrades} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Tải điểm'}
        </Button>
      </Box>

      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}

      {headers.length > 0 && (
        <Box sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {headers.map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {headers.map(h => (
                    <TableCell key={h + i} sx={{ whiteSpace: 'nowrap' }}>{String(r[h] ?? '').slice(0, 120)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default ViewGrades;
