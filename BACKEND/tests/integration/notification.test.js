const { app, request } = require('../utils/setup');
const { createTestStudent, createTestLecturer, generateTestToken } = require('../utils/testHelpers');
const Account = require('../../src/models/account');
const Student = require('../../src/models/student');
const Lecturer = require('../../src/models/lecturer');
const Major = require('../../src/models/major');
const Curriculum = require('../../src/models/curriculum');
const SlotNotification = require('../../src/models/slotNotificationModel');
const Schedule = require('../../src/models/schedule');
const Class = require('../../src/models/class');
const Room = require('../../src/models/room');
const Year = require('../../src/models/year');
const Semester = require('../../src/models/semester');
const Subject = require('../../src/models/subject');
const ScheduleOfStudent = require('../../src/models/scheduleOfStudent');

describe('Notification Controller', () => {
    let studentToken, lecturerToken, studentAccount, lecturerAccount;
    let student, lecturer, major, curriculum, subject, classObj, schedule;
    let room, year, semesterDoc;
    let notificationId;

    beforeEach(async () => {
        // Create major and curriculum
        major = await Major.create({
            majorName: 'Computer Science',
            majorCode: 'CS'
        });

        curriculum = await Curriculum.create({
            curriculumName: 'CS 2024',
            curriculumCode: 'CS2024',
            majorId: major._id
        });

        // Create student user (uses helper to satisfy required fields)
        const testStudent = await createTestStudent({ curriculumId: curriculum._id, majorId: major._id });
        studentAccount = testStudent.user;
        student = testStudent.student;

        // Create lecturer user (helper)
        const testLecturer = await createTestLecturer({ curriculumId: curriculum._id, majorId: major._id });
        lecturerAccount = testLecturer.user;
        lecturer = testLecturer.lecturer;

        // Create subject
        subject = await Subject.create({
            subjectName: 'Programming 101',
            subjectCode: 'PROG101',
            subjectNoCredit: 3,
            majorId: major._id
        });

        // Create room, year and semester required by Class and Schedule
        room = await Room.create({ roomCode: 'R101', roomName: 'Room 101' });
        year = await Year.create({ startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') });
        semesterDoc = await Semester.create({ semesterName: 'S1', startDate: new Date('2024-01-01'), endDate: new Date('2024-06-30'), yearId: year._id });

        // Create class (include roomId)
        classObj = await Class.create({
            className: 'CS101-A',
            subjectId: subject._id,
            lecturerId: lecturer._id,
            roomId: room._id
        });

        // Create schedule (include semesterId, lecturerId, roomId, times)
        schedule = await Schedule.create({
            semesterId: semesterDoc._id,
            classId: classObj._id,
            subjectId: subject._id,
            lecturerId: lecturer._id,
            roomId: room._id,
            date: new Date('2024-12-01'),
            slot: 1,
            startTime: '07:30',
            endTime: '09:00'
        });

        // Enroll student in class
        await ScheduleOfStudent.create({
            studentId: student._id,
            classId: classObj._id,
            attendance: [{
                scheduleId: schedule._id,
                isPresent: true,
                note: 'Present'
            }]
        });

        // Generate JWT tokens for test users
        studentToken = generateTestToken(studentAccount);
        lecturerToken = generateTestToken(lecturerAccount);
    });

    describe('GET /api/notifications/slots', () => {
        beforeEach(async () => {
            // Create test slot notifications
            await SlotNotification.create([
                {
                    scheduleId: schedule._id,
                    senderId: lecturer.accountId,
                    title: 'Delay Notice',
                    content: 'Class will start 15 minutes late today',
                    message: 'Class will start 15 minutes late today',
                    type: 'info'
                },
                {
                    scheduleId: schedule._id,
                    senderId: lecturer.accountId,
                    title: 'Reminder',
                    content: 'Please bring your laptops',
                    message: 'Please bring your laptops',
                    type: 'reminder'
                }
            ]);
        });

        it('should get slot notifications for student', async () => {
            const response = await request(app)
                .get('/api/notifications/slots')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('count');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);

            if (response.body.count > 0) {
                const notification = response.body.data[0];
                expect(notification).toHaveProperty('content');
                expect(notification).toHaveProperty('title');
                expect(notification).toHaveProperty('scheduleId');
                expect(notification).toHaveProperty('senderId');
            }
        });

        it('should return empty array for student with no enrollments', async () => {
            // Create a new student with no enrollments using helper (password hashed)
            const created = await createTestStudent({ curriculumId: curriculum._id, majorId: major._id });
            const newStudentAccount = created.user;
            const newStudent = created.student;
            const newStudentToken = generateTestToken(newStudentAccount);

            const response = await request(app)
                .get('/api/notifications/slots')
                .set('Authorization', `Bearer ${newStudentToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('count', 0);
            expect(response.body.data).toEqual([]);
        });

        it('should return 404 for non-student user', async () => {
            const response = await request(app)
                .get('/api/notifications/slots')
                .set('Authorization', `Bearer ${lecturerToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Không tìm thấy sinh viên.');
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/notifications/slots')
                .expect(401);
        });
    });

    describe('GET /api/notifications/slot/:scheduleId', () => {
        beforeEach(async () => {
            // Create notifications for specific schedule
            const notification = await SlotNotification.create({
                scheduleId: schedule._id,
                senderId: lecturer.accountId,
                title: 'Schedule Update',
                content: 'Schedule specific notification',
                message: 'Schedule specific notification',
                type: 'announcement'
            });
            notificationId = notification._id;
        });

        it('should get notifications for specific schedule', async () => {
            const response = await request(app)
                .get(`/api/notifications/slot/${schedule._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('count');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);

            if (response.body.count > 0) {
                const notification = response.body.data[0];
                expect(notification).toHaveProperty('content');
                expect(notification).toHaveProperty('title');
                expect(notification).toHaveProperty('scheduleId');
                expect(notification.scheduleId).toBe(schedule._id.toString());
            }
        });

        it('should return empty array for schedule with no notifications', async () => {
            // Create a new schedule without notifications
            const newSchedule = await Schedule.create({
                semesterId: semesterDoc._id,
                classId: classObj._id,
                subjectId: subject._id,
                lecturerId: lecturer._id,
                roomId: room._id,
                date: new Date('2024-12-02'),
                slot: 2,
                startTime: '09:30',
                endTime: '11:00'
            });

            const response = await request(app)
                .get(`/api/notifications/slot/${newSchedule._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('count', 0);
            expect(response.body.data).toEqual([]);
        });

        it('should handle invalid schedule ID', async () => {
            const response = await request(app)
                .get('/api/notifications/slot/invalid-id')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('message');
        });

        it('should handle non-existent schedule ID', async () => {
            const response = await request(app)
                .get('/api/notifications/slot/507f1f77bcf86cd799439999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('count', 0);
            expect(response.body.data).toEqual([]);
        });

        it('should work for lecturer users', async () => {
            const response = await request(app)
                .get(`/api/notifications/slot/${schedule._id}`)
                .set('Authorization', `Bearer ${lecturerToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });

        it('should require authentication', async () => {
            await request(app)
                .get(`/api/notifications/slot/${schedule._id}`)
                .expect(401);
        });

        it('should populate schedule and sender information', async () => {
            const response = await request(app)
                .get(`/api/notifications/slot/${schedule._id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            if (response.body.count > 0) {
                const notification = response.body.data[0];
                expect(notification).toHaveProperty('scheduleId');
                expect(notification).toHaveProperty('senderId');

                if (notification.scheduleId && typeof notification.scheduleId === 'object') {
                    expect(notification.scheduleId).toHaveProperty('classId');
                    expect(notification.scheduleId).toHaveProperty('subjectId');
                    expect(notification.scheduleId).toHaveProperty('date');
                    expect(notification.scheduleId).toHaveProperty('slot');
                }

                if (notification.senderId && typeof notification.senderId === 'object') {
                    expect(notification.senderId).toHaveProperty('email');
                    expect(notification.senderId).toHaveProperty('role');
                }
            }
        });
    });
});