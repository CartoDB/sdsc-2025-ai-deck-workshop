import { create } from 'zustand';
import { MapViewState } from '@/types/config';

interface MapStore {
  viewState?: MapViewState;
  setViewState: (viewState: MapViewState) => void;
  flyToLocation: (longitude: number, latitude: number, zoom?: number) => void;
  flyToHome: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: undefined,
  
  setViewState: (viewState: MapViewState) => {
    console.log('[MapStore] Setting view state:', viewState);
    set({ viewState });
  },
  
  flyToLocation: (longitude: number, latitude: number, zoom = 10) => {
    const viewState = { longitude, latitude, zoom };
    console.log('[MapStore] Flying to location:', viewState);
    set({ viewState });
  },
  
  flyToHome: () => {
    const viewState = {
      longitude: -0.1276,  // London coordinates
      latitude: 51.5074,
      zoom: 10
    };
    console.log('[MapStore] Flying home to London:', viewState);
    set({ viewState });
  }
}));