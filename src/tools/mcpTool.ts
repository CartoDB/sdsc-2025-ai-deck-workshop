import { callCartoTool } from '@/lib/cartoClient';
import { ToolCall } from './types';

/**
 * Generic CARTO tool executor
 * Wraps any CARTO MCP tool and calls it through the CARTO client
 * Note: This is an async function, but the AI SDK will handle it properly
 */
export function createCartoTool(toolName: string) {
  return async (toolCall: ToolCall): Promise<string> => {
    try {
      const result = await callCartoTool(toolName, toolCall.input);

      // Extract the text response from CARTO MCP result
      if (result.content && result.content.length > 0) {
        const textContent = result.content[0].text;

        // Try to parse if it's JSON for pretty formatting
        try {
          const data = JSON.parse(textContent);
          return `CARTO Tool "${toolName}" result:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        } catch {
          // If not JSON, return as plain text
          return `CARTO Tool "${toolName}" result:\n${textContent}`;
        }
      }

      return `CARTO Tool "${toolName}" executed but returned no content`;
    } catch (error) {
      console.error(`[CARTO Tool] Error executing ${toolName}:`, error);
      return `Error executing CARTO tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };
}