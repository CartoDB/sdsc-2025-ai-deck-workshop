import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';

export const drawWktGeometrySchema = {
  description:
    "Draw a WKT (Well-Known Text) geometry on the map using deck.gl SolidPolygonLayer. Supports POLYGON and MULTIPOLYGON formats. Use this to visualize geometric shapes like buffers, boundaries, or analysis results.",
  inputSchema: z.object({
    wkt: z
      .string()
      .describe(
        'WKT geometry string (e.g. "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))")'
      ),
    name: z
      .string()
      .optional()
      .describe("Optional name for the geometry"),
    color: z
      .array(z.number())
      .optional()
      .describe(
        "Optional RGBA color array [r, g, b, a] where values are 0-255 for RGB and 0-255 for alpha"
      ),
  }),
};

export const drawWktGeometry: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[drawWktGeometry] Executing tool client-side');
  const { wkt, name, color } = drawWktGeometrySchema.inputSchema.parse(toolCall.input);

  if (!wkt.trim().match(/^(POLYGON|MULTIPOLYGON)\s*\(/i)) {
    return 'Error: Only POLYGON and MULTIPOLYGON geometries are supported';
  }

  const fillColor = color || [0, 100, 200, 100];

  useMapStore.getState().setWktGeometry({
    wkt,
    name,
    color: fillColor
  });

  const geometryType = wkt.trim().match(/^(POLYGON|MULTIPOLYGON)/i)?.[1] || 'geometry';
  const nameStr = name ? ` "${name}"` : '';

  return `Successfully drew ${geometryType}${nameStr} on the map.`;
};
