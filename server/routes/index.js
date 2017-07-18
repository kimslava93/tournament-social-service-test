const express = require('express');
const MainPageRes = require('../resources/MainPageResource');
const usersRoutes = require('./users');
const tournamentsRoutes = require('./tournaments');

const router = express.Router();

router.get('/', MainPageRes.getMainPage);
router.use('/', usersRoutes);
router.use('/', tournamentsRoutes);

router.get('/error', (req, res) => res.render('error'));

router.get('*', (req, res) => res.redirect('/error'));

module.exports = router;
