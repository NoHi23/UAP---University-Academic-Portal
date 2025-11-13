const { app, request } = require('../utils/setup');
const { generateTestToken, createTestLecturer } = require('../utils/testHelpers');
const Subject = require('../../src/models/subject');
const Grade = require('../../src/models/grade');
const Major = require('../../src/models/major');
const Curriculum = require('../../src/models/curriculum');

describe('Lecturer Controller', () => {
    let lecturer, user, token, testMajor, testCurriculum;

    beforeEach(async () => {
        testMajor = await Major.create({ majorName: 'Test Major', majorCode: `M${Date.now()}` });
        testCurriculum = await Curriculum.create({ curriculumName: 'Test Curriculum', majorId: testMajor._id });

        const testLecturer = await createTestLecturer({ majorId: testMajor._id, curriculumId: testCurriculum._id });
        lecturer = testLecturer.lecturer;
        user = testLecturer.user;
        token = generateTestToken(user);
    });

    describe('GET /api/lecturer/profile', () => {
        it('should get lecturer profile successfully', async () => {
            const response = await request(app)
                .get('/api/lecturer/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('employeeCode', lecturer.employeeCode);
            expect(response.body.data).toHaveProperty('department', lecturer.department);
        });

        it('should return error for non-lecturer user', async () => {
            const studentToken = generateTestToken({ role: 'student' });
            const response = await request(app)
                .get('/api/lecturer/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('GET /api/lecturer/subjects', () => {
        it('should get lecturer subjects successfully', async () => {
            // Create test subject (use model fields)
            await Subject.create({
                subjectName: 'Advanced Mathematics',
                subjectCode: `MATH${Date.now()}`,
                subjectNoCredit: 4,
                description: 'Advanced Mathematics Course',
                majorId: testMajor._id
            });

            const response = await request(app)
                .get('/api/lecturer/subjects')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/lecturer/studentsbyclass/:classId', () => {
        it('should get students for a class (empty list if none)', async () => {
            const classId = require('mongoose').Types.ObjectId();
            const response = await request(app)
                .get(`/api/lecturer/studentsbyclass/${classId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('POST /api/lecturer/grades/mark', () => {
        it('should return 400 for invalid grade data (missing fields)', async () => {
            const invalidGradeData = {};

            const response = await request(app)
                .post('/api/lecturer/grades/mark')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidGradeData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    // Grade updates are handled via /grades/mark upsert; leave direct update tests out of this suite

    describe('GET /api/lecturers/schedule', () => {
        it('should get lecturer schedule successfully', async () => {
            const response = await request(app)
                .get('/api/lecturers/schedule')
                .set('Authorization', `Bearer ${token}`)
                .query({ semester: 1, year: 2024 })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('PUT /api/lecturers/profile', () => {
        it('should update lecturer profile successfully', async () => {
            const updateData = {
                department: 'Updated Department',
                phone: '0987654321'
            };

            const response = await request(app)
                .put('/api/lecturers/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('department', updateData.department);
        });

        it('should not allow updating restricted fields', async () => {
            const updateData = {
                employeeCode: 'NEW_CODE'
            };

            const response = await request(app)
                .put('/api/lecturers/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });
});