import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLoveCoins } from './LoveCoinsContext';
import { useAuth } from './AuthContext';
import { sound } from '../lib/sound';
import { LOVEVERSE_ASSETS } from '../assets/loveverseAssets';

export interface ThemeTokens {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cost: number;
  image: string;
  isDark: boolean;
  colors: {
    primary: string;
    primaryHover: string;
    primarySoft: string;
    accent: string;
    accentGold: string;
    screenBg: string;
    screenGradient: string;
    cardBg: string;
    cardBorder: string;
    cardShadow: string;
    textMain: string;
    textMuted: string;
    headerBg: string;
    navBg: string;
    navActive: string;
    bubbleMine: string;
    bubbleMineText: string;
    bubblePartner: string;
    bubblePartnerText: string;
    inputBg: string;
    inputBorder: string;
    tagBg: string;
    tagText: string;
  };
  decorations: {
    symbol: string;
    iconPack: string[];
    skyElement: string;
    vibeTag: string;
  };
}

export const LOVEVERSE_THEMES: Record<string, ThemeTokens> = {
  theme_cloud_romance: {
    id: 'theme_cloud_romance',
    name: 'Cloud Romance',
    subtitle: 'Blush Skies & Floating Glass Hearts',
    description: 'Blush pink, whipped cream, lavender, and pearl white. Floating clouds, delicate stars, glass hearts, and dreamy sky-palace atmospheric radiance.',
    cost: 0,
    image: LOVEVERSE_ASSETS.themes.cloudRomance,
    isDark: false,
    colors: {
      primary: '#E8547A',
      primaryHover: '#D43F66',
      primarySoft: '#FFE4EC',
      accent: '#F4BF62',
      accentGold: '#E6A73C',
      screenBg: '#FFF6F9',
      screenGradient: 'from-[#FFF0F5] via-[#FFF7FA] to-[#F5E6F0]',
      cardBg: 'rgba(255, 255, 255, 0.90)',
      cardBorder: 'rgba(244, 114, 182, 0.25)',
      cardShadow: '0 8px 24px -4px rgba(244, 63, 94, 0.08)',
      textMain: '#2B1A2E',
      textMuted: '#8E6F83',
      headerBg: 'rgba(255, 255, 255, 0.88)',
      navBg: 'rgba(255, 255, 255, 0.92)',
      navActive: '#E8547A',
      bubbleMine: 'linear-gradient(135deg, #FF6B95 0%, #E8547A 100%)',
      bubbleMineText: '#FFFFFF',
      bubblePartner: 'rgba(255, 255, 255, 0.95)',
      bubblePartnerText: '#2B1A2E',
      inputBg: 'rgba(255, 255, 255, 0.9)',
      inputBorder: 'rgba(244, 114, 182, 0.3)',
      tagBg: 'rgba(254, 226, 226, 0.8)',
      tagText: '#BE123C'
    },
    decorations: {
      symbol: '☁️',
      iconPack: ['☁️', '🌸', '✨', '🤍', '🎀'],
      skyElement: 'Soft drifting pink clouds & starlight glimmers',
      vibeTag: 'Dreamy Sky Palace'
    }
  },

  theme_moonlight_sky: {
    id: 'theme_moonlight_sky',
    name: 'Moonlight Dreams',
    subtitle: 'Nocturnal Lavender & Luminous Moons',
    description: 'Lavender night skies, glowing moons, silver constellations, and celestial starlight. A magical night atmosphere designed for intimacy and high readability.',
    cost: 1000,
    image: LOVEVERSE_ASSETS.themes.moonlightDreams,
    isDark: true,
    colors: {
      primary: '#A855F7',
      primaryHover: '#9333EA',
      primarySoft: 'rgba(168, 85, 247, 0.2)',
      accent: '#38BDF8',
      accentGold: '#FDE047',
      screenBg: '#130E24',
      screenGradient: 'from-[#130E24] via-[#1B1433] to-[#251A45]',
      cardBg: 'rgba(27, 20, 51, 0.85)',
      cardBorder: 'rgba(168, 85, 247, 0.35)',
      cardShadow: '0 8px 28px -4px rgba(168, 85, 247, 0.20)',
      textMain: '#F8FAFC',
      textMuted: '#C4B5FD',
      headerBg: 'rgba(19, 14, 36, 0.88)',
      navBg: 'rgba(19, 14, 36, 0.92)',
      navActive: '#C084FC',
      bubbleMine: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
      bubbleMineText: '#FFFFFF',
      bubblePartner: 'rgba(37, 26, 69, 0.95)',
      bubblePartnerText: '#F8FAFC',
      inputBg: 'rgba(27, 20, 51, 0.9)',
      inputBorder: 'rgba(168, 85, 247, 0.4)',
      tagBg: 'rgba(168, 85, 247, 0.25)',
      tagText: '#E9D5FF'
    },
    decorations: {
      symbol: '🌙',
      iconPack: ['🌙', '✨', '🪐', '💫', '🔮'],
      skyElement: 'Glowing crescent moons & silver star clusters',
      vibeTag: 'Celestial Starlight'
    }
  },

  theme_royal_hearts: {
    id: 'theme_royal_hearts',
    name: 'Royal Hearts',
    subtitle: 'Champagne Gold, Ivory & Velvet Roses',
    description: 'Rose pink, champagne gold, ivory, and soft mauve. Elegant roses, crystal ornaments, subtle gold accents, and luxurious romantic palace textures.',
    cost: 2500,
    image: LOVEVERSE_ASSETS.themes.royalHearts,
    isDark: false,
    colors: {
      primary: '#BE185D',
      primaryHover: '#9D174D',
      primarySoft: '#FDF2F8',
      accent: '#D97706',
      accentGold: '#F59E0B',
      screenBg: '#FFFDF9',
      screenGradient: 'from-[#FFFDF7] via-[#FFF8F0] to-[#FDEEE9]',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: 'rgba(245, 158, 11, 0.35)',
      cardShadow: '0 8px 26px -4px rgba(190, 24, 93, 0.10)',
      textMain: '#361521',
      textMuted: '#8C6775',
      headerBg: 'rgba(255, 253, 249, 0.90)',
      navBg: 'rgba(255, 253, 249, 0.94)',
      navActive: '#BE185D',
      bubbleMine: 'linear-gradient(135deg, #E11D48 0%, #BE185D 100%)',
      bubbleMineText: '#FFFFFF',
      bubblePartner: 'rgba(255, 255, 255, 0.95)',
      bubblePartnerText: '#361521',
      inputBg: 'rgba(255, 255, 255, 0.95)',
      inputBorder: 'rgba(245, 158, 11, 0.4)',
      tagBg: 'rgba(254, 243, 199, 0.9)',
      tagText: '#B45309'
    },
    decorations: {
      symbol: '👑',
      iconPack: ['👑', '🌹', '💎', '✨', '🍷'],
      skyElement: 'Gilded palace chandeliers & blooming velvet roses',
      vibeTag: 'Regal Romantic Palace'
    }
  },

  theme_soulmate_galaxy: {
    id: 'theme_soulmate_galaxy',
    name: 'Soulmate Galaxy',
    subtitle: 'Cosmic Nebula & Crystalline Hearts',
    description: 'Pastel violet, cosmic pink, sky blue, and luminous pearl. Interstellar nebula gradients, shooting stars, and crystalline eternal connection.',
    cost: 5000,
    image: LOVEVERSE_ASSETS.themes.soulmateGalaxy,
    isDark: true,
    colors: {
      primary: '#C026D3',
      primaryHover: '#A21CAF',
      primarySoft: 'rgba(192, 38, 211, 0.25)',
      accent: '#818CF8',
      accentGold: '#F472B6',
      screenBg: '#0C071E',
      screenGradient: 'from-[#0C071E] via-[#1A0B2E] to-[#2D0D45]',
      cardBg: 'rgba(26, 11, 46, 0.85)',
      cardBorder: 'rgba(192, 38, 211, 0.35)',
      cardShadow: '0 8px 30px -4px rgba(192, 38, 211, 0.25)',
      textMain: '#FAF5FF',
      textMuted: '#D8B4FE',
      headerBg: 'rgba(12, 7, 30, 0.88)',
      navBg: 'rgba(12, 7, 30, 0.92)',
      navActive: '#E879F9',
      bubbleMine: 'linear-gradient(135deg, #D946EF 0%, #A21CAF 100%)',
      bubbleMineText: '#FFFFFF',
      bubblePartner: 'rgba(38, 16, 68, 0.95)',
      bubblePartnerText: '#FAF5FF',
      inputBg: 'rgba(26, 11, 46, 0.9)',
      inputBorder: 'rgba(192, 38, 211, 0.4)',
      tagBg: 'rgba(216, 180, 254, 0.2)',
      tagText: '#F0ABFC'
    },
    decorations: {
      symbol: '🌌',
      iconPack: ['🌌', '🪐', '💫', '💜', '☄️'],
      skyElement: 'Vibrant interstellar stardust & glowing auroras',
      vibeTag: 'Cosmic Eternity'
    }
  },

  theme_default: {
    id: 'theme_default',
    name: 'Classic Love Link',
    subtitle: 'Timeless Warmth & Gentle Petals',
    description: 'Clean modern romantic blush, warm whites, and crisp rose highlights. The timeless signature couples sanctuary design.',
    cost: 0,
    image: LOVEVERSE_ASSETS.themes.cloudRomance,
    isDark: false,
    colors: {
      primary: '#F43F5E',
      primaryHover: '#E11D48',
      primarySoft: '#FFE4E6',
      accent: '#FB7185',
      accentGold: '#F59E0B',
      screenBg: '#FFF8FA',
      screenGradient: 'from-[#FFF5F7] via-[#FFF8FA] to-[#FFF1F2]',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardBorder: 'rgba(244, 63, 94, 0.2)',
      cardShadow: '0 4px 16px -2px rgba(244, 63, 94, 0.08)',
      textMain: '#1F2937',
      textMuted: '#6B7280',
      headerBg: 'rgba(255, 255, 255, 0.9)',
      navBg: 'rgba(255, 255, 255, 0.95)',
      navActive: '#F43F5E',
      bubbleMine: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)',
      bubbleMineText: '#FFFFFF',
      bubblePartner: 'rgba(255, 255, 255, 0.95)',
      bubblePartnerText: '#1F2937',
      inputBg: 'rgba(255, 255, 255, 0.95)',
      inputBorder: 'rgba(244, 63, 94, 0.25)',
      tagBg: 'rgba(255, 228, 230, 0.8)',
      tagText: '#BE123C'
    },
    decorations: {
      symbol: '❤️',
      iconPack: ['❤️', '🌹', '💌', '✨', '🧸'],
      skyElement: 'Drifting rose petals & golden sunlight',
      vibeTag: 'Classic Sanctuary'
    }
  }
};

