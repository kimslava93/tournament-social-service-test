const express = require('express');
const UsersRes = require('../resources/UsersResource');

const router = express.Router();

router.get('/users', UsersRes.readAll.bind(UsersRes));
router.get('/new', UsersRes.create.bind(UsersRes));
router.get('/take', UsersRes.take.bind(UsersRes));
router.get('/fund', UsersRes.fund.bind(UsersRes));
router.get('/joinTournament', UsersRes.join.bind(UsersRes));
router.get('/balance', UsersRes.balance.bind(UsersRes));

module.exports = router;
