import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExcelImport from './ExcelImport';
import cloAPI from '../../api/cloAPI';

export default function CLOExcellImport({ subjectId, onImported, readOnly }) {
  const [open, setOpen] = useState(false);
  const [clos, setClos] = useState([]);
  const [loading, setLoading] = useState(false);

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
    // Tolerant mapping: try aliases; if not found, fallback to any header containing 'clo' or 'lo'
    let cloVal = String(mapField(['cloDetails','clo_details','clo detail','clo','CLO Details','CLODetails','clodetails']) || '').trim();
    if (!cloVal) {
      const found = keys.find(k => String(k).toLowerCase().includes('clo'));
      if (found) cloVal = String(r[found] || '').trim();
    }
    let loVal = String(mapField(['loDetails','lo_details','lo detail','lo','LO Details','LODetails']) || '').trim();
    if (!loVal) {
      const foundLo = keys.find(k => String(k).toLowerCase().includes('lo'));
      if (foundLo) loVal = String(r[foundLo] || '').trim();
    }
    return {
      subjectId: r.subjectId || r.subjectID || presetSubjectId || undefined,
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
          <Button variant="outlined" onClick={() => setOpen(true)}>Manage / Import CLOs</Button>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Manage Subject - Import CLOs</DialogTitle>
        <DialogContent>
          <ExcelImport subjectId={subjectId} onImported={() => { fetchClos(); if (typeof onImported === 'function') onImported(); setOpen(false); }} model="clos" transformRow={cloTransform} requiredFields={["cloDetails","subjectId"]} />
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
                {clos.map((c, idx) => (
                  <TableRow key={c._id}>
                    <TableCell>{idx + 1}</TableCell>
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
