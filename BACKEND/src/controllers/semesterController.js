const Semester = require('../models/semester');

const getAllSemesters = async (req, res) => {
  const semesters = await Semester.find().sort({ startDate: -1 });
  res.json({ success: true, data: semesters });
};
module.exports = { getAllSemesters };

