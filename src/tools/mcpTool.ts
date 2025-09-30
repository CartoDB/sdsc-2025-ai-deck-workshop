import { callMCPTool } from '@/lib/mcpClient';
import { ToolCall } from './types';

/**
 * Generic MCP tool executor
 * Wraps any MCP tool and calls it through the MCP client
 * Note: This is an async function, but the AI SDK will handle it properly
 */
export function createMCPTool(toolName: string) {
  return async (toolCall: ToolCall): Promise<string> => {
    try {
      const result = await callMCPTool(toolName, toolCall.input);

      // Extract the text response from MCP result
      if (result.content && result.content.length > 0) {
        const textContent = result.content[0].text;

        // Try to parse if it's JSON for pretty formatting
        try {
          const data = JSON.parse(textContent);
          return `MCP Tool "${toolName}" result:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        } catch {
          // If not JSON, return as plain text
          return `MCP Tool "${toolName}" result:\n${textContent}`;
        }
      }

      return `MCP Tool "${toolName}" executed but returned no content`;
    } catch (error) {
      console.error(`[MCP Tool] Error executing ${toolName}:`, error);
      return `Error executing MCP tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };
}