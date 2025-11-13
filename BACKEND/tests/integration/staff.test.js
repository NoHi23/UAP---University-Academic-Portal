const { app, request } = require('../utils/setup');
const { generateTestToken, createTestUser } = require('../utils/testHelpers');
const Account = require('../../src/models/account');
const Student = require('../../src/models/student');
const Lecturer = require('../../src/models/lecturer');
const Major = require('../../src/models/major');
const Curriculum = require('../../src/models/curriculum');

describe('Staff Management API', () => {
    let token;
    let staffUser;
    let testMajor;
    let testCurriculum;

    // Helper to create complete student with account
    const createTestStudent = async (overrides = {}) => {
        const timestamp = Date.now() + Math.random() * 1000;
        const account = await createTestUser({
            role: 'student',
            email: overrides.email || `student${timestamp}@edu.vn`,
            personalEmail: overrides.personalEmail || `student${timestamp}@gmail.com`,
            ...overrides
        });

        const student = await Student.create({
            firstName: 'Test',
            lastName: 'Student',
            citizenID: Math.floor(100000000000 + Math.random() * 900000000000), // 12-digit number
            gender: true, // Boolean, not number
            phone: '0123456789',
            majorId: testMajor._id,
            curriculumId: testCurriculum._id,
            accountId: account._id,
            studentCode: `ST${timestamp}`,
            address: '123 Test St',
            dateOfBirth: new Date('2000-01-01'),
            semesterNo: 1,
            ...overrides.studentData
        });

        return { account, student };
    };

    // Helper to create complete lecturer with account
    const createTestLecturer = async (overrides = {}) => {
        const timestamp = Date.now() + Math.random() * 1000;
        const account = await createTestUser({
            role: 'lecturer',
            email: overrides.email || `lecturer${timestamp}@edu.vn`,
            personalEmail: overrides.personalEmail || `lecturer${timestamp}@gmail.com`,
            ...overrides
        });

        const lecturer = await Lecturer.create({
            firstName: 'Test',
            lastName: 'Lecturer',
            citizenID: Math.floor(100000000000 + Math.random() * 900000000000), // 12-digit number
            gender: true, // Boolean, not number  
            phone: '0123456789',
            majorId: testMajor._id,
            curriculumId: testCurriculum._id,
            accountId: account._id,
            lecturerCode: `LEC${timestamp}`,
            address: '123 Test St',
            dateOfBirth: new Date('1980-01-01'),
            ...overrides.lecturerData
        });

        return { account, lecturer };
    };

    beforeEach(async () => {
        // Create test Major
        testMajor = await Major.create({
            _id: '507f1f77bcf86cd799439011',
            majorName: 'Computer Science',
            majorCode: 'CS',
            description: 'Test major for staff tests'
        });

        // Create test Curriculum
        testCurriculum = await Curriculum.create({
            _id: '507f1f77bcf86cd799439012',
            curriculumName: 'CS 2024',
            majorId: testMajor._id,
            totalCredits: 150,
            description: 'Test curriculum for staff tests'
        });

        // Create staff user for authentication
        staffUser = await createTestUser({
            role: 'staff',
            email: 'staff@edu.vn',
            name: 'Test Staff'
        });

        token = generateTestToken(staffUser);
    }); describe('User Management - Students', () => {
        describe('GET /api/manage/users/students', () => {
            it('should get all students successfully', async () => {
                // Create test students with proper Student records
                await createTestStudent({ email: 'student1@edu.vn' });
                await createTestStudent({ email: 'student2@edu.vn' });

                const response = await request(app)
                    .get('/api/manage/users/students')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toHaveProperty('data');
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body).toHaveProperty('meta');
                expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            });

            it('should return error for non-staff user', async () => {
                const studentToken = generateTestToken({ role: 'student' });

                await request(app)
                    .get('/api/manage/users/students')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });

            it('should require authentication', async () => {
                await request(app)
                    .get('/api/manage/users/students')
                    .expect(401);
            });
        });

        describe('POST /api/manage/users/students', () => {
            it('should create new student successfully', async () => {
                const userData = {
                    firstName: 'New',
                    lastName: 'Student',
                    citizenID: '123456789012',
                    gender: 1,
                    phone: '0123456789',
                    majorId: testMajor._id,
                    curriculumId: testCurriculum._id,
                    avatarBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                    personalEmail: 'newstudent@gmail.com',
                    address: '123 Test St',
                    dateOfBirth: '2000-01-01'
                }; const response = await request(app)
                    .post('/api/manage/users/students')
                    .set('Authorization', `Bearer ${token}`)
                    .send(userData)
                    .expect(201);

                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('account');
                expect(response.body).toHaveProperty('student');
                expect(response.body.account).toHaveProperty('email');
            });

            it('should return error for duplicate email', async () => {
                await createTestUser({
                    email: 'existing@edu.vn',
                    role: 'student',
                    personalEmail: 'newstudent@gmail.com'
                });

                const userData = {
                    firstName: 'New',
                    lastName: 'Student',
                    citizenID: '123456789012',
                    gender: 0, // Integer: 0 = female, 1 = male
                    phone: '0123456789',
                    majorId: testMajor._id,
                    curriculumId: testCurriculum._id,
                    avatarBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                    personalEmail: 'newstudent@gmail.com',
                    address: '123 Test St',
                    dateOfBirth: '2000-01-01'
                };

                await request(app)
                    .post('/api/manage/users/students')
                    .set('Authorization', `Bearer ${token}`)
                    .send(userData)
                    .expect(409);
            });

            it('should return error for missing required fields', async () => {
                const invalidData = {
                    firstName: 'Incomplete Student'
                    // Missing required fields like lastName, citizenID, etc.
                };

                await request(app)
                    .post('/api/manage/users/students')
                    .set('Authorization', `Bearer ${token}`)
                    .send(invalidData)
                    .expect(400);
            });
        });

        describe('PUT /api/manage/users/students/:id', () => {
            let studentUser;

            beforeEach(async () => {
                const created = await createTestStudent({
                    email: 'updatestudent@edu.vn',
                    personalEmail: 'updatestudent@gmail.com'
                });
                studentUser = created;
            });

            it('should update student successfully', async () => {
                const updateData = {
                    name: 'Updated Student Name',
                    phone: '9876543210',
                    address: '456 New Street'
                };

                const response = await request(app)
                    .put(`/api/manage/users/students/${studentUser.student._id}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(updateData)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('student');
            });

            it('should return error for non-existent student', async () => {
                const fakeId = '507f1f77bcf86cd799439011';

                await request(app)
                    .put(`/api/manage/users/students/${fakeId}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ name: 'Test Update' })
                    .expect(404);
            });
        });

        describe('DELETE /api/manage/users/students/:id', () => {
            let studentUser;

            beforeEach(async () => {
                const created = await createTestStudent({
                    email: 'deletestudent@edu.vn',
                    personalEmail: 'deletestudent@gmail.com'
                });
                studentUser = created;
            });

            it('should delete student successfully', async () => {
                const response = await request(app)
                    .delete(`/api/manage/users/students/${studentUser.student._id}`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
            });

            it('should return error for non-existent student', async () => {
                const fakeId = '507f1f77bcf86cd799439011';

                await request(app)
                    .delete(`/api/manage/users/students/${fakeId}`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(404);
            });
        });
    });

    describe('User Management - Lecturers', () => {
        describe('GET /api/manage/users/lecturers', () => {
            it('should get all lecturers successfully', async () => {
                await createTestLecturer({ email: 'lecturer1@edu.vn' });
                await createTestLecturer({ email: 'lecturer2@edu.vn' });

                const response = await request(app)
                    .get('/api/manage/users/lecturers')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toHaveProperty('data');
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body).toHaveProperty('meta');
                expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            });
        });

        describe('POST /api/manage/users/lecturers', () => {
            it('should create new lecturer successfully', async () => {
                const userData = {
                    firstName: 'New',
                    lastName: 'Lecturer',
                    citizenID: '123456789014',
                    gender: 0,
                    phone: '0123456791',
                    majorId: testMajor._id,
                    curriculumId: testCurriculum._id,
                    address: '123 Test St',
                    dateOfBirth: '1980-01-01',
                    personalEmail: 'newlecturer@gmail.com'
                };

                const response = await request(app)
                    .post('/api/manage/users/lecturers')
                    .set('Authorization', `Bearer ${token}`)
                    .send(userData)
                    .expect(201);

                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('account');
                expect(response.body).toHaveProperty('lecturer');
                expect(response.body.account.personalEmail).toBe(userData.personalEmail);
            });
        });

        describe('PUT /api/manage/users/lecturers/:id', () => {
            let lecturerUser;

            beforeEach(async () => {
                const created = await createTestLecturer({
                    email: 'updatelecturer@edu.vn',
                    personalEmail: 'updatelecturer@gmail.com'
                });
                lecturerUser = created;
            });

            it('should update lecturer successfully', async () => {
                const updateData = {
                    name: 'Updated Lecturer Name',
                    phone: '9876543210'
                };

                const response = await request(app)
                    .put(`/api/manage/users/lecturers/${lecturerUser.lecturer._id}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(updateData)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('lecturer');
            });
        });

        describe('DELETE /api/manage/users/lecturers/:id', () => {
            let lecturerUser;

            beforeEach(async () => {
                const created = await createTestLecturer({
                    email: 'deletelecturer@edu.vn',
                    personalEmail: 'deletelecturer@gmail.com'
                });
                lecturerUser = created;
            });

            it('should delete lecturer successfully', async () => {
                const response = await request(app)
                    .delete(`/api/manage/users/lecturers/${lecturerUser.lecturer._id}`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
            });
        });
    });

    describe('Password Reset', () => {
        describe('POST /api/manage/users/resetPassword/:id', () => {
            let targetUser;

            beforeEach(async () => {
                const created = await createTestStudent({
                    email: 'resetpassword@edu.vn',
                    personalEmail: 'resetuser@gmail.com'
                });
                targetUser = created;
            });

            it('should reset user password successfully', async () => {
                const resetData = {
                    personalEmail: 'resetuser@gmail.com'
                };

                const response = await request(app)
                    .post(`/api/manage/users/resetPassword/${targetUser.account._id}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(resetData)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
            }); it('should return error for non-existent user', async () => {
                const fakeId = '507f1f77bcf86cd799439011';
                const resetData = {
                    personalEmail: 'fake@gmail.com'
                };

                await request(app)
                    .post(`/api/manage/users/resetPassword/${fakeId}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(resetData)
                    .expect(404);
            });

            it('should return error for missing email', async () => {
                await request(app)
                    .post(`/api/manage/users/resetPassword/${targetUser.account._id}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({})
                    .expect(400);
            });
        });
    });

    describe('Authentication & Authorization', () => {
        it('should require staff role for all endpoints', async () => {
            const studentToken = generateTestToken({ role: 'student' });
            const lecturerToken = generateTestToken({ role: 'lecturer' });

            // Test multiple endpoints with non-staff tokens
            await request(app)
                .get('/api/manage/users/students')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            await request(app)
                .get('/api/manage/users/lecturers')
                .set('Authorization', `Bearer ${lecturerToken}`)
                .expect(403);
        });

        it('should require valid JWT token', async () => {
            await request(app)
                .get('/api/manage/users/students')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should require authorization header', async () => {
            await request(app)
                .get('/api/manage/users/students')
                .expect(401);
        });
    });
});