// src/controllers/majorController.js
const Major = require("../models/major");

/**
 * GET /api/major
 * Query: q, page, limit, sort
 */
exports.listMajors = async (req, res) => {
  try {
    const {
      q = "",
      page = 1,
      limit = 10,
      sort = "-createdAt",
      status
    } = req.query;

    const where = {};
    if (q) {
      where.$or = [
        { majorCode: { $regex: q, $options: "i" } },
        { majorName: { $regex: q, $options: "i" } },
      ];
    }
    if (typeof status !== "undefined" && status !== "") {
      where.status = status === "true" || status === true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Major.find(where)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Major.countDocuments(where),
    ]);

    res.json({
      data,
      meta: {
        page: +page,
        limit: +limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listMajors error:", err);
    res.status(500).json({ message: "Không thể tải danh sách chuyên ngành." });
  }
};

/**
 * POST /api/major
 */
exports.createMajor = async (req, res) => {
  try {
    const { majorCode, majorName, description, status } = req.body;

    if (!majorCode || !majorName) {
      return res.status(400).json({ message: "Vui lòng nhập mã và tên chuyên ngành." });
    }

    const existed = await Major.findOne({ majorCode });
    if (existed) {
      return res.status(400).json({ message: "Mã chuyên ngành đã tồn tại." });
    }

    const major = await Major.create({
      majorCode,
      majorName,
      description: description || "",
      status: typeof status === "boolean" ? status : true,
    });

    res.json({ message: "Tạo chuyên ngành thành công.", data: major });
  } catch (err) {
    console.error("createMajor error:", err);
    res.status(500).json({ message: "Không thể tạo chuyên ngành." });
  }
};

/**
 * PUT /api/major/:id
 */
exports.updateMajor = async (req, res) => {
  try {
    const { id } = req.params;
    const { majorCode, majorName, description, status } = req.body;

    const existedCode = await Major.findOne({ majorCode, _id: { $ne: id } });
    if (existedCode) {
      return res.status(400).json({ message: "Mã chuyên ngành đã tồn tại." });
    }

    const updated = await Major.findByIdAndUpdate(
      id,
      {
        ...(majorCode ? { majorCode } : {}),
        ...(majorName ? { majorName } : {}),
        ...(typeof description !== "undefined" ? { description } : {}),
        ...(typeof status !== "undefined" ? { status } : {}),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Không tìm thấy chuyên ngành." });
    res.json({ message: "Cập nhật thành công.", data: updated });
  } catch (err) {
    console.error("updateMajor error:", err);
    res.status(500).json({ message: "Không thể cập nhật chuyên ngành." });
  }
};

/**
 * DELETE /api/major/:id
 */
exports.deleteMajor = async (req, res) => {
  try {
    const { id } = req.params;
    const del = await Major.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: "Không tìm thấy chuyên ngành." });
    res.json({ message: "Xoá chuyên ngành thành công." });
  } catch (err) {
    console.error("deleteMajor error:", err);
    res.status(500).json({ message: "Không thể xoá chuyên ngành." });
  }
};

/**
 * PATCH /api/major/:id/toggle
 * Bật/tắt status
 */
exports.toggleMajorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const major = await Major.findById(id);
    if (!major) return res.status(404).json({ message: "Không tìm thấy chuyên ngành." });

    major.status = !major.status;
    await major.save();

    res.json({ message: "Đã cập nhật trạng thái.", data: major });
  } catch (err) {
    console.error("toggleMajorStatus error:", err);
    res.status(500).json({ message: "Không thể cập nhật trạng thái." });
  }
};
