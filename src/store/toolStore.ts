import { create } from "zustand";
import { ToolFunction } from "@/tools/types";
import { tools as localTools } from "@/tools";

interface ToolStore {
  tools: Record<string, ToolFunction>;
  addTool: (name: string, toolFunction: ToolFunction) => void;
  getTool: (name: string) => ToolFunction | undefined;
}

export const useToolStore = create<ToolStore>((set, get) => ({
  // Initialize with local tools
  tools: { ...localTools },

  addTool: (name: string, toolFunction: ToolFunction) => {
    set((state) => ({
      tools: { ...state.tools, [name]: toolFunction },
    }));
  },

  getTool: (name: string) => {
    return get().tools[name];
  },
}));
