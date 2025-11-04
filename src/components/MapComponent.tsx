'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Map, useControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { GeoJsonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { fetchMap } from '@deck.gl/carto';
import { AppConfig } from '@/types/config';
import { useMapStore } from '@/store/mapStore';
import { parseSync } from '@loaders.gl/core';
import { WKTLoader } from '@loaders.gl/wkt';
import 'maplibre-gl/dist/maplibre-gl.css';
import configData from '@/../config/config.json';

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function MapComponent() {
  const config = configData as AppConfig;
  const mapRef = useRef<MapRef>(null);
  const [cartoLayers, setCartoLayers] = useState<any[]>([]);
  const viewState = useMapStore((state) => state.viewState);
  const wktGeometry = useMapStore((state) => state.wktGeometry);
  const cartoMapId = useMapStore((state) => state.cartoMapId);
  const effects = useMapStore((state) => state.postProcessEffects);
  const airportData = useMapStore((state) => state.airportData);

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

  // Build deck.gl layers
  const layers = useMemo(() => {
    const result: any[] = [];

    // Add CARTO layers
    if (cartoLayers.length > 0) {
      result.push(...cartoLayers);
    }

    // Add data layer if airportData is available
    if (airportData) {
      result.push(
        new GeoJsonLayer({
          id: 'data-layer',
          data: airportData,
          pickable: true,
          stroked: false,
          filled: true,
          pointType: 'circle',
          pointRadiusScale: config.displaySettings.layer.pointRadiusScale,
          pointRadiusMinPixels: config.displaySettings.layer.pointRadiusMinPixels,
          getFillColor: config.displaySettings.layer.fillColor,
          getPointRadius: config.displaySettings.layer.pointRadius,
        })
      );
    }

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
            lineWidthMinPixels: 1
          })
        );
      } catch (error) {
        console.error('[MapComponent] Error parsing WKT geometry:', error);
      }
    }

    return result;
  }, [cartoLayers, config, wktGeometry, airportData]);

  const getTooltip = useCallback((info: any) => {
    if (!info.object) return null;

    // Handle both GeoJSON (has properties) and CARTO layers (properties at root)
    const properties = info.object.properties || info.object;

    // For CARTO data, show all properties excluding __ prefixed ones
    if (!info.object.properties?.['iata_code']) {
      const cartoProps = Object.entries(properties)
        .filter(([key]) => !key.startsWith('__'))
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      return cartoProps || 'No data';
    }

    // For GeoJSON, use configured fields
    const tooltipContent = config.displaySettings.tooltip.fields.map((field, index) => {
      const value = properties[field.key];
      if (index === 0) {
        return value || `Unknown ${field.label}`;
      }
      return `${field.label}: ${value || 'N/A'}`;
    }).join('\n');

    return tooltipContent;
  }, [config.displaySettings.tooltip.fields]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 0
        }}
        mapStyle={config.displaySettings.mapStyle}
      >
        <DeckGLOverlay
          layers={layers}
          effects={effects || []}
          getTooltip={getTooltip}
          interleaved={false}
        />
      </Map>
    </div>
  );
}
