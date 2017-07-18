const mongoose = require('mongoose');
const CONSTANTS = require('../../bin/constants');

const Schema = mongoose.Schema;

const Tournament = new Schema({
  id: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
  },
  deposit: {
    type: Number,
    default: 100,
  },
  status: {
    type: Number,
    default: CONSTANTS.TOURNAMENT_TABLE_STATUSES.OPENED,
  },
});
module.exports = mongoose.model('Tournament', Tournament);
