const express = require('express');
const TournamentsRes = require('../resources/TournamentsResource');

const router = express.Router();

router.get('/tournaments', TournamentsRes.getAll);
router.get('/announceTournament', TournamentsRes.create);
router.get('/getTournamentDetails', TournamentsRes.getResults);
router.post('/resultTournament', TournamentsRes.closeTournament);
router.get('/getClosedTournaments', TournamentsRes.getLatestGames);
router.get('/cancelTournament', TournamentsRes.cancelTournament);

module.exports = router;
