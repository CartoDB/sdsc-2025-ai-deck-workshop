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

You have access to a map control tool:
- zoomToHome: Zoom the map to London (home location)

When users ask to go home, zoom home, or see London, use the zoomToHome tool.`,
      messages: convertToModelMessages(messages),
      tools: {
        zoomToHome: {
          description: 'Zoom the map to London (home location)',
          inputSchema: z.object({}),
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