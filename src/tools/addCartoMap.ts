import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';

export const addCartoMapSchema = {
  description:
    "Add a CARTO map to the visualization by its CARTO URL (supports viewer, builder, and map URLs). The tool will extract the map ID from the URL and load the map's layers and configuration using the CARTO Maps API.",
  inputSchema: z.object({
    mapUrl: z
      .string()
      .describe(
        'CARTO URL (e.g. "https://clausa.app.carto.com/map/2d350d98-26b5-4827-a3dd-d62cdaff5ee0" or "https://clausa.app.carto.com/viewer/..." or "https://clausa.app.carto.com/builder/...")'
      ),
  }),
};

export const addCartoMap: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[addCartoMap] Executing tool client-side');

  const { mapUrl } = toolCall.input as {
    mapUrl: string;
  };

  // Extract map ID from CARTO URL
  // Supports multiple formats:
  // - https://[domain].app.carto.com/viewer/{mapId}
  // - https://[domain].app.carto.com/builder/{mapId}
  // - https://[domain].app.carto.com/map/{mapId}
  const mapIdMatch = mapUrl.match(/\/(viewer|builder|map)\/([a-f0-9-]+)/i);

  if (!mapIdMatch || !mapIdMatch[2]) {
    return `Failed to extract map ID from URL: ${mapUrl}. Expected format: https://[domain].app.carto.com/[viewer|builder|map]/[map-id]`;
  }

  const mapId = mapIdMatch[2];

  // Use Zustand store to set the CARTO map
  useMapStore.getState().setCartoMapId(mapId);

  return `Successfully added CARTO map (ID: ${mapId}) to the visualization. The map layers are now being loaded.`;
};
