import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

export const getDrawnRegion: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[getDrawnRegion] Executing tool client-side');

  const wktGeometry = useMapStore.getState().wktGeometry;

  if (!wktGeometry || !wktGeometry.wkt) {
    return 'Error: No region has been drawn on the map yet. Please ask the user to draw a region first using the "Draw Region" button.';
  }

  return JSON.stringify({
    wkt: wktGeometry.wkt,
    name: wktGeometry.name || 'User drawn region',
    message: 'Successfully retrieved the drawn region. You can now use this WKT geometry with MCP tools like get_area.'
  });
};
