'use client';

import React, { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';

interface AirportFeature {
  properties: {
    name?: string;
    sov_a3?: string;
    type?: string;
  };
}

interface AirportData {
  features: AirportFeature[];
}

interface ChatComponentProps {
  airportData?: AirportData;
}

export default function ChatComponent({ airportData }: ChatComponentProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  const airportStats = useMemo(() => {
    if (!airportData?.features) return '';
    
    const totalAirports = airportData.features.length;
    const countries = new Set(airportData.features.map((f) => f.properties.sov_a3).filter(Boolean));
    const types = new Set(airportData.features.map((f) => f.properties.type).filter(Boolean));
    
    return `Currently viewing ${totalAirports} airports across ${countries.size} countries. Airport types include: ${Array.from(types).join(', ')}.`;
  }, [airportData]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Airport Data Assistant</h2>
        {airportData && (
          <p className="text-sm text-gray-600 mt-1">
            {airportStats}
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm">
            <p className="mb-2">Ask me questions about the airport data, such as:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>How many airports are shown on the map?</li>
              <li>Which countries have the most airports?</li>
              <li>What types of airports are included in this dataset?</li>
              <li>Tell me about airport distribution patterns</li>
            </ul>
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
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[85%]">
            <div className="text-sm">Thinking...</div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about the airport data..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}