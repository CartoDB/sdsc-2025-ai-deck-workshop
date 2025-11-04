import { create } from "zustand";
import { ToolFunction } from "@/tools/types";
import { tools as localTools } from "@/tools";

export interface ToolDefinition {
  type: 'local' | 'carto';
  execute?: ToolFunction;
}

interface ToolStore {
  tools: Record<string, ToolDefinition>;
  initialized: boolean;
  setCartoTools: (cartoToolNames: string[]) => void;
  getTool: (name: string) => ToolDefinition | undefined;
}

export const useToolStore = create<ToolStore>((set, get) => ({
  // Initialize with local tools
  tools: Object.keys(localTools).reduce((acc, key) => {
    acc[key] = {
      type: 'local',
      execute: localTools[key as keyof typeof localTools],
    };
    return acc;
  }, {} as Record<string, ToolDefinition>),

  initialized: false,

  setCartoTools: (cartoToolNames: string[]) => {
    set((state) => {
      const newTools = { ...state.tools };
      cartoToolNames.forEach((name) => {
        newTools[name] = { type: 'carto' };
      });
      return { tools: newTools, initialized: true };
    });
  },

  getTool: (name: string) => {
    return get().tools[name];
  },
}));
