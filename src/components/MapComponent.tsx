'use client';

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { AppConfig, GeoJsonData, HoveredFeature } from '@/types/config';

interface MapComponentProps {
  config: AppConfig;
  onDataLoad?: (data: GeoJsonData) => void;
}

export default function MapComponent({ config, onDataLoad }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);

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
          id: 'data-layer',
          data: config.dataSource.url,
          pickable: true,
          stroked: false,
          filled: true,
          pointType: 'circle',
          pointRadiusScale: config.displaySettings.layer.pointRadiusScale,
          pointRadiusMinPixels: config.displaySettings.layer.pointRadiusMinPixels,
          getFillColor: config.displaySettings.layer.fillColor,
          getPointRadius: config.displaySettings.layer.pointRadius,
          onHover: (info) => {
            setHoveredFeature(info.object ? {
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
  }, [config, onDataLoad]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {hoveredFeature && (
        <div 
          className="absolute bg-black/80 text-white p-2 rounded text-sm pointer-events-none z-10"
          style={{ 
            left: hoveredFeature.x + 'px', 
            top: hoveredFeature.y + 'px',
            transform: 'translate(-50%, -100%)', 
            marginTop: '-10px' 
          }}
        >
          {config.displaySettings.tooltip.fields.map((field, index) => (
            <div key={field.key}>
              {index === 0 ? (
                <strong>{hoveredFeature.object.properties[field.key] || `Unknown ${field.label}`}</strong>
              ) : (
                <span>{field.label}: {hoveredFeature.object.properties[field.key] || 'N/A'}</span>
              )}
              {index < config.displaySettings.tooltip.fields.length - 1 && <br/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}