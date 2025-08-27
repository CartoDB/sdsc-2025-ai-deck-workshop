import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

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