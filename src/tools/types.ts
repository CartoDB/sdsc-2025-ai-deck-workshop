export interface ToolCall {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  tool: string;
  output: string;
}

export type ToolFunction = (toolCall: ToolCall) => string;