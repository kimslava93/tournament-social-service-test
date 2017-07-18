const express = require('express');
const UsersRes = require('../resources/UsersResource');

const router = express.Router();

router.get('/users', UsersRes.readAll);
router.get('/new', UsersRes.create);
router.get('/take', UsersRes.take);
router.get('/fund', UsersRes.fund);
router.get('/joinTournament', UsersRes.join);
router.get('/balance', UsersRes.balance);

module.exports = router;
