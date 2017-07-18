const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Player = new Schema({
  id: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
  },
  points: {
    type: Number,
    default: 0,
  },
});
module.exports = mongoose.model('Player', Player);
