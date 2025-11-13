const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const router = require('./routes/index.js');

const app = express();

// CORS configuration
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true
    })
);

// Body parser middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());

// Health check route
app.get('/', async (req, res) => {
    try {
        res.json({ message: 'Welcome to Practical Exam!!' });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// API routes
app.use("/", router);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;