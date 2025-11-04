const Student = require('../models/student');
const CurriculumDetail = require('../models/curriculumDetail');
const Material = require('../models/material');
const Subject = require('../models/subject');
const XLSX = require('xlsx');

const getStudentMaterials = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });

        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông tin sinh viên." });
        }

        const { curriculumId, semesterNo } = student;

        const curriculumDetails = await CurriculumDetail.find({
            curriculumId: curriculumId,
            cdSemester: semesterNo.toString()
        });

        if (!curriculumDetails || curriculumDetails.length === 0) {
            return res.status(200).json({ success: true, data: [], message: "Không có môn học nào trong kỳ này." });
        }

        const subjectIds = curriculumDetails.map(detail => detail.subjectId);

        const materials = await Material.find({
            subjectId: { $in: subjectIds }
        }).populate('subjectId', 'subjectName subjectCode');

        res.status(200).json({
            success: true,
            count: materials.length,
            data: materials
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
};


const createMaterial = async (req, res) => {
    try {
        const { subjectId } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(400).json({ success: false, message: `Không tìm thấy môn học với ID ${subjectId}` });
        }

        const material = await Material.create(req.body);

        res.status(201).json({
            success: true,
            data: material
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getAllMaterials = async (req, res) => {
    try {
        let query = {};
        if (req.query.subjectId) {
            query.subjectId = req.query.subjectId;
        }
        const materials = await Material.find(query).populate('subjectId', 'subjectName subjectCode');
        res.status(200).json({ success: true, count: materials.length, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
};

// GET /api/staff/materials/export-excel
const exportMaterialsExcel = async (req, res) => {
    try {
        let query = {};
        if (req.query.subjectId) {
            query.subjectId = req.query.subjectId;
        }
        const materials = await Material.find(query).populate('subjectId', 'subjectName subjectCode');
        const data = materials.map(item => ({
            MaterialDescription: item.materialDescription,
            Author: item.author,
            Publisher: item.publisher,
            PublishDate: item.publishDate ? item.publishDate.toISOString().slice(0, 10) : '',
            Edition: item.edition,
            ISBN: item.isbn,
            IsMainMaterial: item.isMainMaterial,
            IsHardCopy: item.isHardCopy,
            IsOnline: item.isOnline,
            Note: item.note
        }));
        // Ensure header order
        const header = [
            'MaterialDescription',
            'Author',
            'Publisher',
            'PublishDate',
            'Edition',
            'ISBN',
            'IsMainMaterial',
            'IsHardCopy',
            'IsOnline',
            'Note'
        ];
        const ws = XLSX.utils.json_to_sheet(data, { header });
        XLSX.utils.sheet_add_aoa(ws, [header], { origin: 0 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Materials');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="materials.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) {
        console.error('exportMaterialsExcel error', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateMaterial = async (req, res) => {
    try {
        const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!material) {
            return res.status(404).json({ success: false, message: `Không tìm thấy tài liệu với ID ${req.params.id}` });
        }

        res.status(200).json({ success: true, data: material });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);

        if (!material) {
            return res.status(404).json({ success: false, message: `Không tìm thấy tài liệu với ID ${req.params.id}` });
        }

        res.status(200).json({ success: true, message: "Xóa tài liệu thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
};


module.exports = {
    getStudentMaterials,
    createMaterial,
    getAllMaterials,
    updateMaterial,
    deleteMaterial,
    exportMaterialsExcel
};