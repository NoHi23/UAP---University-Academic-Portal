// controllers/accounts.controller.js
const mongoose = require('mongoose')
const Account = require('../models/account')
const Student = require('../models/student')
const Lecturer = require('../models/Lecturer')
const Major = require('../models/major')
// const Curriculum = require('../models/Curriculum') // nếu cần validate tồn tại

// ==== Helpers ====
const computeSemesterNo = (date = new Date()) => {
    const baseYear = 2025
    const y = date.getFullYear()
    const n = Math.max(1, y - baseYear + 1)
    return { number: n, str2: String(n).padStart(2, '0') }
}

const generateUniqueCode = async ({ majorCode, sem2, model, field }) => {
    // Thử tối đa 10 lần để tránh trùng
    for (let i = 0; i < 10; i++) {
        const rand4 = Math.floor(1000 + Math.random() * 9000) // 1000–9999
        const code = `${majorCode}${sem2}${rand4}`
        const exists = await model.exists({ [field]: code })
        if (!exists) return code
    }
    throw new Error('Không thể tạo mã duy nhất, vui lòng thử lại')
}

// ==== Controllers ====

/**
 * POST /api/accounts/students
 * body: { email, password, firstName, lastName, gender, phone, majorId, curriculumId }
 */
const createStudentAccount = async (req, res) => {
    const session = await mongoose.startSession()
    try {
        const { email, password, firstName, lastName, gender, phone, majorId, curriculumId } = req.body

        // Validate sơ bộ
        if (!email || !password || !firstName || !lastName || typeof gender === 'undefined' || !phone || !majorId || !curriculumId) {
            return res.status(400).json({ message: 'Thiếu dữ liệu đầu vào' })
        }

        const major = await Major.findById(majorId).lean()
        if (!major) return res.status(404).json({ message: 'Major không tồn tại' })

        // Nếu cần: kiểm tra curriculum tồn tại
        // const cur = await Curriculum.findById(curriculumId).lean()
        // if (!cur) return res.status(404).json({ message: 'Curriculum không tồn tại' })

        // Kiểm tra email trùng
        const emailTaken = await Account.exists({ email })
        if (emailTaken) return res.status(409).json({ message: 'Email đã tồn tại' })

        const { number: semesterNo, str2: sem2 } = computeSemesterNo()

        await session.withTransaction(async () => {
            // 1) Tạo Account
            const acc = await Account.create([{
                email,
                password, // TODO: khuyến nghị hash bằng bcrypt
                role: 'student',
                status: true
            }], { session })

            const account = acc[0]

            // 2) Tạo studentCode duy nhất
            const studentCode = await generateUniqueCode({
                majorCode: major.majorCode,
                sem2,
                model: Student,
                field: 'studentCode'
            })

            // 3) Tạo Student
            const student = await Student.create([{
                studentCode,
                firstName,
                lastName,
                gender,
                phone,
                semester: sem2,         // nếu bạn muốn lưu thêm dạng chuỗi "01", optional
                semesterNo,             // dạng số: 1, 2, 3...
                curriculumId,
                accountId: account._id,
                majorId
            }], { session })

            // Trả về theo format "map" giống bạn cung cấp
            const s = student[0]
            res.status(201).json({
                message: 'Tạo account student thành công',
                account: {
                    _id: account._id,
                    email: account.email,
                    role: account.role,
                    status: account.status,
                    createdAt: account.createdAt
                },
                student: {
                    _id: s._id,
                    studentCode: s.studentCode,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    gender: s.gender,
                    phone: s.phone,
                    semester: s.semester,
                    semesterNo: s.semesterNo,
                    major: {
                        _id: major._id,
                        majorName: major.majorName,
                        majorCode: major.majorCode
                    },
                    curriculumId: s.curriculumId,
                    accountId: s.accountId,
                    createdAt: s.createdAt
                }
            })
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'server error' })
    } finally {
        session.endSession()
    }
}

/**
 * POST /api/accounts/lecturers
 * body: { email, password, firstName, lastName, gender, phone, majorId, curriculumId }
 */
const createLecturerAccount = async (req, res) => {
    const session = await mongoose.startSession()
    try {
        const { email, password, firstName, lastName, gender, phone, majorId, curriculumId } = req.body

        if (!email || !password || !firstName || !lastName || typeof gender === 'undefined' || !phone || !majorId || !curriculumId) {
            return res.status(400).json({ message: 'Thiếu dữ liệu đầu vào' })
        }

        const major = await Major.findById(majorId).lean()
        if (!major) return res.status(404).json({ message: 'Major không tồn tại' })

        const emailTaken = await Account.exists({ email })
        if (emailTaken) return res.status(409).json({ message: 'Email đã tồn tại' })

        const { number: semesterNo, str2: sem2 } = computeSemesterNo()

        await session.withTransaction(async () => {
            // 1) Account
            const acc = await Account.create([{
                email,
                password, // TODO: hash
                role: 'lecture', // CHÚ Ý: enum model là 'lecture' (không phải 'lecturer')
                status: true
            }], { session })

            const account = acc[0]

            // 2) lecturerCode duy nhất
            const lecturerCode = await generateUniqueCode({
                majorCode: major.majorCode,
                sem2,
                model: Lecturer,
                field: 'lecturerCode'
            })

            // 3) Lecturer
            const lecturer = await Lecturer.create([{
                lecturerCode,
                firstName,
                lastName,
                gender,
                phone,
                semester: sem2,
                semesterNo,
                curriculumId,
                accountId: account._id,
                majorId
            }], { session })

            const l = lecturer[0]
            res.status(201).json({
                message: 'Tạo account lecture thành công',
                account: {
                    _id: account._id,
                    email: account.email,
                    role: account.role,
                    status: account.status,
                    createdAt: account.createdAt
                },
                lecturer: {
                    _id: l._id,
                    lecturerCode: l.lecturerCode,
                    firstName: l.firstName,
                    lastName: l.lastName,
                    gender: l.gender,
                    phone: l.phone,
                    semester: l.semester,
                    semesterNo: l.semesterNo,
                    major: {
                        _id: major._id,
                        majorName: major.majorName,
                        majorCode: major.majorCode
                    },
                    curriculumId: l.curriculumId,
                    accountId: l.accountId,
                    createdAt: l.createdAt
                }
            })
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'server error' })
    } finally {
        session.endSession()
    }
}

module.exports = {
    createStudentAccount,
    createLecturerAccount
}
