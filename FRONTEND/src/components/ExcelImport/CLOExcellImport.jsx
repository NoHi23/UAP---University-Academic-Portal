import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExcelImport from './ExcelImport';
import cloAPI from '../../api/cloAPI';
import { AuthContext } from '../../context/AuthContext';

export default function CLOExcellImport({ subjectId, onImported, readOnly }) {
  const [open, setOpen] = useState(false);
  const [clos, setClos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  // transform for CLO rows: map various header names to cloDetails and loDetails
  const cloTransform = (r, { presetSubjectId }) => {
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
    // Map cloName
    let cloNameVal = mapField(['cloName', 'CLO Name', 'CLOName', 'cloname']);
    if (cloNameVal === undefined || cloNameVal === null || cloNameVal === '') {
      const found = keys.find(k => String(k).toLowerCase().includes('cloname'));
      if (found) cloNameVal = r[found];
    }
    if (cloNameVal !== undefined && cloNameVal !== null && cloNameVal !== '') {
      cloNameVal = Number(cloNameVal);
      if (isNaN(cloNameVal)) cloNameVal = undefined;
    }
    let cloVal = String(mapField(['cloDetails', 'clo_details', 'clo detail', 'clo', 'CLO Details', 'CLODetails', 'clodetails']) || '').trim();
    if (!cloVal) {
      const found = keys.find(k => String(k).toLowerCase().includes('clo'));
      if (found) cloVal = String(r[found] || '').trim();
    }
    let loVal = String(mapField(['loDetails', 'lo_details', 'lo detail', 'lo', 'LO Details', 'LODetails']) || '').trim();
    if (!loVal) {
      const foundLo = keys.find(k => String(k).toLowerCase().includes('lo'));
      if (foundLo) loVal = String(r[foundLo] || '').trim();
    }
    return {
      subjectId: r.subjectId || r.subjectID || presetSubjectId || undefined,
      cloName: cloNameVal,
      cloDetails: cloVal,
      loDetails: loVal
    };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const res = await cloAPI.getAll({ subjectId });
        const data = res.data?.data ?? res.data ?? [];
        if (mounted) setClos(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setClos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [subjectId]);

  const fetchClos = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res = await cloAPI.getAll({ subjectId });
      const data = res.data?.data ?? res.data ?? [];
      setClos(Array.isArray(data) ? data : []);
    } catch (err) {
      setClos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">CLOs</Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        {!readOnly && (
          <>
            {!readOnly && user?.role !== 'student' && ( // <--- SỬA: Thêm điều kiện user
              <>
                <Button variant="outlined" onClick={() => setOpen(true)}>Manage / Import CLOs</Button>
              </>
            )}
            <Button variant="contained" color="success" onClick={async () => {
              try {
                const res = await cloAPI.exportExcel(subjectId ? { subjectId } : {});
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'clos.xlsx');
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
        <DialogTitle>Manage Subject - Import CLOs</DialogTitle>
        <DialogContent>
          <ExcelImport subjectId={subjectId} onImported={() => { fetchClos(); if (typeof onImported === 'function') onImported(); setOpen(false); }} model="clos" transformRow={cloTransform} requiredFields={["cloName", "cloDetails", "subjectId"]} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ mt: 1, p: 1, overflowX: 'auto' }}>
        {loading ? <CircularProgress size={18} /> : (
          clos.length === 0 ? (
            <Typography sx={{ p: 1, color: 'text.secondary' }}>Chưa có CLO nào.</Typography>
          ) : (
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224,224,224,1)' }, '& .MuiTableRow-root > .MuiTableCell-root:not(:last-child)': { borderRight: '1px solid rgba(224,224,224,1)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>CLO Name</TableCell>
                  <TableCell>CLO Details</TableCell>
                  <TableCell>LO Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clos
                  .slice()
                  .sort((a, b) => {
                    if (a.cloName === undefined && b.cloName === undefined) return 0;
                    if (a.cloName === undefined) return 1;
                    if (b.cloName === undefined) return -1;
                    return a.cloName - b.cloName;
                  })
                  .map((c, idx) => (
                    <TableRow key={c._id}>
                      <TableCell>{c.cloName ?? (idx + 1)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{c.cloDetails}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{c.loDetails || '-'}</TableCell>
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
