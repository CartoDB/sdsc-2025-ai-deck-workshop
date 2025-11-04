'use client';

import React, { useState, useEffect } from 'react';
import MapComponent from '@/components/MapComponent';
import ChatComponent from '@/components/ChatComponent';
import { AppConfig, GeoJsonData } from '@/types/config';
import { useMapStore } from '@/store/mapStore';
import { useToolStore } from '@/store/toolStore';
import { listCartoTools, createCartoToolFunction } from '@/lib/cartoClient';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    // Load configuration from API endpoint
    fetch('/api/config')
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Fetch and store airport data in mapStore
    if (config?.dataSource?.url) {
      fetch(config.dataSource.url)
        .then(res => res.json())
        .then((data: GeoJsonData) => {
          console.log('[HomePage] Loaded airport data with', data?.features?.length || 0, 'features');
          useMapStore.getState().setAirportData(data);
        })
        .catch(console.error);
    }
  }, [config]);

  useEffect(() => {
    // Load CARTO tools and add them to the tool store (client-side)
    listCartoTools()
      .then((cartoTools) => {
        console.log('[HomePage] Loaded CARTO tools:', cartoTools.map(t => t.name));
        cartoTools.forEach((cartoTool) => {
          const toolFunction = createCartoToolFunction(cartoTool.name);
          useToolStore.getState().addTool(cartoTool.name, toolFunction);
        });
      })
      .catch(console.error);
  }, []);

  if (!config) {
    return <div className="h-screen flex items-center justify-center">Loading configuration...</div>;
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <MapComponent config={config} />
      </div>
      <div className="w-96">
        <ChatComponent config={config} />
      </div>
    </div>
  );
}