class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }
    this.logs = [];
    Logger.instance = this;
  }

  log(message, level = 'INFO') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.logs.push(logEntry);
    console.log(`[${logEntry.level}] ${logEntry.timestamp}: ${message}`);
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  getLogs() {
    return this.logs;
  }
}

module.exports = new Logger();