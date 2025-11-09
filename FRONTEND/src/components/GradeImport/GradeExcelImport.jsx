import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { notifyError } from '../../services/notificationService';
import * as XLSX from 'xlsx';
import gradeAPI from '../../api/gradeAPI';
import gradeComponentAPI from '../../api/gradeComponentAPI';
import lecturerAPI from '../../api/lecturerAPI';

/**
 * GradeExcelImport
 * Props:
 * - subjectId (string) optional preset subject _id
 * - classId (string) optional preset class _id
 * - semesterId (string) optional semester _id used by backend
 * - onImported() callback when import succeeds
 */
const GradeExcelImport = ({ subjectId: presetSubjectId = '', classId: presetClassId = '', semesterId = '', onImported, downloadTemplate, templateDownloading = false, isConfirmed = false, subjectLabel = '', classLabel = '', onEditConfirm }) => {
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rowsPreview, setRowsPreview] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Metadata key helpers - keep a single source of truth for header aliases
  const STUDENT_KEYS = ['studentcode','student_code','mssv','student id','studentid','mã sinh viên','ma sinh vien','msv'];
  const STT_KEYS = ['stt','số thứ tự','so thu tu'];
  const NAME_KEYS = ['họ và tên','ho va ten','hovaten','fullname','full name','name'];
  const EMAIL_KEYS = ['gmail','email','e-mail'];

  const normalizeKey = (k) => String(k ?? '').trim().toLowerCase();
  const isStudentKey = (k) => STUDENT_KEYS.includes(normalizeKey(k));
  const isSttKey = (k) => STT_KEYS.includes(normalizeKey(k));
  const isNameKey = (k) => NAME_KEYS.includes(normalizeKey(k));
  const isEmailKey = (k) => EMAIL_KEYS.includes(normalizeKey(k));
  const isMetaColumn = (k) => isStudentKey(k) || isSttKey(k) || isNameKey(k) || isEmailKey(k);

  const handleFile = (file) => {
    setError('');
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!raw || raw.length === 0) {
          setError('File Excel rỗng hoặc không đọc được.');
          return;
        }
        const hdr = raw[0].map(h => String(h).trim());
  // find studentCode header (case-insensitive variants)
  const studentKey = hdr.find(h => ['studentcode', 'student_code', 'mssv', 'student id', 'studentid', 'mã sinh viên', 'ma sinh vien', 'msv'].includes(String(h).toLowerCase()));
        if (!studentKey) {
          setError('Header phải chứa cột mã sinh viên (studentCode / student_code / mssv).');
          return;
        }
  // detect presence of full name / email columns via header values (handled later when skipping keys)
        // build objects
        const objRows = raw.slice(1).map(r => {
          const obj = {};
          hdr.forEach((h, i) => {
            obj[h] = r[i];
          });
          return obj;
        }).filter(r => r && Object.values(r).some(v => String(v).trim() !== ''));
        // preserve detected special keys for later validation/UI if needed
        const normalizedHdr = hdr.map(h => h);
        setHeaders(normalizedHdr);
        // rowsPreview keeps STT (if present) for readability, but parsedRows should NOT contain STT
        setRowsPreview(objRows.slice(0, 10));
        const cleaned = objRows.map(row => {
          const copy = { ...row };
          // remove any STT-like column from parsedRows to ensure STT never becomes data
          Object.keys(copy).forEach(k => {
            if (isSttKey(k)) delete copy[k];
          });
          return copy;
        }).filter(r => r && Object.values(r).some(v => String(v).trim() !== ''));
        setParsedRows(cleaned);
        // Clear the file input's value so selecting the same file again (after editing externally)
        // will trigger onChange. We keep fileName state for UI display.
        try {
          if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '';
        } catch (er) { /* ignore */ }
      } catch (err) {
        console.error(err);
        setError('Không thể phân tích file Excel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const fileInputRef = useRef(null);

  // When instructor confirms selection, fetch students + components + current grades and build a preview table.
  // fetch or rebuild the current preview table (used on confirm and after import)
  const fetchExistingGrades = async () => {
    if (!isConfirmed) return;
    if (!presetSubjectId || !presetClassId) return;
    try {
      setLoading(true);
      setError('');

      // Fetch grade components for subject (to get weightPercentage and order)
      const compResp = await gradeComponentAPI.getAll(presetSubjectId);
      const comps = compResp?.data?.data || compResp?.data || compResp || [];
      const compsSorted = (Array.isArray(comps) ? comps : []).slice().sort((a, b) => {
        const wa = Number(a?.weightPercentage ?? 0);
        const wb = Number(b?.weightPercentage ?? 0);
        if (wa === wb) return String(a.name || '').localeCompare(String(b.name || ''));
        return wa - wb;
      });

      // Fetch students in class to get names/emails/studentCode
      const stuResp = await lecturerAPI.getStudentsByClass(presetClassId);
      const students = stuResp?.data || stuResp || [];

      // Fetch current grades Excel and parse into map (studentCode -> { componentName: score })
      let gradeMap = {};
      try {
        const resp = await gradeAPI.exportClassExcel(presetSubjectId, presetClassId);
        const blob = resp && resp.data ? resp.data : resp;
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (raw && raw.length > 0) {
            const hdrRow = raw[0].map(h => String(h).trim());
            for (let i = 1; i < raw.length; i++) {
              const row = raw[i];
              const studentCode = String(row[0] ?? '').trim();
              if (!studentCode) continue;
              gradeMap[studentCode] = gradeMap[studentCode] || {};
              for (let c = 1; c < hdrRow.length; c++) {
                const compNameRaw = hdrRow[c];
                // normalize header by stripping trailing percentage like " (40%)"
                const compName = String(compNameRaw).replace(/\s*\(\s*\d+(?:\.\d+)?%\s*\)\s*$/i, '').trim();
                gradeMap[studentCode][compName] = row[c] ?? '';
              }
            }
          }
        }
      } catch (e) {
        // ignore grade fetch error; we'll still show students and empty cells
        console.warn('Could not fetch grade Excel:', e);
      }

      // Build display headers: STT, name, studentCode, email, then components (sorted)
      const displayCompHeaders = compsSorted.map(c => `${c.name} (${c.weightPercentage ?? 0}%)`);
      const displayHeaders = ['STT', 'Họ và tên', 'Mã sinh viên', 'Gmail', ...displayCompHeaders];

      // Build rows: for each student, map to header values (include STT index)
      const rows = (Array.isArray(students) ? students : []).map((s, idx) => {
        const fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim();
        const scode = s.studentCode || '';
        const mail = s.email || '';
        const gradeRow = { 'STT': idx + 1, 'Họ và tên': fullName, 'Mã sinh viên': scode, 'Gmail': mail };
        for (const comp of compsSorted) {
          const keyName = comp.name;
          const displayKey = `${comp.name} (${comp.weightPercentage ?? 0}%)`;
          gradeRow[displayKey] = (gradeMap[scode] && (gradeMap[scode][keyName] !== undefined)) ? gradeMap[scode][keyName] : '';
        }
        return gradeRow;
      });

      setHeaders(displayHeaders);
      setRowsPreview(rows.slice(0, 10));
      // parsedRows used for import should not include STT column
      setParsedRows(rows.map(r => {
        const copy = { ...r };
        if (copy.STT !== undefined) delete copy.STT;
        return copy;
      }));
      setFileName(`${classLabel || presetClassId} - ${subjectLabel || presetSubjectId} (current)`);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load existing grades', err);
      setError('Không tải được bảng điểm hiện tại của lớp/môn này.');
      setLoading(false);
    }
  };

  // fetchExistingGrades is stable enough for our usage here; we intentionally omit it from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchExistingGrades();
  }, [isConfirmed, presetSubjectId, presetClassId, classLabel, subjectLabel]);

  const handleImport = async () => {
    setError('');
    if (!parsedRows || parsedRows.length === 0) {
      setError('Không có dữ liệu để import.');
      return;
    }
    // ensure subjectId and classId are provided by parent (required for grade import)
    if (!presetSubjectId || !presetClassId) {
      const msg = 'Vui lòng chọn Môn và Lớp trước khi import (subjectId và classId phải được đặt).';
      setError(msg);
      // also show global notification reminder
      try { notifyError(msg); } catch (e) { /* ignore */ }
      return;
    }
    // required studentCode header already validated on parse
    setLoading(true);
      try {
        const items = [];
        for (const row of parsedRows) {
        // find studentCode key (name/email are not needed for import items)
        const studentCodeKey = Object.keys(row).find(k => isStudentKey(k));
              const studentCode = studentCodeKey ? String(row[studentCodeKey]).trim() : '';
        if (!studentCode) continue; // skip empty
        // for each other header treat as component name, but skip name/email columns
            for (const key of Object.keys(row)) {
              // skip any meta columns (studentCode, STT, name, email)
              if (isMetaColumn(key)) continue;
          const rawVal = row[key];
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') continue;
          const num = Number(rawVal);
          const score = Number.isFinite(num) ? Math.round(num * 100) / 100 : rawVal;
          // normalize component name: strip trailing percentage like " (40%)" if present
          const componentNameRaw = String(key).trim();
          const componentName = componentNameRaw.replace(/\s*\(\s*\d+(?:\.\d+)?%\s*\)\s*$/i, '').trim();
          items.push({ studentCode, subjectId: presetSubjectId, classId: presetClassId, componentName, rawComponent: componentNameRaw, score });
        }
        // if no component columns present, still send a minimal item so server can decide
        const hasScore = Object.keys(row).some(k => {
          if (isMetaColumn(k)) return false;
          return String(row[k]).trim() !== '';
        });
        if (!hasScore) {
          items.push({ studentCode, subjectId: presetSubjectId, classId: presetClassId });
        }
      }

      if (items.length === 0) {
        setError('Không tìm thấy điểm hợp lệ trong file.');
        setLoading(false);
        return;
      }

      const body = { items, semesterId: semesterId || undefined, rejectOnError: true };
      // call import and handle detailed server errors so we can show the first message
      let resp;
      try {
        resp = await gradeAPI.import(body);
      } catch (err) {
        console.error('Import failed', err);
        const respErr = err?.response?.data || err?.response || null;
        if (respErr) {
          // If backend returned structured subject/components info, show detailed message
          if (respErr.subjectName || respErr.components) {
            const short = respErr.message || 'Import thất bại';
            const comps = Array.isArray(respErr.components) ? respErr.components.map(c => `${c.name} (${c.weightPercentage ?? c.weight ?? ''}%)`).join(', ') : '';
            const msg = comps ? `${short} — Chi tiết: ${comps}` : short;
            setError(msg);
            try { notifyError(short); } catch (e) { /* ignore */ }
          } else if (Array.isArray(respErr.errors) && respErr.errors.length > 0) {
            const first = respErr.errors[0];
            const msg = first?.message || (Array.isArray(first?.errors) ? first.errors.join('; ') : JSON.stringify(first));
            setError(msg);
            try { notifyError(msg); } catch (e) { /* ignore */ }
          } else if (Array.isArray(respErr.failed) && respErr.failed.length > 0) {
            const first = respErr.failed[0];
            const msg = first?.error || first?.message || JSON.stringify(first);
            setError(msg);
            try { notifyError(msg); } catch (e) { /* ignore */ }
          } else if (respErr.message) {
            setError(respErr.message);
            try { notifyError(respErr.message); } catch (e) { /* ignore */ }
          } else {
            setError(err?.message || 'Import thất bại');
            try { notifyError(err?.message || 'Import thất bại'); } catch (e) { /* ignore */ }
          }
        } else {
          setError(err?.message || 'Import thất bại');
          try { notifyError(err?.message || 'Import thất bại'); } catch (e) { /* ignore */ }
        }
        setLoading(false);
        return;
      }

      // If server returned partial failures inside 2xx, show first
      const data = resp?.data || resp || {};
      if (data && (data.subjectName || data.components)) {
        const short = data.message || 'Import thất bại';
        const comps = Array.isArray(data.components) ? data.components.map(c => `${c.name} (${c.weightPercentage ?? c.weight ?? ''}%)`).join(', ') : '';
        const msg = comps ? `${short} — Chi tiết: ${comps}` : short;
        setError(msg);
        try { notifyError(short); } catch (e) { /* ignore */ }
        setLoading(false);
        return;
      }
      if (data && Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        const msg = first?.message || (Array.isArray(first?.errors) ? first.errors.join('; ') : JSON.stringify(first));
        setError(msg);
        try { notifyError(msg); } catch (e) { /* ignore */ }
        setLoading(false);
        return;
      }
      if (data && Array.isArray(data.failed) && data.failed.length > 0) {
        const first = data.failed[0];
        const msg = first?.error || first?.message || JSON.stringify(first);
        setError(msg);
        try { notifyError(msg); } catch (e) { /* ignore */ }
        setLoading(false);
        return;
      }

      setLoading(false);
      // refresh preview by fetching latest class-grade sheet from server
      try {
        await fetchExistingGrades();
      } catch (e) {
        console.warn('Import succeeded but failed to refresh preview', e);
      }
      // clear parsedRows (uploaded staging rows) but keep preview visible
      setParsedRows([]);
      if (onImported) onImported();
    } catch (err) {
      console.error('Import failed', err);
      setError(err?.response?.data?.message || err?.message || 'Import thất bại');
      setLoading(false);
    }
  };

  return (
    <Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Button variant="contained" component="label" size="small">
          Chọn file Excel
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(e) => handleFile(e.target.files && e.target.files[0])}
          />
        </Button>
        <Typography variant="body2">{fileName || 'Chưa chọn file'}</Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ mr: 2 }}>
          {isConfirmed ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2">Chọn: <strong>{classLabel || presetClassId}</strong> — <strong>{subjectLabel || presetSubjectId}</strong></Typography>
              {onEditConfirm ? <Button size="small" variant="text" onClick={onEditConfirm}>Thay đổi</Button> : null}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Chưa xác nhận Môn/Lớp</Typography>
          )}
        </Box>
        {/* Template download button (bigger) */}
        {/* Export current grades from server (primary action) */}
        <Button
          variant="contained"
          color="success"
          size="medium"
          onClick={async () => {
            // refresh preview by fetching latest class-grade sheet from server
            try {
              await fetchExistingGrades();
            } catch (e) {
              // ignore refresh errors
              console.warn('Failed to refresh preview before export', e);
            }
            if (!presetSubjectId || !presetClassId || !isConfirmed) return;
            setExporting(true);
            setError('');
            try {
              // Fetch components (sorted ascending by weight)
              const compResp = await gradeComponentAPI.getAll(presetSubjectId);
              const comps = compResp?.data?.data || compResp?.data || compResp || [];
              const compsSorted = (Array.isArray(comps) ? comps : []).slice().sort((a, b) => {
                const wa = Number(a?.weightPercentage ?? 0);
                const wb = Number(b?.weightPercentage ?? 0);
                if (wa === wb) return String(a.name || '').localeCompare(String(b.name || ''));
                return wa - wb;
              });

              // Fetch students
              const stuResp = await lecturerAPI.getStudentsByClass(presetClassId);
              const students = stuResp?.data || stuResp || [];

              // Try to fetch existing grades to fill values
              let gradeMap = {};
              try {
                const resp = await gradeAPI.exportClassExcel(presetSubjectId, presetClassId);
                const blob = resp && resp.data ? resp.data : resp;
                if (blob) {
                  const arrayBuffer = await blob.arrayBuffer();
                  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[sheetName];
                  const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                  if (raw && raw.length > 0) {
                    const hdrRow = raw[0].map(h => String(h).trim());
                    for (let i = 1; i < raw.length; i++) {
                      const row = raw[i];
                      const sCode = String(row[0] ?? '').trim();
                      if (!sCode) continue;
                      gradeMap[sCode] = gradeMap[sCode] || {};
                      for (let c = 1; c < hdrRow.length; c++) {
                        const compNameRaw = hdrRow[c];
                        const compName = String(compNameRaw).replace(/\s*\(\s*\d+(?:\.\d+)?%\s*\)\s*$/i, '').trim();
                        gradeMap[sCode][compName] = row[c] ?? '';
                      }
                    }
                  }
                }
              } catch (e) {
                console.warn('Could not fetch existing grades for export:', e);
              }

              // Build headers and AOAs
              const headersExport = ['STT', 'Họ và tên', 'Mã sinh viên', 'Gmail', ...compsSorted.map(c => `${c.name} (${c.weightPercentage ?? 0}%)`)];
              const aoa = [headersExport];
              (Array.isArray(students) ? students : []).forEach((s, idx) => {
                const fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim();
                const scode = s.studentCode || '';
                const mail = s.email || '';
                const row = [idx + 1, fullName, scode, mail];
                for (const comp of compsSorted) {
                  const val = (gradeMap[scode] && (gradeMap[scode][comp.name] !== undefined)) ? gradeMap[scode][comp.name] : '';
                  row.push(val);
                }
                aoa.push(row);
              });

              const ws = XLSX.utils.aoa_to_sheet(aoa);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Grades');
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
              const blobOut = new Blob([wbout], { type: 'application/octet-stream' });
              const url = window.URL.createObjectURL(blobOut);
              const a = document.createElement('a');
              a.href = url;
              const sanitize = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '_').trim();
              const aClass = sanitize(classLabel || presetClassId || 'class');
              const aSubj = sanitize(subjectLabel || presetSubjectId || 'subject');
              a.download = `${aClass} - ${aSubj} (current).xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error('Export (client) failed', e);
              setError('Không xuất được file bảng điểm hiện tại (client).');
            } finally {
              setExporting(false);
            }
          }}
          disabled={!presetSubjectId || !presetClassId || !isConfirmed || exporting}
          sx={{
            height: 40,
            mr: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)'
          }}
        >
          {exporting ? 'Đang xuất...' : 'Xuất bảng điểm'}
        </Button>
        {downloadTemplate ? (
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            onClick={downloadTemplate}
            disabled={templateDownloading || !presetSubjectId || !presetClassId || !isConfirmed}
            sx={{
              height: 40,
              mr: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {templateDownloading ? 'Đang tạo...' : 'Tải mẫu'}
          </Button>
        ) : null}
        <Button
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleImport}
          disabled={loading || !fileName || !presetSubjectId || !presetClassId || !isConfirmed}
          sx={{
            height: 40,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)'
          }}
        >
          {loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Import'}
        </Button>
      </Box>

      {error ? (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>
      ) : null}

      {headers.length > 0 && (
        <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
          <Table size="small" sx={{ borderCollapse: 'separate' }}>
            <TableHead>
              <TableRow>
                {headers.map(h => (
                  <TableCell
                    key={h}
                    sx={{
                      borderRight: '1px solid rgba(0,0,0,0.12)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rowsPreview.map((r, i) => (
                <TableRow key={i}>
                  {headers.map((h, ci) => (
                    <TableCell
                      key={h + i}
                      sx={{
                        borderRight: '1px solid rgba(0,0,0,0.06)',
                        '&:last-child': { borderRight: 'none' },
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {String(r[h] ?? '').slice(0, 80)}
                    </TableCell>
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

export default GradeExcelImport;
