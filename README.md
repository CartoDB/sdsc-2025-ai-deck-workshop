# SDSC Workshop - Spatial AI Demo

An interactive map application demonstrating Claude AI integration with spatial data using CARTO's MCP server. Features airport data visualization and AI-powered spatial analysis.

## Features

- **Interactive Map**: MapLibre GL with deck.gl visualization layers
- **Drawing Tools**: Draw and analyze custom regions on the map
- **Claude AI Chat**: Natural language interface for spatial queries and map control
- **CARTO MCP Integration**: Access spatial analysis tools (isolines, buffers, area calculations)
- **Custom Tools**: Location search, airport lookup, geometry visualization

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Create `.env.local` with required keys:
   ```
   ANTHROPIC_API_KEY=your_anthropic_key
   CARTO_MCP_SERVER_URL=your_carto_mcp_url
   CARTO_API_TOKEN=your_carto_token
   ```

3. Run the development server:
   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

- **Map**: Navigate and interact with the airport data layer
- **Chat**: Ask questions or give commands like:
  - "Draw a 30-minute isoline around San Francisco"
  - "Show me airports near London"
  - "Calculate the area of the drawn region"
  - "Zoom to New York"
- **Drawing**: Use the drawing tools to create regions for spatial analysis

## Tech Stack

Next.js 15, TypeScript, MapLibre GL, deck.gl, Claude AI (Vercel AI SDK), CARTO MCP Server
