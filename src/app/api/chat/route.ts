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
      model: anthropic('claude-3-haiku-20240307'),
      system: `${config.systemPrompt}

You have access to map control tools:
- zoomToHome: Zoom the map to London (home location)
- zoomToLocation: Zoom the map to any location by coordinates

When users ask to go to a specific city, airport, or location (like "take me to Miami", "show me Paris", "zoom to Tokyo"), use the zoomToLocation tool with the appropriate coordinates.
When users ask to go home, zoom home, or see London, use the zoomToHome tool.`,
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