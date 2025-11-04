import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';

export const lookupAirportSchema = {
  description:
    "Look up detailed information about an airport by its IATA code from the loaded dataset. Use this tool whenever users ask for information about any airport.",
  inputSchema: z.object({
    iataCode: z
      .string()
      .describe(
        '3-letter IATA airport code (e.g. "MAD" for Madrid, "LAX" for Los Angeles)'
      ),
  }),
};

export const lookupAirport: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[lookupAirport] Executing tool client-side');
  const { iataCode } = lookupAirportSchema.inputSchema.parse(toolCall.input);

  const data = useMapStore.getState().airportData;

  if (!data?.features) {
    return 'No airport data available. Please wait for the map to load.';
  }

  const airport = data.features.find(feature =>
    feature.properties.iata_code === iataCode.toUpperCase()
  );

  if (!airport) {
    return `No airport found with IATA code: ${iataCode}`;
  }

  return `Airport information for ${iataCode}:\n\`\`\`json\n${JSON.stringify(airport.properties, null, 2)}\n\`\`\``;
};