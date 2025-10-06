const express = require('express');
const router = express.Router();
const usersRouter = require('./account.js');
const staffRouter = require('./staff.js')
const majorRouter = require('./major.js')
router.use('/api/account', usersRouter);
router.use('/api/staff', staffRouter);
router.use('/api/major', majorRouter);
router.use('/announcements', require('./announcement'));
module.exports = router;