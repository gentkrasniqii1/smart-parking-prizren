import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  selectedZoneId: string | null;
  setSelectedZoneId: (zoneId: string | null) => void;
  adminSidebarCollapsed: boolean;
  toggleAdminSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedZoneId: null,
      setSelectedZoneId: (zoneId) => set({ selectedZoneId: zoneId }),
      adminSidebarCollapsed: false,
      toggleAdminSidebar: () =>
        set((state) => ({ adminSidebarCollapsed: !state.adminSidebarCollapsed })),
    }),
    {
      name: "smart-parking-ui",
      partialize: (state) => ({
        adminSidebarCollapsed: state.adminSidebarCollapsed,
      }),
    },
  ),
);
