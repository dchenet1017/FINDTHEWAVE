import { create } from 'zustand'
import { create as createZustand } from 'zustand'
import type { Business, BusinessType, WaveLeader } from '../../../shared/types/business'

export interface MapFilters {
  businessTypes: BusinessType[]
  showWaveLeaders: boolean
  showEvents: boolean
  showCheckIns: boolean
  showPromotionsOnly: boolean
  showVerifiedOnly: boolean
  radius: number
  search: string
}

export interface MapBounds {
  ne: { lat: number; lng: number }
  sw: { lat: number; lng: number }
}

export interface MapState {
  mapCenter: [number, number]
  mapZoom: number
  bounds: MapBounds | null
  style: 'dark' | 'light' | 'satellite'
  userLocation: { lat: number; lng: number } | null
  filters: MapFilters
  layers: {
    businesses: boolean
    waveLeaders: boolean
    events: boolean
    checkIns: boolean
    heatmap: boolean
    serviceArea: boolean
    competitors: boolean
  }
  selectedBusiness: Business | null
  selectedWaveLeader: WaveLeader | null
  selectedEvent: any | null
  setFilters: (filters: Partial<MapFilters>) => void
  toggleLayer: (layer: keyof MapState['layers']) => void
  setSelectedBusiness: (b: Business | null) => void
  setSelectedWaveLeader: (w: WaveLeader | null) => void
  setSelectedEvent: (e: any | null) => void
  setUserLocation: (loc: { lat: number; lng: number } | null) => void
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  setBounds: (bounds: MapBounds | null) => void
  setStyle: (style: MapState['style']) => void
  resetFilters: () => void
}

const defaultFilters: MapFilters = {
  businessTypes: [],
  showWaveLeaders: true,
  showEvents: false,
  showCheckIns: false,
  showPromotionsOnly: false,
  showVerifiedOnly: false,
  radius: 5,
  search: '',
}

const defaultLayers: MapState['layers'] = {
  businesses: true,
  waveLeaders: true,
  events: false,
  checkIns: false,
  heatmap: false,
  serviceArea: false,
  competitors: false,
}

export const useMapStore = createZustand<MapState>((set) => ({
  mapCenter: [-74.006, 40.7128],
  mapZoom: 12,
  bounds: null,
  style: 'dark',
  userLocation: null,
  filters: defaultFilters,
  layers: defaultLayers,
  selectedBusiness: null,
  selectedWaveLeader: null,
  selectedEvent: null,

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  setSelectedBusiness: (b) => set({ selectedBusiness: b }),
  setSelectedWaveLeader: (w) => set({ selectedWaveLeader: w }),
  setSelectedEvent: (e) => set({ selectedEvent: e }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setBounds: (bounds) => set({ bounds }),
  setStyle: (style) => set({ style }),
  resetFilters: () =>
    set({
      filters: defaultFilters,
    }),
}))

