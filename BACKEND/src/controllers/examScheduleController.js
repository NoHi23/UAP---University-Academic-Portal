const ExamSchedule = require("../models/examSchedule");
const ExamScheduleOfStudent = require("../models/examScheduleOfStudent");
const ExamScheduleOfLecture = require("../models/examScheduleOfLecture");
const Student = require("../models/student");
const Lecturer = require("../models/lecturer");
const Subject = require("../models/subject");
const Room = require("../models/room");
const e = require("express");
const Curriculum = require("../models/curriculum");
const CurriculumDetail = require("../models/curriculumDetail");

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
    const { subjectId, examDate, time, room, note } = req.body;

    // 1️⃣ Kiểm tra môn học tồn tại
    const subject = await Subject.findById(subjectId).populate("majorId");
    if (!subject)
      return res.status(404).json({ message: "Không tìm thấy môn học." });

    const majorId = subject.majorId._id;

    // 2️⃣ Kiểm tra trùng phòng + thời gian
    const existed = await ExamSchedule.findOne({ room, examDate, time });
    if (existed) {
      return res.status(400).json({
        message: "Phòng này đã có lịch thi vào thời điểm đó. Vui lòng chọn phòng hoặc thời gian khác.",
      });
    }

    // 3️⃣ Kiểm tra xem ngày thi có phải trong quá khứ không
    const currentDate = new Date();
    const selectedExamDate = new Date(examDate);
    if (selectedExamDate < currentDate) {
      return res.status(400).json({
        message: "Ngày thi không thể là ngày trong quá khứ. Vui lòng chọn ngày khác.",
      });
    }

    // 4️⃣ Lấy chương trình đào tạo theo ngành
    const curriculums = await Curriculum.find({ majorId });
    const curriculumIds = curriculums.map((c) => c._id);

    // 5️⃣ Xác định chương trình nào có môn học này
    const validCurriculumIds = await CurriculumDetail.distinct("curriculumId", {
      subjectId,
      curriculumId: { $in: curriculumIds },
    });

    // 6️⃣ Tìm sinh viên cùng ngành và học môn này
    const eligibleStudents = await Student.find({
      majorId,
      curriculumId: { $in: validCurriculumIds },
    });

    if (!eligibleStudents.length) {
      return res.status(400).json({
        message: "Không tìm thấy sinh viên đủ điều kiện thi môn học này.",
      });
    }

    // 7️⃣ Random 10 sinh viên hợp lệ
    const selectedStudents = randomPick(eligibleStudents, 10);

    // 8️⃣ Tạo lịch thi mới (thêm courseName để tránh lỗi required)
    const examSchedule = await ExamSchedule.create({
      subjectId,
      majorId,
      courseName: subject.subjectName,
      examDate,
      time,
      room,
      note,
    });

    // 9️⃣ Gán sinh viên vào lịch thi (đúng field `student`)
    const studentDocs = selectedStudents.map((sv) => ({
      student: sv._id,
      examSchedule: examSchedule._id,
    }));
    await ExamScheduleOfStudent.insertMany(studentDocs);

    res.json({
      message: `Đã tạo lịch thi và gán ${selectedStudents.length} sinh viên hợp lệ.`,
      examSchedule,
    });
  } catch (error) {
    console.error("Lỗi khi tạo lịch thi:", error);
    res.status(500).json({ message: error.message });
  }
};


// 🧩 GÁN GIẢNG VIÊN TỰ ĐỘNG
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
      const exists = await ExamScheduleOfLecture.findOne({
        examSchedule: exam._id,
      });
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

// 🧩 LẤY DANH SÁCH MÔN HỌC
exports.getCourseList = async (req, res) => {
  try {
    const courses = await Subject.find({ status: true })
      .select("subjectName subjectCode")
      .sort({ subjectName: 1 });

    const formatted = courses.map((c) => ({
      label: `${c.subjectCode} - ${c.subjectName}`,
      value: c._id,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách môn học:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách môn học" });
  }
};

// 🧩 LẤY DANH SÁCH PHÒNG THI
exports.getRoomList = async (req, res) => {
  try {
    const rooms = await Room.find()
      .select("roomCode roomName")
      .sort({ roomName: 1 });
    const formatted = rooms.map((r) => ({
      label: r.roomName,
      value: r.roomCode,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng học" });
  }
};

// 🧩 XÓA LỊCH THI
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

// 🧩 CẬP NHẬT LỊCH THI
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

// 🧩 LẤY CHI TIẾT LỊCH THI (kèm sinh viên)
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
      students: studentList.map((item) => ({
        _id: item.student._id,
        studentCode: item.student.studentCode,
        name: `${item.student.firstName} ${item.student.lastName}`,
      })),
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết lịch thi:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};