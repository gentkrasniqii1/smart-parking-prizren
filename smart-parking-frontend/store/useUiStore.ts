import { create } from "zustand";

interface UiState {
  selectedZoneId: string | null;
  setSelectedZoneId: (zoneId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedZoneId: null,
  setSelectedZoneId: (zoneId) => set({ selectedZoneId: zoneId }),
}));
