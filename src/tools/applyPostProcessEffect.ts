import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

export const applyPostProcessEffect: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[applyPostProcessEffect] Executing tool client-side');

  const { brightness = 0.0, contrast = 0.0 } = toolCall.input as {
    brightness?: number;
    contrast?: number;
  };

  // Validate input ranges
  if (brightness < -1 || brightness > 1) {
    return `Invalid brightness value: ${brightness}. Must be between -1 and 1 (default: 0, where -1 is black, 0 is no change, 1 is white)`;
  }

  if (contrast < -1 || contrast > 1) {
    return `Invalid contrast value: ${contrast}. Must be between -1 and 1 (default: 0, where -1 is gray, 0 is no change, 1 is max contrast)`;
  }

  // Use Zustand store to set the post-process effect parameters
  useMapStore.getState().setPostProcessEffect({ brightness, contrast });

  const effects: string[] = [];
  if (brightness !== 0.0) effects.push(`brightness: ${brightness}`);
  if (contrast !== 0.0) effects.push(`contrast: ${contrast}`);

  return effects.length > 0
    ? `Successfully applied post-process effects: ${effects.join(', ')}`
    : 'Post-process effects reset to defaults';
};
