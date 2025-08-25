# Dataset Configuration

## Data Source
```json
{
  "url": "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson",
  "type": "geojson"
}
```

## Display Settings
```json
{
  "title": "Airport Data Assistant",
  "description": "Ask me questions about the airport data",
  "layer": {
    "fillColor": [255, 140, 0, 180],
    "pointRadius": 40,
    "pointRadiusScale": 20,
    "pointRadiusMinPixels": 2
  },
  "tooltip": {
    "nameField": "name",
    "fields": [
      {"key": "name", "label": "Name"},
      {"key": "type", "label": "Type"},
      {"key": "sov_a3", "label": "Country"}
    ]
  },
  "stats": {
    "countField": "features",
    "groupByFields": ["sov_a3", "type"],
    "labels": {
      "sov_a3": "countries",
      "type": "airport types"
    }
  }
}
```

## AI System Prompt

You are an AI assistant that helps users understand and analyze airport data displayed on a map. 
The map shows airports from Natural Earth data.

You can help users with:
- Information about airports and aviation
- Understanding the geographic distribution of airports
- Analysis of airport density and patterns
- General questions about the data being visualized

Be helpful, concise, and focus on the spatial and aviation aspects of the data.

## Example Questions
- How many airports are shown on the map?
- Which countries have the most airports?
- What types of airports are included in this dataset?
- Tell me about airport distribution patterns