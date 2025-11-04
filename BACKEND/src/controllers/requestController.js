const Request = require('../models/requestModel');
const Student = require('../models/student');
const RequestNotification = require('../models/requestNotificationModel');
const Account = require('../models/account');

const submitRequest = async (req, res) => {
  try {
    const student = await Student.findOne({ accountId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin sinh viên.' });
    }

    const { requestType, title, description } = req.body;

    const newRequest = await Request.create({
      studentId: student._id,
      requestType,
      title,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu thành công.',
      data: newRequest
    });

  } catch (error) {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ accountId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin sinh viên.' });
    }

    const requests = await Request.find({ studentId: student._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

const getAllRequests = async (req, res) => {
  try {
    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const requests = await Request.find(query)
      .populate('studentId', 'studentCode firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { status, response } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: `Không tìm thấy yêu cầu với ID ${req.params.id}` });
    }

    request.status = status || request.status;
    request.response = response || request.response;
    request.handlerId = req.user.id;

    const updatedRequest = await request.save();

    // Create a request notification for the student so they see the staff response
    try {
      const student = await Student.findById(request.studentId);
      if (student) {
        const sender = await Account.findById(req.user.id).select('email role');
        const title = `Phản hồi: ${request.title}`;
        const content = response || `Yêu cầu của bạn đã được cập nhật: ${status}`;
        await RequestNotification.create({
          requestId: request._id,
          studentId: student._id,
          senderId: req.user.id,
          title,
          content
        });
      }
    } catch (notifErr) {
      // Log and continue - do not fail the main request update if notification creation fails
      console.error('Failed to create request notification:', notifErr.message || notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật yêu cầu thành công.',
      data: updatedRequest
    });

  } catch (error) {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};
module.exports = {
  submitRequest,
  getMyRequests,
  getAllRequests,
  updateRequest
};