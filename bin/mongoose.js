const Promise = require('bluebird');
const mongoose = require('mongoose');
const logger = require('./logger');

const mongooseOptions = {
  promiseLibrary: Promise,
  server: {
    reconnectTries: Number.MAX_VALUE,
    socketOptions: {
      keepAlive: 30000,
      connectTimeoutMS: 30000,
    },
  },
};
mongoose.Promise = Promise;
mongoose.connection.on('error', err => logger.error(`MongoDB connection error: ${err}`));
module.exports.mongooseOptions = mongooseOptions;
module.exports.mongoose = mongoose;
