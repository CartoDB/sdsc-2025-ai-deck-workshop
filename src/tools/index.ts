import { zoomToHome } from './zoomToHome';
import { zoomToLocation } from './zoomToLocation';
import { ToolFunction } from './types';

export const tools: Record<string, ToolFunction> = {
  zoomToHome,
  zoomToLocation
};

export type ToolName = keyof typeof tools;
export * from './types';