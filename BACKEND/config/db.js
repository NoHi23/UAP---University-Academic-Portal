const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri || typeof uri !== 'string' || uri.trim() === '') {
            console.error('MongoDB connection failed: MONGO_URI is not set. Check your .env or environment variables.');
            console.error('Current process.env.MONGO_URI:', process.env.MONGO_URI);
            throw new Error('Missing MONGO_URI environment variable');
        }

        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error("MongoDB connection failed: ", error);
        process.exit(1);
    }
};

module.exports = connectDB;