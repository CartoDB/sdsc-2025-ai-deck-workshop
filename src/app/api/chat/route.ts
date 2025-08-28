import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { loadConfig } from '@/lib/config';
import { logToFile } from '@/lib/logger';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    logToFile('[API] Received request', { 
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });
    
    const config = loadConfig();

    const result = streamText({
      // model: anthropic('claude-3-7-sonnet-latest'), // Smart
      model: anthropic('claude-3-5-haiku-latest'), // Fast
      onToolCall: ({ toolCall }) => {
        logToFile('[API] Tool call received', { toolCall });
        console.log('[API] Tool call received:', JSON.stringify(toolCall, null, 2));
      },
      system: `${config.systemPrompt}

You have access to map control tools:
- zoomToHome: Zoom the map to London (home location)
- zoomToLocation: Zoom the map to any location by coordinates
- lookupAirport: Look up detailed information about an airport by its IATA code

IMPORTANT: When users ask for information about ANY airport, you MUST use the lookupAirport tool to get the actual data from the dataset. Do NOT use your general knowledge about airports. Always use the tool to provide accurate, dataset-specific information.

When users ask to go to a specific city, airport, or location (like "take me to Miami", "show me Paris", "zoom to Tokyo"), use the zoomToLocation tool with the appropriate coordinates.
When users ask to go home, zoom home, or see London, use the zoomToHome tool.
When users ask for information about a specific airport (like "tell me about Madrid airport", "info about LAX", "give me info about JFK"), you MUST determine the IATA code for that airport and use the lookupAirport tool to retrieve the actual data from the dataset.`,
      messages: convertToModelMessages(messages),
      tools: {
        zoomToHome: {
          description: 'Zoom the map to London (home location)',
          inputSchema: z.object({}),
        },
        zoomToLocation: {
          description: 'Zoom the map to a specific location by coordinates',
          inputSchema: z.object({
            longitude: z.number().describe('Longitude coordinate of the location'),
            latitude: z.number().describe('Latitude coordinate of the location'),
            locationName: z.string().describe('Name of the location for user feedback'),
            zoom: z.number().optional().describe('Zoom level (default: 10)'),
          }),
        },
        lookupAirport: {
          description: 'Look up detailed information about an airport by its IATA code from the loaded dataset. Use this tool whenever users ask for information about any airport.',
          inputSchema: z.object({
            iataCode: z.string().describe('3-letter IATA airport code (e.g. "MAD" for Madrid, "LAX" for Los Angeles)'),
          }),
        }
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    logToFile('[API] Error', { error: error.message });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}