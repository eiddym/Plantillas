const winston = require("winston");
const fs = require("fs");
winston.emitErrs = true;

const LOG_TO_FILE = process.env.LOG_TO_FILE || false;

if (!fs.existsSync("logs") && LOG_TO_FILE) {
fs.mkdirSync("logs");
}

let transportList = [
  new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  })
]

if (LOG_TO_FILE) {
  transportList.push(new winston.transports.File({
    level: 'info',
    filename: './logs/all-logs.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, //5MB
    maxFiles: 5,
    colorize: false,
  }));
}

const logger = new winston.Logger({
    transports: transportList,
    exitOnError: false
});

module.exports = logger;
