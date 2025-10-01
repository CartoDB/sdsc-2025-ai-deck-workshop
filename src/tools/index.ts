import { zoomToHome } from './zoomToHome';
import { zoomToLocation } from './zoomToLocation';
import { lookupAirport } from './lookupAirport';
import { drawWktGeometry } from './drawWktGeometry';
import { ToolFunction } from './types';

export const tools: Record<string, ToolFunction> = {
  zoomToHome,
  zoomToLocation,
  lookupAirport,
  drawWktGeometry
};

export type ToolName = keyof typeof tools;
export * from './types';