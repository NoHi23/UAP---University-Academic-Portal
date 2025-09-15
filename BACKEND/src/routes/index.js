const express = require('express');
const router = express.Router();
const usersRouter = require('./users.js');

router.use('/api/users', usersRouter);

module.exports = router;