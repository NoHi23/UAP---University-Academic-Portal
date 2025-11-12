import React, { useState, useEffect } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import GradeExcelImport from '../../components/GradeImport/GradeExcelImport';
import gradeComponentAPI from '../../api/gradeComponentAPI';
import * as XLSX from 'xlsx';
import { notifySuccess, notifyError } from '../../services/notificationService';
import lecturerAPI from '../../api/lecturerAPI';

const EnterGrades = () => {
  const [semesterId, setSemesterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [semesterName, setSemesterName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  

  const onImported = () => {
    notifySuccess('Import completed — kiểm tra kết quả ở thông báo.');
  };

  const handleDownloadTemplate = async () => {
    if (!subjectId || !classId) {
      notifyError('Vui lòng chọn môn và lớp trước khi tải mẫu.');
      return;
    }
    try {
      setDownloading(true);
      // fetch students and components
      const stuResp = await lecturerAPI.getStudentsByClass(classId);
      const students = stuResp?.data || stuResp || [];
      const compResp = await gradeComponentAPI.getAll(subjectId);
      const comps = compResp?.data?.data || compResp?.data || compResp || [];
      // sort components ascending by weightPercentage (low -> high)
      const compsSorted = (Array.isArray(comps) ? comps : []).slice().sort((a, b) => {
        const wa = Number(a?.weightPercentage ?? 0);
        const wb = Number(b?.weightPercentage ?? 0);
        if (wa === wb) return String(a.name || '').localeCompare(String(b.name || ''));
        return wa - wb;
      });

      // build headers and rows (include STT as first column)
      const headers = ['STT', 'Họ và tên', 'Mã sinh viên', 'Gmail'];
      const compHeaders = compsSorted.map(c => {
        const pct = (c && (c.weightPercentage !== undefined && c.weightPercentage !== null)) ? String(c.weightPercentage) : '0';
        return `${c.name} (${pct}%)`;
      });
      headers.push(...compHeaders);

      const aoa = [headers];
      (Array.isArray(students) ? students : []).forEach((s, idx) => {
        const fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim();
        const row = [idx + 1, fullName, s.studentCode || '', s.email || ''];
        for (let i = 0; i < compHeaders.length; i++) row.push('');
        aoa.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // build human-friendly filename: "class - subject.xlsx"
      const findClass = (Array.isArray(classOptions) ? classOptions : []).find(x => String(x._id) === String(classId));
      const findSubject = (Array.isArray(subjectOptions) ? subjectOptions : []).find(x => String(x._id) === String(subjectId));
      const classLabel = findClass ? (findClass.code || findClass.name || findClass.classCode || findClass.className || findClass._id) : classId || 'class';
      const subjectLabel = findSubject ? (findSubject.code || findSubject.name || findSubject.subjectCode || findSubject.subjectName || findSubject._id) : subjectId || 'subject';
      const sanitize = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '_').trim();
      a.download = `${sanitize(classLabel)} - ${sanitize(subjectLabel)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notifySuccess('File mẫu đã được tạo và tải xuống');
    } catch (err) {
      console.error('Failed to create template', err);
      notifyError(err?.response?.data?.message || err.message || 'Tạo mẫu thất bại');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    // fetch current semester and semester-options for lecturer
    const load = async () => {
      try {
        // get semesters (use API wrapper)
        const semRes = await lecturerAPI.getSemesters();
        // support a few possible shapes returned by the API
        let currentSemesterId = semRes?.currentSemesterId || semRes?.data?.currentSemesterId || (Array.isArray(semRes?.data) ? semRes.data[0]?._id : semRes?.data?.[0]?._id) || semRes?.[0]?._id;
        if (!currentSemesterId && semRes?.data && Array.isArray(semRes.data) && semRes.data.length > 0) currentSemesterId = semRes.data[0]._id;
        if (currentSemesterId) {
          setSemesterId(currentSemesterId);
          // determine semester name from response shapes
          try {
            const allSems = semRes?.data || semRes || [];
            const semObj = Array.isArray(allSems) ? allSems.find(x => String(x._id) === String(currentSemesterId)) : (allSems.currentSemesterId ? allSems : null);
            const resolvedName = semObj?.semesterName || semObj?.name || semObj?.semester || '';
            if (resolvedName) setSemesterName(resolvedName);
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error('Failed to load semester/semester-options', err);
      }
    };
    load();
  }, []);

  // compute readable labels for selected subject/class
  const currentClass = (Array.isArray(classOptions) ? classOptions : []).find(x => String(x._id) === String(classId)) || null;
  const currentSubject = (Array.isArray(subjectOptions) ? subjectOptions : []).find(x => String(x._id) === String(subjectId)) || null;
  const classLabel = currentClass ? (currentClass.code || currentClass.name || currentClass.classCode || currentClass.className || currentClass._id) : (classId || '');
  const subjectLabel = currentSubject ? (currentSubject.code || currentSubject.name || currentSubject.subjectCode || currentSubject.subjectName || currentSubject._id) : (subjectId || '');

  // load subjects and classes for the selected semester
  useEffect(() => {
    if (!semesterId) return;
    const loadOptions = async () => {
      try {
        // Prefer semester-specific options (subjects/classes assigned to this lecturer)
        const semOptRes = await lecturerAPI.getSemesterOptions(semesterId);
        const semData = semOptRes?.data || semOptRes || {};
  const semSubjects = (semData.subjects || []);

        if (Array.isArray(semSubjects) && semSubjects.length > 0) {
          // map to a consistent shape used by selects
          setSubjectOptions(semSubjects.map(s => ({ _id: s.subjectId, code: s.subjectCode || '', name: s.subjectName || '' })));
        } else {
          // fallback to generic subjects list
          const subjRes = await lecturerAPI.getSubjects({ semesterId });
          const subs = subjRes?.data || subjRes || [];
          setSubjectOptions(Array.isArray(subs) ? subs : []);
        }

        // For classes: we'll load them in a dedicated effect so we can support subject filtering
        // If semClasses are available we keep them as a cache, but we'll not set classOptions here.
        // Store a local cache (if needed) by setting a transient variable; currently we ignore caching
        // and load classes in the class-loading effect below.
      } catch (err) {
        console.error('Failed to load subjects/classes', err);
        notifyError('Không tải được danh sách môn/lớp. Vui lòng thử lại sau.');
        setSubjectOptions([]);
        setClassOptions([]);
      }
    };
    loadOptions();
  }, [semesterId]);

  // Load classes for the selected semester. If subjectId is set, ask server to filter by subjectId.
  useEffect(() => {
    if (!semesterId) return;
    const loadClasses = async () => {
      try {
        let clsRes;
        if (subjectId) {
          // Ask backend for classes filtered by subjectId
          clsRes = await lecturerAPI.getClassesBySemester(semesterId, subjectId);
        } else {
          clsRes = await lecturerAPI.getClassesBySemester(semesterId);
        }
        const cls = clsRes?.data || clsRes || [];
        // backend returns teaching-instances with classId/className/classCode
        const mapped = Array.isArray(cls) ? cls.map(c => ({ _id: c.classId || c._id || c.classId?._id, code: c.classCode || c.classCode || c.className || '', name: c.className || c.className || '' })) : [];
        setClassOptions(mapped);
        // If current selected class is not in mapped options, clear selection
        if (classId && !mapped.some(m => String(m._id) === String(classId))) {
          setClassId('');
        }
      } catch (err) {
        console.error('Failed to load classes for semester/subject', err);
        notifyError('Không tải được danh sách lớp. Vui lòng thử lại sau.');
        setClassOptions([]);
      }
    };
    loadClasses();
  }, [semesterId, subjectId, classId]);
    // auto-select when only one subject/class option is available
    useEffect(() => {
      if (!subjectId && subjectOptions.length === 1) setSubjectId(subjectOptions[0]._id);
    }, [subjectOptions, subjectId]);

    useEffect(() => {
      if (!classId && classOptions.length === 1) setClassId(classOptions[0]._id);
    }, [classOptions, classId]);

    // render
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5">Nhập điểm sinh viên</Typography>
        {semesterName ? (
          <Typography variant="subtitle1" sx={{ mt: 0.5, fontWeight: 600 }}>
            {`Kỳ học: ${semesterName}`}
          </Typography>
        ) : null}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="subject-select-label">Môn</InputLabel>
          <Select
            labelId="subject-select-label"
            label="Môn"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={isConfirmed}
          >
            <MenuItem value="">-- Chọn môn --</MenuItem>
            {subjectOptions.map(s => (
              <MenuItem key={s._id} value={s._id}>{ s.code + " - " + (s.name || "")}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="class-select-label">Lớp</InputLabel>
          <Select
            labelId="class-select-label"
            label="Lớp"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={isConfirmed}
          >
            <MenuItem value="">-- Chọn lớp --</MenuItem>
            {classOptions.map(c => (
              <MenuItem key={c._id} value={c._id}>{c.code + (c.name ? ` - ${c.name}` : '')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Template download is rendered next to Import button inside GradeExcelImport */}
      </Box>



      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        {!isConfirmed ? (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              if (!subjectId || !classId) { notifyError('Vui lòng chọn môn và lớp trước khi xác nhận.'); return; }
              setIsConfirmed(true);
            }}
          >Xác nhận môn & lớp</Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">Đã chọn: <strong>{classLabel}</strong> — <strong>{subjectLabel}</strong></Typography>
            <Button size="small" variant="text" onClick={() => setIsConfirmed(false)}>Thay đổi</Button>
          </Box>
        )}
      </Box>

      {isConfirmed ? (
        <GradeExcelImport
          semesterId={semesterId}
          subjectId={subjectId}
          classId={classId}
          onImported={onImported}
          downloadTemplate={handleDownloadTemplate}
          templateDownloading={downloading}
          isConfirmed={isConfirmed}
          subjectLabel={subjectLabel}
          classLabel={classLabel}
          onEditConfirm={() => setIsConfirmed(false)}
        />
      ) : null}

      <Typography variant="body2" color='info' sx={{ mt: 2 }}>
        Lưu ý: Header của file Excel phải chứa "mã sinh viên" và các cột tên thành phần điểm (tên phải khớp chính xác với các điểm có trong hệ thống ). Điểm sẽ được làm tròn 2 chữ số thập phân. Nếu có bất kỳ lỗi nào, toàn bộ file sẽ bị từ chối và báo lỗi chi tiết.
      </Typography>
    </Box>
  );
};

export default EnterGrades;
