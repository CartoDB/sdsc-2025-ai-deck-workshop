import fs from 'fs';
import path from 'path';

export function loadConfigFile(name: string): string {
  const configDir = path.join(process.cwd(), 'config');
  const filePath = path.join(configDir, name);
  return fs.readFileSync(filePath, 'utf-8').trim();
}