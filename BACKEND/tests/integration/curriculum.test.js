const { app, request } = require('../utils/setup');
const { generateTestToken, createTestStudent } = require('../utils/testHelpers');
const Subject = require('../../src/models/subject');
const Grade = require('../../src/models/grade');
const Curriculum = require('../../src/models/curriculum');

describe('Curriculum Controller', () => {
    let student, user, token;

    beforeEach(async () => {
        const testStudent = await createTestStudent();
        student = testStudent.student;
        user = testStudent.user;
        token = generateTestToken(user);
    });

    describe('GET /api/curriculums', () => {
        it('should get curriculum subjects successfully', async () => {
            // Create test subject
            const subject = await Subject.create({
                name: 'Computer Science 101',
                code: 'CS101',
                credits: 3,
                description: 'Introduction to Computer Science',
                semester: 1,
                year: 1
            });

            // Create curriculum entry
            await Curriculum.create({
                majorId: student.majorId,
                subjectId: subject._id,
                semester: 1,
                year: 1,
                required: true
            });

            const response = await request(app)
                .get('/api/curriculums')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return empty array when no curriculum exists', async () => {
            // Ensure DB has no curriculums
            await Curriculum.deleteMany({});
            const response = await request(app)
                .get('/api/curriculums')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toEqual([]);
        });

        it('should return error without authentication', async () => {
            const response = await request(app)
                .get('/api/curriculums')
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });
    });
    describe('GET /api/curriculums/:id and details', () => {
        it('should get curriculum by id and its details', async () => {
            const subject = await Subject.create({
                name: 'Data Structures',
                code: 'DS201',
                credits: 4,
                description: 'Advanced Data Structures and Algorithms',
                semester: 2,
                year: 2
            });

            const curriculum = await Curriculum.create({
                majorId: student.majorId,
                curriculumName: 'Test Curriculum'
            });

            await Curriculum.create({});

            // Create a CurriculumDetail linked to this curriculum
            await require('../../src/models/curriculumDetail').create({
                curriculumId: curriculum._id,
                subjectId: subject._id,
                semester: 2
            });

            const res1 = await request(app)
                .get(`/api/curriculums/${curriculum._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res1.body).toHaveProperty('curriculumId');

            const res2 = await request(app)
                .get(`/api/curriculums/${curriculum._id}/details`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res2.body).toHaveProperty('curriculum');
            expect(Array.isArray(res2.body.details)).toBe(true);
        });
    });

    describe('GET /api/curriculums/semester/:semester', () => {
        it('should get subjects by semester successfully', async () => {
            // Create subjects for specific semester
            const subject1 = await Subject.create({
                name: 'Physics 101',
                code: 'PHY101',
                credits: 3,
                description: 'Basic Physics',
                semester: 1,
                year: 1
            });

            const subject2 = await Subject.create({
                name: 'Chemistry 101',
                code: 'CHE101',
                credits: 3,
                description: 'Basic Chemistry',
                semester: 1,
                year: 1
            });

            // Create curriculum entries
            await Curriculum.create({
                majorId: student.majorId,
                subjectId: subject1._id,
                semester: 1,
                year: 1,
                required: true
            });

            await Curriculum.create({
                majorId: student.majorId,
                subjectId: subject2._id,
                semester: 1,
                year: 1,
                required: true
            });

            const response = await request(app)
                .get('/api/curriculums/semester/1')
                .set('Authorization', `Bearer ${token}`)
                .query({ year: 1 })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should require year parameter', async () => {
            const response = await request(app)
                .get('/api/curriculums/semester/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('GET /api/curriculum/statistics', () => {
        it('should get curriculum statistics successfully', async () => {
            // Create test subjects and grades for statistics
            const subject = await Subject.create({
                name: 'Statistics Subject',
                code: 'STAT101',
                credits: 3,
                description: 'Statistics Test Subject'
            });

            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'Final',
                score: 85,
                weight: 40,
                semester: 1,
                year: 2024
            });

            const response = await request(app)
                .get('/api/curriculums/statistics')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('totalSubjects');
            expect(response.body.data).toHaveProperty('completedSubjects');
            expect(response.body.data).toHaveProperty('totalCredits');
            expect(response.body.data).toHaveProperty('gpa');
            expect(response.body.data).toHaveProperty('semesterSummary');
        });
    });

    describe('Grade calculation tests', () => {
        it('should calculate weighted average correctly', async () => {
            const subject = await Subject.create({
                name: 'Test Subject for Calculation',
                code: 'TEST101',
                credits: 3,
                description: 'Test Subject for Grade Calculation'
            });

            // Create grades matching the component structure
            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'Ass1',
                score: 80,
                weight: 10,
                semester: 1,
                year: 2024
            });

            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'pt1',
                score: 85,
                weight: 10,
                semester: 1,
                year: 2024
            });

            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'fe',
                score: 90,
                weight: 30,
                semester: 1,
                year: 2024
            });

            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'pe',
                score: 88,
                weight: 40,
                semester: 1,
                year: 2024
            });

            const response = await request(app)
                .get(`/api/curriculum/${subject._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('weightedAverage');

            // Calculate expected weighted average: (80*10 + 85*10 + 90*30 + 88*40) / 90 = 87
            const expectedAverage = (80 * 10 + 85 * 10 + 90 * 30 + 88 * 40) / 90;
            expect(response.body.data.weightedAverage).toBeCloseTo(expectedAverage, 2);
        });

        it('should handle missing grade components gracefully', async () => {
            const subject = await Subject.create({
                name: 'Partial Grades Subject',
                code: 'PART101',
                credits: 3,
                description: 'Subject with partial grades'
            });

            // Only create some components
            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'Ass1',
                score: 80,
                weight: 10,
                semester: 1,
                year: 2024
            });

            await Grade.create({
                studentId: student._id,
                subjectId: subject._id,
                componentName: 'fe',
                score: 85,
                weight: 30,
                semester: 1,
                year: 2024
            });

            const response = await request(app)
                .get(`/api/curriculum/${subject._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('weightedAverage');
            // Should calculate average with available components
            expect(response.body.data.weightedAverage).not.toBeNull();
        });
    });
});