interface ThemeContextType {
  activeThemeId: string;
  previewThemeId: string | null;
  theme: ThemeTokens;
  activeTheme: ThemeTokens;
  isDark: boolean;
  isPreviewing: boolean;
  setPreviewTheme: (themeId: string | null) => void;
  applyTheme: (themeId: string) => Promise<void>;
  unlockTheme: (themeId: string) => Promise<{ success: boolean; error?: string }>;
  isThemeOwned: (themeId: string) => boolean;
}

const defaultTheme = LOVEVERSE_THEMES.theme_cloud_romance;

export const defaultThemeContext: ThemeContextType = {
  activeThemeId: 'theme_cloud_romance',
  previewThemeId: null,
  theme: defaultTheme,
  activeTheme: defaultTheme,
  isDark: false,
  isPreviewing: false,
  setPreviewTheme: () => {},
  applyTheme: async () => {},
  unlockTheme: async () => ({ success: false, error: 'Theme provider not initialized' }),
  isThemeOwned: (id: string) => id === 'theme_cloud_romance',
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

const THEME_STORAGE_KEY = 'lovelink_active_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { inventory, setActiveTheme: setCoinsActiveTheme, spendCoins } = useLoveCoins();
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'theme_cloud_romance';
    } catch {
      return 'theme_cloud_romance';
    }
  });

  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  // Sync with inventory when available
  useEffect(() => {
    if (inventory?.activeTheme && LOVEVERSE_THEMES[inventory.activeTheme]) {
      setActiveThemeId(inventory.activeTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, inventory.activeTheme);
      } catch {}
    }
  }, [inventory?.activeTheme]);

  // The effectively rendered theme: preview overrides active in preview mode!
  const effectiveThemeId = previewThemeId || activeThemeId;
  const theme = useMemo(() => {
    return LOVEVERSE_THEMES[effectiveThemeId] || LOVEVERSE_THEMES.theme_cloud_romance;
  }, [effectiveThemeId]);

  const activeTheme = useMemo(() => {
    return LOVEVERSE_THEMES[activeThemeId] || LOVEVERSE_THEMES.theme_cloud_romance;
  }, [activeThemeId]);

  // Update root CSS variables and data-theme
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--theme-primary-soft', theme.colors.primarySoft);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-bg-screen', theme.colors.screenBg);
    root.style.setProperty('--theme-card-bg', theme.colors.cardBg);
    root.style.setProperty('--theme-card-border', theme.colors.cardBorder);
    root.style.setProperty('--theme-text-main', theme.colors.textMain);
    root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
    root.style.setProperty('--theme-nav-bg', theme.colors.navBg);
    root.style.setProperty('--theme-header-bg', theme.colors.headerBg);

    // Dynamic body styling
    document.body.style.backgroundColor = theme.colors.screenBg;
    document.body.style.color = theme.colors.textMain;
  }, [theme]);

  const runWithViewTransition = (callback: () => void) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      try {
        (document as any).startViewTransition(() => {
          callback();
        });
        return;
      } catch {
        // Fallback gracefully
      }
    }
    callback();
  };

  const isThemeOwned = (id: string): boolean => {
    if (id === 'theme_cloud_romance' || id === 'theme_default') return true;
    const owned = inventory?.ownedThemes || ['theme_cloud_romance', 'theme_default'];
    return owned.includes(id);
  };

  const setPreviewTheme = (themeId: string | null) => {
    runWithViewTransition(() => {
      setPreviewThemeId(themeId);
    });
  };

  const applyTheme = async (themeId: string) => {
    if (!LOVEVERSE_THEMES[themeId]) return;
    sound.tap();
    runWithViewTransition(() => {
      setActiveThemeId(themeId);
      setPreviewThemeId(null);
    });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {}

    // Persist via LoveCoins backend preferences
    if (setCoinsActiveTheme) {
      await setCoinsActiveTheme(themeId);
    }
    sound.playSuccess();
  };

  const unlockTheme = async (themeId: string): Promise<{ success: boolean; error?: string }> => {
    const target = LOVEVERSE_THEMES[themeId];
    if (!target) return { success: false, error: 'Theme not found.' };

    if (isThemeOwned(themeId)) {
      await applyTheme(themeId);
      return { success: true };
    }

    try {
      const res = await spendCoins(themeId, 'theme', target.cost);
      if (!res.success) {
        sound.error();
        return { success: false, error: res.error || 'Failed to unlock theme.' };
      }

      sound.playSuccess();
      await applyTheme(themeId);
      return { success: true };
    } catch (err: any) {
      sound.error();
      return { success: false, error: err.message || 'Transaction error.' };
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        activeThemeId,
        previewThemeId,
        theme,
        activeTheme,
        isDark: theme.isDark,
        isPreviewing: previewThemeId !== null,
        setPreviewTheme,
        applyTheme,
        unlockTheme,
        isThemeOwned,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context || !context.theme) {
    return defaultThemeContext;
  }
  return context;
}
