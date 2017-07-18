const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Game = new Schema({
  tournamentId: {
    type: String,
    ref: 'Tournament',
    required: true,
  },
  playerId: {
    type: String,
    required: true,
  },
  betSum: {
    type: Number,
    required: true,
  },
  isWinner: {
    type: Boolean,
    default: false,
  },
  ownedSum: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
});
module.exports = mongoose.model('Game', Game);
