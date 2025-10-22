import type { ToolbarConfig } from '@/types/graph';

export const STORAGE_KEY = 'graphToolbarConfig';

export const getDefaultConfig = (): ToolbarConfig => ({
  nameFilter: '',
  typeFilter: [1, 2, 3, 4],
  levelFilter: 'all',
  nodeSize: 1,
  textSize: 1,
  nodeOpacity: 1,
  textLevelDisplay: [1, 2, 3, 4],
  linkWidth: 1.5,
  centerForce: 0.05,
  linkDistance: 1,
  chargeStrength: 1,
});

export const loadConfig = (): ToolbarConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...getDefaultConfig(), ...JSON.parse(saved) } : getDefaultConfig();
  } catch {
    return getDefaultConfig();
  }
};

export const saveConfig = (config: ToolbarConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

