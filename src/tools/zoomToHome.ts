import { useMapStore } from '@/store/mapStore';

export interface ToolCall {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface AddToolResultParams {
  toolCallId: string;
  tool: string;
  output: string;
}

export interface ToolHandler {
  execute: (
    toolCall: ToolCall, 
    addToolResult: (params: AddToolResultParams) => void
  ) => void;
}

export const zoomToHome: ToolHandler = {
  execute: (toolCall, addToolResult) => {
    console.log('[zoomToHome] Executing tool client-side');
    
    // Use Zustand store directly
    useMapStore.getState().flyToHome();
    
    // Return result to AI
    addToolResult({
      toolCallId: toolCall.toolCallId,
      tool: toolCall.toolName,
      output: 'Successfully zoomed to London coordinates.',
    });
  }
};