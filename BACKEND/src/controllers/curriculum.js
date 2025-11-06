const Curriculum = require('../models/curriculum');
const CurriculumDetail = require('../models/curriculumDetail');
const Subject = require('../models/subject');
const Major = require('../models/major');

// GET /api/curriculums?majorId=...
const getAllCurriculums = async (req, res) => {
    try {
        const { majorId } = req.query;
        const filter = {};
        if (majorId) filter.majorId = majorId;

        const curriculums = await Curriculum.find(filter).populate('majorId', 'majorName majorCode');
        // map to expected JSON shape
        const mapped = curriculums.map(c => ({
            curriculumId: c._id,
            curriculumName: c.curriculumName || c.name || null,
            major: c.majorId ? (c.majorId.majorName || null) : null,
            totalSemester: c.totalSemester || null,
            yearApplied: c.yearApplied || null,
            description: c.description || null
        }));
        return res.status(200).json(mapped);
    } catch (error) {
        console.error('Error fetching curriculums', error);
        return res.status(500).json({ message: 'Lấy danh sách khung chương trình thất bại', error: error.message });
    }
};

// GET /api/curriculums/:id
const getCurriculumById = async (req, res) => {
    try {
        const { id } = req.params;
        const curriculum = await Curriculum.findById(id).populate('majorId', 'majorName majorCode');
        if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });
        const mapped = {
            curriculumId: curriculum._id,
            curriculumName: curriculum.curriculumName || curriculum.name || null,
            major: curriculum.majorId ? (curriculum.majorId.majorName || null) : null,
            totalSemester: curriculum.totalSemester || null,
            yearApplied: curriculum.yearApplied || null,
            description: curriculum.description || null
        };
        return res.status(200).json(mapped);
    } catch (error) {
        console.error('Error fetching curriculum', error);
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/curriculums/:id/details
const getCurriculumDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const curriculum = await Curriculum.findById(id).populate('majorId', 'majorName majorCode');
        if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

        const details = await CurriculumDetail.find({ curriculumId: id }).populate({ path: 'subjectId', model: 'Subject' });

        const mapped = details.map(d => {
            const s = d.subjectId || {};
            return {
                curriculumDetailId: d._id,
                curriculumId: d.curriculumId,
                curriculumName: curriculum.curriculumName || curriculum.name || null,
                major: curriculum.majorId ? curriculum.majorId.majorName : null,
                semester: d.semester || d.cdSemester || null,
                subjectId: d.subjectId?._id || s._id || null,
                subjectCode: d.subjectCode || s.subjectCode || s.code || null,
                subjectName: d.subjectName || s.subjectName || s.name || null,
                subjectEnglish: d.subjectEnglish || s.subjectEnglish || s.englishName || null,
                credits: d.credits || s.credits || s.credit || null,
                type: d.type || s.type || null,
                lecturer: d.lecturer || s.lecturer || null,
                description: d.description || s.description || null,
                learningOutcomes: (d.learningOutcomes && d.learningOutcomes.length) ? d.learningOutcomes : (s.learningOutcomes || []),
                preRequisite: s.preRequisite || []
            };
        });

        return res.status(200).json({ curriculum: curriculum, details: mapped });
    } catch (error) {
        console.error('Error fetching curriculum details', error);
        return res.status(500).json({ message: 'Lấy chi tiết khung chương trình thất bại', error: error.message });
    }
};

// GET /api/curriculums/by-subject?subjectId=...
const getCurriculumDetailsBySubject = async (req, res) => {
    try {
        const { subjectId } = req.query;
        if (!subjectId) return res.status(400).json({ message: 'subjectId is required' });

        console.log('[getCurriculumDetailsBySubject] subjectId=', subjectId);
        // populate both possible name fields to be safe
        const details = await CurriculumDetail.find({ subjectId }).populate('curriculumId', 'curriculumName name yearApplied majorId');

        const mapped = details.map(d => ({
            _id: d._id,
            curriculumId: d.curriculumId?._id || d.curriculumId,
            curriculumName: d.curriculumId?.curriculumName || d.curriculumId?.name || null,
            yearApplied: d.curriculumId?.yearApplied || null,
            majorId: d.curriculumId?.majorId || null,
            semester: d.semester
        }));

        console.log('[getCurriculumDetailsBySubject] found', mapped.length, 'items:', mapped);

        return res.status(200).json({ data: mapped });
    } catch (error) {
        console.error('Error fetching curriculum details by subject', error);
        return res.status(500).json({ message: 'Lấy chi tiết khung chương trình theo subject thất bại', error: error.message });
    }
};

module.exports = {
    getAllCurriculums,
    getCurriculumById,
    getCurriculumDetails
    , getCurriculumDetailsBySubject
};
