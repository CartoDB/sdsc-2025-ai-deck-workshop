/**
 * MCP Client for CARTO workflows
 * Handles communication with CARTO MCP server
 */

import { mcpToolConfig } from '@/config/mcpTools';

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    additionalProperties: boolean
    $schema?: string
  }
}

export interface MCPToolCallResult {
  content: Array<{
    type: string
    text: string
  }>
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
 * List all available MCP tools from the server
 */
export async function listMCPTools(): Promise<MCPTool[]> {
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
      return jsonData.result.tools
    } else {
      console.error('Unexpected MCP response format:', jsonData)
      return []
    }
  } catch (error) {
    console.error('Error listing MCP tools:', error)
    return []
  }
}

/**
 * Call an MCP tool with given arguments
 */
export async function callMCPTool(
  toolName: string,
  args: Record<string, any>
): Promise<MCPToolCallResult> {
  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    },
    id: Date.now()
  }

  console.log('[MCP] Calling tool:', toolName, 'with args:', args)

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

    if (jsonData && jsonData.result) {
      return jsonData.result
    } else if (jsonData && jsonData.error) {
      throw new Error(`MCP error: ${jsonData.error.message}`)
    } else {
      throw new Error('Unexpected MCP response format')
    }
  } catch (error) {
    console.error('[MCP] Error calling tool:', error)
    throw error
  }
}