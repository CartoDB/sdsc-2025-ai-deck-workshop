import { zoomToHome } from './zoomToHome';
import { zoomToLocation } from './zoomToLocation';

export const tools = {
  zoomToHome,
  zoomToLocation
};

export type ToolName = keyof typeof tools;