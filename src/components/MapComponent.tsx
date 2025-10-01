'use client';

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { SolidPolygonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { AppConfig, GeoJsonData, HoveredFeature } from '@/types/config';
import { useMapStore } from '@/store/mapStore';
import { parseWKT } from '@/lib/wktParser';

interface MapComponentProps {
  config: AppConfig;
  onDataLoad?: (data: GeoJsonData) => void;
}

export default function MapComponent({ config, onDataLoad }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const overlay = useRef<MapboxOverlay | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);
  const viewState = useMapStore((state) => state.viewState);
  const wktGeometry = useMapStore((state) => state.wktGeometry);

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

    overlay.current = new MapboxOverlay({
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
          onDataLoad: (loadedData) => {
            console.log('[MapComponent] Data loaded with features:', loadedData?.features?.length || 0);

            // Store data globally for tool access
            if (typeof window !== 'undefined') {
              window.mapData = loadedData;
            }

            if (onDataLoad) {
              onDataLoad(loadedData);
            }
          }
        })
      ]
    });

    map.current.addControl(overlay.current as maplibregl.IControl);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [config, onDataLoad]);

  // Handle view state updates from chat
  useEffect(() => {
    console.log('[MapComponent] ViewState effect triggered with:', viewState);
    if (map.current && viewState) {
      console.log('[MapComponent] Flying to coordinates:', viewState);
      map.current.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        duration: 2000 // 2 second animation
      });
    } else {
      console.log('[MapComponent] No map instance or viewState:', { hasMap: !!map.current, viewState });
    }
  }, [viewState]);

  // Handle WKT geometry updates
  useEffect(() => {
    if (!overlay.current) return;

    console.log('[MapComponent] WKT geometry effect triggered with:', wktGeometry);

    // Get existing data layer
    const dataLayer = new GeoJsonLayer({
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
      onDataLoad: (loadedData) => {
        console.log('[MapComponent] Data loaded with features:', loadedData?.features?.length || 0);

        // Store data globally for tool access
        if (typeof window !== 'undefined') {
          window.mapData = loadedData;
        }

        if (onDataLoad) {
          onDataLoad(loadedData);
        }
      }
    });

    const layers = [dataLayer];

    // Add WKT geometry layer if present
    if (wktGeometry) {
      try {
        const parsed = parseWKT(wktGeometry.wkt);
        console.log('[MapComponent] Parsed WKT geometry:', parsed);

        const polygonLayer = new SolidPolygonLayer({
          id: 'wkt-geometry-layer',
          data: [parsed],
          getPolygon: (d: any) => {
            // Handle both Polygon and MultiPolygon
            if (d.type === 'Polygon') {
              // For Polygon, coordinates is [outer ring, ...holes]
              // We only use the outer ring for SolidPolygonLayer
              return d.coordinates[0];
            } else if (d.type === 'MultiPolygon') {
              // For MultiPolygon, return the first polygon's outer ring
              // Note: SolidPolygonLayer doesn't support MultiPolygon directly
              // You may need to create multiple layers or flatten
              return d.coordinates[0][0];
            }
            return [];
          },
          getFillColor: wktGeometry.color || [0, 100, 200, 100],
          getLineColor: [0, 0, 0, 200],
          getLineWidth: 2,
          lineWidthMinPixels: 1,
          pickable: true
        });

        layers.push(polygonLayer);
      } catch (error) {
        console.error('[MapComponent] Error parsing WKT geometry:', error);
      }
    }

    overlay.current.setProps({ layers });
  }, [wktGeometry, config, onDataLoad]);

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