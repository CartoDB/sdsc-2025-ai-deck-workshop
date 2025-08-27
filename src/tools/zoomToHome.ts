import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

export const zoomToHome: ToolFunction = (toolCall: ToolCall): string => {
  useMapStore.getState().flyToHome();
  
  return 'Successfully zoomed to London coordinates.';
};