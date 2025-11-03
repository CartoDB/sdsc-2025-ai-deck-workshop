import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';

export const zoomToHomeSchema = {
  description: "Zoom the map to London (home location)",
  inputSchema: z.object({}),
};

export const zoomToHome: ToolFunction = (toolCall: ToolCall): string => {
  useMapStore.getState().flyToHome();

  return 'Successfully zoomed to London coordinates.';
};