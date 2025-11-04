'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Map, useControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { DeckProps } from '@deck.gl/core';
import { GeoJsonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { fetchMap } from '@deck.gl/carto';
import { AppConfig, GeoJsonData, HoveredFeature } from '@/types/config';
import { useMapStore } from '@/store/mapStore';
import { parseSync } from '@loaders.gl/core';
import { WKTLoader } from '@loaders.gl/wkt';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  config: AppConfig;
  onDataLoad?: (data: GeoJsonData) => void;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const CARTO_BASEMAP_STYLE = {
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
};

export default function MapComponent({ config, onDataLoad }: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);
  const [cartoLayers, setCartoLayers] = useState<any[]>([]);
  const viewState = useMapStore((state) => state.viewState);
  const wktGeometry = useMapStore((state) => state.wktGeometry);
  const cartoMapId = useMapStore((state) => state.cartoMapId);
  const effects = useMapStore((state) => state.postProcessEffects);

  // Suppress CARTO-related console errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorStr = args[0]?.toString?.() || '';
      if (
        errorStr.includes('Failed to fetch resource') ||
        errorStr.includes('api.carto.com') ||
        errorStr.includes('429')
      ) {
        return;
      }
      originalError.apply(console, args);
    };
    return () => { console.error = originalError; };
  }, []);

  // Handle CARTO map loading
  useEffect(() => {
    if (!cartoMapId) {
      setCartoLayers([]);
      return;
    }

    const accessToken = process.env.NEXT_PUBLIC_CARTO_API_TOKEN;
    fetchMap({
      cartoMapId,
      ...(accessToken ? { credentials: { accessToken } } : {})
    })
      .then((cartoMap) => {
        console.log('[MapComponent] CARTO map loaded with', cartoMap.layers?.length || 0, 'layers');
        setCartoLayers(cartoMap.layers || []);

        if (cartoMap.initialViewState && mapRef.current) {
          mapRef.current.flyTo({
            center: [cartoMap.initialViewState.longitude, cartoMap.initialViewState.latitude],
            zoom: cartoMap.initialViewState.zoom,
            duration: 2000
          });
        }
      })
      .catch((error) => {
        console.error('[MapComponent] Error loading CARTO map:', error);
        setCartoLayers([]);
      });
  }, [cartoMapId]);

  // Handle view state updates
  useEffect(() => {
    if (mapRef.current && viewState) {
      mapRef.current.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        duration: 2000
      });
    }
  }, [viewState]);

  const handleHover = useCallback((info: any) => {
    setHoveredFeature(info.object ? {
      object: info.object,
      x: info.x,
      y: info.y
    } : null);
  }, []);

  const handleDataLoad = useCallback((loadedData: GeoJsonData) => {
    console.log('[MapComponent] Data loaded with', loadedData?.features?.length || 0, 'features');
    if (typeof window !== 'undefined') {
      window.mapData = loadedData;
    }
    onDataLoad?.(loadedData);
  }, [onDataLoad]);

  // Build deck.gl layers
  const layers = useMemo(() => {
    const result: any[] = [];

    // Add CARTO layers
    if (cartoLayers.length > 0) {
      result.push(...cartoLayers);
    }

    // Add data layer
    result.push(
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
        onHover: handleHover,
        onDataLoad: handleDataLoad
      })
    );

    // Add WKT geometry layer if present
    if (wktGeometry) {
      try {
        result.push(
          new SolidPolygonLayer({
            id: 'wkt-geometry-layer',
            data: [wktGeometry.wkt],
            dataTransform: (wkt: string[]) => wkt.map(d => parseSync(d, WKTLoader)),
            getPolygon: (d: any) => d.coordinates,
            getFillColor: wktGeometry.color || [0, 100, 200, 100],
            getLineColor: [0, 0, 0, 200],
            getLineWidth: 2,
            lineWidthMinPixels: 1,
            pickable: true
          })
        );
      } catch (error) {
        console.error('[MapComponent] Error parsing WKT geometry:', error);
      }
    }

    return result;
  }, [cartoLayers, config, wktGeometry, handleHover, handleDataLoad]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 0
        }}
        mapStyle={CARTO_BASEMAP_STYLE as any}
      >
        <DeckGLOverlay layers={layers} effects={effects || []} interleaved={false} />
      </Map>

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
              {index < config.displaySettings.tooltip.fields.length - 1 && <br />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
