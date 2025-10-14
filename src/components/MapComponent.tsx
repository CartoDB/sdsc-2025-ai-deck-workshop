'use client';

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { SolidPolygonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { fetchMap } from '@deck.gl/carto';
import { PostProcessEffect } from '@deck.gl/core';
import { brightnessContrast, noise, sepia, vignette, ink } from '@luma.gl/effects';
import { AppConfig, GeoJsonData, HoveredFeature } from '@/types/config';
import { useMapStore } from '@/store/mapStore';
import { parseSync } from '@loaders.gl/core';
import { WKTLoader } from '@loaders.gl/wkt';

interface MapComponentProps {
  config: AppConfig;
  onDataLoad?: (data: GeoJsonData) => void;
}

export default function MapComponent({ config, onDataLoad }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const overlay = useRef<MapboxOverlay | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);
  const [cartoLayers, setCartoLayers] = useState<any[]>([]);
  const viewState = useMapStore((state) => state.viewState);
  const wktGeometry = useMapStore((state) => state.wktGeometry);
  const cartoMapId = useMapStore((state) => state.cartoMapId);
  const postProcessEffect = useMapStore((state) => state.postProcessEffect);

  // Suppress CARTO-related console errors globally
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Filter out CARTO 429 errors and other expected fetch failures
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

    return () => {
      console.error = originalError;
    };
  }, []);

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
      zoom: 0
    });

    overlay.current = new MapboxOverlay({
      interleaved: false,
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

  // Handle CARTO map loading
  useEffect(() => {
    if (!cartoMapId) {
      setCartoLayers([]);
      return;
    }

    console.log('[MapComponent] Fetching CARTO map:', cartoMapId);

    const accessToken = process.env.NEXT_PUBLIC_CARTO_API_TOKEN;
    console.log('[MapComponent] Access token available:', !!accessToken);

    fetchMap({
      cartoMapId,
      ...(accessToken ? { credentials: { accessToken } } : {})
    })
      .then((cartoMap) => {
        console.log('[MapComponent] CARTO map loaded:', cartoMap);
        console.log('[MapComponent] CARTO layers count:', cartoMap.layers?.length || 0);
        setCartoLayers(cartoMap.layers || []);

        // Optionally, update view state to match CARTO map's initial view
        if (cartoMap.initialViewState && map.current) {
          console.log('[MapComponent] Flying to CARTO map initial view:', cartoMap.initialViewState);
          map.current.flyTo({
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

    const layers = [];

    // Add CARTO layers
    console.log('[MapComponent] Adding CARTO layers, count:', cartoLayers.length);
    if (cartoLayers.length > 0) {
      cartoLayers.forEach((layer, idx) => {
        console.log(`[MapComponent] Adding CARTO layer ${idx}:`, layer.id || 'no-id', layer);
      });
      layers.push(...cartoLayers);
      console.log('[MapComponent] Total layers after adding CARTO:', layers.length);
    }

    layers.push(dataLayer);

    // Add WKT geometry layer if present
    if (wktGeometry) {
      try {
        const polygonLayer = new SolidPolygonLayer({
          id: 'wkt-geometry-layer',
          data: [wktGeometry.wkt],
          dataTransform: wkt => wkt.map(d => parseSync(d, WKTLoader)),
          getPolygon: (d: any) => d.coordinates,
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

    // Create post-process effects if configured
    const effects = [];
    if (postProcessEffect) {
      // Brightness and contrast
      if (postProcessEffect.brightness !== undefined || postProcessEffect.contrast !== undefined) {
        effects.push(
          new PostProcessEffect(brightnessContrast, {
            brightness: postProcessEffect.brightness ?? 0,
            contrast: postProcessEffect.contrast ?? 0,
          })
        );
      }

      // Sepia
      if (postProcessEffect.sepia !== undefined) {
        effects.push(
          new PostProcessEffect(sepia, {
            amount: postProcessEffect.sepia,
          })
        );
      }

      // Vignette
      if (postProcessEffect.vignette) {
        effects.push(
          new PostProcessEffect(vignette, {
            size: postProcessEffect.vignette.size ?? 0.5,
            amount: postProcessEffect.vignette.amount ?? 0.5,
          })
        );
      }

      // Ink
      if (postProcessEffect.ink !== undefined) {
        effects.push(
          new PostProcessEffect(ink, {
            strength: postProcessEffect.ink,
          })
        );
      }

      // Noise
      if (postProcessEffect.noise !== undefined) {
        effects.push(
          new PostProcessEffect(noise, {
            amount: postProcessEffect.noise,
          })
        );
      }
    }

    overlay.current.setProps({ layers, effects });
  }, [wktGeometry, config, onDataLoad, cartoLayers, postProcessEffect]);

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
