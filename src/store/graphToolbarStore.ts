
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ToolbarConfig } from '@/types/graph';

const getDefaultConfig = (): ToolbarConfig => ({
  nameFilter: '',
  typeFilter: [1, 2, 3, 4],
  levelFilter: 'all',
  minConnections: 0,
  nodeSize: 1,
  textSize: 1,
  nodeOpacity: 1,
  textLevelDisplay: [1, 2, 3, 4],
  linkWidth: 1.5,
  centerForce: 0.05,
  linkDistance: 1,
  chargeStrength: 1,
});

interface ToolbarStore {
  config: ToolbarConfig;
  setConfig: (config: Partial<ToolbarConfig>) => void;
  resetConfig: () => void;
}

export const useToolbarStore = create<ToolbarStore>()(
  persist(
    (set) => ({
      config: getDefaultConfig(),
      
      setConfig: (config) => {
        set((state) => ({
          config: { ...state.config, ...config },
        }));
      },
      
      resetConfig: () => {
        set({ config: getDefaultConfig() });
      },
    }),
    {
      name: 'graphToolbarConfig',
    }
  )
);
