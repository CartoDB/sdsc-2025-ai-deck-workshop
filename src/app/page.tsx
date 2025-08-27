'use client';

import React, { useState, useCallback, useEffect } from 'react';
import MapComponent from '@/components/MapComponent';
import ChatComponent from '@/components/ChatComponent';
import { AppConfig, GeoJsonData, MapViewState } from '@/types/config';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [data, setData] = useState<GeoJsonData | null>(null);
  const [mapViewState, setMapViewState] = useState<MapViewState | undefined>();

  useEffect(() => {
    // Load configuration from API endpoint
    fetch('/api/config')
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  const handleDataLoad = useCallback((data: GeoJsonData) => {
    console.log('[HomePage] Data loaded callback with features:', data?.features?.length || 0);
    setData(data);
  }, []);

  if (!config) {
    return <div className="h-screen flex items-center justify-center">Loading configuration...</div>;
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <MapComponent 
          config={config} 
          viewState={mapViewState}
          onDataLoad={handleDataLoad} 
        />
      </div>
      <div className="w-96">
        <ChatComponent 
          config={config} 
          data={data}
          setMapViewState={setMapViewState}
        />
      </div>
    </div>
  );
}