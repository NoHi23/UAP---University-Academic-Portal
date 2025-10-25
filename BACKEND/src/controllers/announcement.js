const Announcement = require("../models/annoucement");

// 📌 Lấy danh sách thông báo
exports.listAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, q } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (q) filter.title = { $regex: q, $options: "i" };

    const total = await Announcement.countDocuments(filter);
    const data = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      meta: { total, page: Number(page), limit: Number(limit) },
      data,
    });
  } catch (error) {
    console.error("❌ Error getting announcements:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Lấy chi tiết thông báo
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ data: announcement });
  } catch (error) {
    res.status(400).json({ message: "Invalid ID", error: error.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, audience, scheduledAt, status } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: "Thiếu tiêu đề hoặc nội dung" });

    const postBy = req.user?.email || "unknown"; // lấy email staff từ token

    const announcement = await Announcement.create({
      title,
      content,
      postBy,
      audience: audience || "all",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: status || "published",
    });

    res.status(201).json({
      message: "Tạo thông báo thành công!",
      data: announcement,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo thông báo:", error);
    res.status(400).json({
      message: "Không thể tạo thông báo.",
      error: error.message,
    });
  }
};


// 📌 Cập nhật thông báo
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy thông báo." });
    res.status(200).json({ message: "Cập nhật thành công!", data: updated });
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi cập nhật.", error: error.message });
  }
};

// 📌 Xóa thông báo
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy thông báo." });
    res.status(200).json({ message: "Xóa thông báo thành công!" });
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi xóa thông báo.", error: error.message });
  }
};
