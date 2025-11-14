const { app, request } = require('../utils/setup');
jest.setTimeout(30000);
const { createTestUser, createTestStudent, createTestLecturer, generateTestToken } = require('../utils/testHelpers');
const Account = require('../../src/models/account');
const Staff = require('../../src/models/staff');
const Student = require('../../src/models/student');
const Support = require('../../src/models/support');

describe('Support Controller', () => {
    let staffToken, studentToken, lecturerToken;
    let staffAccount, studentAccount, lecturerAccount;
    let supportId;

    beforeAll(async () => {
        // Create staff account and staff profile
        staffAccount = await createTestUser({ email: 'staff@test.com', role: 'staff' });
        await Staff.create({
            staffCode: 'STAFF001',
            fullName: 'Test Staff',
            gender: true,
            phone: '0123456789',
            address: 'Test Address',
            dateOfBirth: new Date('1990-01-01'),
            accountId: staffAccount._id
        });

        // Create student user/profile
        const createdStudent = await createTestStudent();
        studentAccount = createdStudent.user;

        // Create lecturer user/profile
        const createdLecturer = await createTestLecturer();
        lecturerAccount = createdLecturer.user;

        // Generate tokens directly to avoid login endpoint issues in tests
        staffToken = generateTestToken(staffAccount);
        studentToken = generateTestToken(studentAccount);
        lecturerToken = generateTestToken(lecturerAccount);
    });

    describe('POST /api/support/request', () => {
        it('should create support request successfully for student', async () => {
            const supportData = {
                request: 'I need help with my course registration'
            };

            const response = await request(app)
                .post('/api/support/request')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(supportData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Yêu cầu hỗ trợ đã được gửi thành công.');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('request', supportData.request);
            expect(response.body.data).toHaveProperty('status', 'open');
            expect(response.body.data).toHaveProperty('accountId', studentAccount._id.toString());
        });

        it('should create support request successfully for lecturer', async () => {
            const supportData = {
                request: 'I need access to the grade management system'
            };

            const response = await request(app)
                .post('/api/support/request')
                .set('Authorization', `Bearer ${lecturerToken}`)
                .send(supportData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Yêu cầu hỗ trợ đã được gửi thành công.');
            expect(response.body.data).toHaveProperty('request', supportData.request);
        });

        it('should return error for missing request content', async () => {
            const response = await request(app)
                .post('/api/support/request')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('message', 'Vui lòng nhập nội dung yêu cầu hỗ trợ.');
        });

        it('should require authentication', async () => {
            const supportData = {
                request: 'No auth test'
            };

            await request(app)
                .post('/api/support/request')
                .send(supportData)
                .expect(401);
        });
    });

    describe('GET /api/support', () => {
        beforeEach(async () => {
            // Create test support requests
            await Support.create([
                {
                    accountId: studentAccount._id,
                    request: 'Test support request 1',
                    status: 'open'
                },
                {
                    accountId: lecturerAccount._id,
                    request: 'Test support request 2',
                    status: 'in_progress',
                    answer: 'We are working on it'
                },
                {
                    accountId: studentAccount._id,
                    request: 'Test support request 3',
                    status: 'closed'
                }
            ]);
        });

        it('should get all support requests for staff', async () => {
            const response = await request(app)
                .get('/api/support')
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Danh sách yêu cầu hỗ trợ');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should require staff authorization', async () => {
            await request(app)
                .get('/api/support')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/support')
                .expect(401);
        });
    });

    describe('GET /api/support/account/:accountId', () => {
        beforeEach(async () => {
            // Create support requests for specific account
            await Support.create([
                {
                    accountId: studentAccount._id,
                    request: 'Student specific request 1',
                    status: 'open'
                },
                {
                    accountId: studentAccount._id,
                    request: 'Student specific request 2',
                    status: 'closed'
                },
                {
                    accountId: lecturerAccount._id,
                    request: 'Lecturer specific request',
                    status: 'open'
                }
            ]);
        });

        it('should get support requests for specific account', async () => {
            const response = await request(app)
                .get(`/api/support/account/${studentAccount._id}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data.every(item => item.accountId === studentAccount._id.toString())).toBe(true);
        });

        it('should return 404 for account with no support requests', async () => {
            const response = await request(app)
                .get(`/api/support/account/507f1f77bcf86cd799439999`)
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Không tìm thấy yêu cầu hỗ trợ nào.');
        });

        it('should require authentication', async () => {
            await request(app)
                .get(`/api/support/account/${studentAccount._id}`)
                .expect(401);
        });
    });

    describe('GET /api/support/:id', () => {
        beforeEach(async () => {
            const support = await Support.create({
                accountId: studentAccount._id,
                request: 'Test support for get by ID',
                status: 'open'
            });
            supportId = support._id;
        });

        it('should get support request by ID', async () => {
            const response = await request(app)
                .get(`/api/support/${supportId}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Chi tiết yêu cầu hỗ trợ');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('request', 'Test support for get by ID');
            expect(response.body.data).toHaveProperty('status', 'open');
        });

        it('should return 404 for non-existent support request', async () => {
            const response = await request(app)
                .get('/api/support/507f1f77bcf86cd799439999')
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Không tìm thấy yêu cầu hỗ trợ.');
        });

        it('should require authentication', async () => {
            await request(app)
                .get(`/api/support/${supportId}`)
                .expect(401);
        });
    });

    describe('PUT /api/support/:id/answer', () => {
        beforeEach(async () => {
            const support = await Support.create({
                accountId: studentAccount._id,
                request: 'Test support for answering',
                status: 'open'
            });
            supportId = support._id;
        });

        it('should answer support request successfully', async () => {
            const answerData = {
                answer: 'Here is the solution to your problem'
            };

            const response = await request(app)
                .put(`/api/support/${supportId}/answer`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send(answerData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Đã trả lời yêu cầu hỗ trợ.');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('answer', answerData.answer);
            expect(response.body.data).toHaveProperty('status', 'in_progress');
        });

        it('should return 404 for non-existent support request', async () => {
            const response = await request(app)
                .put('/api/support/507f1f77bcf86cd799439999/answer')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ answer: 'Test answer' })
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Không tìm thấy yêu cầu hỗ trợ.');
        });

        it('should require staff authorization', async () => {
            await request(app)
                .put(`/api/support/${supportId}/answer`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ answer: 'Unauthorized answer' })
                .expect(403);
        });

        it('should require authentication', async () => {
            await request(app)
                .put(`/api/support/${supportId}/answer`)
                .send({ answer: 'No auth answer' })
                .expect(401);
        });
    });

    describe('PUT /api/support/:id/status', () => {
        beforeEach(async () => {
            const support = await Support.create({
                accountId: studentAccount._id,
                request: 'Test support for status update',
                status: 'in_progress',
                answer: 'Initial answer'
            });
            supportId = support._id;
        });

        it('should update support status successfully for student', async () => {
            const statusData = {
                status: 'closed'
            };

            const response = await request(app)
                .put(`/api/support/${supportId}/status`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(statusData)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.data).toHaveProperty('status', 'closed');
        });

        it('should update support status successfully for lecturer', async () => {
            // Create support for lecturer
            const lecturerSupport = await Support.create({
                accountId: lecturerAccount._id,
                request: 'Lecturer support request',
                status: 'in_progress'
            });

            const statusData = {
                status: 'closed'
            };

            const response = await request(app)
                .put(`/api/support/${lecturerSupport._id}/status`)
                .set('Authorization', `Bearer ${lecturerToken}`)
                .send(statusData)
                .expect(200);

            expect(response.body.data).toHaveProperty('status', 'closed');
        });

        it('should return 404 for non-existent support request', async () => {
            const response = await request(app)
                .put('/api/support/507f1f77bcf86cd799439999/status')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ status: 'closed' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });

        it('should require student or lecturer authorization', async () => {
            await request(app)
                .put(`/api/support/${supportId}/status`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ status: 'closed' })
                .expect(403);
        });

        it('should require authentication', async () => {
            await request(app)
                .put(`/api/support/${supportId}/status`)
                .send({ status: 'closed' })
                .expect(401);
        });
    });
});