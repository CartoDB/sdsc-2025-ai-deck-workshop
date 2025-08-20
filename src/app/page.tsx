'use client';

import React, { useState } from 'react';
import MapComponent from '@/components/MapComponent';
import ChatComponent from '@/components/ChatComponent';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [airportData, setAirportData] = useState(null);

  const handleDataLoad = (data: any) => {
    setAirportData(data);
  };

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