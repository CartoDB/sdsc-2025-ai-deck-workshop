import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall, ToolResult } from './types';

export const zoomToHome: ToolFunction = (toolCall: ToolCall): ToolResult => {
  console.log('[zoomToHome] Executing tool client-side');
  
  // Use Zustand store directly
  useMapStore.getState().flyToHome();
  
  // Return result parameters
  return {
    toolCallId: toolCall.toolCallId,
    tool: toolCall.toolName,
    output: 'Successfully zoomed to London coordinates.',
  };
};