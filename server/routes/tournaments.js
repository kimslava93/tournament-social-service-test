const express = require('express');
const TournamentsRes = require('../resources/TournamentsResource');

const router = express.Router();

router.get('/', TournamentsRes.getAll.bind(TournamentsRes));
router.get('/announceTournament', TournamentsRes.create.bind(TournamentsRes));
router.get('/get-tournament-details', TournamentsRes.getResults.bind(TournamentsRes));
router.get('/resultTournament', TournamentsRes.getLatestGames.bind(TournamentsRes));
router.get('/close-tournament', TournamentsRes.closeTournament.bind(TournamentsRes));
router.get('/cancel-tournament', TournamentsRes.cancelTournament.bind(TournamentsRes));

module.exports = router;
