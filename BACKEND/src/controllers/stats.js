// controllers/stats.js
const Student = require('../models/student');
const Lecturer = require('../models/lecturer'); // nếu có model riêng
const Account = require('../models/account');   // dùng để đếm theo role nếu cần
const Staff = require('../models/staff');

exports.getDashboardStats = async (req, res) => {
  try {
    // NOTE: chỉnh query nếu schema của bạn khác
    // Tổng số sinh viên: đếm collection students
    const totalStudents = await Student.countDocuments({});

    // Tổng số giảng viên: nếu bạn có model Lecturer thì dùng Lecturer.countDocuments()
    // nếu bạn lưu giảng viên dưới accounts với role: 'lecturer' thì dùng Account.countDocuments({ role: 'lecturer', status: true })
    let totalLecturers = 0;
    if (typeof Lecturer !== 'undefined' && Lecturer.countDocuments) {
      try { totalLecturers = await Lecturer.countDocuments({}); } catch(e) { totalLecturers = 0; }
    }
    if (!totalLecturers) {
      // fallback: count accounts with role lecturer
      totalLecturers = await Account.countDocuments({ role: 'lecturer', status: true });
    }

    // Pending approvals: tùy business logic:
    // ví dụ: accounts chưa active (status: false) hoặc lecturer requests with status pending
    // Mặc định mình kiểm tra accounts.status === false (chưa kích hoạt / chờ duyệt)
    const pendingApprovals = await Account.countDocuments({ status: false });

    // Bạn có thể mở rộng thêm:
    // const totalStaff = await Staff.countDocuments({ status: true });

    return res.json({
      totalStudents,
      totalLecturers,
      pendingApprovals
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ message: error.message });
  }
};
