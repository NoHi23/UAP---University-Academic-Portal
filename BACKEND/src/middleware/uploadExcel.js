// middlewares/uploadExcel.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `students_${Date.now()}${ext}`);
    }
});

const uploadExcel = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xls|xlsx)$/)) {
            return cb(new Error('Chỉ chấp nhận file Excel (.xls, .xlsx)'));
        }
        cb(null, true);
    }
});

module.exports = { uploadExcel };
