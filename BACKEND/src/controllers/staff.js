const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Account = require('../models/account');
const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Major = require('../models/major');

const {
    computeSemesterNo,
    generateUniqueCode,
    makeStudentEmail,
    makeLecturerEmail,
    generateInitialPassword,
    isValidImageDataUri,
    pick
} = require('../helpers/staff.helpers');

// ==========STUDENT=============

// create account
const createStudentAccount = async (req, res) => {
    try {
        const { firstName, lastName, citizenID, gender, phone, majorId, curriculumId, avatarBase64 } = req.body;

        // Validate cơ bản
        if (!firstName || !lastName || !citizenID || typeof gender === 'undefined' || !phone || !majorId || !curriculumId || !avatarBase64) {
            return res.status(400).json({ message: 'Thiếu dữ liệu đầu vào' });
        }
        if (!isValidImageDataUri(avatarBase64)) {
            return res.status(400).json({ message: 'studentAvatar phải là data URI base64 của ảnh (png/jpg/jpeg/gif/webp)' });
        }

        // Check trùng citizenID
        const citizenTaken = await Student.exists({ citizenID });
        if (citizenTaken) return res.status(409).json({ message: 'CitizenID đã tồn tại cho Student' });

        const major = await Major.findById(majorId).lean();
        if (!major) return res.status(404).json({ message: 'Major không tồn tại' });

        const { number: semesterNo, str2: sem2 } = computeSemesterNo();

        const studentCode = await generateUniqueCode({
            majorCode: major.majorCode, sem2,
            model: Student, field: 'studentCode'
        });

        const email = makeStudentEmail({ firstName, lastName, studentCode });
        let finalEmail = email;
        if (await Account.exists({ email })) {
            const suffix = Math.floor(100 + Math.random() * 900);
            finalEmail = email.replace('@edu.vn', `${suffix}@edu.vn`);
            if (await Account.exists({ email: finalEmail })) {
                return res.status(409).json({ message: 'Không thể tạo email duy nhất, vui lòng thử lại' });
            }
        }

        const plainPassword = generateInitialPassword(12);
        const hashed = await bcrypt.hash(plainPassword, 10);

        const account = await Account.create({
            email: finalEmail,
            password: hashed,
            role: 'student',
            status: true
        });

        let student;
        try {
            student = await Student.create({
                studentCode,
                studentAvatar: avatarBase64,
                firstName,
                lastName,
                citizenID,
                gender,
                phone,
                semester: sem2,
                semesterNo,
                curriculumId,
                accountId: account._id,
                majorId
            });
        } catch (err) {
            await Account.deleteOne({ _id: account._id }).catch(() => { });
            throw err;
        }

        return res.status(201).json({
            message: 'Tạo account student thành công',
            account: {
                _id: account._id,
                email: account.email,
                role: account.role,
                status: account.status,
                createdAt: account.createdAt
            },
            student: {
                _id: student._id,
                studentCode: student.studentCode,
                firstName: student.firstName,
                lastName: student.lastName,
                citizenID: student.citizenID,
                gender: student.gender,
                phone: student.phone,
                semester: student.semester,
                semesterNo: student.semesterNo,
                major: {
                    _id: major._id,
                    majorName: major.majorName,
                    majorCode: major.majorCode
                },
                curriculumId: student.curriculumId,
                accountId: student.accountId,
                createdAt: student.createdAt
            },
            initialPassword: plainPassword
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'server error' });
    }
};

