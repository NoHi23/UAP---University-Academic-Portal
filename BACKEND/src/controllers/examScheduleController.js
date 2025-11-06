const ExamSchedule = require("../models/examSchedule");
const ExamScheduleOfStudent = require("../models/examScheduleOfStudent");
const ExamScheduleOfLecture = require("../models/examScheduleOfLecture");
const Student = require("../models/student");
const Lecturer = require("../models/lecturer");
const Subject = require("../models/subject");
const Room = require("../models/room");

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

exports.getStudentsByExamSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const students = await ExamScheduleOfStudent.find({ examSchedule: id })
      .populate("student", "name email") // Lấy thông tin sinh viên
      .populate("examSchedule", "courseName examDate time room"); // Thông tin lịch thi
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không thể lấy thông tin sinh viên tham gia lịch thi." });
  }
};

