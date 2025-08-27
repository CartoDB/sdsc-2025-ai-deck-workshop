'use client';

import React, { useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { AppConfig, GeoJsonData, MapViewState } from '@/types/config';

interface ChatComponentProps {
  config: AppConfig;
  data?: GeoJsonData;
  onMapViewUpdate?: (viewState: MapViewState) => void;
}

export default function ChatComponent({ config, data, onMapViewUpdate }: ChatComponentProps) {
  console.log('[ChatComponent] Component rendered with data features count:', data?.features?.length || 0);
  console.log('[ChatComponent] Data object:', data ? 'exists' : 'null');
  
  const { messages, sendMessage, status, addToolResult } = useChat({
    api: '/api/chat',
    onToolCall: ({ toolCall }) => {
      console.log('[ChatComponent] Tool call received:', JSON.stringify(toolCall, null, 2));
      
      // Handle client-side tool execution
      if (toolCall.toolName === 'zoomToHome' && !toolCall.result) {
        console.log('[ChatComponent] Executing zoomToHome tool client-side');
        
        const viewState = {
          longitude: -0.1276,  // London coordinates
          latitude: 51.5074,
          zoom: 10
        };
        
        console.log('[ChatComponent] Calling onMapViewUpdate with:', viewState);
        if (onMapViewUpdate) {
          onMapViewUpdate(viewState);
        }
        
        // Return result to AI
        addToolResult({
          toolCallId: toolCall.toolCallId,
          result: 'Successfully zoomed to London coordinates.',
        });
      }
    },
  });
  const [input, setInput] = useState('');

  const dataStats = useMemo(() => {
    if (!data?.features) return '';
    
    const totalFeatures = data.features.length;
    const stats: string[] = [`Currently viewing ${totalFeatures} features`];
    
    config.displaySettings.stats.groupByFields.forEach(field => {
      const uniqueValues = new Set(data.features.map((f) => f.properties[field]).filter(Boolean));
      const label = config.displaySettings.stats.labels[field] || field;
      stats.push(`${uniqueValues.size} ${label}`);
    });
    
    return stats.join(' across ') + '.';
  }, [data, config]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">{config.displaySettings.title}</h2>
        {data && (
          <p className="text-sm text-gray-600 mt-1">
            {dataStats}
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm">
            <p className="mb-2">{config.displaySettings.description}</p>
            {config.exampleQuestions.length > 0 && (
              <ul className="list-disc ml-4 space-y-1">
                {config.exampleQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg max-w-[85%] ${
              message.role === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">
              {message.role === 'user' ? 'User: ' : 'AI: '}
              {message.parts.map((part, index) =>
                part.type === 'text' ? <span key={index}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}
        
        {status === 'in_progress' && (
          <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[85%]">
            <div className="text-sm">Thinking...</div>
          </div>
        )}
      </div>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            console.log('[ChatComponent] Sending message:', input);
            sendMessage({ text: input });
            setInput('');
          } else {
            console.log('[ChatComponent] Empty input, not sending');
          }
        }}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about the ${config.displaySettings.title.toLowerCase()}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={status !== 'ready'}
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !input?.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
