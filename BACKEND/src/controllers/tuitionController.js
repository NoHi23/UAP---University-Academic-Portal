const TuitionConfig = require('../models/tuitionConfigModel');
const TuitionBatch = require('../models/tuitionBatchModel');
const TuitionFee = require('../models/tuitionFeeModel');
const Student = require('../models/student');
const Major = require('../models/major');
const Semester = require('../models/semester');
const Account = require('../models/account');
const { sendPaymentNotificationEmail, sendTuitionReminderEmail } = require('../services/emailService');

/*
 * ===========================================
 * 1. QUẢN LÝ BẢNG GIÁ (Tuition Config)
 * ===========================================
 */
const createTuitionConfig = async (req, res) => {
  try {
    const { majorId, semesterNo, baseAmount } = req.body;
    if (!majorId || !semesterNo || !baseAmount) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đủ majorId, semesterNo, và baseAmount.' });
    }
    const newConfig = await TuitionConfig.create({ majorId, semesterNo, baseAmount });
    res.status(201).json({ success: true, data: newConfig });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Lỗi: Cấu hình cho Chuyên ngành & Kỳ này đã tồn tại.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

const getTuitionConfigs = async (req, res) => {
  try {
    const configs = await TuitionConfig.find()
      .populate('majorId', 'majorName majorCode')
      .sort({ majorId: 1, semesterNo: 1 });
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

const updateTuitionConfig = async (req, res) => {
  try {
    const { baseAmount } = req.body;
    const config = await TuitionConfig.findByIdAndUpdate(
      req.params.id,
      { baseAmount },
      { new: true, runValidators: true }
    );
    if (!config) return res.status(404).json({ message: 'Không tìm thấy cấu hình.' });
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

const deleteTuitionConfig = async (req, res) => {
  try {
    const config = await TuitionConfig.findByIdAndDelete(req.params.id);
    if (!config) return res.status(404).json({ message: 'Không tìm thấy cấu hình.' });
    res.status(200).json({ success: true, message: 'Xóa cấu hình thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/*
 * ===========================================
 * 2. TẠO KHOẢN THU HÀNG LOẠT (Batch)
 * ===========================================
 */
const generateFees = async (req, res) => {
  try {
    const { semesterId, majorId, semesterNo, payableFrom, deadline } = req.body;
    const staffAccountId = req.user.id;

    const config = await TuitionConfig.findOne({ majorId, semesterNo });
    if (!config) {
      return res.status(404).json({ message: 'Chưa cấu hình mức thu cho Chuyên ngành & Kỳ này.' });
    }

    // --- SỬA LỖI 3: Populate email và tên ---
    const students = await Student.find({ majorId, semesterNo })
      .select('accountId firstName lastName')
      .populate('accountId', 'email'); // Lấy email từ Account

    if (students.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên nào khớp (Ngành/Kỳ).' });
    }

    const studentIds = students.map(s => s._id);

    let batch;
    try {
      batch = await TuitionBatch.create({
        semesterId, majorId, semesterNo, payableFrom, deadline,
        generatedBy: staffAccountId,
        studentCount: students.length,
        totalAmountGenerated: students.length * config.baseAmount
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Lỗi: Khoản thu cho (Kỳ + Ngành + Kỳ số) này đã được tạo trước đó.' });
      }
      throw error;
    }

    const feeRecords = studentIds.map(studentId => ({
      studentId: studentId,
      semesterId: semesterId,
      majorId: majorId,
      batchId: batch._id,
      amount: config.baseAmount,
      payableFrom: payableFrom,
      deadline: deadline,
      status: 'unpaid'
    }));

    await TuitionFee.insertMany(feeRecords);

    const semester = await Semester.findById(semesterId).select('semesterName');
    (async () => {
      for (const student of students) {
        if (student.accountId && student.accountId.email) {
          try {
            await sendPaymentNotificationEmail({
              to: student.accountId.email,
              studentName: `${student.lastName} ${student.firstName}`,
              semesterName: semester.semesterName,
              amount: config.baseAmount,
              deadline: deadline
            });
          } catch (emailError) {
            console.error(`Lỗi gửi mail thông báo cho ${student.accountId.email}:`, emailError);
          }
        }
      }
    })();

    res.status(201).json({ message: `Tạo khoản thu thành công cho ${students.length} sinh viên.` });

  } catch (error) {
    console.error("Lỗi khi tạo khoản thu:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const getGeneratedBatches = async (req, res) => {
  try {
    const batches = await TuitionBatch.find().lean();
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const getTuitionFees = async (req, res) => {
  try {
    const { semesterId, majorId, status } = req.query;
    let filter = {};
    if (semesterId) filter.semesterId = semesterId;
    if (majorId) filter.majorId = majorId;
    if (status) filter.status = status;
    const fees = await TuitionFee.find(filter)
      .populate({
        path: 'studentId',
        select: 'studentCode firstName lastName accountId',
        populate: { path: 'accountId', select: 'email' }
      })
      .populate('semesterId', 'semesterName')
      .populate('majorId', 'majorName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

const sendReminder = async (req, res) => {
  try {
    const { feeId, message } = req.body;
    // --- SỬA LỖI 4: Lấy thêm Tên (firstName, lastName) ---
    const fee = await TuitionFee.findById(feeId)
      .populate({
        path: 'studentId',
        select: 'accountId firstName lastName', // <-- Thêm firstName lastName
        populate: { path: 'accountId', select: 'email' }
      })
      .populate('semesterId', 'semesterName');

    if (!fee) return res.status(404).json({ message: 'Không tìm thấy khoản phí.' });
    if (!fee.studentId || !fee.studentId.accountId) return res.status(404).json({ message: 'Không tìm thấy tài khoản sinh viên.' });

    const studentEmail = fee.studentId.accountId.email;
    const studentName = `${fee.studentId.lastName} ${fee.studentId.firstName}`; // <-- Giờ đã có tên

    await sendTuitionReminderEmail({
      to: studentEmail,
      studentName: studentName,
      semesterName: fee.semesterId.semesterName,
      amount: fee.amount,
      deadline: fee.deadline,
      customMessage: message
    });

    fee.reminderHistory.push({ message: message || "Gửi nhắc nhở tự động." });
    await fee.save();

    res.status(200).json({ success: true, message: `Đã gửi nhắc nhở tới ${studentEmail}` });
  } catch (error) {
    console.error("Lỗi khi gửi nhắc nhở:", error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

const toggleClassVisibility = async (req, res) => {
  try {
    const { feeId, isClassHidden } = req.body;
    const fee = await TuitionFee.findByIdAndUpdate(
      feeId,
      { isClassHidden: isClassHidden },
      { new: true }
    );
    if (!fee) return res.status(404).json({ message: 'Không tìm thấy khoản phí.' });
    const actionText = isClassHidden ? "ẩn" : "hiện";
    res.status(200).json({ success: true, message: `Đã ${actionText} lịch học của sinh viên.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * @desc    Gửi email nhắc nhở HÀNG LOẠT (THEO BỘ LỌC)
 * @route   POST /api/staff/tuition/bulk-remind-by-filter
 */
const sendBulkReminderByFilter = async (req, res) => {
  try {
    const { semesterId, majorId, status, message } = req.body;

    let filter = {};
    if (semesterId) filter.semesterId = semesterId;
    if (majorId) filter.majorId = majorId;
    if (status) filter.status = status;
    else filter.status = { $ne: 'paid' };

    const fees = await TuitionFee.find(filter)
      .populate({
        path: 'studentId',
        select: 'accountId firstName lastName',
        populate: { path: 'accountId', select: 'email' }
      })
      .populate('semesterId', 'semesterName');

    if (fees.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên nào khớp với bộ lọc.' });
    }

    let successCount = 0;
    let failCount = 0;

    (async () => {
      for (const fee of fees) {
        try {
          if (!fee.studentId || !fee.studentId.accountId || !fee.studentId.accountId.email) {
            throw new Error('Thiếu thông tin email sinh viên.');
          }
          const studentEmail = fee.studentId.accountId.email;
          const studentName = `${fee.studentId.lastName} ${fee.studentId.firstName}`;
          await sendTuitionReminderEmail({
            to: studentEmail,
            studentName: studentName,
            semesterName: fee.semesterId.semesterName,
            amount: fee.amount,
            deadline: fee.deadline,
            customMessage: message
          });

          fee.reminderHistory.push({ message: message || "Gửi nhắc nhở hàng loạt (theo bộ lọc)." });
          await fee.save();
          successCount++;
        } catch (emailError) {
          console.error(`Lỗi gửi mail nhắc nhở hàng loạt cho ${fee.studentId?._id}:`, emailError);
          failCount++;
        }
      }
      console.log(`[Email Batch Reminder] Gửi ${successCount} thành công, ${failCount} thất bại.`);
    })();

    res.status(200).json({
      success: true,
      message: `Đang gửi ${fees.length} email nhắc nhở (thông báo) ...`
    });

  } catch (error) {
    console.error("Lỗi khi gửi nhắc nhở hàng loạt:", error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

/**
 * @desc    Ẩn/Hiện lịch học HÀNG LOẠT (THEO BỘ LỌC)
 * @route   POST /api/staff/tuition/bulk-toggle-visibility-by-filter
 */
const bulkToggleClassVisibilityByFilter = async (req, res) => {
  try {
    const { semesterId, majorId, status, isClassHidden } = req.body;
    if (isClassHidden === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái (isClassHidden: true/false).' });
    }

    let filter = {};
    if (semesterId) filter.semesterId = semesterId;
    if (majorId) filter.majorId = majorId;
    if (status) filter.status = status;
    else filter.status = { $ne: 'paid' };

    const result = await TuitionFee.updateMany(
      filter,
      { isClassHidden: isClassHidden }
    );

    const actionText = isClassHidden ? "ẩn" : "hiện";
    res.status(200).json({
      success: true,
      message: `Đã ${actionText} lịch học cho ${result.modifiedCount} sinh viên (theo bộ lọc).`
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lịch hàng loạt:", error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  createTuitionConfig,
  getTuitionConfigs,
  updateTuitionConfig,
  deleteTuitionConfig,
  generateFees,
  getGeneratedBatches,
  getTuitionFees,
  sendReminder,
  toggleClassVisibility,
  sendBulkReminderByFilter,
  bulkToggleClassVisibilityByFilter
};