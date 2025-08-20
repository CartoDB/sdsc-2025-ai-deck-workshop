'use client';

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';

const AIRPORTS_URL = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

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

interface HoveredAirport {
  object: AirportFeature;
  x: number;
  y: number;
}

interface MapComponentProps {
  onDataLoad?: (data: AirportData) => void;
}

export default function MapComponent({ onDataLoad }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [hoveredAirport, setHoveredAirport] = useState<HoveredAirport | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '© CARTO'
          }
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light'
          }
        ]
      },
      center: [0, 20],
      zoom: 2
    });

    const overlay = new MapboxOverlay({
      layers: [
        new GeoJsonLayer({
          id: 'airports',
          data: AIRPORTS_URL,
          pickable: true,
          stroked: false,
          filled: true,
          pointType: 'circle',
          pointRadiusScale: 20,
          pointRadiusMinPixels: 2,
          getFillColor: [255, 140, 0, 180],
          getPointRadius: 40,
          onHover: (info) => {
            setHoveredAirport(info.object ? {
              object: info.object,
              x: info.x,
              y: info.y
            } : null);
          },
          onDataLoad: onDataLoad
        })
      ]
    });

    map.current.addControl(overlay as maplibregl.IControl);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onDataLoad]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {hoveredAirport && (
        <div 
          className="absolute bg-black/80 text-white p-2 rounded text-sm pointer-events-none z-10"
          style={{ 
            left: hoveredAirport.x + 'px', 
            top: hoveredAirport.y + 'px',
            transform: 'translate(-50%, -100%)', 
            marginTop: '-10px' 
          }}
        >
          <strong>{hoveredAirport.object.properties.name || 'Unknown Airport'}</strong><br/>
          Type: {hoveredAirport.object.properties.type || 'N/A'}<br/>
          Country: {hoveredAirport.object.properties.sov_a3 || 'N/A'}
        </div>
      )}
    </div>
  );
}