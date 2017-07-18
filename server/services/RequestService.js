const Promise = require('bluebird');
const logger = require('../../bin/logger');

function failWithError(message, code) {
  return Promise.reject({ message, code });
}
function getOrganizedError(error) {
  const resultError = error;
  if (typeof error === 'string') {
    resultError.message = error;
  }
  logger.error(error.message);
  if (!error.code || typeof error.code === 'string') {
    resultError.code = 500;
  }
  return resultError;
}

function sendErrorToClient(error, res) {
  const organizedError = getOrganizedError(error);
  return Promise.resolve(res.status(organizedError.code).json(organizedError.message));
}
module.exports = {
  failWithError,
  sendErrorToClient,
};
