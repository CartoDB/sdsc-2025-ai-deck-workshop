import { zoomToHome } from './zoomToHome';
import { zoomToLocation } from './zoomToLocation';
import { lookupAirport } from './lookupAirport';
import { ToolFunction } from './types';

export const tools: Record<string, ToolFunction> = {
  zoomToHome,
  zoomToLocation,
  lookupAirport
};

export type ToolName = keyof typeof tools;
export * from './types';