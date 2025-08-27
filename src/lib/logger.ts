import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'debug.log');

export function logToFile(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  const fullEntry = data ? `${logEntry} ${JSON.stringify(data, null, 2)}\n` : `${logEntry}\n`;
  
  try {
    fs.appendFileSync(logFile, fullEntry);
    console.log(logEntry); // Also log to console
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}