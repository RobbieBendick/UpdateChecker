import winston from 'winston';

const format = winston.format.printf(
  ({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level} [${meta.namespace}] ${message}`;
  }
);

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.colorize(),
  format
);

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Configure transports based on environment
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
  }),
];

// Only add file transports if not on Vercel (serverless doesn't support file system writes)
if (!isVercel) {
  transports.push(
    new winston.transports.File({
      filename: 'src/server/logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
    }),
    new winston.transports.File({
      filename: 'src/server/logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
    })
  );
}

const Logger = winston.createLogger({
  format: logFormat,
  transports,
});

export default Logger;

