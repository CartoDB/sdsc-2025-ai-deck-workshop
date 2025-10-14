/**
 * MCP Tools Configuration
 * Configure which MCP tools to expose to the AI
 */

export interface MCPToolConfig {
  serverUrl: string;
  apiToken: string;
  whitelist: string[];
}

export const mcpToolConfig: MCPToolConfig = {
  // CARTO MCP Server
  // Use NEXT_PUBLIC_ prefixed vars for client-side, regular vars for server-side
  serverUrl:
    process.env.NEXT_PUBLIC_CARTO_MCP_SERVER_URL ||
    process.env.CARTO_MCP_SERVER_URL ||
    "",
  apiToken:
    process.env.NEXT_PUBLIC_CARTO_API_TOKEN ||
    process.env.CARTO_API_TOKEN ||
    "",

  // Whitelist of MCP tools to include
  // Only tools in this list will be exposed to Claude
  whitelist: ["get_buffer_around_location"],
};
