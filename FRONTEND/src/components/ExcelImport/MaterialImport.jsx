import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExcelImport from './ExcelImport';
import materialAPI from '../../api/materialAPI';

export default function MaterialImport({ subjectId, onImported, readOnly }) {
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialAPI.getAll({ subjectId });
      const data = res.data?.data ?? res.data ?? [];
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const res = await materialAPI.getAll({ subjectId });
        const data = res.data?.data ?? res.data ?? [];
        if (mounted) setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setMaterials([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [subjectId]);

  // explicit material transform (keeps same logic as default mapping in ExcelImport)
  const materialTransform = (r, { presetSubjectId }) => {
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
    const parseBool = (v) => {
      if (v === undefined || v === null || v === '') return false;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).trim().toLowerCase();
      const truthy = ['true', 'yes', '1', 'y', 'on', 'checked'];
      if (truthy.includes(s)) return true;
      return false;
    };
    const payload = {
      subjectId: r.subjectId || r.subjectID || presetSubjectId || undefined,
      materialDescription: mapField(['materialDescription','description','title','name','MaterialDescription','Description']) || '',
      author: mapField(['author','Author','nguoi','Nguoi']) || '',
      isMainMaterial: parseBool(mapField(['isMainMaterial','isMain','Main','main','mainMaterial'])),
      isOnline: parseBool(mapField(['isOnline','online','IsOnline','Online'])),
      isHardCopy: parseBool(mapField(['isHardCopy','hardCopy','hard','isHard','Hard copy','HardCopy'])),
      url: mapField(['url','link','Link','URL']) || '',
      isbn: mapField(['isbn','ISBN']) || '',
      note: mapField(['note','Note','GhiChu']) || ''
    };
    try {
      const descVal = String(payload.materialDescription || '').trim();
      if ((!payload.url || String(payload.url).trim() === '') && /^\s*(https?:\/\/|www\.)/i.test(descVal)) {
        payload.url = descVal;
      }
    } catch (e) {}
    return payload;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Materials</Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        {!readOnly && (
          <>
            <Button variant="outlined" onClick={() => setOpen(true)}>Manage Subject / Import</Button>
            <Button variant="contained" color="success" onClick={async () => {
              try {
                const res = await materialAPI.exportExcel(subjectId ? { subjectId } : {});
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'materials.xlsx');
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
        <DialogTitle>Manage Subject - Import Materials</DialogTitle>
        <DialogContent>
          <ExcelImport subjectId={subjectId} onImported={() => { fetchMaterials(); setOpen(false); if (typeof onImported === 'function') onImported(); }} model="materials" transformRow={materialTransform} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {loading ? <CircularProgress size={20} /> : (
        <Paper sx={{ mt: 1, overflowX: 'auto' }}>
          {materials.length === 0 ? (
            <Box sx={{ p: 2 }}>Chưa có tài liệu.</Box>
          ) : (
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224,224,224,1)' }, '& .MuiTableRow-root > .MuiTableCell-root:not(:last-child)': { borderRight: '1px solid rgba(224,224,224,1)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>MaterialDescription</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Publisher</TableCell>
                  <TableCell>PublishedDate</TableCell>
                  <TableCell>Edition</TableCell>
                  <TableCell>ISBN</TableCell>
                  <TableCell>IsMainMaterial</TableCell>
                  <TableCell>IsHardCopy</TableCell>
                  <TableCell>IsOnline</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {materials.map(m => (
                  <TableRow key={m._id} hover>
                    <TableCell sx={{ maxWidth: 420, whiteSpace: 'normal', wordBreak: 'break-word' }}>{m.materialDescription || '-'}</TableCell>
                    <TableCell>{(m.author && m.author !== 'Imported') ? m.author : ''}</TableCell>
                    <TableCell>{m.publisher || '-'}</TableCell>
                    <TableCell>{m.publishDate ? new Date(m.publishDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{m.edition ?? '-'}</TableCell>
                    <TableCell>{m.isbn || '-'}</TableCell>
                    <TableCell>{m.isMainMaterial ? 'TRUE' : 'FALSE'}</TableCell>
                    <TableCell>{m.isHardCopy ? 'TRUE' : 'FALSE'}</TableCell>
                    <TableCell>{m.isOnline ? 'TRUE' : 'FALSE'}</TableCell>
                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>{m.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  );
}
