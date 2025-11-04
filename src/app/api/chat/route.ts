import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, jsonSchema, streamText, UIMessage } from "ai";
import { loadConfig } from "@/lib/config";
import { logToFile } from "@/lib/logger";
import { listCartoTools } from "@/lib/cartoClient";
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

    // Fetch whitelisted CARTO tools
    const cartoTools = await listCartoTools();
    logToFile("[API] Loaded CARTO tools", {
      count: cartoTools.length,
      tools: cartoTools.map((t) => t.name),
    });

    // Build tools object with both local and CARTO tools
    const tools: Record<string, any> = { ...localToolSchemas };

    for (const cartoTool of cartoTools) {
      tools[cartoTool.name] = {
        description: cartoTool.description,
        inputSchema: jsonSchema(cartoTool.inputSchema),
      };
    }

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
      system: config.systemPrompt,
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
