'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';

const AIRPORTS_URL = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

interface MapComponentProps {
  onDataLoad?: (data: any) => void;
}

export default function MapComponent({ onDataLoad }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const deckOverlay = useRef<MapboxOverlay | null>(null);
  const [airportData, setAirportData] = useState(null);

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

    // Load airport data
    fetch(AIRPORTS_URL)
      .then(response => response.json())
      .then(data => {
        setAirportData(data);
        onDataLoad?.(data);
        
        // Create deck.gl overlay
        const overlay = new MapboxOverlay({
          layers: [
            new GeoJsonLayer({
              id: 'airports',
              data,
              pickable: true,
              stroked: false,
              filled: true,
              pointType: 'circle',
              pointRadiusScale: 20,
              pointRadiusMinPixels: 2,
              getFillColor: [255, 140, 0, 180],
              getPointRadius: 40,
              onHover: (info) => {
                if (info.object) {
                  const tooltip = document.getElementById('tooltip');
                  if (tooltip) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = info.x + 'px';
                    tooltip.style.top = info.y + 'px';
                    tooltip.innerHTML = `
                      <strong>${info.object.properties.name || 'Unknown Airport'}</strong><br/>
                      Type: ${info.object.properties.type || 'N/A'}<br/>
                      Country: ${info.object.properties.sov_a3 || 'N/A'}
                    `;
                  }
                } else {
                  const tooltip = document.getElementById('tooltip');
                  if (tooltip) {
                    tooltip.style.display = 'none';
                  }
                }
              }
            })
          ]
        });

        deckOverlay.current = overlay;
        map.current?.addControl(overlay as any);
      })
      .catch(error => {
        console.error('Error loading airport data:', error);
      });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onDataLoad]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div 
        id="tooltip" 
        className="absolute bg-black/80 text-white p-2 rounded text-sm pointer-events-none z-10 hidden"
        style={{ transform: 'translate(-50%, -100%)', marginTop: '-10px' }}
      />
    </div>
  );
}