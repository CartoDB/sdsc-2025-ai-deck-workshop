import { zoomToHome } from './zoomToHome';
import { zoomToLocation } from './zoomToLocation';
import { lookupAirport } from './lookupAirport';
import { drawWktGeometry } from './drawWktGeometry';
import { getDrawnRegion } from './getDrawnRegion';
import { addCartoMap } from './addCartoMap';
import { applyPostProcessEffect } from './applyPostProcessEffect';
import { ToolFunction } from './types';

export const tools: Record<string, ToolFunction> = {
  zoomToHome,
  zoomToLocation,
  lookupAirport,
  drawWktGeometry,
  getDrawnRegion,
  addCartoMap,
  applyPostProcessEffect
};

export type ToolName = keyof typeof tools;
export * from './types';