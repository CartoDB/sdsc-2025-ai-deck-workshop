import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { loadConfig } from '@/lib/config';
import { logToFile } from '@/lib/logger';
import { listMCPTools } from '@/lib/mcpClient';
import { z } from 'zod';

export const maxDuration = 30;

// Convert MCP JSON schema to Zod schema
function jsonSchemaToZod(schema: any): z.ZodTypeAny {
  if (!schema.properties) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    const propSchema = prop as any;
    let zodType: z.ZodTypeAny;

    switch (propSchema.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'object':
        zodType = z.record(z.any());
        break;
      default:
        zodType = z.any();
    }

    if (propSchema.description) {
      zodType = zodType.describe(propSchema.description);
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    logToFile('[API] Received request', {
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    const config = loadConfig();

    // Fetch MCP tools dynamically
    const mcpTools = await listMCPTools();
    logToFile('[API] Loaded MCP tools', { count: mcpTools.length, tools: mcpTools.map(t => t.name) });

    // Build tools object with both local and MCP tools
    const tools: Record<string, any> = {
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
    };

    // Pattern for valid Anthropic tool names
    const validToolNamePattern = /^[a-zA-Z0-9_-]{1,128}$/;

    // Add MCP tools dynamically - only those with valid names
    const validMcpTools = mcpTools.filter(tool => validToolNamePattern.test(tool.name));
    const invalidMcpTools = mcpTools.filter(tool => !validToolNamePattern.test(tool.name));

    if (invalidMcpTools.length > 0) {
      logToFile('[API] Skipped invalid MCP tools', {
        count: invalidMcpTools.length,
        tools: invalidMcpTools.map(t => t.name)
      });
    }

    for (const mcpTool of validMcpTools) {
      tools[mcpTool.name] = {
        description: mcpTool.description,
        inputSchema: jsonSchemaToZod(mcpTool.inputSchema),
      };
    }

    // Build system prompt with only valid MCP tools
    const mcpToolDescriptions = validMcpTools.map(t => `- ${t.name}: ${t.description}`).join('\n');

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

You also have access to CARTO MCP geospatial workflow tools:
${mcpToolDescriptions}

IMPORTANT: When users ask for information about ANY airport, you MUST use the lookupAirport tool to get the actual data from the dataset. Do NOT use your general knowledge about airports. Always use the tool to provide accurate, dataset-specific information.

When users ask to go to a specific city, airport, or location (like "take me to Miami", "show me Paris", "zoom to Tokyo"), use the zoomToLocation tool with the appropriate coordinates.
When users ask to go home, zoom home, or see London, use the zoomToHome tool.
When users ask for information about a specific airport (like "tell me about Madrid airport", "info about LAX", "give me info about JFK"), you MUST determine the IATA code for that airport and use the lookupAirport tool to retrieve the actual data from the dataset.

For geospatial analysis, use the appropriate MCP tools. These tools can perform operations like creating buffers around points, enriching areas with demographic data, analyzing fires in boundaries, etc.`,
      messages: convertToModelMessages(messages),
      tools
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