//get student by ID
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const s = await Student.findById(id).lean();
        if (!s) return res.status(404).json({ message: 'Student không tồn tại' });

        const [major, account] = await Promise.all([
            Major.findById(s.majorId).lean(),
            Account.findById(s.accountId).lean()
        ]);

        return res.json({
            _id: s._id,
            studentCode: s.studentCode,
            studentAvatar: s.studentAvatar,
            firstName: s.firstName,
            lastName: s.lastName,
            citizenID: s.citizenID,
            gender: s.gender,
            phone: s.phone,
            semester: s.semester,
            semesterNo: s.semesterNo,
            curriculumId: s.curriculumId,
            account: account ? {
                _id: account._id,
                email: account.email,
                role: account.role,
                status: account.status
            } : null,
            major: major ? {
                _id: major._id,
                majorName: major.majorName,
                majorCode: major.majorCode
            } : null,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
};

//get all student
// get all student (có lọc, tìm kiếm, phân trang, sắp xếp)
const listStudents = async (req, res) => {
    try {
        const {
            q = "",                 // tìm kiếm theo tên, mã, email
            major = "",             // lọc theo majorId
            page = "1",
            limit = "20",
            sort = "-createdAt",    // sắp xếp mới nhất trước
            fields = ""             // chọn field trả về
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Điều kiện lọc
        const where = {};
        if (q) {
            where.$or = [
                { firstName: { $regex: q, $options: "i" } },
                { lastName: { $regex: q, $options: "i" } },
                { studentCode: { $regex: q, $options: "i" } },
            ];
        }
        if (major) where.majorId = major;

        // Projection (chọn field)
        const projection = {};
        if (fields) {
            fields
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)
                .forEach(f => (projection[f] = 1));
        }

        // Truy vấn DB
        const [items, total] = await Promise.all([
            Student.find(where, Object.keys(projection).length ? projection : undefined)
                .populate('accountId', 'email')
                .populate('majorId', 'majorName majorCode')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Student.countDocuments(where),
        ]);

        // ✅ Trả JSON chuẩn RESTful
        return res.json({
            data: items,
            meta: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (e) {
        console.error('❌ Lỗi listStudents:', e);
        return res.status(500).json({ message: 'Server error', error: e.message });
    }
};


//update student
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;

        // chặn nếu client cố gửi các field bị cấm
        if ('citizenID' in req.body) {
            return res.status(400).json({ message: 'Không được cập nhật citizenID' });
        }
        if ('email' in req.body) {
            return res.status(400).json({ message: 'Không được cập nhật email qua student; email thuộc Account' });
        }

        // các field cho phép update
        const allowed = [
            'studentAvatar', 'firstName', 'lastName', 'gender', 'phone',
            'semester', 'semesterNo', 'curriculumId', 'majorId'
            // KHÔNG cho update: studentCode, accountId, citizenID
        ];
        const data = pick(req.body, allowed);

        // validate avatar nếu có
        if (data.studentAvatar && !isValidImageDataUri(data.studentAvatar)) {
            return res.status(400).json({ message: 'studentAvatar phải là data URI base64 (png/jpg/jpeg/gif/webp)' });
        }

        const updated = await Student.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) return res.status(404).json({ message: 'Student không tồn tại' });

        return res.json({ message: 'Cập nhật student thành công', student: updated });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
};

//delete Student
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const s = await Student.findById(id).lean();
        if (!s) return res.status(404).json({ message: 'Student không tồn tại' });

        // xóa student trước
        await Student.deleteOne({ _id: id });

        // rồi xóa account (nếu có)
        if (s.accountId) {
            await Account.deleteOne({ _id: s.accountId }).catch(err => {
                console.error('Delete linked Account failed:', err);
            });
        }

        return res.json({ message: 'Xoá student (và account liên kết) thành công' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
};


// ========LECTURER=========

//Create lecturer
const createLecturerAccount = async (req, res) => {
    try {
        const { firstName, lastName, citizenID, gender, phone, majorId, curriculumId } = req.body;

        if (!firstName || !lastName || !citizenID || typeof gender === 'undefined' || !phone || !majorId || !curriculumId) {
            return res.status(400).json({ message: 'Thiếu dữ liệu đầu vào' });
        }

        // Check trùng citizenID
        const citizenTaken = await Lecturer.exists({ citizenID });
        if (citizenTaken) return res.status(409).json({ message: 'CitizenID đã tồn tại cho Lecturer' });

        const major = await Major.findById(majorId).lean();
        if (!major) return res.status(404).json({ message: 'Major không tồn tại' });

        const { number: semesterNo, str2: sem2 } = computeSemesterNo();

        const lecturerCode = await generateUniqueCode({
            majorCode: major.majorCode, sem2,
            model: Lecturer, field: 'lecturerCode'
        });

        const email = makeLecturerEmail({ firstName, lastName, lecturerCode });
        let finalEmail = email;
        if (await Account.exists({ email })) {
            const suffix = Math.floor(100 + Math.random() * 900);
            finalEmail = email.replace('@edu.vn', `${suffix}@edu.vn`);
            if (await Account.exists({ email: finalEmail })) {
                return res.status(409).json({ message: 'Không thể tạo email duy nhất, vui lòng thử lại' });
            }
        }

        const plainPassword = generateInitialPassword(12);
        const hashed = await bcrypt.hash(plainPassword, 10);

        const account = await Account.create({
            email: finalEmail,
            password: hashed,
            role: 'lecture',
            status: true
        });

        let lecturer;
        try {
            lecturer = await Lecturer.create({
                lecturerCode,
                lecturerAvatar: req.body.lecturerAvatar || '', // nếu bạn muốn bắt buộc thì validate thêm
                firstName,
                lastName,
                citizenID,
                gender,
                phone,
                semester: sem2,
                semesterNo,
                curriculumId,
                accountId: account._id,
                majorId
            });
        } catch (err) {
            await Account.deleteOne({ _id: account._id }).catch(() => { });
            throw err;
        }

        return res.status(201).json({
            message: 'Tạo account lecture thành công',
            account: {
                _id: account._id,
                email: account.email,
                role: account.role,
                status: account.status,
                createdAt: account.createdAt
            },
            lecturer: {
                _id: lecturer._id,
                lecturerCode: lecturer.lecturerCode,
                firstName: lecturer.firstName,
                lastName: lecturer.lastName,
                citizenID: lecturer.citizenID,
                gender: lecturer.gender,
                phone: lecturer.phone,
                semester: lecturer.semester,
                semesterNo: lecturer.semesterNo,
                major: {
                    _id: major._id,
                    majorName: major.majorName,
                    majorCode: major.majorCode
                },
                curriculumId: lecturer.curriculumId,
                accountId: lecturer.accountId,
                createdAt: lecturer.createdAt
            },
            initialPassword: plainPassword
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'server error' });
    }
};
//get lecturer by ID
const getLecturerById = async (req, res) => {
    try {
        const { id } = req.params;

        const l = await Lecturer.findById(id).lean();
        if (!l) return res.status(404).json({ message: 'Lecturer không tồn tại' });

        const [major, account] = await Promise.all([
            Major.findById(l.majorId).lean(),
            Account.findById(l.accountId).lean()
        ]);

        return res.json({
            _id: l._id,
            lecturerCode: l.lecturerCode,
            lecturerAvatar: l.lecturerAvatar,
            firstName: l.firstName,
            lastName: l.lastName,
            citizenID: l.citizenID,
            gender: l.gender,
            phone: l.phone,
            semester: l.semester,
            semesterNo: l.semesterNo,
            curriculumId: l.curriculumId,
            account: account ? {
                _id: account._id,
                email: account.email,
                role: account.role,
                status: account.status
            } : null,
            major: major ? {
                _id: major._id,
                majorName: major.majorName,
                majorCode: major.majorCode
            } : null,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
};

//list lecturer
// list lecturer (có lọc, tìm kiếm, phân trang, sắp xếp)
const listLecturers = async (req, res) => {
    try {
        const {
            q = "",
            major = "",
            page = "1",
            limit = "20",
            sort = "-createdAt",
            fields = ""
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (q) {
            where.$or = [
                { firstName: { $regex: q, $options: "i" } },
                { lastName: { $regex: q, $options: "i" } },
                { lecturerCode: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } }, // nếu model Lecturer có trường email
            ];
        }
        if (major) where.majorId = major;

        const projection = {};
        if (fields) {
            fields.split(",").map(s => s.trim()).filter(Boolean).forEach(f => projection[f] = 1);
        }

        const [items, total] = await Promise.all([
            Lecturer
                .find(where, Object.keys(projection).length ? projection : undefined)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Lecturer.countDocuments(where)
        ]);

        return res.json({
            data: items,
            meta: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "server error" });
    }
};


//update lecturer
const updateLecturer = async (req, res) => {
    try {
        const { id } = req.params;

        if ('citizenID' in req.body) {
            return res.status(400).json({ message: 'Không được cập nhật citizenID' });
        }
        if ('email' in req.body) {
            return res.status(400).json({ message: 'Không được cập nhật email qua lecturer; email thuộc Account' });
        }

        const allowed = [
            'lecturerAvatar', 'firstName', 'lastName', 'gender', 'phone',
            'semester', 'semesterNo', 'curriculumId', 'majorId'
            // KHÔNG cho update: lecturerCode, accountId, citizenID
        ];
        const data = pick(req.body, allowed);

        // nếu muốn validate data URI cho lecturerAvatar:
        if (data.lecturerAvatar && !isValidImageDataUri(data.lecturerAvatar)) {
            return res.status(400).json({ message: 'lecturerAvatar phải là data URI base64 (png/jpg/jpeg/gif/webp)' });
        }

        const updated = await Lecturer.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) return res.status(404).json({ message: 'Lecturer không tồn tại' });

        return res.json({ message: 'Cập nhật lecturer thành công', lecturer: updated });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
};

// delete lecturer
const deleteLecturer = async (req, res) => {
    try {
        const { id } = req.params;

        const l = await Lecturer.findById(id).lean();
        if (!l) return res.status(404).json({ message: 'Lecturer không tồn tại' });

        await Lecturer.deleteOne({ _id: id });

        if (l.accountId) {
            await Account.deleteOne({ _id: l.accountId }).catch(err => {
                console.error('Delete linked Account failed:', err);
            });
        }

        return res.json({ message: 'Xoá lecturer (và account liên kết) thành công' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
};


module.exports = {
    //STUDENT
    createStudentAccount,
    getStudentById,
    listStudents,
    updateStudent,
    deleteStudent,
    //LECTURER
    createLecturerAccount,
    getLecturerById,
    listLecturers,
    updateLecturer,
    deleteLecturer
};
