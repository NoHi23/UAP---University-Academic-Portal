const GradeComponent = require('../models/gradeComponent');
const XLSX = require('xlsx');

// Bulk import grade components for a subject
// Expects req.body = array of { name, weightPercentage, dropLowest, reLearnTime, description, gradingGuide }
// subjectId is taken from req.query.subjectId or req.body.subjectId (prefer query)
const bulkCreateGradeComponents = async (req, res) => {
  try {
    const subjectId = req.query.subjectId || req.body.subjectId;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });
    const rows = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, message: 'Payload must be a non-empty array' });
    const MAX_ROWS = 200;
    if (rows.length > MAX_ROWS) return res.status(400).json({ success: false, message: `Too many rows. Max allowed is ${MAX_ROWS}` });
    const docs = [];
    const errors = [];
    rows.forEach((row, idx) => {
      const rowErrors = [];
      if (!row || typeof row !== 'object') rowErrors.push('Row must be an object');
      if (!row.name || !String(row.name).trim()) rowErrors.push('name is required');
      if (row.weightPercentage === undefined || row.weightPercentage === null || isNaN(Number(row.weightPercentage))) rowErrors.push('weightPercentage is required');
      // dropLowest, reLearnTime, description, gradingGuide are optional
      if (rowErrors.length) errors.push({ index: idx, errors: rowErrors, row });
      else docs.push({
        name: String(row.name).trim(),
        weightPercentage: Number(row.weightPercentage),
        dropLowest: row.dropLowest || '',
        reLearnTime: row.reLearnTime ? Number(row.reLearnTime) : 0,
        description: row.description || '',
        gradingGuide: row.gradingGuide || '',
        subjectId
      });
    });
    if (docs.length > 0) {
      // Remove all old grade components for this subject (replace mode)
      await GradeComponent.deleteMany({ subjectId });
      await GradeComponent.insertMany(docs, { ordered: false });
    }
    return res.status(201).json({ success: true, insertedCount: docs.length, errors });
  } catch (err) {
    console.error('bulkCreateGradeComponents error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Export grade components for a subject as Excel
const exportGradeComponentsExcel = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });
    const items = await GradeComponent.find({ subjectId });
    const data = items.map(item => ({
      'Name': item.name,
      'WeightPercentage': item.weightPercentage,
      'DropLowest': item.dropLowest,
      'ReLearnTime': item.reLearnTime,
      'Description': item.description,
      'GradingGuide': item.gradingGuide
    }));
    const header = ['Name','WeightPercentage','DropLowest','ReLearnTime','Description','GradingGuide'];
    const ws = XLSX.utils.json_to_sheet(data, { header });
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 0 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GradeComponents');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="grade_components.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('exportGradeComponentsExcel error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { bulkCreateGradeComponents, exportGradeComponentsExcel };

// List grade components for a subject
const getGradeComponents = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });
    const items = await GradeComponent.find({ subjectId }).sort({ weightPercentage: -1, name: 1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('getGradeComponents error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { bulkCreateGradeComponents, exportGradeComponentsExcel, getGradeComponents };
