const { app, request } = require('../utils/setup');
const Account = require('../../src/models/account');
const Staff = require('../../src/models/staff');
const Announcement = require('../../src/models/annoucement');
const { generateTestToken, createTestUser } = require('../utils/testHelpers');

describe('Announcement Controller', () => {
    let token, staffToken, studentToken;
    let staff, student;
    let announcementId;

    beforeAll(async () => {
        // Create staff account and staff profile using test helper
        const staffAccount = await createTestUser({ email: 'staff@test.com', role: 'staff' });
        staff = await Staff.create({
            staffCode: 'STAFF001',
            fullName: 'Test Staff',
            citizenID: 123456789012,
            gender: true,
            phone: '0123456789',
            address: 'Test Address',
            dateOfBirth: new Date('1990-01-01'),
            accountId: staffAccount._id
        });

        // Create student account
        const studentAccount = await createTestUser({ email: 'student@test.com', role: 'student' });
        student = studentAccount;

        // Generate tokens for tests
        staffToken = generateTestToken(staffAccount);
        studentToken = generateTestToken(studentAccount);
        token = staffToken; // Default to staff token
    });

    describe('GET /api/announcements', () => {
        beforeEach(async () => {
            // Create test announcements
            await Announcement.create([
                {
                    title: 'Test Announcement 1',
                    content: 'Content 1',
                    postBy: 'staff@test.com',
                    audience: 'all',
                    status: 'published'
                },
                {
                    title: 'Test Announcement 2',
                    content: 'Content 2',
                    postBy: 'staff@test.com',
                    audience: 'student',
                    status: 'published'
                },
                {
                    title: 'Draft Announcement',
                    content: 'Draft Content',
                    postBy: 'staff@test.com',
                    audience: 'all',
                    status: 'draft'
                }
            ]);
        });

        it('should get all announcements successfully', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('meta');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('total');
            expect(response.body.meta).toHaveProperty('page');
            expect(response.body.meta).toHaveProperty('limit');
        });

        it('should filter announcements by status', async () => {
            const response = await request(app)
                .get('/api/announcements?status=published')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data.every(item => item.status === 'published')).toBe(true);
        });

        it('should search announcements by title', async () => {
            const response = await request(app)
                .get('/api/announcements?q=Draft')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].title).toContain('Draft');
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/announcements?page=1&limit=2')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.limit).toBe(2);
            expect(response.body.data.length).toBeLessThanOrEqual(2);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/announcements')
                .expect(401);
        });

        it('should allow students to view announcements', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
        });
    });

    describe('GET /api/announcements/:id', () => {
        beforeEach(async () => {
            const announcement = await Announcement.create({
                title: 'Single Test Announcement',
                content: 'Single test content',
                postBy: 'staff@test.com',
                audience: 'all',
                status: 'published'
            });
            announcementId = announcement._id;
        });

        it('should get single announcement successfully', async () => {
            const response = await request(app)
                .get(`/api/announcements/${announcementId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('title', 'Single Test Announcement');
            expect(response.body.data).toHaveProperty('content', 'Single test content');
        });

        it('should return 404 for non-existent announcement', async () => {
            const response = await request(app)
                .get('/api/announcements/507f1f77bcf86cd799439999')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Not found');
        });

        it('should return 400 for invalid ID format', async () => {
            await request(app)
                .get('/api/announcements/invalid-id')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });

        it('should require authentication', async () => {
            await request(app)
                .get(`/api/announcements/${announcementId}`)
                .expect(401);
        });
    });

    describe('POST /api/announcements', () => {
        it('should create announcement successfully', async () => {
            const announcementData = {
                title: 'New Test Announcement',
                content: 'New test content',
                audience: 'student',
                status: 'published'
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(announcementData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Tạo thông báo thành công!');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('title', announcementData.title);
            expect(response.body.data).toHaveProperty('content', announcementData.content);
            expect(response.body.data).toHaveProperty('postBy', 'staff@test.com');
        });

        it('should create announcement with default values', async () => {
            const announcementData = {
                title: 'Default Values Test',
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(announcementData)
                .expect(201);

            expect(response.body.data).toHaveProperty('audience', 'all');
            expect(response.body.data).toHaveProperty('status', 'published');
        });

        it('should return error for missing title', async () => {
            const announcementData = {
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(announcementData)
                .expect(400);

            expect(response.body).toHaveProperty('message', 'Thiếu tiêu đề hoặc nội dung');
        });

        it('should return error for missing content', async () => {
            const announcementData = {
                title: 'Test Title'
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(announcementData)
                .expect(400);

            expect(response.body).toHaveProperty('message', 'Thiếu tiêu đề hoặc nội dung');
        });

        it('should require staff authorization', async () => {
            const announcementData = {
                title: 'Unauthorized Test',
                content: 'Test content'
            };

            await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(announcementData)
                .expect(403);
        });

        it('should require authentication', async () => {
            const announcementData = {
                title: 'No Auth Test',
                content: 'Test content'
            };

            await request(app)
                .post('/api/announcements')
                .send(announcementData)
                .expect(401);
        });
    });

    describe('PUT /api/announcements/:id', () => {
        beforeEach(async () => {
            const announcement = await Announcement.create({
                title: 'Update Test Announcement',
                content: 'Original content',
                postBy: 'staff@test.com',
                audience: 'all',
                status: 'published'
            });
            announcementId = announcement._id;
        });

        it('should update announcement successfully', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content',
                audience: 'lecturer',
                status: 'draft'
            };

            const response = await request(app)
                .put(`/api/announcements/${announcementId}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Cập nhật thành công!');
            expect(response.body.data).toHaveProperty('title', 'Updated Title');
            expect(response.body.data).toHaveProperty('content', 'Updated content');
            expect(response.body.data).toHaveProperty('audience', 'lecturer');
            expect(response.body.data).toHaveProperty('status', 'draft');
        });

        it('should return 404 for non-existent announcement', async () => {
            const response = await request(app)
                .put('/api/announcements/507f1f77bcf86cd799439999')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ title: 'Updated' })
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Không tìm thấy thông báo.');
        });

        it('should require staff authorization', async () => {
            await request(app)
                .put(`/api/announcements/${announcementId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ title: 'Unauthorized Update' })
                .expect(403);
        });

        it('should require authentication', async () => {
            await request(app)
                .put(`/api/announcements/${announcementId}`)
                .send({ title: 'No Auth Update' })
                .expect(401);
        });
    });

    describe('DELETE /api/announcements/:id', () => {
        beforeEach(async () => {
            const announcement = await Announcement.create({
                title: 'Delete Test Announcement',
                content: 'Delete test content',
                postBy: 'staff@test.com',
                audience: 'all',
                status: 'published'
            });
            announcementId = announcement._id;
        });

        it('should delete announcement successfully', async () => {
            const response = await request(app)
                .delete(`/api/announcements/${announcementId}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Xóa thông báo thành công!');

            // Verify announcement is actually deleted
            const deletedAnnouncement = await Announcement.findById(announcementId);
            expect(deletedAnnouncement).toBeNull();
        });

        it('should return 404 for non-existent announcement', async () => {
            const response = await request(app)
                .delete('/api/announcements/507f1f77bcf86cd799439999')
                .set('Authorization', `Bearer ${staffToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('message', 'Không tìm thấy thông báo.');
        });

        it('should require staff authorization', async () => {
            await request(app)
                .delete(`/api/announcements/${announcementId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });

        it('should require authentication', async () => {
            await request(app)
                .delete(`/api/announcements/${announcementId}`)
                .expect(401);
        });
    });
});