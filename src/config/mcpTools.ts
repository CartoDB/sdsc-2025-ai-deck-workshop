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
  serverUrl: "https://gcp-us-east1.api.carto.com/mcp/ac_cb7b9151",
  apiToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfY2I3YjkxNTEiLCJqdGkiOiJhOGE2NmM0OSJ9.QfHjGrVXnnObLY3_IzPczqJxiWjkiLvaonsWRnSeO4w",

  // Whitelist of MCP tools to include
  // Only tools in this list will be exposed to Claude
  whitelist: ["get_isolines_around_location", "get_buffer_around_location"],
};
