const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    // Tiêu đề thông báo
    title: { type: String, required: true },

    // Nội dung thông báo (dạng HTML từ Jodit)
    content: { type: String, required: true },

    // Người đăng (email hoặc _id của staff)
    postBy: { type: String, required: true },

    // Ảnh minh họa (tuỳ chọn)
    picture: { type: String, default: null },

    // Đối tượng nhận thông báo
    audience: {
      type: String,
      enum: ["all", "student", "lecturer", "staff"],
      default: "all",
    },

    // Trạng thái đăng bài
    status: {
      type: String,
      enum: ["published", "scheduled", "draft"],
      default: "published",
    },

    // Lên lịch đăng (nếu có)
    scheduledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
