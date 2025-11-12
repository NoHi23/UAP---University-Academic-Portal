const Staff = require('../models/staff');

// GET /api/staff/profile
exports.getProfile = async (req, res) => {
  try {
    // Lấy nhân sự dựa trên accountId trong token
    const staff = await Staff.findOne({ accountId: req.user.id }).populate('accountId', 'email role');

    // Nếu không tìm thấy
    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy thông tin nhân sự." });
    }

    // Trả nguyên document (kể cả field undefined)
    res.json(staff);
  } catch (error) {
    console.error('Lỗi getProfile:', error);
    res.status(500).json({ message: error.message });
  }
};


// PUT /api/staff/profile
exports.updateProfile = async (req, res) => {
  try {
    const staff = await Staff.findOne({ accountId: req.user.id });
    if (!staff) return res.status(404).json({ message: "Không tìm thấy nhân sự." });

    // Lấy dữ liệu gửi lên
    const updates = req.body;

    // Cập nhật linh hoạt — có gì update nấy
    const updatedStaff = await Staff.findOneAndUpdate(
      { accountId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('accountId', 'email role');

    res.json({
      message: "Cập nhật thành công",
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({ message: error.message });
  }
};
