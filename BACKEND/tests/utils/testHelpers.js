const jwt = require('jsonwebtoken');
const User = require('../../src/models/account');
const Student = require('../../src/models/student');
const Lecturer = require('../../src/models/lecturer');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Generate test JWT token
const generateTestToken = (user = {}) => {
    const payload = {
        id: user._id || new mongoose.Types.ObjectId(),
        email: user.email || 'test@edu.vn',
        role: user.role || 'student'
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
};

// Create test user
const createTestUser = async (userData = {}) => {
    const randomId = Math.floor(Math.random() * 10000);
    const defaultUser = {
        email: userData.email || `test${randomId}@edu.vn`,
        personalEmail: userData.personalEmail || userData.email || `test${randomId}@gmail.com`,
        password: userData.password || await bcrypt.hash('password123', 10),
        role: userData.role || 'student'
    };

    const user = await User.create({ ...defaultUser, ...userData });
    return user;
};

// Create test student
const createTestStudent = async (userData = {}) => {
    const user = await createTestUser({ role: 'student', ...userData });

    const studentData = {
        accountId: user._id,
        studentCode: userData.studentCode || `ST${Date.now()}`,
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'Student',
        citizenID: userData.citizenID || 123456789012,
        phone: userData.phone || '0123456789',
        address: userData.address || 'Test Address',
        dateOfBirth: userData.dateOfBirth || new Date('2000-01-01'),
        curriculumId: userData.curriculumId || new mongoose.Types.ObjectId(),
        majorId: userData.majorId || new mongoose.Types.ObjectId(),
        year: userData.year || 1,
        semester: userData.semester || 1
    };

    const student = await Student.create(studentData);
    return { user, student };
};

// Create test lecturer
const createTestLecturer = async (userData = {}) => {
    const user = await createTestUser({ role: 'lecturer', ...userData });

    const lecturerData = {
        accountId: user._id,
        lecturerCode: userData.lecturerCode || `LEC${Date.now()}`,
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'Lecturer',
        citizenID: userData.citizenID || 123456789012,
        phone: userData.phone || '0123456789',
        address: userData.address || 'Test Address',
        dateOfBirth: userData.dateOfBirth || new Date('1980-01-01'),
        curriculumId: userData.curriculumId || new mongoose.Types.ObjectId(),
        majorId: userData.majorId || new mongoose.Types.ObjectId()
    };

    const lecturer = await Lecturer.create(lecturerData);
    return { user, lecturer };
};

// Mock authentication middleware
const mockAuth = (user = {}) => {
    return (req, res, next) => {
        req.user = {
            id: user._id || new mongoose.Types.ObjectId(),
            email: user.email || 'test@edu.vn',
            role: user.role || 'student'
        };
        next();
    };
};

// Test data generators
const generateTestGrade = (overrides = {}) => {
    return {
        studentId: overrides.studentId || new mongoose.Types.ObjectId(),
        subjectId: overrides.subjectId || new mongoose.Types.ObjectId(),
        componentId: overrides.componentId || new mongoose.Types.ObjectId(),
        componentName: overrides.componentName || 'Midterm',
        score: overrides.score || 8.5,
        weight: overrides.weight || 30,
        semester: overrides.semester || 1,
        year: overrides.year || 2024,
        ...overrides
    };
};

const generateTestSubject = (overrides = {}) => {
    return {
        name: 'Test Subject',
        code: `TS${Date.now()}`,
        credits: 3,
        description: 'Test subject description',
        ...overrides
    };
};

module.exports = {
    generateTestToken,
    createTestUser,
    createTestStudent,
    createTestLecturer,
    mockAuth,
    generateTestGrade,
    generateTestSubject
};