const Account = require("../models/account");
const Student = require("../models/student");
const Lecturer = require("../models/lecturer");
const Staff = require("../models/staff"); // cần có model staff
const Major = require("../models/major");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const { sendWelcomeEmail } = require('../services/emailService');
const {
  makeStudentEmail,
  makeLecturerEmail,
  makeStaffEmail,
  generateInitialPassword,
} = require("../helpers/staff.helpers");

// 🧩 Lấy danh sách account theo role
exports.listAccounts = async (req, res) => {
  try {
    const { role, q = "", page = 1, limit = 10 } = req.query;
    const filter = {};

    if (role && role !== "all") filter.role = role;
    if (q)
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { personalEmail: { $regex: q, $options: "i" } },
      ];

    const skip = (page - 1) * limit;
    const total = await Account.countDocuments(filter);
    const list = await Account.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: list,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách tài khoản" });
  }
};

// 🧩 Tạo tài khoản mới (admin có thể tạo mọi loại)

exports.createAccount = async (req, res) => {
  try {
    const { name, role, personalEmail, majorCode } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!personalEmail || personalEmail === "undefined") {
      return res.status(400).json({ message: "Email cá nhân không hợp lệ." });
    }

    if (!["student", "lecture", "staff"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    // Sinh email theo role
    let email = "";
    if (role === "student") email = makeStudentEmail(personalEmail);
    if (role === "lecture") email = makeLecturerEmail(personalEmail);
    if (role === "staff") email = makeStaffEmail(personalEmail);

    const password = generateInitialPassword();
    const hash = await bcrypt.hash(password, 10);

    // Tạo tài khoản chung
    const newAcc = await Account.create({
      email,
      password: hash,
      role,
      personalEmail,
    });

    // Tạo bản ghi chi tiết tương ứng (student, lecturer, staff)
    if (role === "student") {
      await Student.create({
        studentId: email.split("@")[0],  // Gán studentId bằng email
        account: newAcc._id,
        major: majorCode,
      });
    } else if (role === "lecture") {
      await Lecturer.create({
        lecturerCode: email.split("@")[0],  // Gán lecturerCode bằng email
        account: newAcc._id,
      });
    } else if (role === "staff") {
      await Staff.create({
        staffCode: email.split("@")[0],  // Gán staffCode bằng email
        account: newAcc._id,
      });
    }

    sendWelcomeEmail(personalEmail, email, password);

    res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${role} thành công`,
      data: newAcc,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo tài khoản" });
  }
};



// 🧩 Cập nhật thông tin tài khoản
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, personalEmail, role } = req.body;
    const updated = await Account.findByIdAndUpdate(
      id,
      { status, personalEmail, role },
      { new: true }
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật tài khoản" });
  }
};

// 🧩 Xóa tài khoản
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const acc = await Account.findById(id);
    if (!acc) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    // Xóa dữ liệu chi tiết theo role
    if (acc.role === "student") await Student.deleteOne({ account: id });
    if (acc.role === "lecturer") await Lecturer.deleteOne({ account: id });
    if (acc.role === "staff") await Staff.deleteOne({ account: id });

    await Account.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Xóa tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa tài khoản" });
  }
};

// 🧩 Reset mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const password = generateInitialPassword();
    const hash = await bcrypt.hash(password, 10);
    const acc = await Account.findByIdAndUpdate(id, { password: hash }, { new: true });

    sendWelcomeEmail(acc.personalEmail, acc.email, password);
    res.status(200).json({ success: true, message: "Đã reset mật khẩu và gửi email" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi reset mật khẩu" });
  }
};


// 🧩 Chặn / Mở khóa tài khoản
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const acc = await Account.findById(id);
    if (!acc) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    acc.status = !acc.status; // đổi trạng thái
    await acc.save();

    res.status(200).json({
      success: true,
      message: acc.status ? "Đã mở khóa tài khoản" : "Đã chặn tài khoản",
      data: acc,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái tài khoản" });
  }
};
