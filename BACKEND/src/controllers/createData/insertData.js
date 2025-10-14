const Schedule = require('../../models/schedule');
const Semester = require('../../models/semester');
const Subject = require('../../models/subject');
const Class = require('../../models/class');
const Time = require('../../models/time');
const Week = require('../../models/week');
const Room = require('../../models/room');
const Lecturer = require('../../models/lecturer');
const Year = require('../../models/year');
// Create new semester
const createSemester = async (req, res) => {
  try {
    const semester = new Semester({
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      year: req.body.year,
      isActive: req.body.isActive || true
    });

    await semester.save();
    res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      data: semester
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating semester',
      error: error.message
    });
  }
};

// Create new subject
const createSubject = async (req, res) => {
  try {
    const subject = new Subject({
      subjectCode: req.body.subjectCode,
      subjectName: req.body.subjectName,
      credits: req.body.credits,
      description: req.body.description,
      prerequisites: req.body.prerequisites || []
    });

    await subject.save();
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating subject',
      error: error.message
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const classData = new Class({
      className: req.body.className,
      majorId: req.body.majorId,
      year: req.body.year,
      semester: req.body.semester,
      maxStudents: req.body.maxStudents || 30
    });

    await classData.save();
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating class',
      error: error.message
    });
  }
};

// Create new time slot
const createTimeSlot = async (req, res) => {
  try {
    const timeSlot = new Time({
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      slot: req.body.slot,
    });

    await timeSlot.save();
    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: timeSlot
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating time slot',
      error: error.message
    });
  }
};

// Create new week
const createWeek = async (req, res) => {
  try {
    const week = new Week({
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      
    });

    await week.save();
    res.status(201).json({
      success: true,
      message: 'Week created successfully',
      data: week
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating week',
      error: error.message
    });
  }
};

// Create new room
const createRoom = async (req, res) => {
  try {
    const room = new Room({
      roomCode: req.body.roomCode,
      roomName: req.body.roomName,
    });

    await room.save();
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating room',
      error: error.message
    });
  }
};

// Create new lecturer
const createLecturer = async (req, res) => {
  try {
    const lecturer = new Lecturer({
      lecturerCode: req.body.lecturerCode,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      department: req.body.department,
      qualification: req.body.qualification,
      specialization: req.body.specialization,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    await lecturer.save();
    res.status(201).json({
      success: true,
      message: 'Lecturer created successfully',
      data: lecturer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating lecturer',
      error: error.message
    });
  }
};

// Create new schedule
const createSchedule = async (req, res) => {
  try {
    const schedule = new Schedule({
      semesterId: req.body.semesterId,
      subjectId: req.body.subjectId,
      classId: req.body.classId,
      timeSlotId: req.body.timeSlotId,
      weekId: req.body.weekId,
      roomId: req.body.roomId,
      lecturerId: req.body.lecturerId,
      dayOfWeek: new Date(req.body.dayOfWeek)
    });

    await schedule.save();
    
    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        ...schedule.toObject(),
        displayDate: schedule.getDateOnly()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating schedule',
      error: error.message
    });
  }
};

const createYear = async (req, res) => {
    try {
        const year = new Year({
            year: req.body.year,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        });

        await year.save();
        res.status(201).json({
            success: true,
            message: 'Year created successfully',
            data: year
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating year',
            error: error.message
        });
    }
}

module.exports = {
  createSemester,
  createSubject,
  createClass,
  createTimeSlot,
  createWeek,
  createRoom,
  createYear,
  createLecturer,
  createSchedule
};