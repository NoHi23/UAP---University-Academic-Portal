import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExcelImport from './ExcelImport';
import sessionMaterialAPI from '../../api/sessionMaterialAPI';

export default function SessionMaterialImport({ subjectId, onImported, readOnly }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // transform for session materials: require numeric session and map other fields
  const sessionTransform = (r, { presetSubjectId }) => {
    if (!r || typeof r !== 'object') return null;
    const keys = Object.keys(r);
    const mapField = (names) => {
      for (const n of names) {
        if (Object.prototype.hasOwnProperty.call(r, n)) return r[n];
        const matchKey = keys.find(k => String(k).trim().toLowerCase() === String(n).trim().toLowerCase());
        if (matchKey) return r[matchKey];
      }
      return undefined;
    };
    const parseNumber = (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(String(v).trim());
      return Number.isFinite(n) ? n : undefined;
    };
    const urlsRaw = mapField(['urls','url','links','link','URLs']) || '';
    const urls = Array.isArray(urlsRaw) ? urlsRaw : String(urlsRaw).split(/[;,\n\r]+/).map(s=>s.trim()).filter(Boolean);
    // Extract CLO values from various possible headers and normalize to an array of strings
    // Accept a wider variety of header names for CLO column (common variants)
    // Try aliases first, otherwise fallback to any header containing 'clo' (tolerant match)
    let cloRaw = String(mapField([
      'LO','CLO','cloDetails','lo_details','clo detail','lo',
    ]) || '').trim();
    if (!cloRaw) {
      const foundKey = keys.find(k => String(k).toLowerCase().includes('clo'));
      if (foundKey) cloRaw = String(r[foundKey] || '').trim();
    }
    const learningOutcomes = cloRaw ? String(cloRaw).split(/[;,\n\r]+/).map(s => s.trim()).filter(Boolean) : undefined;

    const mapped = {
      subjectId: r.subjectId || r.subjectID || presetSubjectId || undefined,
      session: parseNumber(mapField(['session','Session','sessionNo','sessionNumber','SessionNumber'])) ,
      topic: String(mapField(['topic','title','Topic']) || '').trim(),
      learningTeachingType: String(mapField(['Learning-Teaching Type','type','Type']) || '').trim(),
      itu: (() => { const raw = mapField(['itu','ITU','ITU Hours','ituHours','hours','time','duration','Hours']); return (raw === undefined || raw === null || String(raw).trim() === '') ? undefined : String(raw).trim(); })(),
      studentMaterial: (mapField(['Student Materials	','student','isStudentMaterial'])),
      downloadable: (mapField(['downloadable','isDownloadable','download','S-Download'])),
      studentTask: String(mapField(['studentTask','task',"Student's Tasks"]) || '').trim(),
      urls,
      learningOutcomes,
    };
    try {
      if (typeof window !== 'undefined') console.debug('Session row mapped (preview):', mapped);
    } catch (e) { /* ignore */ }
    return mapped;
  };

  // Backend will resolve cloDetails to cloId; no client-side resolution required.

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const res = await sessionMaterialAPI.getAll({ subjectId });
        const data = res.data?.data ?? res.data ?? [];
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [subjectId]);

  const fetchItems = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res = await sessionMaterialAPI.getAll({ subjectId });
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Tài liệu buổi (Session Materials)</Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        {!readOnly && (
          <>
            <Button variant="outlined" onClick={() => setOpen(true)}>Manage / Import Session Materials</Button>
            <Button variant="contained" color="success" onClick={async () => {
              try {
                const res = await sessionMaterialAPI.exportExcel(subjectId ? { subjectId } : {});
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'session_materials.xlsx');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert('Xuất Excel thất bại!');
              }
            }}>Xuất Excel</Button>
          </>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Manage Subject - Import Session Materials</DialogTitle>
        <DialogContent>
          <ExcelImport subjectId={subjectId} onImported={() => { fetchItems(); if (typeof onImported === 'function') onImported(); setOpen(false); }} model="session-materials" transformRow={sessionTransform} requiredFields={["session","topic","learningOutcomes","subjectId"]} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ mt: 1, p: 1, overflowX: 'auto' }}>
          {loading ? <CircularProgress size={18} /> : (
          items.length === 0 ? (
            <Typography sx={{ p: 1, color: 'text.secondary' }}>Chưa có tài liệu buổi nào.</Typography>
          ) : (
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224,224,224,1)' }, '& .MuiTableRow-root > .MuiTableCell-root:not(:last-child)': { borderRight: '1px solid rgba(224,224,224,1)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Session</TableCell>
                  <TableCell>Topic</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>ITU</TableCell>
                  <TableCell>StudentMaterial</TableCell>
                  <TableCell>Downloadable</TableCell>
                  <TableCell>StudentTask</TableCell>
                  <TableCell>URLs</TableCell>
                  <TableCell>CLO Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((s, idx) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.session ?? '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{s.topic}</TableCell>
                    <TableCell>{s.learningTeachingType || '-'}</TableCell>
                    <TableCell>{s.itu ?? '-'}</TableCell>
                    <TableCell>{s.studentMaterial ?? '-'}</TableCell>
                    <TableCell>{s.downloadable ?? '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{s.studentTask || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{Array.isArray(s.urls) ? s.urls.join(', ') : (s.urls || '-')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{Array.isArray(s.learningOutcomes) ? s.learningOutcomes.join(', ') : (s.learningOutcomes || '-')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </Paper>
    </Box>
  );
}
