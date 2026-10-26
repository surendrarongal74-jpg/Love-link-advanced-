export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityConfig {
  level: QualityLevel;
  label: string;
  pixelRatioMax: number;
  shadows: boolean;
  particleMultiplier: number;
  environmentIntensity: number;
  antialias: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityConfig> = {
  low: {
    level: 'low',
    label: 'Battery Saver (Low)',
    pixelRatioMax: 1.0,
    shadows: false,
    particleMultiplier: 0.4,
    environmentIntensity: 0.6,
    antialias: false,
  },
  medium: {
    level: 'medium',
    label: 'Balanced (Med)',
    pixelRatioMax: 1.5,
    shadows: true,
    particleMultiplier: 0.8,
    environmentIntensity: 0.9,
    antialias: true,
  },
  high: {
    level: 'high',
    label: 'Ultra Romantic (High)',
    pixelRatioMax: 2.0,
    shadows: true,
    particleMultiplier: 1.2,
    environmentIntensity: 1.2,
    antialias: true,
  },
};

const STORAGE_KEY = 'loveverse_3d_quality';

export function getStoredQuality(): QualityLevel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as QualityLevel | null;
    if (saved && (saved === 'low' || saved === 'medium' || saved === 'high')) {
      return saved;
    }
  } catch {
    // ignore localstorage errors
  }
  // Auto-detect mobile devices for default
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  return isMobile ? 'medium' : 'high';
}

export function setStoredQuality(level: QualityLevel): void {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // ignore
  }
}
