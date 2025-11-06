const Curriculum = require('../models/curriculum');
const CurriculumDetail = require('../models/curriculumDetail');
const Subject = require('../models/subject');
const Major = require('../models/major');

// CREATE a new curriculum
const createCurriculum = async (req, res) => {
    try {
        const { curriculumName, majorId, totalSemester, yearApplied, description } = req.body;
        const curriculum = new Curriculum({
            curriculumName,
            majorId,
            totalSemester,
            yearApplied,
            description
        });
        await curriculum.save();
        return res.status(201).json({ message: 'Curriculum created successfully', curriculum });
    } catch (error) {
        console.error('Error creating curriculum', error);
        return res.status(500).json({ message: 'Error creating curriculum', error: error.message });
    }
};

// UPDATE an existing curriculum
const updateCurriculum = async (req, res) => {
    try {
        const { id } = req.params;
        const { curriculumName, majorId, totalSemester, yearApplied, description } = req.body;
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

        curriculum.curriculumName = curriculumName || curriculum.curriculumName;
        curriculum.majorId = majorId || curriculum.majorId;
        curriculum.totalSemester = totalSemester || curriculum.totalSemester;
        curriculum.yearApplied = yearApplied || curriculum.yearApplied;
        curriculum.description = description || curriculum.description;

        await curriculum.save();
        return res.status(200).json({ message: 'Curriculum updated successfully', curriculum });
    } catch (error) {
        console.error('Error updating curriculum', error);
        return res.status(500).json({ message: 'Error updating curriculum', error: error.message });
    }
};

// DELETE a curriculum
const deleteCurriculum = async (req, res) => {
    try {
        const { id } = req.params;
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

        await curriculum.remove();
        return res.status(200).json({ message: 'Curriculum deleted successfully' });
    } catch (error) {
        console.error('Error deleting curriculum', error);
        return res.status(500).json({ message: 'Error deleting curriculum', error: error.message });
    }
};

// CREATE a curriculum detail
const createCurriculumDetail = async (req, res) => {
    try {
        const { curriculumId, semester, subjectId, subjectCode, subjectName, subjectEnglish, credits, type, lecturer, description, learningOutcomes } = req.body;

        const curriculumDetail = new CurriculumDetail({
            curriculumId,
            semester,
            subjectId,
            subjectCode,
            subjectName,
            subjectEnglish,
            credits,
            type,
            lecturer,
            description,
            learningOutcomes
        });
        await curriculumDetail.save();
        return res.status(201).json({ message: 'Curriculum detail created successfully', curriculumDetail });
    } catch (error) {
        console.error('Error creating curriculum detail', error);
        return res.status(500).json({ message: 'Error creating curriculum detail', error: error.message });
    }
};

// UPDATE a curriculum detail
const updateCurriculumDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const { semester, subjectId, subjectCode, subjectName, subjectEnglish, credits, type, lecturer, description, learningOutcomes } = req.body;

        const curriculumDetail = await CurriculumDetail.findById(id);
        if (!curriculumDetail) return res.status(404).json({ message: 'Curriculum detail not found' });

        curriculumDetail.semester = semester || curriculumDetail.semester;
        curriculumDetail.subjectId = subjectId || curriculumDetail.subjectId;
        curriculumDetail.subjectCode = subjectCode || curriculumDetail.subjectCode;
        curriculumDetail.subjectName = subjectName || curriculumDetail.subjectName;
        curriculumDetail.subjectEnglish = subjectEnglish || curriculumDetail.subjectEnglish;
        curriculumDetail.credits = credits || curriculumDetail.credits;
        curriculumDetail.type = type || curriculumDetail.type;
        curriculumDetail.lecturer = lecturer || curriculumDetail.lecturer;
        curriculumDetail.description = description || curriculumDetail.description;
        curriculumDetail.learningOutcomes = learningOutcomes || curriculumDetail.learningOutcomes;

        await curriculumDetail.save();
        return res.status(200).json({ message: 'Curriculum detail updated successfully', curriculumDetail });
    } catch (error) {
        console.error('Error updating curriculum detail', error);
        return res.status(500).json({ message: 'Error updating curriculum detail', error: error.message });
    }
};

// DELETE a curriculum detail
const deleteCurriculumDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const curriculumDetail = await CurriculumDetail.findById(id);
        if (!curriculumDetail) return res.status(404).json({ message: 'Curriculum detail not found' });

        await curriculumDetail.remove();
        return res.status(200).json({ message: 'Curriculum detail deleted successfully' });
    } catch (error) {
        console.error('Error deleting curriculum detail', error);
        return res.status(500).json({ message: 'Error deleting curriculum detail', error: error.message });
    }
};

module.exports = {
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    createCurriculumDetail,
    updateCurriculumDetail,
    deleteCurriculumDetail
};
