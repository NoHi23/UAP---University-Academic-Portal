const AbsenceRequest = require("../models/absenceRequest");
const Semester = require("../models/semester");
const Student = require("../models/student");

// --- Sinh viên gửi đơn ---
exports.submitAbsenceRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });

    if (req.user.role !== "student")
      return res.status(403).json({ message: "Chỉ sinh viên mới có thể gửi đơn." });

    const { semesterId, reason, attachments } = req.body;
    if (!semesterId || !reason)
      return res.status(400).json({ message: "Thiếu thông tin kỳ học hoặc lý do." });

    const semester = await Semester.findById(semesterId);
    if (!semester)
      return res.status(400).json({ message: "Kỳ học không tồn tại hoặc không hợp lệ." });

    const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin sinh viên.' });
        }
    const doc = await AbsenceRequest.create({
      studentId: req.user.id,
      semesterId,
      reason,
      attachments,
    });

    res.status(201).json({ message: "Gửi đơn xin nghỉ học thành công.", data: doc });
  } catch (error) {
    console.error("❌ Lỗi khi tạo đơn xin nghỉ:", error);
    res.status(500).json({ message: "Lỗi khi gửi đơn.", error: error.message });
  }
};

// --- Sinh viên xem danh sách của mình ---
exports.getMyAbsenceRequests = async (req, res) => {
  try {
    const list = await AbsenceRequest.find({ studentId: req.user.id })
      .populate('studentId', 'studentCode firstName lastName')
      .populate("semesterId", "semesterName startDate endDate")
      .sort("-createdAt");
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// --- Staff/Admin lấy toàn bộ đơn (lọc + phân trang) ---
exports.getAllAbsences = async (req, res) => {
  try {
    const {
      status = "",
      q = "",
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (q) {
      where.$or = [
        { reason: { $regex: q, $options: "i" } },
        { slotId: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AbsenceRequest.find(where)
        .populate("studentId", "firstName lastName studentCode")
        .populate("semesterId", "semesterName startDate endDate")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      AbsenceRequest.countDocuments(where),
    ]);

    res.json({
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đơn:", error);
    res.status(500).json({ message: "Lỗi khi tải danh sách đơn.", error: error.message });
  }
};

// --- Staff duyệt hoặc từ chối ---
exports.reviewAbsenceRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["approved", "rejected"];
    if (!valid.includes(status))
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });

    const reqDoc = await AbsenceRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: "Không tìm thấy đơn." });

    reqDoc.status = status;
    reqDoc.reviewedBy = req.user.id;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();

    res.json({ message: `Đơn đã được ${status === "approved" ? "duyệt" : "từ chối"}.` });
  } catch (error) {
    console.error("❌ Lỗi khi duyệt đơn:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- Lấy chi tiết 1 đơn ---
exports.getAbsenceById = async (req, res) => {
  try {
    const doc = await AbsenceRequest.findById(req.params.id)
      .populate("studentId", "firstName lastName studentCode");
    if (!doc) return res.status(404).json({ message: "Không tìm thấy đơn." });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Lấy danh sách kỳ học ---
exports.getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ status: true })
      .select("semesterName startDate endDate")
      .sort("startDate");
    res.json(semesters);
  } catch (error) {
    console.error("Lỗi khi tải danh sách kỳ học:", error);
    res.status(500).json({ message: "Không thể tải danh sách kỳ học.", error: error.message });
  }
};

