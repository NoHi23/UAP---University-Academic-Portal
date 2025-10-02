const express = require('express');
const router = express.Router();
const usersRouter = require('./account.js');
const staffRouter = require('./staff.js')
router.use('/api/account', usersRouter);
router.use('/api/staff', staffRouter);
module.exports = router;