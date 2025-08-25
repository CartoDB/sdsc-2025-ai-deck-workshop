import fs from 'fs';
import path from 'path';
import { AppConfig } from '@/types/config';

export function loadConfig(): AppConfig {
  const configPath = path.join(process.cwd(), 'config.md');
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract JSON blocks
  const jsonBlocks = content.match(/```json\n([\s\S]*?)\n```/g) || [];
  
  if (jsonBlocks.length < 2) {
    throw new Error('Config file must contain at least data source and display settings JSON blocks');
  }
  
  // Parse data source
  const dataSourceJson = jsonBlocks[0].replace(/```json\n|\n```/g, '');
  const dataSource = JSON.parse(dataSourceJson);
  
  // Parse display settings
  const displayJson = jsonBlocks[1].replace(/```json\n|\n```/g, '');
  const displaySettings = JSON.parse(displayJson);
  
  // Extract system prompt
  const promptMatch = content.match(/## AI System Prompt\n\n([\s\S]*?)(?=\n##|$)/);
  const systemPrompt = promptMatch ? promptMatch[1].trim() : 'You are a helpful assistant.';
  
  // Extract example questions
  const exampleMatch = content.match(/## Example Questions\n([\s\S]*?)(?=\n##|$)/);
  const exampleText = exampleMatch ? exampleMatch[1] : '';
  const exampleQuestions = exampleText
    .split('\n')
    .filter(line => line.startsWith('- '))
    .map(line => line.substring(2));
  
  return {
    dataSource,
    displaySettings,
    systemPrompt,
    exampleQuestions
  };
}