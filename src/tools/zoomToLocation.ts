import { ToolHandler } from './zoomToHome';
import { useMapStore } from '@/store/mapStore';

export const zoomToLocation: ToolHandler = {
  execute: (toolCall, addToolResult) => {
    console.log('[zoomToLocation] Executing tool client-side');
    
    const { longitude, latitude, locationName, zoom = 10 } = toolCall.input as {
      longitude: number;
      latitude: number;
      locationName: string;
      zoom?: number;
    };
    
    // Use Zustand store directly
    useMapStore.getState().flyToLocation(longitude, latitude, zoom);
    
    // Return result to AI
    addToolResult({
      toolCallId: toolCall.toolCallId,
      tool: toolCall.toolName,
      output: `Successfully zoomed to ${locationName} at coordinates ${latitude}, ${longitude}.`,
    });
  }
};