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
    "eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfY2I3YjkxNTEiLCJqdGkiOiI5NjM1Zjk2NSJ9.iiT3epMxX5tdzIYQJpj7Fe_50Z5XQ7yOCfJ5w6nVas8",

  // Whitelist of MCP tools to include
  // Only tools in this list will be exposed to Claude
  whitelist: ["get_buffer_around_location"],
};
