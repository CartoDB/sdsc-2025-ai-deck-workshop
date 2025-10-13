import { zoomToHome } from './zoomToHome';
import { zoomToLocation } from './zoomToLocation';
import { lookupAirport } from './lookupAirport';
import { drawWktGeometry } from './drawWktGeometry';
import { addCartoMap } from './addCartoMap';
import { applyPostProcessEffect } from './applyPostProcessEffect';
import { ToolFunction } from './types';

export const tools: Record<string, ToolFunction> = {
  zoomToHome,
  zoomToLocation,
  lookupAirport,
  drawWktGeometry,
  addCartoMap,
  applyPostProcessEffect
};

export type ToolName = keyof typeof tools;
export * from './types';