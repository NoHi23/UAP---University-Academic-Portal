const Account = require("../models/account");
const Student = require("../models/student");
const Lecturer = require("../models/lecturer");
const Staff = require("../models/staff");
const bcrypt = require("bcryptjs");

// ✅ Hàm tự tạo password
const generateInitialPassword = () => {
  return Math.random().toString(36).slice(-8);
};

// ✅ Hàm tạo email hệ thống theo role
const makeEmail = (personalEmail, role) => {
  const username = personalEmail.split("@")[0]
    .normalize("NFD")                    // Bỏ dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")        // Xóa ký tự đặc biệt
    .toLowerCase();

  return `${username}@${role}.edu.vn`;
};



// 🧩 Lấy danh sách account
exports.listAccounts = async (req, res) => {
  try {
    const { role, q = "", page = 1, limit = 10 } = req.query;
    const filter = {};

    if (role && role !== "all") filter.role = role;
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { personalEmail: { $regex: q, $options: "i" } },
      ];
    }

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

// 🧩 Tạo tài khoản mới
exports.createAccount = async (req, res) => {
  try {
    const { role, personalEmail } = req.body;

    if (!personalEmail || personalEmail === "undefined") {
      return res.status(400).json({ message: "Email cá nhân không hợp lệ." });
    }

    if (!["student", "lecturer", "staff"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ (student | lecturer | staff)" });
    }

    const email = makeEmail(personalEmail, role);
    const password = generateInitialPassword();
    const hash = await bcrypt.hash(password, 10);

    const existAccount = await Account.findOne({ email });
    if (existAccount) {
      return res.status(400).json({
        success: false,
        message: "Email hệ thống đã tồn tại, vui lòng dùng email cá nhân khác hoặc xóa tài khoản cũ trước khi tạo.",
      });
    }
    // Tạo tài khoản Account
    const newAcc = await Account.create({
      email,
      password: hash,
      role,
      personalEmail,
    });

    // Tạo bảng chi tiết theo role ✅ (đúng field theo model bạn đang có)
    if (role === "student") {
      await Student.create({
        studentCode: email.split("@")[0].toUpperCase(),
        firstName: "Unknown",
        lastName: "User",
        citizenID: 0,
        gender: true,
        phone: "0000000000",
        address: "Unknown",
        dateOfBirth: new Date(),
        semester: "N/A",
        semesterNo: 1,
        curriculumId: null,
        accountId: newAcc._id,
        majorId: null,
      });
    }

    if (role === "lecturer") {
      await Lecturer.create({
        lecturerCode: email.split("@")[0].toUpperCase(),
        accountId: newAcc._id,
      });
    }

    if (role === "staff") {
      await Staff.create({
        staffCode: email.split("@")[0].toUpperCase(),
        accountId: newAcc._id,

        firstName: req.body.firstName || "Unknown",
        lastName: req.body.lastName || "Staff",
        phone: req.body.phone || "0000000000",
      });
    }


    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${role} thành công`,
      data: newAcc,
      defaultPassword: password, // trả về để test, sau này có thể ẩn đi
    });

  } catch (error) {
    console.error("🔥 Lỗi createAccount:", error);
    return res.status(500).json({ message: "Lỗi khi tạo tài khoản", error: error.message });
  }
};

// 🧩 Cập nhật account
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

    if (acc.role === "student") await Student.deleteOne({ accountId: id });
    if (acc.role === "lecturer") await Lecturer.deleteOne({ accountId: id });
    if (acc.role === "staff") await Staff.deleteOne({ accountId: id });

    await Account.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Xóa tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa tài khoản" });
  }
};

// 🧩 Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const password = generateInitialPassword();
    const hash = await bcrypt.hash(password, 10);

    const acc = await Account.findByIdAndUpdate(id, { password: hash }, { new: true });

    return res.status(200).json({
      success: true,
      message: "Reset mật khẩu thành công",
      newPassword: password, // phù hợp khi test
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi khi reset mật khẩu" });
  }
};

// 🧩 Chặn / Mở khóa
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const acc = await Account.findById(id);
    if (!acc) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    
    if (acc.role === "admin") {
      return res.status(403).json({ message: "Không thể khóa tài khoản admin!" });
    }

    acc.status = !acc.status;
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

