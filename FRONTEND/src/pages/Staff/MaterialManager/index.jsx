import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, TextField, MenuItem, Button, FormControlLabel, Checkbox, CircularProgress, IconButton, Tooltip, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete } from '@mui/material';
import majorAPI from '../../../api/majorAPI';
import subjectAPI from '../../../api/subjectAPI';
import materialAPI from '../../../api/materialAPI';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import  Grid  from '@mui/material/GridLegacy';
import RefreshIcon from '@mui/icons-material/Refresh';
export default function MaterialManager() {
  const [majors, setMajors] = useState([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [tab, setTab] = useState(0);

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const navigate = useNavigate();
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ materialDescription: '', author: '', isMainMaterial: false, isOnline: false, url: '' });
  const [form, setForm] = useState({
    subjectCode: '', subjectName: '', subjectEnglish: '', subjectNoCredit: 3,
    degreeLevel: '', timeAllocation: '', preRequisite: [], description: '', studentTask: '', tools: '', scoringScale: '', decisionNumber: '', minAvgMarkToPass: 4.0, status: true, approveDate: '', majorId: ''
  });

  useEffect(() => {
    loadMajors();
    // preload subjects so create-form can offer prerequisite selection
    loadSubjects();
  }, []);

  const loadMajors = async () => {
    setMajorsLoading(true);
    try {
      const res = await majorAPI.getAll();
      setMajors(res?.data || []);
    } catch (e) {
      setMajors([]);
      notifyError('Không lấy được danh sách Majors');
    } finally {
      setMajorsLoading(false);
    }
  };

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await subjectAPI.getAll();
      setSubjects(res.data?.data || []);
    } catch (err) {
      setSubjects([]);
      notifyError('Không tải được danh sách môn học');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const onChange = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async () => {
    // basic client-side validation
    if (!form.subjectCode || !form.subjectName || !form.majorId) {
      notifyError('Vui lòng điền Subject Code, Subject Name và chọn Major');
      return;
    }
    try {
      const payload = { ...form };
      // allow preRequisite as comma-separated codes
  await subjectAPI.create(payload);
      notifySuccess('Tạo môn học thành công');
  // reset form minimal
  setForm({ subjectCode: '', subjectName: '', subjectEnglish: '', subjectNoCredit: 3, degreeLevel: '', timeAllocation: '', preRequisite: [], description: '', studentTask: '', tools: '', scoringScale: '', decisionNumber: '', minAvgMarkToPass: 4.0, status: true, approveDate: '', majorId: '' });
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tạo môn học thất bại');
    }
  };

  useEffect(() => {
    if (tab === 0) loadSubjects();
  }, [tab]);

  const handleOpenView = (subject) => {
    // navigate to detail page
    navigate(`/staff/material/${subject._id}`);
  };

  /* eslint-disable-next-line no-unused-vars */
  const handleOpenAddMaterial = (subject) => {
    setSelectedSubject(subject);
    setMaterialForm({ materialDescription: '', author: '', isMainMaterial: false, isOnline: false, url: '' });
    setAddMaterialOpen(true);
  };

  const handleMaterialChange = (k) => (e) => setMaterialForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmitMaterial = async () => {
    if (!selectedSubject) return notifyError('Vui lòng chọn môn');
    if (!materialForm.materialDescription) return notifyError('Mô tả tài liệu không được rỗng');
    try {
      const payload = { ...materialForm, subjectId: selectedSubject._id };
      await materialAPI.create(payload);
      notifySuccess('Tạo mô tả tài liệu thành công');
      setAddMaterialOpen(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || 'Tạo mô tả thất bại');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Material Manager</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Danh sách môn học" />
        <Tab label="Tạo môn học" />

      </Tabs>

      {tab === 1 && (
        <Box component="form">
          <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField label="Mã môn (Subject Code)" value={form.subjectCode} onChange={onChange('subjectCode')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField label="Tên môn (Subject Name)" value={form.subjectName} onChange={onChange('subjectName')} fullWidth />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField label="Tên tiếng Anh (Subject English)" value={form.subjectEnglish} onChange={onChange('subjectEnglish')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Số tín chỉ (NoCredit)" type="number" value={form.subjectNoCredit} onChange={onChange('subjectNoCredit')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Ngành (Major)"
                select
                value={form.majorId}
                onChange={onChange('majorId')}
                fullWidth
                helperText={majors.length === 0 && !majorsLoading ? 'Không có ngành. Nhấn Refresh để thử lại.' : 'Chọn Ngành (bắt buộc)'}
                SelectProps={{
                  renderValue: (v) => {
                    const sel = majors.find(x => x._id === v);
                    return sel ? `${sel.majorName} (${sel.majorCode || sel._id})` : '';
                  }
                }}
              >
                {majors.map(m => (<MenuItem key={m._id} value={m._id}>{m.majorName} ({m.majorCode || m._id})</MenuItem>))}
              </TextField>

              <Tooltip title="Reload majors">
                <span>
                  <IconButton onClick={loadMajors} disabled={majorsLoading} size="small">
                    {majorsLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Cấp độ (Degree Level)" value={form.degreeLevel} onChange={onChange('degreeLevel')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phân bổ thời gian (Time Allocation)" value={form.timeAllocation} onChange={onChange('timeAllocation')} fullWidth />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={subjects}
              getOptionLabel={(opt) => opt ? `${opt.subjectCode} — ${opt.subjectName}` : ''}
              value={subjects.filter(s => Array.isArray(form.preRequisite) && form.preRequisite.includes(s.subjectCode))}
              onChange={(e, v) => setForm(prev => ({ ...prev, preRequisite: Array.isArray(v) ? v.map(x => x.subjectCode) : [] }))}
              disablePortal
              PopperProps={{
                placement: 'bottom-start',
                modifiers: [
                  { name: 'flip', enabled: false },
                  { name: 'preventOverflow', options: { padding: 8 } }
                ]
              }}
              renderInput={(params) => (
                <TextField {...params} label="Tiền quyết (Pre-Requisite)" placeholder="Chọn môn tiền quyết / Select prerequisite subjects" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Điểm tối thiểu để qua (Min Avg To Pass)" type="number" inputProps={{ step: 0.1 }} value={form.minAvgMarkToPass} onChange={onChange('minAvgMarkToPass')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Thang điểm (Scoring Scale)" value={form.scoringScale} onChange={onChange('scoringScale')} fullWidth />
          </Grid>

          <Grid item xs={12}>
            <TextField label="Mô tả (Description)" value={form.description} onChange={onChange('description')} multiline rows={3} fullWidth />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Công cụ (Tools)"
              value={form.tools}
              onChange={onChange('tools')}
              multiline
              rows={4}
              placeholder={"- tool1\n- tool2\n(or paste Markdown / bullet list)"}
              helperText="Bạn có thể nhập nhiều dòng hoặc Markdown. Sẽ lưu nguyên văn vào field 'tools'."
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Số quyết định (Decision Number)" value={form.decisionNumber} onChange={onChange('decisionNumber')} fullWidth />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Ngày phê duyệt (Approve Date)"
              type="date"
              value={form.approveDate}
              onChange={onChange('approveDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel control={<Checkbox checked={form.status} onChange={onChange('status')} />} label="Active (status)" />
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button variant="contained" onClick={handleSubmit}>Tạo môn học</Button>
          </Grid>
        </Grid>
      </Box>
      )}

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Danh sách môn học</Typography>
            <Box>
              <Button onClick={loadSubjects} startIcon={subjectsLoading ? <CircularProgress size={16} /> : null}>Refresh</Button>
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
                  <TableCell>Major</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((s, index) => (
                  <TableRow key={s._id}>

                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{s.subjectCode}</TableCell>
                    <TableCell>{s.subjectName}</TableCell>
                    <TableCell>{s.subjectNoCredit}</TableCell>
                    <TableCell>{s.majorId?.majorName || ''}</TableCell>
                    <TableCell>
                      {/* Former "Xem chi tiết" -> now Edit action */}
                     
                      {/* Former "Thêm mô tả" -> now read-only view */}
                      <Button size="small"  sx={{ mr: 1 }}  onClick={() => navigate(`/staff/material/${s._id}?readonly=true`)}>Xem chi tiết</Button>
                     <Button size="small" variant="contained"s onClick={() => handleOpenView(s)}>Chỉnh sửa</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      

      <Dialog open={addMaterialOpen} onClose={() => setAddMaterialOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm mô tả tài liệu cho: {selectedSubject?.subjectName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
            <TextField label="Mô tả tài liệu" multiline rows={3} value={materialForm.materialDescription} onChange={handleMaterialChange('materialDescription')} fullWidth />
            <TextField label="Tác giả" value={materialForm.author} onChange={handleMaterialChange('author')} fullWidth />
            <TextField label="URL (nếu có)" value={materialForm.url} onChange={handleMaterialChange('url')} fullWidth />
            <FormControlLabel control={<Checkbox checked={materialForm.isMainMaterial} onChange={handleMaterialChange('isMainMaterial')} />} label="Tài liệu chính" />
            <FormControlLabel control={<Checkbox checked={materialForm.isOnline} onChange={handleMaterialChange('isOnline')} />} label="Online" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMaterialOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitMaterial}>Lưu mô tả</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
