const Class = require('../models/class');
const Lecturer = require('../models/lecturer');
const ScheduleOfStudent = require('../models/ScheduleOfStudent');
const ScheduleOfLecture = require('../models/scheduleOfLecture');
const Schedule = require('../models/schedule');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const getClasses = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const schedules = await Schedule.find({ lecturerId }).populate('classId');
    const classMap = {};
    const classes = [];
    schedules.forEach(sch => {
      if (sch.classId && !classMap[sch.classId._id]) {
        classMap[sch.classId._id] = true;
        classes.push(sch.classId);
      }
    });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    // optional scheduleId query to include attendance for that schedule
    const { scheduleId } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'classId is required' });

    // Query ScheduleOfStudent records for the class and populate student.accountId for email
    const scheduleRecords = await ScheduleOfStudent.find({ classId })
      .populate({ path: 'studentId', populate: { path: 'accountId', model: 'Account', select: 'email' } })
      .lean();

    const recordsArray = Array.isArray(scheduleRecords) ? scheduleRecords : (scheduleRecords ? [scheduleRecords] : []);

    // Helper to extract attendance entry for given scheduleId from a ScheduleOfStudent record
    const findAttendance = (sos, schId) => {
      if (!sos || !Array.isArray(sos.attendance) || !schId) return null;
      return sos.attendance.find(a => String(a.scheduleId) === String(schId)) || null;
    };

    const students = recordsArray
      .map(r => {
        const s = r.studentId;
        if (!s) return null;
        return {
          _id: s._id,
          studentCode: s.studentCode,
          studentAvatar: s.studentAvatar || null,
          firstName: s.firstName,
          lastName: s.lastName,
          phone: s.phone,
          email: s.accountId?.email || null,
          attendance: scheduleId ? findAttendance(r, scheduleId) : null
        };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('getStudentsByClass error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};



const getMyWeeklySchedule = async (req, res) => {
    // Hàm xác định thứ trong tuần từ ngày bất kỳ
    function getDayOfWeek(dateString) {
  const d = new Date(dateString);
  d.setHours(d.getHours() + 7); // Chuyển sang giờ VN
  const daysVN = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return { num: d.getDay(), name: daysVN[d.getDay()] };
    }
  try {
    console.log('DEBUG getMyWeeklySchedule: req.user =', req.user);
    const lecturer = await Lecturer.findOne({ accountId: req.user.id });
    console.log('DEBUG getMyWeeklySchedule: lecturer =', lecturer);
    if (!lecturer) {
      console.log('DEBUG getMyWeeklySchedule: Không tìm thấy giảng viên với accountId', req.user.id);
      return res.status(404).json({ message: "Không tìm thấy thông tin giảng viên." });
    }

    // Cho phép filter tuần bất kỳ qua body from/to (POST), nếu không có thì lấy tuần hiện tại
  let { from, to } = req.body;
  console.log('DEBUG getMyWeeklySchedule: from =', from, 'to =', to);
 
    let firstDay, lastDay;
    if (from && to) {
      firstDay = new Date(from);
      lastDay = new Date(to);
    } else {
      const now = new Date();
      firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Thứ 2
      lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 7)); // Chủ nhật
    }
    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);
    console.log('DEBUG getMyWeeklySchedule: firstDay =', firstDay, 'lastDay =', lastDay);

    const schedules = await Schedule.find({
      lecturerId: lecturer._id,
      date: { $gte: firstDay, $lte: lastDay }
    })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .populate('roomId', 'roomName roomCode')
      .sort({ date: 1, slot: 1 });
    console.log('DEBUG getMyWeeklySchedule: schedules.length =', schedules.length);

    // Map lại dữ liệu để trả về lecturer info (vì model Schedule không có)
    const responseData = schedules.map(s => ({
      ...s.toObject(),
      lecturer: { // Thêm thông tin giảng viên để frontend dễ tái sử dụng component
        _id: lecturer._id,
        firstName: lecturer.firstName,
        lastName: lecturer.lastName
      }
    }));
    console.log('API /lecturer/schedules/my-week trả về:', { success: true, data: responseData });
    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};





module.exports = {
  getMyWeeklySchedule,
  
  getStudentsByClass,
  getClasses,
};

// Add getScheduleById if not already present (safe to add at file end)
const getScheduleById = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId)
      .populate('subjectId', 'subjectName subjectCode')
      .populate({ path: 'classId', populate: { path: 'subjectId', model: 'Subject' } })
      .populate('roomId', 'roomName roomCode')
      .populate('lecturerId', 'firstName lastName email');

    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error getScheduleById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Attach to exports (extend existing exports object)
