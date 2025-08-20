# SDSC Workshop Demo - Airport Data Visualization

An interactive web application that combines MapLibre GL JS with deck.gl for visualizing global airport data, integrated with Claude AI for intelligent data analysis.

## Features

- **Interactive Map**: MapLibre GL JS map with custom CARTO basemap
- **Airport Visualization**: deck.gl overlay showing global airports from Natural Earth data
- **AI-Powered Chat**: Chat interface powered by Claude AI that understands the airport data context
- **Real-time Interaction**: Hover over airports to see details, ask the AI questions about patterns and distributions

## Tech Stack

- Next.js 15 with TypeScript
- MapLibre GL JS for mapping
- deck.gl for data visualization
- Vercel AI SDK with Anthropic Claude
- Tailwind CSS for styling

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Create a `.env.local` file and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Start the development server:
   ```bash
   npx next dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application

## Usage

- The left side shows an interactive map with airport data
- Hover over airport dots to see details
- Use the chat interface on the right to ask questions about the data
- Example questions:
  - "How many airports are shown on the map?"
  - "Which countries have the most airports?"
  - "What types of airports are included?"
  - "Tell me about airport distribution patterns"

## Data Source

Airport data is sourced from Natural Earth:
https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson