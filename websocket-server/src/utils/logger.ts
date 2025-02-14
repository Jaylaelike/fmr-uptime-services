export function logInfo(message: string) {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
}

export function logError(message: string) {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
}

export function logDebug(message: string) {
  if (process.env.DEBUG) {
    console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
  }
}