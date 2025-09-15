const express = require('express')
const { login, getProfile, register, getAllUsers, updateProfile, updateUserRole } = require('../controllers/users');
const { verifyToken, authorize } = require('../middleware/authorization');
const usersRouter = express.Router();

usersRouter.post('/register', register);

usersRouter.post('/login', login)
usersRouter.get("/profile", verifyToken, getProfile);
usersRouter.get('/', verifyToken, authorize('admin'), getAllUsers);
usersRouter.put('/profile', verifyToken, updateProfile);
usersRouter.put('/:id/role', verifyToken, authorize('admin'), updateUserRole);

module.exports = usersRouter