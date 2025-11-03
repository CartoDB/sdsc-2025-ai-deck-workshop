import { zoomToHome, zoomToHomeSchema } from './zoomToHome';
import { zoomToLocation, zoomToLocationSchema } from './zoomToLocation';
import { lookupAirport, lookupAirportSchema } from './lookupAirport';
import { drawWktGeometry, drawWktGeometrySchema } from './drawWktGeometry';
import { addCartoMap, addCartoMapSchema } from './addCartoMap';
import { applyPostProcessEffect, applyPostProcessEffectSchema } from './applyPostProcessEffect';
import { ToolFunction } from './types';

export const tools: Record<string, ToolFunction> = {
  zoomToHome,
  zoomToLocation,
  lookupAirport,
  drawWktGeometry,
  addCartoMap,
  applyPostProcessEffect
};

export const localToolSchemas: Record<string, any> = {
  zoomToHome: zoomToHomeSchema,
  zoomToLocation: zoomToLocationSchema,
  lookupAirport: lookupAirportSchema,
  drawWktGeometry: drawWktGeometrySchema,
  addCartoMap: addCartoMapSchema,
  applyPostProcessEffect: applyPostProcessEffectSchema
};

export type ToolName = keyof typeof tools;
export * from './types';