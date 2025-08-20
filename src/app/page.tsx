'use client';

import React, { useState, useCallback } from 'react';
import MapComponent from '@/components/MapComponent';
import ChatComponent from '@/components/ChatComponent';

export const dynamic = 'force-dynamic';

interface AirportData {
  features: Array<{
    properties: {
      name?: string;
      sov_a3?: string;
      type?: string;
    };
  }>;
}

export default function Home() {
  const [airportData, setAirportData] = useState<AirportData | null>(null);

  const handleDataLoad = useCallback((data: AirportData) => {
    setAirportData(data);
  }, []);

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <MapComponent onDataLoad={handleDataLoad} />
      </div>
      <div className="w-96">
        <ChatComponent airportData={airportData} />
      </div>
    </div>
  );
}