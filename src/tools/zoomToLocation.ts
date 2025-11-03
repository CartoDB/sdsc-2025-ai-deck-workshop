import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';

export const zoomToLocationSchema = {
  description: "Zoom the map to a specific location by coordinates",
  inputSchema: z.object({
    longitude: z
      .number()
      .describe("Longitude coordinate of the location"),
    latitude: z.number().describe("Latitude coordinate of the location"),
    locationName: z
      .string()
      .describe("Name of the location for user feedback"),
    zoom: z.number().optional().describe("Zoom level (default: 10)"),
  }),
};

export const zoomToLocation: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[zoomToLocation] Executing tool client-side');
  
  const { longitude, latitude, locationName, zoom = 10 } = toolCall.input as {
    longitude: number;
    latitude: number;
    locationName: string;
    zoom?: number;
  };
  
  // Use Zustand store directly
  useMapStore.getState().flyToLocation(longitude, latitude, zoom);
  
  return `Successfully zoomed to ${locationName} at coordinates ${latitude}, ${longitude}.`;
};