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
      addCartoMap: {
        description:
          "Add a CARTO map to the visualization by its CARTO URL (supports viewer, builder, and map URLs). The tool will extract the map ID from the URL and load the map's layers and configuration using the CARTO Maps API.",
        inputSchema: z.object({
          mapUrl: z
            .string()
            .describe(
              'CARTO URL (e.g. "https://clausa.app.carto.com/map/2d350d98-26b5-4827-a3dd-d62cdaff5ee0" or "https://clausa.app.carto.com/viewer/..." or "https://clausa.app.carto.com/builder/...")'
            ),
        }),
      },
      applyPostProcessEffect: {
        description:
          "Apply post-process visual effects to the map visualization including brightness, contrast, sepia, vignette, ink, and noise. Effects are additive - they merge with existing effects. To remove an effect, set it to 0. Use reset: true to clear all effects first.",
        inputSchema: z.object({
          brightness: z
            .number()
            .optional()
            .describe(
              "Brightness adjustment (-1 to 1). Set to 0 to remove brightness effect"
            ),
          contrast: z
            .number()
            .optional()
            .describe(
              "Contrast adjustment (-1 to 1). Set to 0 to remove contrast effect"
            ),
          sepia: z
            .number()
            .optional()
            .describe(
              "Sepia tone effect (0 to 1). Set to 0 to remove sepia"
            ),
          vignetteSize: z
            .number()
            .optional()
            .describe(
              "Vignette size (0 to 1). Set to 0 to remove vignette"
            ),
          vignetteAmount: z
            .number()
            .optional()
            .describe(
              "Vignette intensity (0 to 1). Set to 0 to remove vignette"
            ),
          ink: z
            .number()
            .optional()
            .describe(
              "Ink effect strength (0 to 1). Set to 0 to remove ink effect"
            ),
          noise: z
            .number()
            .optional()
            .describe(
              "Noise amount (0 to 1). Set to 0 to remove noise"
            ),
          reset: z
            .boolean()
            .optional()
            .describe(
              "Set to true to clear all existing effects before applying new ones"
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

You also have access to CARTO MCP geospatial workflow tools:
${mcpToolDescriptions}`,
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
