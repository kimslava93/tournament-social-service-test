#!/usr/bin/env node
const app = require('../app');
const debug = require('debug')('social-tournament-service:server');
const http = require('http');
const logger = require('./logger');

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  const errors = {
    EACCES: () => `${bind} requires elevated privileges`,
    EADDRINUSE: () => `${bind} is already in use`,
  };

  if (errors[error.code]) {
    logger.error(errors[error.code]());
    process.exit(1);
  }
  throw error;
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

module.exports = server;
