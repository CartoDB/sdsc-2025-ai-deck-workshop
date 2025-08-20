## SDSC workshop demo

I will be presenting a workshop at the Spatial Data Science Conference, it will be one hour long and the audience will be technical

## Demo

The demo I would like to give should introduce the following concepts:

- building an agentic AI app
- using deck.gl for visualization
- using the MCP API of CARTO to execute a workflow (https://carto.com/workflows)

## Task

I want you create a simple app using the Vercel AI SDK: https://ai-sdk.dev/docs/introduction. It should:

- Show a maplibre map with a deck.gl overlay (use this as a starting point: https://github.com/visgl/deck.gl/blob/master/examples/get-started/react/maplibre/app.jsx)
- Use Claude for the AI backend
- In addition to the map, there should be a chat box to interact with the AI
- The chat should understand the context of the map, in this simple example it should be possible to ask it questions about the dataset displayed: https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson
- Do not add the CARTO MCP API for now

## Acceptance

Verify the code is working using `yarn build`. After any change run `yarn lint` to check for errors.
