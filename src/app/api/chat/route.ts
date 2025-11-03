import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, jsonSchema, streamText, UIMessage } from "ai";
import { loadConfig } from "@/lib/config";
import { logToFile } from "@/lib/logger";
import { listMCPTools } from "@/lib/mcpClient";
import { mcpToolConfig } from "@/config/mcpTools";
import { localToolSchemas } from "@/tools";

export const maxDuration = 30;

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
        inputSchema: jsonSchema(mcpTool.inputSchema),
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
