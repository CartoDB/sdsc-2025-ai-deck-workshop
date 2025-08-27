import fs from 'fs';
import path from 'path';
import { AppConfig } from '@/types/config';

export function loadConfig(): AppConfig {
  const configDir = path.join(process.cwd(), 'config');
  
  // Load main configuration
  const configPath = path.join(configDir, 'config.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  
  // Load system prompt
  const systemPromptPath = path.join(configDir, 'system-prompt.md');
  const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8').trim();
  
  return {
    dataSource: config.dataSource,
    displaySettings: config.displaySettings,
    systemPrompt,
    exampleQuestions: config.exampleQuestions
  };
}