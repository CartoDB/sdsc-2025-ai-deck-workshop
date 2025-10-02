'use client';

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { SolidPolygonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { EditableGeoJsonLayer, DrawPolygonMode } from '@deck.gl-community/editable-layers';
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState<any>({ type: 'FeatureCollection', features: [] });
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
      interleaved: true,
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

    // Add editable layer for drawing
    if (isDrawing) {
      const editableLayer = new EditableGeoJsonLayer({
        id: 'editable-layer',
        data: drawnFeatures,
        mode: DrawPolygonMode,
        selectedFeatureIndexes: [],
        onEdit: ({ updatedData, editType }) => {
          console.log('[MapComponent] Edit event:', editType, updatedData);
          setDrawnFeatures(updatedData);
        },
        // Styling
        getFillColor: [200, 0, 0, 100],
        getLineColor: [200, 0, 0, 255],
        getLineWidth: 2,
        lineWidthMinPixels: 2,
        // Edit handles styling
        getEditHandlePointColor: [255, 0, 0, 255],
        getEditHandlePointRadius: 8,
        editHandlePointRadiusMinPixels: 8,
        // Enable picking
        pickable: true,
        autoHighlight: true
      });

      layers.push(editableLayer);
    }

    overlay.current.setProps({ layers });
  }, [wktGeometry, config, onDataLoad, isDrawing, drawnFeatures]);

  const handleDrawClick = () => {
    if (isDrawing) {
      console.log('[MapComponent] Finishing drawing, features:', drawnFeatures);

      // Re-enable map dragging
      if (map.current) {
        map.current.dragPan.enable();
      }

      // Finish drawing - convert to WKT and save
      if (drawnFeatures.features.length > 0) {
        const feature = drawnFeatures.features[0];
        if (feature.geometry.type === 'Polygon') {
          // Convert GeoJSON coordinates to WKT
          const coords = feature.geometry.coordinates[0];
          const wktCoords = coords.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ');
          const wkt = `POLYGON((${wktCoords}))`;

          useMapStore.getState().setWktGeometry({
            wkt,
            name: 'User drawn region',
            color: [200, 0, 0, 100]
          });
        }
      }

      setIsDrawing(false);
      setDrawnFeatures({ type: 'FeatureCollection', features: [] });
    } else {
      // Start drawing
      console.log('[MapComponent] Starting drawing mode');
      setIsDrawing(true);
      setDrawnFeatures({ type: 'FeatureCollection', features: [] });

      // Disable map dragging when drawing
      if (map.current) {
        map.current.dragPan.disable();
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Draw Region Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleDrawClick}
          className={`px-4 py-2 rounded font-medium shadow-lg transition-colors ${
            isDrawing
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-800'
          }`}
        >
          {isDrawing ? 'Finish Drawing' : 'Draw Region'}
        </button>
      </div>

      {/* Drawing mode indicator */}
      {isDrawing && (
        <div className="absolute top-20 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow-lg z-20">
          Click on the map to draw polygon vertices
        </div>
      )}

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
