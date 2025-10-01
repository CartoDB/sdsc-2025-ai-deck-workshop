import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

export const drawWktGeometry: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[drawWktGeometry] Executing tool client-side');

  const { wkt, name, color } = toolCall.input as {
    wkt: string;
    name?: string;
    color?: [number, number, number, number];
  };

  if (!wkt) {
    return 'Error: WKT geometry string is required';
  }

  // Validate WKT format
  if (!wkt.trim().match(/^(POLYGON|MULTIPOLYGON)\s*\(/i)) {
    return 'Error: Only POLYGON and MULTIPOLYGON geometries are supported';
  }

  // Default color: semi-transparent blue
  const fillColor = color || [0, 100, 200, 100];

  // Use Zustand store to set the geometry
  useMapStore.getState().setWktGeometry({
    wkt,
    name,
    color: fillColor
  });

  const geometryType = wkt.trim().match(/^(POLYGON|MULTIPOLYGON)/i)?.[1] || 'geometry';
  const nameStr = name ? ` "${name}"` : '';

  return `Successfully drew ${geometryType}${nameStr} on the map.`;
};
