'use client';

import React, { useEffect } from 'react';
import MapComponent from '@/components/MapComponent';
import ChatComponent from '@/components/ChatComponent';
import { GeoJsonData, AppConfig } from '@/types/config';
import { useMapStore } from '@/store/mapStore';
import { useToolStore } from '@/store/toolStore';
import { listCartoTools, createCartoToolFunction } from '@/lib/cartoClient';
import configData from '@/../config/config.json';

export const dynamic = 'force-dynamic';

export default function Home() {
  const config = configData as AppConfig;

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

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <MapComponent />
      </div>
      <div className="w-96">
        <ChatComponent />
      </div>
    </div>
  );
}