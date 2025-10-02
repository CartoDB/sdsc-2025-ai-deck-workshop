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
  //const wktGeometry = useMapStore((state) => state.wktGeometry);
  const wktGeometry = JSON.parse('{"wkt":"POLYGON((2.35726016436118 48.9464704828915, 2.3304675443777 48.9453900661247, 2.30451449406218 48.9408915671981, 2.28040314115278 48.9331487500659, 2.25906343338637 48.9224605882924, 2.24131688814726 48.9092395578269, 2.22784480424491 48.8939955201511, 2.21916218985091 48.8773158560617, 2.21559839021603 48.8598426553018, 2.21728509390913 48.8422478748125, 2.22415207600881 48.8252074453478, 2.23593071872575 48.8093753317936, 2.25216504940415 48.7953585380802, 2.2722297641751 48.7836939961238, 2.29535447021118 48.7748281939946, 2.32065318439559 48.7691002864668, 2.34715797213538 48.7667292964758, 2.37385549587701 48.7678058640378, 2.39972516651554 48.7722888348708, 2.42377755020631 48.780006809066, 2.44509167669737 48.790664595209, 2.46284992296592 48.8038543417855, 2.47636920865056 48.8190709499925, 2.48512733944276 48.8357312148877, 2.48878347344873 48.853196000041, 2.48719186518437 48.870794629691, 2.48040826233037 48.8878505870932, 2.46868858903524 48.9037075434082, 2.4524798403508 48.9177547126584, 2.43240342536352 48.9294505385479, 2.40923151797644 48.9383437703018, 2.38385728719066 48.9440910772004, 2.35726016436118 48.9464704828915))","name":"Paris 10km Buffer","color":[0,0,255,100]}')

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
        const polygonLayer = new SolidPolygonLayer({
          id: 'wkt-geometry-layer',
          data: [wktGeometry.wkt],
          dataTransform: wkt => {
            return wkt.map(d => parseWKT(d));
          },
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
