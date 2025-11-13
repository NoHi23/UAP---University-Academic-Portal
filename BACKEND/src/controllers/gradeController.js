const mongoose = require('mongoose');
const XLSX = require('xlsx');

const Grade = require('../models/grade');
const GradeComponent = require('../models/gradeComponent');
const Student = require('../models/student');
const Subject = require('../models/subject');
const Schedule = require('../models/schedule');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Semester = require('../models/semester');

// POST /lecturer/grades/mark or /lecturer/grades/import
// Accepts single item or array of items. Each item should contain at least:
// { studentCode, classId, subjectId, componentId OR componentName, score }
// If rejectOnError=true (used for Excel import) then on any validation error the whole request is rejected
const markGrades = async (req, res) => {
  try {
    const lecturerAccountId = req.user.id;
    // Resolve Lecturer document from accountId so we can check lecturer._id against Schedule.lecturerId
    const LecturerModel = require('../models/lecturer');
    const lecturer = await LecturerModel.findOne({ accountId: lecturerAccountId }).lean();
    if (!lecturer) return res.status(403).json({ success: false, message: 'Lecturer profile not found or unauthorized' });

    const payload = req.body;
    const items = Array.isArray(payload) ? payload : (payload && payload.items ? payload.items : [payload]);
    const rejectOnError = !!req.body.rejectOnError;

    // Pre-check: ensure for each subjectId involved in the import, the grade components sum to 100%
    try {
      const subjectIdSet = new Set(items.map(it => it && it.subjectId).filter(Boolean));
      for (const subjId of subjectIdSet) {
        // load components for this subject
        const compsForSubj = await GradeComponent.find({ subjectId: subjId }).lean();
        // resolve subject name if possible for better error messages
        let subjName = null;
        try {
          const subjDoc = await Subject.findById(subjId).lean();
          subjName = subjDoc ? (subjDoc.name || subjDoc.subjectName || null) : null;
        } catch (_) {
          subjName = null;
        }
        if (Array.isArray(compsForSubj) && compsForSubj.length > 0) {
          const total = compsForSubj.reduce((s, c) => s + (Number(c.weightPercentage) || 0), 0);
          // allow tiny floating point epsilon; require total <= 100 (do not allow >100)
          if (total - 100 > 1e-6) {
            return res.status(400).json({
              success: false,
              message: `Tổng tỷ lệ phần trăm của các thành phần điểm cho môn ${subjName || subjId} không được vượt quá 100% (hiện là ${total}%).`,
              subjectId: subjId,
              subjectName: subjName,
              total,
              components: compsForSubj.map(c => ({ name: c.name, weightPercentage: Number(c.weightPercentage) || 0 }))
            });
          }
        } else {
          // no components defined for this subject - that's an error for imports
          return res.status(400).json({
            success: false,
            message: `Chưa có thành phần điểm cho môn ${subjName || subjId}. Vui lòng tạo các GradeComponent trước khi import.`,
            subjectId: subjId,
            subjectName: subjName,
            total: 0,
            components: []
          });
        }
      }
    } catch (compCheckErr) {
      console.error('Failed to validate grade components before import', compCheckErr);
      return res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra thành phần điểm trước import.' });
    }

    // Normalize and collect validation errors first
    const errors = [];

    // helper to parse ObjectId-like values
    const toObjectId = (v) => {
      try {
        return mongoose.Types.ObjectId(String(v));
      } catch (e) {
        return null;
      }
    };

    // preload semester if provided to check closing date
    const semesterId = req.body.semesterId ? toObjectId(req.body.semesterId) : null;
    let semesterDoc = null;
    if (semesterId) {
      semesterDoc = await Semester.findById(semesterId).lean();
      if (!semesterDoc) {
        // we'll include as error for all items if provided semesterId invalid
        errors.push({ message: 'semesterId không hợp lệ', semesterId: req.body.semesterId });
      }
    }

    // Validate each item
    const validatedItems = [];
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx] || {};
      const rowIdx = idx + 1;
      const entryErrors = [];

      const studentCode = it.studentCode || it.studentId || null; // support either, prefer studentCode
      const classId = it.classId || null;
      const subjectId = it.subjectId || null;
      const scoreRaw = it.score;
      const componentId = it.componentId || null;
      const componentName = it.componentName || null;

      if (!studentCode) entryErrors.push({ row: rowIdx, field: 'studentCode', message: 'studentCode là bắt buộc' });
      if (!classId) entryErrors.push({ row: rowIdx, field: 'classId', message: 'classId là bắt buộc' });
      if (!subjectId) entryErrors.push({ row: rowIdx, field: 'subjectId', message: 'subjectId là bắt buộc' });
      if (!componentId && !componentName) entryErrors.push({ row: rowIdx, field: 'component', message: 'componentId hoặc componentName là bắt buộc' });

      // parse numeric score
      const parsed = scoreRaw === null || scoreRaw === undefined || scoreRaw === '' ? null : Number(scoreRaw);
      if (parsed === null || Number.isNaN(parsed)) {
        entryErrors.push({ row: rowIdx, field: 'score', message: 'score phải là số' });
      } else if (parsed < 0 || parsed > 10) {
        entryErrors.push({ row: rowIdx, field: 'score', message: 'score phải trong khoảng 0-10' });
      }

      // resolve student by studentCode
      let studentDoc = null;
      if (studentCode) {
        studentDoc = await Student.findOne({ studentCode: String(studentCode).trim() }).lean();
        if (!studentDoc) entryErrors.push({ row: rowIdx, field: 'studentCode', message: `Không tìm thấy studentCode: ${studentCode}` });
      }

      // ensure student belongs to class
      if (studentDoc && classId) {
        const sos = await ScheduleOfStudent.findOne({ classId: classId, studentId: studentDoc._id }).lean();
        if (!sos) entryErrors.push({ row: rowIdx, field: 'classId', message: `Sinh viên ${studentCode} không thuộc lớp ${classId}` });
      }

      // resolve component
      let componentDoc = null;
      if (componentId) {
        componentDoc = await GradeComponent.findById(componentId).lean();
        if (!componentDoc) entryErrors.push({ row: rowIdx, field: 'componentId', message: `Không tìm thấy componentId: ${componentId}` });
      } else if (componentName && subjectId) {
        componentDoc = await GradeComponent.findOne({ subjectId: subjectId, name: componentName }).lean();
        if (!componentDoc) entryErrors.push({ row: rowIdx, field: 'componentName', message: `Không tìm thấy thành phần '${componentName}' cho môn này` });
      }

      // if component resolved, ensure its subject matches provided subjectId
      if (componentDoc && String(componentDoc.subjectId) !== String(subjectId)) {
        entryErrors.push({ row: rowIdx, field: 'component', message: 'component không thuộc subjectId đã cung cấp' });
      }

      // check lecturer teaches this class & subject in the semester (authorization)
      // find any schedule that matches lecturerId, classId, subjectId and semesterId (if provided) or any
      if (classId && subjectId) {
  const schFilter = { classId: classId, subjectId: subjectId, lecturerId: lecturer._id };
        if (semesterId) schFilter.semesterId = semesterId;
        const sch = await Schedule.findOne(schFilter).lean();
        if (!sch) {
          // Try alternative: if req.user.id is accountId, need to look up Lecturer by accountId — but lecturer routes normally call controller with account id mapped elsewhere
          // For simplicity, if schedule not found under provided filters, reject
          entryErrors.push({ row: rowIdx, field: 'authorization', message: 'Bạn không có quyền nhập điểm cho lớp/môn này hoặc schedule không tồn tại trong kỳ' });
        }
      }

      if (entryErrors.length > 0) {
        errors.push(...entryErrors);
      } else {
        // validated item
        validatedItems.push({ row: rowIdx, student: studentDoc, classId, subjectId, component: componentDoc, score: Number(parsed.toFixed(2)), rawScore: parsed });
      }
    }

    if (errors.length > 0 && rejectOnError) {
      return res.status(400).json({ success: false, errors });
    }

    // If rejectOnError is false, we will process only validatedItems and return per-item results including errors for invalid rows
    const results = [];
    // perform upserts for validated items
    for (const vi of validatedItems) {
      try {
        const g = await Grade.findOneAndUpdate(
          { studentId: vi.student._id, subjectId: vi.subjectId, componentId: vi.component._id },
          { score: vi.score },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        results.push({ studentId: String(vi.student._id), studentCode: vi.student.studentCode, componentId: String(vi.component._id), success: true });
      } catch (err) {
        results.push({ studentId: String(vi.student._id), studentCode: vi.student.studentCode, componentId: String(vi.component._id), success: false, message: err.message });
      }
    }

    // include errors for invalid items if any (when rejectOnError==false)
    if (!rejectOnError && errors.length > 0) {
      // map errors by row
      return res.status(207).json({ success: false, results, errors });
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('markGrades error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  markGrades
};

// Export class grades as Excel: accepts query params subjectId and classId
const exportClassGradesExcel = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    const classId = req.query.classId;
    if (!subjectId || !classId) return res.status(400).json({ success: false, message: 'subjectId and classId are required' });

    // load grade components for subject
    const components = await GradeComponent.find({ subjectId }).sort({ weightPercentage: -1, name: 1 }).lean();
    const componentIds = components.map(c => c._id);

    // find students in the class
    const sos = await ScheduleOfStudent.find({ classId }).populate('studentId').lean();
    const students = sos.map(s => s.studentId).filter(Boolean);
    const studentIds = students.map(s => s._id);

    // load grades for these students, subject and components
    const grades = await Grade.find({ subjectId, componentId: { $in: componentIds }, studentId: { $in: studentIds } }).lean();

    // build a map studentId -> { componentId: score }
    const gradeMap = {};
    for (const g of grades) {
      const sid = String(g.studentId);
      if (!gradeMap[sid]) gradeMap[sid] = {};
      gradeMap[sid][String(g.componentId)] = (g.score === undefined || g.score === null) ? '' : g.score;
    }

    // prepare rows: studentCode, then each component name
    const header = ['studentCode', ...components.map(c => c.name)];
    const data = students.map(s => {
      const row = { studentCode: s.studentCode || '' };
      for (const comp of components) {
        row[comp.name] = gradeMap[String(s._id)] ? (gradeMap[String(s._id)][String(comp._id)] ?? '') : '';
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data, { header });
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 0 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grades');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="grades_${subjectId}_${classId}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (err) {
    console.error('exportClassGradesExcel error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};





module.exports = Object.assign(module.exports, { exportClassGradesExcel });
