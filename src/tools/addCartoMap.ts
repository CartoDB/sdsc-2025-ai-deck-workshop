import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

export const addCartoMap: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[addCartoMap] Executing tool client-side');

  const { mapUrl } = toolCall.input as {
    mapUrl: string;
  };

  // Extract map ID from CARTO URL
  // Supports both formats:
  // - https://[domain].app.carto.com/viewer/{mapId}
  // - https://[domain].app.carto.com/builder/{mapId}
  const mapIdMatch = mapUrl.match(/\/(viewer|builder)\/([a-f0-9-]+)/i);

  if (!mapIdMatch || !mapIdMatch[2]) {
    return `Failed to extract map ID from URL: ${mapUrl}. Expected format: https://[domain].app.carto.com/viewer/[map-id] or https://[domain].app.carto.com/builder/[map-id]`;
  }

  const mapId = mapIdMatch[2];

  // Use Zustand store to set the CARTO map
  useMapStore.getState().setCartoMapId(mapId);

  return `Successfully added CARTO map (ID: ${mapId}) to the visualization. The map layers are now being loaded.`;
};
