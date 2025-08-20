import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-haiku-20240307'),
    system: `You are an AI assistant that helps users understand and analyze airport data displayed on a map. 
    The map shows airports from Natural Earth data (https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson).
    
    You can help users with:
    - Information about airports and aviation
    - Understanding the geographic distribution of airports
    - Analysis of airport density and patterns
    - General questions about the data being visualized
    
    Be helpful, concise, and focus on the spatial and aviation aspects of the data.`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}