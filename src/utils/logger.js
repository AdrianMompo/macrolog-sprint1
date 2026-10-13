function writeLog(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details
  };

  const serializedEntry = JSON.stringify(entry);

  if (level === "error") {
    console.error(serializedEntry);
  } else {
    console.log(serializedEntry);
  }
}

export const logger = {
  info(event, details) {
    writeLog("info", event, details);
  },

  error(event, details) {
    writeLog("error", event, details);
  }
};