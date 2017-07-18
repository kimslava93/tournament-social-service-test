const winston = require('winston');
const fs = require('fs');

const logDirectory = 'logs';
const megabyteSize = 1024 * 1024;
const env = process.env.NODE_ENV || 'development';
const isProductionEnv = env === 'production';
const logLevel = 'info'; // !isProductionEnv ? 'debug' : 'info';

winston.setLevels(winston.config.npm.levels);
winston.addColors(winston.config.npm.colors);

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

class Logger {
  constructor(logger) {
    this.logger = logger;
    this.log = msg => this.logger.log(logLevel, msg);
    this.debug = msg => this.logger.debug(msg);
    this.info = msg => this.logger.info(msg);
    this.warn = msg => this.logger.warn(msg);
    this.error = msg => this.logger.error(msg);
  }
}

const transports = [
  new winston.transports.File({
    level: logLevel,
    filename: `${logDirectory}/logs.log`,
    maxsize: megabyteSize * 20,
  }),
];

if (!isProductionEnv) {
  transports.push(
    new winston.transports.Console({
      handleExceptions: true,
      level: logLevel,
      colorize: true,
    }));
}
const WinstonLogger = winston.Logger;
const logger = new WinstonLogger({
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: `${logDirectory}/exceptions.log`,
      maxsize: megabyteSize * 20,
    }),
    new winston.transports.Console({
      level: 'error',
      colorize: true,
    }),
  ],
  exitOnError: false,
});

module.exports = new Logger(logger);
