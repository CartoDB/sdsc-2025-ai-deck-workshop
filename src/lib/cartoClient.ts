/**
 * CARTO Client for MCP workflows
 * Handles communication with CARTO MCP server
 */

import { mcpToolConfig } from '@/config/mcpTools';
import { JSONSchema7 } from 'ai';
import { ToolFunction } from '@/tools/types';

export interface CartoTool {
  name: string
  description: string
  inputSchema: JSONSchema7
}


/**
 * Parse SSE response from MCP server
 */
function parseSSEResponse(text: string): any {
  const lines = text.split('\n')
  let jsonData = null

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      jsonData = JSON.parse(line.substring(6))
    }
  }

  return jsonData
}

/**
 * List whitelisted CARTO tools from the MCP server
 */
export async function listCartoTools(): Promise<CartoTool[]> {
  const request = {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  }

  try {
    const response = await fetch(mcpToolConfig.serverUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mcpToolConfig.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify(request)
    })

    const text = await response.text()
    const jsonData = parseSSEResponse(text)

    if (jsonData && jsonData.result && jsonData.result.tools) {
      // Filter to only whitelisted tools
      return jsonData.result.tools.filter((tool: CartoTool) =>
        mcpToolConfig.whitelist.includes(tool.name)
      )
    } else {
      console.error('Unexpected CARTO MCP response format:', jsonData)
      return []
    }
  } catch (error) {
    console.error('Error listing CARTO tools:', error)
    return []
  }
}

/**
 * Create a ToolFunction wrapper for a CARTO tool
 */
export function createCartoToolFunction(name: string): ToolFunction {
  return async (toolCall: any): Promise<string> => {
    return await callCartoTool(name, toolCall.input);
  };
}

/**
 * Call a CARTO MCP tool with given arguments and return formatted output
 * Catches all errors and returns them as formatted strings
 */
export async function callCartoTool(
  toolName: string,
  args: Record<string, any>
): Promise<string> {
  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    },
    id: Date.now()
  }

  console.log('[CARTO] Calling tool:', toolName, 'with args:', args)

  try {
    const response = await fetch(mcpToolConfig.serverUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mcpToolConfig.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify(request)
    })

    console.log('[CARTO] Response status:', response.status, response.statusText)

    const text = await response.text()
    console.log('[CARTO] Raw response text:', text.substring(0, 500))

    const jsonData = parseSSEResponse(text)
    console.log('[CARTO] Parsed response:', jsonData)

    if (jsonData && jsonData.result) {
      console.log('[CARTO] Tool call successful, result:', jsonData.result)

      // Extract and format the result
      if (jsonData.result.content && jsonData.result.content.length > 0) {
        const textContent = jsonData.result.content[0].text;

        // Try to parse and format JSON
        try {
          const data = JSON.parse(textContent);
          return `MCP Tool "${toolName}" result:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        } catch {
          // Not JSON, return as text
          return `MCP Tool "${toolName}" result:\n${textContent}`;
        }
      } else {
        return `MCP tool executed but returned no content`;
      }
    } else if (jsonData && jsonData.error) {
      console.error('[CARTO] Tool call error:', jsonData.error)
      return `Error executing MCP tool "${toolName}": ${jsonData.error.message}`;
    } else {
      console.error('[CARTO] Unexpected response format:', jsonData)
      return `Error executing MCP tool "${toolName}": Unexpected response format`;
    }
  } catch (error) {
    console.error('[CARTO] Error calling tool:', error)
    return `Error executing MCP tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}