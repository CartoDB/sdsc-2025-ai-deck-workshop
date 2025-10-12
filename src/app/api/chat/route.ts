import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { loadConfig } from "@/lib/config";
import { logToFile } from "@/lib/logger";
import { listMCPTools } from "@/lib/mcpClient";
import { mcpToolConfig } from "@/config/mcpTools";
import { z } from "zod";

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
      case "string":
        zodType = z.string();
        break;
      case "number":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "object":
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
    logToFile("[API] Received request", {
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1],
    });

    const config = loadConfig();

    // Fetch MCP tools dynamically
    const mcpTools = await listMCPTools();
    logToFile("[API] Loaded MCP tools", {
      count: mcpTools.length,
      tools: mcpTools.map((t) => t.name),
    });

    // Build tools object with both local and MCP tools
    const tools: Record<string, any> = {
      zoomToHome: {
        description: "Zoom the map to London (home location)",
        inputSchema: z.object({}),
      },
      zoomToLocation: {
        description: "Zoom the map to a specific location by coordinates",
        inputSchema: z.object({
          longitude: z
            .number()
            .describe("Longitude coordinate of the location"),
          latitude: z.number().describe("Latitude coordinate of the location"),
          locationName: z
            .string()
            .describe("Name of the location for user feedback"),
          zoom: z.number().optional().describe("Zoom level (default: 10)"),
        }),
      },
      lookupAirport: {
        description:
          "Look up detailed information about an airport by its IATA code from the loaded dataset. Use this tool whenever users ask for information about any airport.",
        inputSchema: z.object({
          iataCode: z
            .string()
            .describe(
              '3-letter IATA airport code (e.g. "MAD" for Madrid, "LAX" for Los Angeles)'
            ),
        }),
      },
      drawWktGeometry: {
        description:
          "Draw a WKT (Well-Known Text) geometry on the map using deck.gl SolidPolygonLayer. Supports POLYGON and MULTIPOLYGON formats. Use this to visualize geometric shapes like buffers, boundaries, or analysis results.",
        inputSchema: z.object({
          wkt: z
            .string()
            .describe(
              'WKT geometry string (e.g. "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))")'
            ),
          name: z
            .string()
            .optional()
            .describe("Optional name for the geometry"),
          color: z
            .array(z.number())
            .optional()
            .describe(
              "Optional RGBA color array [r, g, b, a] where values are 0-255 for RGB and 0-255 for alpha"
            ),
        }),
      },
      getDrawnRegion: {
        description:
          "Get the WKT geometry of the region that the user has drawn on the map. Use this tool when users ask about the drawn region (e.g., 'what is the area of this region?', 'analyze this region'). Returns the WKT string that can be passed to MCP tools like get_area.",
        inputSchema: z.object({}),
      },
      addCartoMap: {
        description:
          "Add a CARTO map to the visualization by its CARTO URL (supports both viewer and builder URLs). The tool will extract the map ID from the URL and load the map's layers and configuration using the CARTO Maps API.",
        inputSchema: z.object({
          mapUrl: z
            .string()
            .describe(
              'CARTO URL with viewer or builder format (e.g. "https://clausa.app.carto.com/viewer/1c43588e-7f6e-4fa8-b529-076d847934f5" or "https://clausa.app.carto.com/builder/1c43588e-7f6e-4fa8-b529-076d847934f5")'
            ),
        }),
      },
    };

    // Add only whitelisted MCP tools
    const whitelistedMcpTools = mcpTools.filter((tool) =>
      mcpToolConfig.whitelist.includes(tool.name)
    );

    logToFile("[API] Whitelisted MCP tools", {
      count: whitelistedMcpTools.length,
      tools: whitelistedMcpTools.map((t) => t.name),
    });

    for (const mcpTool of whitelistedMcpTools) {
      tools[mcpTool.name] = {
        description: mcpTool.description,
        inputSchema: jsonSchemaToZod(mcpTool.inputSchema),
      };
    }

    // Build system prompt with only whitelisted MCP tools
    const mcpToolDescriptions = whitelistedMcpTools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    const result = streamText({
      // model: anthropic('claude-3-7-sonnet-latest'), // Smart
      model: anthropic("claude-3-5-haiku-latest"), // Fast
      onToolCall: ({ toolCall }) => {
        logToFile("[API] Tool call received", { toolCall });
        console.log(
          "[API] Tool call received:",
          JSON.stringify(toolCall, null, 2)
        );
      },
      system: `${config.systemPrompt}

You have access to map control and visualization tools:
- zoomToHome: Zoom the map to London (home location)
- zoomToLocation: Zoom the map to any location by coordinates
- lookupAirport: Look up detailed information about an airport by its IATA code
- drawWktGeometry: Draw WKT geometry (POLYGON/MULTIPOLYGON) on the map to visualize shapes and boundaries
- getDrawnRegion: Get the WKT geometry of the region the user has drawn on the map (for use with MCP tools)
- addCartoMap: Add a CARTO map to the visualization using a CARTO Builder viewer URL

You also have access to CARTO MCP geospatial workflow tools:
${mcpToolDescriptions}

IMPORTANT: When users ask for information about ANY airport, you MUST use the lookupAirport tool to get the actual data from the dataset. Do NOT use your general knowledge about airports. Always use the tool to provide accurate, dataset-specific information.

When users ask to go to a specific city, airport, or location (like "take me to Miami", "show me Paris", "zoom to Tokyo"), use the zoomToLocation tool with the appropriate coordinates.
When users ask to go home, zoom home, or see London, use the zoomToHome tool.
When users ask for information about a specific airport (like "tell me about Madrid airport", "info about LAX", "give me info about JFK"), you MUST determine the IATA code for that airport and use the lookupAirport tool to retrieve the actual data from the dataset.

For geospatial analysis, use the appropriate MCP tools. These tools can perform operations like creating buffers around points, enriching areas with demographic data, analyzing fires in boundaries, etc.

IMPORTANT: When you receive WKT geometry output from MCP tools that CREATE NEW geometries (like get_buffer_around_location, get_isolines_around_location), ALWAYS use the drawWktGeometry tool to visualize the result on the map. Extract the WKT string from the MCP tool output and pass it to drawWktGeometry. After the geometry is drawn, zoom to the location using the zoomToLocation tool.

IMPORTANT: When users ask about the drawn region (e.g., "what is the area of this region?", "how big is this region?"), you MUST:
1. First use the getDrawnRegion tool to retrieve the WKT geometry
2. Then use the appropriate MCP tool (like get_area) with the WKT string from step 1
3. Present the result to the user in a clear, understandable format
4. DO NOT draw the geometry again with drawWktGeometry - it's already visible on the map`,
      messages: convertToModelMessages(messages),
      tools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    logToFile("[API] Error", { error: error.message });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
