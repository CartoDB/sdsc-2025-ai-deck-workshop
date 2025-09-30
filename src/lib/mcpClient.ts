/**
 * MCP Client for CARTO workflows
 * Handles communication with CARTO MCP server
 */

const MCP_SERVER_URL = 'https://gcp-us-east1.api.carto.com/mcp/ac_cb7b9151'
const API_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfY2I3YjkxNTEiLCJqdGkiOiI5NjM1Zjk2NSJ9.iiT3epMxX5tdzIYQJpj7Fe_50Z5XQ7yOCfJ5w6nVas8'

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
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
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
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
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