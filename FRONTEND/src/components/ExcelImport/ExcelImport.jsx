import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, TextField, Checkbox, FormControlLabel } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import materialAPI from '../../api/materialAPI';
import cloAPI from '../../api/cloAPI';
import sessionMaterialAPI from '../../api/sessionMaterialAPI';
import { notifySuccess, notifyError } from '../../services/notificationService';

// Minimal Excel import: parse first sheet, auto-map headers to fields, preview and POST to bulk endpoint.
export default function ExcelImport({ subjectId: presetSubjectId, onImported, model = 'materials', transformRow, requiredFields = [] }) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [subjectId, setSubjectId] = useState(presetSubjectId || '');
  const [replace, setReplace] = useState(false);
  // compute a sensible table min width based on number of columns
  const tableMinWidth = Math.max(1200, headers.length * 180);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Try to parse as objects using header row
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (parsed.length === 0) {
        notifyError('Không tìm thấy dữ liệu trong file');
        return;
      }
  const hdrs = Object.keys(parsed[0]);
  // Debug: log parsed headers and a small preview of rows
  console.log('Excel parsed headers:', hdrs);
  console.log('Excel preview rows (first 10):', parsed.slice(0, 10));
  setHeaders(hdrs);
  setRows(parsed.slice(0, 200)); // preview up to 200 rows
  setResult(null);
    };
    
   const save = reader.readAsArrayBuffer(f);
console.log('read file', save);
  };

  const buildPayload = async () => {
    // If a transformRow was provided by the caller, use it to map each row.
    // transformRow(row, { presetSubjectId }) => mappedObject
    if (typeof transformRow === 'function') {
      // Support async transformRow: allow transformRow to return a Promise
      const mapped = await Promise.all(rows.map(r => transformRow(r, { presetSubjectId })));
      console.log('Built import payload (using transformRow) count:', mapped.length);
      console.log('Built import payload sample:', mapped.slice(0, 5));
      return mapped;
    }

    // Default: material mapping (backwards compatible)
    const payload = rows.map(r => {
      // smarter mapping: match header names case-insensitively and trim whitespace
      const mapField = (names) => {
        if (!r || typeof r !== 'object') return undefined;
        const keys = Object.keys(r);
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
        const truthy = ['true', 'yes', '1', 'y', 'on', 'checked','TRUE','YES','Y'];
        if (truthy.includes(s)) return true;
        const falsy = ['false', 'no', '0', 'n', 'off', 'unchecked','FALSE','NO','N'];
        if (falsy.includes(s)) return false;
        if (/[\u2713\u2714\u2611\u2715\u00D7x×]/.test(s)) return true;
        return false;
      };

      const payload = {
        subjectId: r.subjectId || r.subjectID || r['SubjectId'] || subjectId || presetSubjectId || undefined,
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
      } catch (e) {
        // ignore
      }
      return payload;
    });
    // Debug: show how many payload items and sample of first 5
    console.log('Built import payload count:', payload.length);
    console.log('Built import payload sample:', payload.slice(0, 5));
    return payload;
  };

  const handleImport = async () => {
    if (!rows || rows.length === 0) {
      notifyError('Chưa có dữ liệu để import');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
  const payload = await buildPayload();
  // Debug: log payload summary before sending
  console.log('Importing payload length:', payload.length);
  console.log('Importing payload sample (first 3):', payload.slice(0, 3));
      // Validate requiredFields (if provided)
      if (Array.isArray(requiredFields) && requiredFields.length > 0) {
        const missingField = requiredFields.find(f => {
          return payload.some(p => p === undefined || p === null || p[f] === undefined || p[f] === null || String(p[f]).trim() === '');
        });
        if (missingField) {
          notifyError(`Missing required field for import: ${missingField}. Please include it in the Excel or set SubjectId.`);
          setLoading(false);
          return;
        }
      }
      // ensure every item has a subjectId
      const missing = payload.findIndex(p => !p.subjectId || String(p.subjectId).trim() === '');
      if (missing !== -1) {
        notifyError('Có hàng thiếu subjectId. Vui lòng đặt Subject hoặc include subjectId trong file.');
        setLoading(false);
        return;
      }

      // choose API based on model prop
      const apiMap = {
        materials: materialAPI,
        clos: cloAPI,
        'session-materials': sessionMaterialAPI
      };
      const apiClient = apiMap[model] || materialAPI;
  const res = await apiClient.bulk(payload, { replace });
  setResult(res.data);
  const labelMap = { materials: 'materials', clos: 'CLOs', 'session-materials': 'session materials' };
  const label = labelMap[model] || 'items';
  if (res.data?.insertedCount) notifySuccess(`Inserted ${res.data.insertedCount} ${label}`);
      if (onImported) onImported();
    } catch (err) {
      console.error('bulk import error', err);
      notifyError(err?.response?.data?.message || 'Import lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
  <Paper sx={{ p: 2, mt: 2, width: '100%' }}>
      <Typography variant="subtitle1">Import từ Excel</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
          Chọn file (.xlsx)
          <input hidden type="file" accept=".xlsx,.xls" onChange={handleFile} />
        </Button>
        <Typography>{fileName || 'Chưa chọn file'}</Typography>
        <TextField label="SubjectId (optional)" size="small" value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} disabled={!!presetSubjectId} />
        <FormControlLabel control={<Checkbox checked={replace} onChange={(e)=>setReplace(e.target.checked)} />} label="Replace existing (delete subject materials before import)" />
        <Button variant="contained" onClick={handleImport} disabled={loading || rows.length===0}>
          {loading ? <CircularProgress size={16} /> : 'Import'}
        </Button>
      </Box>

      {headers.length > 0 && (
      <Box sx={{ mt: 2, overflowX: 'auto', width: '100%' }}>
            <Typography variant="subtitle2">Preview (max 200 rows)</Typography>
            {/* Table will occupy 100% of container but keep a minWidth so on narrow screens it becomes horizontally scrollable */}
            <Table size="small" sx={{ width: '100%', minWidth: tableMinWidth, tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        verticalAlign: 'top',
                        minWidth: 160,
                        fontWeight: 600
                      }}
                      title={h}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={idx}>
                    {headers.map((h) => {
                      const val = String(r[h] ?? '');
                      return (
                        <TableCell
                          key={h}
                          sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            minWidth: 160,
                            maxWidth: 420,
                            verticalAlign: 'top'
                          }}
                          title={val}
                        >
                          {val}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography>Result: inserted {result.insertedCount ?? 0}</Typography>
          {result.errors && result.errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography color="error">Errors:</Typography>
              {result.errors.map((e, i) => (
                <Typography key={i} sx={{ fontSize: 13 }}>{`Row ${e.index}: ${e.errors.join('; ')}`}</Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
