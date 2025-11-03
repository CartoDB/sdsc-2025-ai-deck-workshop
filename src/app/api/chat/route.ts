import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { loadConfig } from "@/lib/config";
import { logToFile } from "@/lib/logger";
import { listMCPTools } from "@/lib/mcpClient";
import { mcpToolConfig } from "@/config/mcpTools";
import { localToolSchemas } from "@/tools";
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
    const tools: Record<string, any> = { ...localToolSchemas };

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
