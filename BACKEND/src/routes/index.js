const express = require('express');
const router = express.Router();
const usersRouter = require('./account.js');

router.use('/api/account', usersRouter);

module.exports = router;