import { create } from "zustand";
import { MapViewState } from "@/types/config";
import dummyWkt from "./dummyWkt";

export interface WktGeometry {
  wkt: string;
  name?: string;
  color?: [number, number, number, number];
}

export interface PostProcessEffectParams {
  brightness?: number;
  contrast?: number;
  sepia?: number;
  vignette?: { size?: number; amount?: number };
  ink?: number;
  noise?: number;
}

interface MapStore {
  viewState?: MapViewState;
  wktGeometry?: WktGeometry;
  cartoMapId?: string;
  postProcessEffect?: PostProcessEffectParams;
  setViewState: (viewState: MapViewState) => void;
  flyToLocation: (longitude: number, latitude: number, zoom?: number) => void;
  flyToHome: () => void;
  setWktGeometry: (geometry: WktGeometry | undefined) => void;
  setCartoMapId: (mapId: string | undefined) => void;
  setPostProcessEffect: (effect: PostProcessEffectParams | undefined) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: undefined,
  //wktGeometry: dummyWkt, // For testing
  wktGeometry: undefined,
  cartoMapId: undefined,
  postProcessEffect: undefined,

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

  setPostProcessEffect: (effect: PostProcessEffectParams | undefined) => {
    console.log("[MapStore] Setting post-process effect:", effect);
    set({ postProcessEffect: effect });
  },
}));

