const ExamSchedule = require("../models/examSchedule");
const ExamScheduleOfStudent = require("../models/examScheduleOfStudent");
const ExamScheduleOfLecture = require("../models/examScheduleOfLecture");
const Student = require("../models/student");
const Lecturer = require("../models/lecturer");
const Subject = require("../models/subject");
const Room = require("../models/room");
const e = require("express");

// random helper
const randomPick = (arr, n) => {
  if (arr.length <= n) return arr;
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};
exports.getAll = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 10, sort = "-examDate" } = req.query;
    const where = {};

    if (q) {
      where.$or = [
        { courseName: { $regex: q, $options: "i" } },
        { room: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      ExamSchedule.find(where)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      ExamSchedule.countDocuments(where),
    ]);

    res.json({
      data,
      meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lịch thi:", error);
    res.status(500).json({ message: "Không thể tải danh sách lịch thi.", error: error.message });
  }
};


//  Tạo lịch thi + auto add sinh viên cùng chuyên ngành
exports.createExamSchedule = async (req, res) => {
  try {
    const { courseName, examDate, time, room, note, majorCode } = req.body;

    if (!courseName || !examDate || !time || !room)
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc." });

    const newSchedule = await ExamSchedule.create({
      courseName,
      examDate,
      time,
      room,
      note,
      createdBy: req.user.id,
    });

    // Lấy danh sách sinh viên cùng chuyên ngành
    const students = await Student.find({ major: majorCode }).select("_id");
    if (!students.length)
      return res.status(400).json({ message: "Không tìm thấy sinh viên cùng chuyên ngành." });

    // random 10 sinh viên
    const picked = randomPick(students, 10);
    const records = picked.map((s) => ({
      examSchedule: newSchedule._id,
      student: s._id,
    }));
    await ExamScheduleOfStudent.insertMany(records);

    res.status(201).json({
      message: `Tạo lịch thi thành công. Đã phân ${picked.length} sinh viên.`,
      data: newSchedule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo lịch thi", error: error.message });
  }
};

//  Gán giảng viên tự động (trước 3 ngày thi)
exports.assignLecturersForUpcomingExams = async (req, res) => {
  try {
    const now = new Date();
    const upcoming = new Date();
    upcoming.setDate(now.getDate() + 3);

    const exams = await ExamSchedule.find({
      examDate: { $gte: now, $lte: upcoming },
    });

    const lecturers = await Lecturer.find().select("_id");

    for (const exam of exams) {
      const exists = await ExamScheduleOfLecture.findOne({ examSchedule: exam._id });
      if (exists) continue;
      const randomLecturer = randomPick(lecturers, 1)[0];
      await ExamScheduleOfLecture.create({
        examSchedule: exam._id,
        lecturer: randomLecturer._id,
      });
    }

    res.json({ message: "Đã gán giảng viên cho các kỳ thi sắp tới." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không thể gán giảng viên.", error: error.message });
  }
};

// Lấy danh sách môn học (courseName)  
exports.getCourseList = async (req, res) => {
  try {
    const courses = await Subject.find({ status: true })  // Lọc theo status nếu cần
      .select("subjectName subjectCode")
      .sort({ subjectName: 1 });  // Sắp xếp theo tên môn học

    const formatted = courses.map((c) => ({
      label: `${c.subjectCode} - ${c.subjectName}`,  // Định dạng label cho Select
      value: c.subjectName,                          // Giá trị là tên môn học
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách môn học:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách môn học" });
  }
};


// Lấy danh sách phòng thi
exports.getRoomList = async (req, res) => {
  try {
    const rooms = await Room.find().select("roomCode roomName").sort({ roomName: 1 });
    const formatted = rooms.map((r) => ({
      label: r.roomName,
      value: r.roomCode,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng học" });
  }
};
// DELETE /exam-schedule/:id
exports.deleteExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await ExamScheduleOfStudent.deleteMany({ examSchedule: id });
    await ExamScheduleOfLecture.deleteMany({ examSchedule: id });
    const deleted = await ExamSchedule.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Lịch thi không tồn tại" });
    }

    res.json({ message: "Xoá lịch thi thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// PUT /exam-schedule/:id (CHỈ sửa thông tin lịch thi)
exports.updateExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, examDate, time, room, note } = req.body;

    const updated = await ExamSchedule.findByIdAndUpdate(
      id,
      { courseName, examDate, time, room, note },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Lịch thi không tồn tại" });
    }

    res.json({ message: "Cập nhật thành công", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Lấy chi tiết lịch thi (kèm sinh viên tham gia)

exports.getExamScheduleDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await ExamSchedule.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Lịch thi không tồn tại" });
    }

    const studentList = await ExamScheduleOfStudent.find({ examSchedule: id })
      .populate("student", "firstName lastName studentCode");

    res.json({
      exam,
      students: studentList.map(item => ({
        _id: item.student._id,
        studentCode: item.student.studentCode,
        name: item.student.firstName + " " + item.student.lastName // ✅ ghép tên đúng
      }))
    });

  } catch (error) {
    console.error("Lỗi khi lấy chi tiết lịch thi:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};






