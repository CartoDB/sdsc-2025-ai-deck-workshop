import { create } from "zustand";
import { MapViewState, GeoJsonData } from "@/types/config";
import { PostProcessEffect } from '@deck.gl/core';
import dummyWkt from "./dummyWkt";

export interface WktGeometry {
  wkt: string;
  name?: string;
  color?: [number, number, number, number];
}

interface MapStore {
  viewState?: MapViewState;
  wktGeometry?: WktGeometry;
  cartoMapId?: string;
  postProcessEffects?: PostProcessEffect[];
  airportData?: GeoJsonData;
  setViewState: (viewState: MapViewState) => void;
  flyToLocation: (longitude: number, latitude: number, zoom?: number) => void;
  flyToHome: () => void;
  setWktGeometry: (geometry: WktGeometry | undefined) => void;
  setCartoMapId: (mapId: string | undefined) => void;
  setPostProcessEffects: (effects: PostProcessEffect[] | undefined) => void;
  setAirportData: (data: GeoJsonData | undefined) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: undefined,
  //wktGeometry: dummyWkt, // For testing
  wktGeometry: undefined,
  cartoMapId: undefined,
  postProcessEffects: undefined,
  airportData: undefined,

  setViewState: (viewState: MapViewState) => {
    console.log("[MapStore] Setting view state:", viewState);
    set({ viewState });
  },

  flyToLocation: (longitude: number, latitude: number, zoom = 10) => {
    const viewState = { longitude, latitude, zoom };
    console.log("[MapStore] Flying to location:", viewState);
    set({ viewState });
  },

  flyToHome: () => {
    const viewState = {
      longitude: -0.1276, // London coordinates
      latitude: 51.5074,
      zoom: 10,
    };
    console.log("[MapStore] Flying home to London:", viewState);
    set({ viewState });
  },

  setWktGeometry: (geometry: WktGeometry | undefined) => {
    console.log("[MapStore] Setting WKT geometry:", geometry);
    set({ wktGeometry: geometry });
  },

  setCartoMapId: (mapId: string | undefined) => {
    console.log("[MapStore] Setting CARTO map ID:", mapId);
    set({ cartoMapId: mapId });
  },

  setPostProcessEffects: (effects: PostProcessEffect[] | undefined) => {
    console.log("[MapStore] Setting post-process effects:", effects);
    set({ postProcessEffects: effects });
  },

  setAirportData: (data: GeoJsonData | undefined) => {
    console.log("[MapStore] Setting airport data:", data?.features?.length || 0, "features");
    set({ airportData: data });
  },
}));

