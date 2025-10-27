const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const connectDB = require('./config/db.js');
const router = require('./src/routes/index.js');
const fs = require('fs');
const path = require('path');

// Kiểm tra xem thư mục uploads đã tồn tại chưa, nếu chưa thì tạo
const uploadsDir = path.join(__dirname, 'uploads'); // Đảm bảo thư mục uploads là thư mục lưu trữ tệp
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // Tạo thư mục uploads nếu chưa có
    console.log("Thư mục 'uploads' đã được tạo.");
} else {
    console.log("Thư mục 'uploads' đã tồn tại.");
}

// Tiếp theo, bạn có thể yêu cầu Multer sử dụng thư mục này để lưu trữ tệp
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);  // Đảm bảo Multer lưu tệp vào thư mục uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Đặt tên file để tránh trùng lặp
    },
});

const upload = multer({ storage });
app.get('/', async (req, res) => {
    try {
        res.send({ message: 'Welcome to Practical Exam!!' });
    } catch (error) {
        res.send({ error: error.message });
    }
});

const cors = require('cors')
connectDB();
app.use(
    cors({
        origin: "http://localhost:3000",
        credential: true
    })
)

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(express.json());
app.use("/", router);
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));