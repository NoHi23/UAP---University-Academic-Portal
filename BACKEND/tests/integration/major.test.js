const { app, request } = require('../utils/setup');
const Major = require('../../src/models/major');

describe('Major Controller', () => {
    describe('GET /api/major', () => {
        beforeEach(async () => {
            // Create test majors
            await Major.create([
                {
                    majorName: 'Computer Science',
                    majorCode: 'CS',
                    description: 'Computer Science major'
                },
                {
                    majorName: 'Information Technology',
                    majorCode: 'IT',
                    description: 'Information Technology major'
                },
                {
                    majorName: 'Business Administration',
                    majorCode: 'BA',
                    description: 'Business Administration major'
                }
            ]);
        });

        it('should get all majors successfully', async () => {
            const response = await request(app)
                .get('/api/major')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);

            const majorCodes = response.body.map(major => major.majorCode);
            expect(majorCodes).toContain('CS');
            expect(majorCodes).toContain('IT');
            expect(majorCodes).toContain('BA');
        });

        it('should return empty array when no majors exist', async () => {
            // Clear all majors first
            await Major.deleteMany({});

            const response = await request(app)
                .get('/api/major')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return majors with correct structure', async () => {
            const response = await request(app)
                .get('/api/major')
                .expect(200);

            expect(response.body.length).toBeGreaterThan(0);

            const major = response.body[0];
            expect(major).toHaveProperty('majorName');
            expect(major).toHaveProperty('majorCode');
            expect(major).toHaveProperty('_id');
        });

        it('should not require authentication', async () => {
            // This endpoint is public according to routes
            const response = await request(app)
                .get('/api/major')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});