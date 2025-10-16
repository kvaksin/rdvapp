const winston = require('winston');
require('winston-daily-rotate-file');

// Define log formats
const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  file: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
};

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: formats.console
    }),
    // Rotating file transport for production
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: formats.file
    }),
    // Error file transport
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: formats.file
    })
  ]
});

// Export logger
module.exports = logger;