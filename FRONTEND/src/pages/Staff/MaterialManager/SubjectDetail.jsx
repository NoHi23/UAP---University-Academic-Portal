import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Typography, Box, Button, CircularProgress, Paper, TextField, MenuItem, Autocomplete } from '@mui/material';
import majorAPI from '../../../api/majorAPI';
import Grid  from '@mui/material/GridLegacy';
import subjectAPI from '../../../api/subjectAPI';
import MaterialImport from '../../../components/ExcelImport/MaterialImport';
import CLOExcellImport from '../../../components/ExcelImport/CLOExcellImport';
import SessionMaterialImport from '../../../components/ExcelImport/sessionMaterialImport';
import GradeComponentImport from '../../../components/ExcelImport/GradeComponentImport';
import gradeComponentAPI from '../../../api/gradeComponentAPI';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
// Dialogs are handled inside the import components
import { notifyError, notifySuccess } from '../../../services/notificationService';


export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const readOnly = qs.get('readonly') === 'true' || qs.get('view') === '1';
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [majors, setMajors] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [gradeComponents, setGradeComponents] = useState([]);
  

  useEffect(() => {
    fetchSubject();
    loadMajors();
    loadSubjects();
    loadGradeComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadGradeComponents = async () => {
    try {
      const res = await gradeComponentAPI.getAll(id);
      setGradeComponents(res.data?.data || []);
    } catch (err) {
      console.error('loadGradeComponents error', err);
      setGradeComponents([]);
    }
  };

  const loadMajors = async () => {
    try {
      const res = await majorAPI.getAll();
      setMajors(res?.data || []);
    } catch (e) {
      setMajors([]);
    } finally {
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await subjectAPI.getAll();
      setSubjectsList(res.data?.data || []);
    } catch (err) {
      setSubjectsList([]);
    } finally {
    }
  };

  

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const res = await subjectAPI.getById(id);
      setSubject(res.data?.data || null);
    } catch (err) {
      notifyError(err?.response?.data?.message || 'Không tải được subject');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (!subject) return;
    setEditForm({
      subjectCode: subject.subjectCode || '',
      subjectName: subject.subjectName || '',
      subjectEnglish: subject.subjectEnglish || '',
      subjectNoCredit: subject.subjectNoCredit ?? 0,
      degreeLevel: subject.degreeLevel || '',
  timeAllocation: subject.timeAllocation || '',
  // store preRequisite as array of subjectCodes for Autocomplete and backend compatibility
  preRequisiteCodes: Array.isArray(subject.preRequisite) ? subject.preRequisite.map(p => (p.subjectCode || (typeof p === 'string' ? p : ''))) : (subject.preRequisite ? (Array.isArray(subject.preRequisite) ? subject.preRequisite : [subject.preRequisite]) : []),
      description: subject.description || '',
      studentTask: subject.studentTask || '',
      tools: subject.tools || '',
      scoringScale: subject.scoringScale || '',
      decisionNumber: subject.decisionNumber || '',
      minAvgMarkToPass: subject.minAvgMarkToPass ?? '',
      approveDate: subject.approveDate ? new Date(subject.approveDate).toISOString().slice(0,10) : '',
      majorId: subject.majorId?._id || ''
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({});
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = Object.assign({}, editForm);
      // if preRequisiteCodes present, map to preRequisite for backend
      if (Array.isArray(editForm.preRequisiteCodes)) {
        payload.preRequisite = editForm.preRequisiteCodes;
        delete payload.preRequisiteCodes;
      }
      // convert numeric fields
      if (payload.subjectNoCredit !== undefined && payload.subjectNoCredit !== '') payload.subjectNoCredit = Number(payload.subjectNoCredit);
      if (payload.minAvgMarkToPass !== undefined && payload.minAvgMarkToPass !== '') payload.minAvgMarkToPass = Number(payload.minAvgMarkToPass);
      // send preRequisite as provided (string or array supported by backend)
      await subjectAPI.update(id, payload);
      notifySuccess('Cập nhật subject thành công');
      await fetchSubject();
      setEditing(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  

  if (loading) return <Container sx={{ py: 4 }}><CircularProgress /></Container>;

  if (!subject) return <Container sx={{ py: 4 }}><Typography>Không tìm thấy môn học</Typography></Container>;

  return (
    // increase maxWidth so detail page takes more horizontal space
    <Container maxWidth="lg" sx={{ py: 2, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="h5">Chi tiết môn học</Typography>
        <Box>
          <Button onClick={() => navigate(-1)} sx={{ mr: 1 }}>Quay lại</Button>
          {!readOnly && !editing && (
            <Button variant="contained" onClick={startEdit}>Chỉnh sửa môn</Button>
          )}
          {!readOnly && editing && (
            <>
              <Button variant="contained" onClick={saveEdit} disabled={saving} sx={{ mr: 1 }}>Lưu</Button>
              <Button onClick={cancelEdit}>Hủy</Button>
            </>
          )}
        </Box>
      </Box>

  <Paper sx={{ p: 3, width: '100%' }}>
        <Grid container spacing={1}>
          <Grid item xs={4} sm={3}><Typography color="textSecondary">Mã Syllabus (Syllabus ID)</Typography></Grid>
          <Grid item xs={8} sm={9}><Typography>{subject._id}</Typography></Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Tên môn (Subject Name)</Typography></Grid>
          <Grid item xs={8} sm={9}>
            {editing ? (
              <TextField fullWidth value={editForm.subjectName || ''} onChange={(e) => setEditForm(prev => ({ ...prev, subjectName: e.target.value }))} />
            ) : (
              <Typography>{subject.subjectName}{subject.subjectEnglish ? ` — ${subject.subjectEnglish}` : ''}</Typography>
            )}
          </Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Mã môn (Subject Code)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField fullWidth value={editForm.subjectCode || ''} onChange={(e) => setEditForm(prev => ({ ...prev, subjectCode: e.target.value }))} />) : (<Typography>{subject.subjectCode}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Ngành (Major)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (
            <TextField select fullWidth value={editForm.majorId || ''} onChange={(e) => setEditForm(prev => ({ ...prev, majorId: e.target.value }))}>
              {majors.map(m => (<MenuItem key={m._id} value={m._id}>{m.majorName} ({m.majorCode || m._id})</MenuItem>))}
            </TextField>
          ) : (
            <Typography>{subject.majorId?.majorName || '-'}</Typography>
          )}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Số tín chỉ (NoCredit)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField type="number" fullWidth value={editForm.subjectNoCredit ?? ''} onChange={(e) => setEditForm(prev => ({ ...prev, subjectNoCredit: e.target.value }))} />) : (<Typography>{subject.subjectNoCredit}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Cấp độ (Degree Level)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField fullWidth value={editForm.degreeLevel || ''} onChange={(e) => setEditForm(prev => ({ ...prev, degreeLevel: e.target.value }))} />) : (<Typography>{subject.degreeLevel || '-'}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Phân bổ thời gian (Time Allocation)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField fullWidth multiline value={editForm.timeAllocation || ''} onChange={(e) => setEditForm(prev => ({ ...prev, timeAllocation: e.target.value }))} />) : (<Typography sx={{ whiteSpace: 'pre-wrap' }}>{subject.timeAllocation || '-'}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Tiền quyết (Pre-Requisite)</Typography></Grid>
          <Grid item xs={8} sm={9}>
            {editing ? (
              <Autocomplete
                multiple
                options={subjectsList}
                getOptionLabel={(opt) => opt ? `${opt.subjectCode} — ${opt.subjectName}` : ''}
                value={subjectsList.filter(s => Array.isArray(editForm.preRequisiteCodes) && editForm.preRequisiteCodes.includes(s.subjectCode))}
                onChange={(e, v) => setEditForm(prev => ({ ...prev, preRequisiteCodes: Array.isArray(v) ? v.map(x => x.subjectCode) : [] }))}
                disablePortal
                PopperProps={{ placement: 'bottom-start', modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', options: { padding: 8 } }] }}
                renderInput={(params) => (
                  <TextField {...params} label="Tiền quyết (Pre-Requisite)" placeholder="Chọn môn tiền quyết / Select prerequisite subjects" fullWidth />
                )}
              />
            ) : (
              <Typography>
                {Array.isArray(subject.preRequisite) && subject.preRequisite.length > 0
                  ? subject.preRequisite.map(p => p.subjectCode || p).join(', ')
                  : (subject.preRequisite || '-')}
              </Typography>
            )}
          </Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Thang điểm (Scoring Scale)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField fullWidth value={editForm.scoringScale || ''} onChange={(e) => setEditForm(prev => ({ ...prev, scoringScale: e.target.value }))} />) : (<Typography>{subject.scoringScale || '-'}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Số quyết định (Decision Number)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField fullWidth value={editForm.decisionNumber || ''} onChange={(e) => setEditForm(prev => ({ ...prev, decisionNumber: e.target.value }))} />) : (<Typography>{subject.decisionNumber || '-'}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Điểm tối thiểu để qua (Min Avg To Pass)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField type="number" inputProps={{ step: 0.1 }} fullWidth value={editForm.minAvgMarkToPass ?? ''} onChange={(e) => setEditForm(prev => ({ ...prev, minAvgMarkToPass: e.target.value }))} />) : (<Typography>{subject.minAvgMarkToPass ?? '-'}</Typography>)}</Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Ngày phê duyệt (Approve Date)</Typography></Grid>
          <Grid item xs={8} sm={9}>{editing ? (<TextField type="date" fullWidth value={editForm.approveDate || ''} onChange={(e) => setEditForm(prev => ({ ...prev, approveDate: e.target.value }))} />) : (<Typography>{subject.approveDate ? new Date(subject.approveDate).toLocaleDateString() : '-'}</Typography>)}</Grid>

        </Grid>

        <Grid container spacing={1} sx={{ mt: 2 }}>
          <Grid item xs={4} sm={3}><Typography color="textSecondary">Mô tả (Description)</Typography></Grid>
          <Grid item xs={8} sm={9}>
            {editing ? (
              <TextField fullWidth multiline rows={4} value={editForm.description || ''} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} />
            ) : (
              <Typography sx={{ whiteSpace: 'pre-wrap', borderTop:'2px solid #eee'}}>{subject.description || '-'}</Typography>
            )}
          </Grid>

          <Grid item xs={4} sm={3}><Typography color="textSecondary">Công cụ (Tools)</Typography></Grid>
          <Grid item xs={8} sm={9}>
            {editing ? (
              <TextField fullWidth multiline rows={3} value={editForm.tools || ''} onChange={(e) => setEditForm(prev => ({ ...prev, tools: e.target.value }))} />
            ) : (
              <Typography sx={{ whiteSpace: 'pre-wrap',borderTop:'2px solid #eee' }}>{subject.tools || '-'}</Typography>
            )}
          </Grid>
        </Grid>

      </Paper>

      <Box sx={{ mt: 1 }}>
        {readOnly && (
          <Box sx={{ mb: 1 }}>
            <Typography color="textSecondary">Chế độ: Chỉ xem</Typography>
            <Typography sx={{ mb: 1 }} variant="body2">Bạn đang xem trang ở chế độ chỉ đọc — thao tác import/chỉnh sửa bị vô hiệu.</Typography>
          </Box>
        )}
      </Box>


  {/* Grade Component Import (Excel) */}
  <GradeComponentImport subjectId={id} readOnly={readOnly} onImported={loadGradeComponents} />

  {/* Grade Components list */}
  <Paper sx={{ p: 2, mt: 2 }}>
    <Typography variant="h6">Grade Components</Typography>
    {gradeComponents.length === 0 ? (
      <Typography color="textSecondary">Chưa có đầu điểm cho môn này.</Typography>
    ) : (
      <Box sx={{ overflowX: 'auto', mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Weight (%)</TableCell>
              <TableCell>DropLowest</TableCell>
              <TableCell>ReLearnTime</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gradeComponents.map(gc => (
              <TableRow key={gc._id}>
                <TableCell>{gc.name}</TableCell>
                <TableCell>{gc.weightPercentage}</TableCell>
                <TableCell>{gc.dropLowest}</TableCell>
                <TableCell>{gc.reLearnTime}</TableCell>
                <TableCell>{gc.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    )}
  </Paper>

  {/* Always render the three lists; pass readOnly so wrappers can hide import controls when necessary */}
  <MaterialImport subjectId={id} readOnly={readOnly} />
  <CLOExcellImport subjectId={id} readOnly={readOnly} />
  <SessionMaterialImport subjectId={id} readOnly={readOnly} />

    </Container>
  );
}
