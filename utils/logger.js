const fs = require('fs');
const path = require('path');

const LOG_DIR = './logs';

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const log = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const fullMessage = data ? `${logMessage} | ${JSON.stringify(data)}` : logMessage;

  console.log(fullMessage);

  // Write to file
  const logFile = path.join(LOG_DIR, `dvsa-monitor-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, fullMessage + '\n');
};

const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
  debug: (message, data) => log('debug', message, data),
  success: (message, data) => log('success', message, data)
};

module.exports = logger;