module.exports.getScheduleById = getScheduleById;

// Mark attendance (single or bulk)
const markAttendance = async (req, res) => {
  try {
    const payload = req.body;
    // Cho phép truyền 1 object hoặc mảng -> chuẩn hoá thành mảng items để xử lý chung
    const items = Array.isArray(payload) ? payload : [payload];

    // helper nhỏ: chuẩn hoá tên trạng thái attendance để tránh các biến thể (NotYet / Not Yet / Present...)
    const normalizeStatus = (s) => {
      if (!s) return 'Not Yet';
      const map = {
        'NotYet': 'Not Yet',
        'Not Yet': 'Not Yet',
        'Present': 'Present',
        'Absent': 'Absent',
        'Excused': 'Excused'
      };
      return map[s] || s;
    };

    // results sẽ chứa kết quả xử lý cho từng item (để frontend/để debug)
    const results = [];

    // Xử lý từng item: mỗi item cần có scheduleId và studentId
    for (const it of items) {
      const { scheduleId, studentId, status, note, date } = it || {};
      if (!scheduleId || !studentId) {
        // Nếu thiếu dữ liệu bắt buộc thì ghi lỗi cho item đó và chuyển tiếp
        results.push({ success: false, message: 'scheduleId and studentId required', item: it });
        continue;
      }

      // Lấy schedule từ DB để kiểm tra classId, date, và lecturer (nếu cần authorization sau này)
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        results.push({ success: false, message: 'Schedule not found', scheduleId });
        continue;
      }

      // Chỉ cho phép chấm điểm đúng ngày của schedule (so sánh theo YYYY-MM-DD)
      const schedDateStr = (new Date(schedule.date)).toISOString().slice(0,10);
      const attendanceDateStr = date ? (new Date(date)).toISOString().slice(0,10) : (new Date()).toISOString().slice(0,10);
      if (schedDateStr !== attendanceDateStr) {
        results.push({ success: false, message: 'Attendance allowed only on schedule date', scheduleId, expectedDate: schedDateStr, receivedDate: attendanceDateStr });
        continue;
      }

      // Tìm (hoặc tạo) record ScheduleOfStudent cho cặp classId + studentId
      // ScheduleOfStudent lưu attendance dưới dạng mảng subdocs { scheduleId, status, note }
      let sos = await ScheduleOfStudent.findOne({ classId: schedule.classId, studentId });
      if (!sos) {
        // Nếu chưa có document ScheduleOfStudent cho học sinh này trong lớp -> tạo mới
        sos = new ScheduleOfStudent({ classId: schedule.classId, studentId, attendance: [] });
      }

      // Tìm attendance entry đã tồn tại cho schedule này trong sos.attendance
      const schIdStr = String(scheduleId);
      const existing = Array.isArray(sos.attendance) ? sos.attendance.find(a => String(a.scheduleId) === schIdStr) : null;
      const normalizedStatus = normalizeStatus(status);

      if (existing) {
        // Nếu đã có entry -> cập nhật status và note (note giữ nguyên nếu không truyền mới)
        existing.status = normalizedStatus;
        existing.note = note || existing.note;
      } else {
        // Nếu chưa có entry -> push một entry mới vào mảng attendance
        sos.attendance.push({ scheduleId, status: normalizedStatus, note: note || '' });
      }

      // Lưu lại ScheduleOfStudent (upsert behavior nếu doc mới)
      await sos.save();
      // Ghi kết quả thành công cho item này
      results.push({ success: true, scheduleId, studentId });
    }

    // Sau khi xử lý xong tất cả items, kiểm tra từng schedule xem đã đầy đủ attendance cho cả lớp hay chưa
    // Nếu tất cả sinh viên trong lớp đã được đánh dấu (không còn 'Not Yet'), thì upsert flag attendance=true trong ScheduleOfLecture
    const scheduleIds = [...new Set(items.map(i => i?.scheduleId).filter(Boolean))];
    const schedulesChecked = [];
    for (const schId of scheduleIds) {
      try {
        const scheduleDoc = await Schedule.findById(schId);
        if (!scheduleDoc) continue;
        // Lấy tất cả ScheduleOfStudent cho lớp tương ứng
        const sosRecords = await ScheduleOfStudent.find({ classId: scheduleDoc.classId }).lean();
        if (!sosRecords || sosRecords.length === 0) continue; // nếu không có records thì bỏ qua

        // helper nhỏ để chuẩn hoá status thành string dễ so sánh
        const norm = (v) => {
          if (!v && v !== 0) return '';
          const s = String(v).trim().toLowerCase();
          if (s === 'notyet' || s === 'not yet' || s === 'not_yet' || s === 'noknown') return 'not yet';
          if (s === 'present') return 'present';
          if (s === 'absent') return 'absent';
          if (s === 'excused') return 'excused';
          return s;
        };

        // Nếu một ScheduleOfStudent không có entry cho schedule này -> coi như 'Not Yet'
        const anyNotYet = sosRecords.some(r => {
          const a = Array.isArray(r.attendance) ? r.attendance.find(x => String(x.scheduleId) === String(schId)) : null;
          if (!a) return true; // chưa có entry -> Not Yet
          const stNorm = norm(a.status || '');
          if (stNorm === '' || stNorm === 'not yet' || stNorm === 'notyet') return true;
          return false;
        });

        schedulesChecked.push({ scheduleId: schId, anyNotYet });
        if (!anyNotYet) {
          // Nếu không còn 'Not Yet' cho schedule này -> đánh dấu lecture-level attendance = true
          try {
            // Upsert vào ScheduleOfLecture để không sửa trực tiếp model Schedule
            await ScheduleOfLecture.findOneAndUpdate(
              { scheduleId: scheduleDoc._id, lecturerId: scheduleDoc.lecturerId },
              { attendance: true },
              { new: true, upsert: true }
            );
          } catch (err) {
            // Nếu upsert thất bại thì log để debug nhưng không phá vỡ flow
            console.error('Failed to update ScheduleOfLecture attendance flag for', schId, err);
          }
        } else {
          // Nếu còn ít nhất một học sinh chưa điểm danh -> đảm bảo lecture-level attendance = false
          // Lưu ý: ở đây ta chỉ update nếu record ScheduleOfLecture tồn tại (upsert: false)
          // để tránh tạo ra nhiều bản ghi có attendance=false không cần thiết.
          try {
            await ScheduleOfLecture.findOneAndUpdate(
              { scheduleId: scheduleDoc._id, lecturerId: scheduleDoc.lecturerId },
              { attendance: false },
              { new: true, upsert: false }
            );
          } catch (err) {
            console.error('Failed to clear ScheduleOfLecture attendance flag for', schId, err);
          }
        }
      } catch (err) {
        console.error('Error checking attendance completion for schedule', schId, err);
      }
    }

    // Trả về kết quả xử lý và thông tin diagnostic (schedulesChecked) để frontend hoặc dev kiểm tra
    return res.status(200).json({ success: true, results, schedulesChecked });
  } catch (error) {
    console.error('markAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

module.exports.markAttendance = markAttendance;

