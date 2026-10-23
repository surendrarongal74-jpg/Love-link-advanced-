export interface ThemeDefinition {
  id: string;
  name: string;
  primary: string;
  primarySoft: string;
  bgLight: string;
  textDark: string;
  accent: string;
  description: string;
  cost: number;
  image?: string;
}

export const THEMES_LIST: ThemeDefinition[] = [
  {
    id: 'theme_cloud_romance',
    name: 'Cloud Romance',
    primary: '#E8547A',
    primarySoft: '#F2A7BE',
    bgLight: '#FFF6F9',
    textDark: '#2B1A2E',
    accent: '#F4BF62',
    description: 'Soft pink clouds, floating hearts, cream surfaces, and gentle rose accents.',
    cost: 0,
    image: '/src/assets/images/theme_cloud_romance_1791977048928.jpg'
  },
  {
    id: 'theme_moonlight_sky',
    name: 'Moonlight Dreams',
    primary: '#9333EA',
    primarySoft: '#E9D5FF',
    bgLight: '#231B36',
    textDark: '#FDF4FF',
    accent: '#F4BF62',
    description: 'Lavender night skies, crescent moons, soft blue-purple surfaces, and tiny stars.',
    cost: 1000,
    image: '/src/assets/images/theme_moonlight_sky_1791976914876.jpg'
  },
  {
    id: 'theme_royal_hearts',
    name: 'Royal Hearts',
    primary: '#E8547A',
    primarySoft: '#F2A7BE',
    bgLight: '#FFF8F6',
    textDark: '#381622',
    accent: '#F4BF62',
    description: 'Elegant rose gradients, warm gold accents, decorative heart motifs, and refined surfaces.',
    cost: 2500,
    image: '/src/assets/images/theme_royal_hearts_1791977003556.jpg'
  },
  {
    id: 'theme_soulmate_galaxy',
    name: 'Soulmate Galaxy',
    primary: '#7C3AED',
    primarySoft: '#E9D5FF',
    bgLight: '#1E1430',
    textDark: '#FAF5FF',
    accent: '#F4BF62',
    description: 'Dreamy cosmic lavender, glowing stars, glass hearts, and deep violet accents.',
    cost: 5000,
    image: '/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg'
  },
  {
    id: 'theme_default',
    name: 'Classic Love Link',
    primary: '#F43F5E',
    primarySoft: '#FFE4E6',
    bgLight: '#FFF8FA',
    textDark: '#1F2937',
    accent: '#FB7185',
    description: 'Clean modern romantic blush, warm whites, and crisp rose highlights.',
    cost: 0,
    image: '/src/assets/images/theme_cloud_romance_1791977048928.jpg'
  }
];

export interface WallpaperOption {
  id: string;
  name: string;
  preview: string;
  styleClass: string;
  customBgStyle?: Record<string, string>;
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  {
    id: 'theme_cloud_romance',
    name: 'Cloud Romance Sky',
    preview: 'url(/src/assets/images/theme_cloud_romance_1791977048928.jpg)',
    styleClass: 'bg-cover bg-center',
    customBgStyle: {
      backgroundImage: 'url(/src/assets/images/theme_cloud_romance_1791977048928.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 'theme_moonlight_sky',
    name: 'Moonlight Dreams Night',
    preview: 'url(/src/assets/images/theme_moonlight_sky_1791976914876.jpg)',
    styleClass: 'bg-cover bg-center',
    customBgStyle: {
      backgroundImage: 'url(/src/assets/images/theme_moonlight_sky_1791976914876.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 'theme_royal_hearts',
    name: 'Royal Hearts Palace',
    preview: 'url(/src/assets/images/theme_royal_hearts_1791977003556.jpg)',
    styleClass: 'bg-cover bg-center',
    customBgStyle: {
      backgroundImage: 'url(/src/assets/images/theme_royal_hearts_1791977003556.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 'theme_soulmate_galaxy',
    name: 'Soulmate Galaxy Nebula',
    preview: 'url(/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg)',
    styleClass: 'bg-cover bg-center',
    customBgStyle: {
      backgroundImage: 'url(/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 'blush_gradient',
    name: 'Blush Sweetheart',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #ffe4e6 100%)',
    styleClass: 'bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100'
  },
  {
    id: 'starry_night',
    name: 'Starry Night Velvet',
    preview: 'linear-gradient(135deg, #180d24 0%, #291238 50%, #3e1b4b 100%)',
    styleClass: 'bg-gradient-to-br from-[#180d24] via-[#291238] to-[#3e1b4b]'
  },
  {
    id: 'lavender_dreams',
    name: 'Lavender Dusk',
    preview: 'linear-gradient(135deg, #ede9fe 0%, #fae8ff 50%, #fdf2f8 100%)',
    styleClass: 'bg-gradient-to-br from-purple-100 via-fuchsia-50 to-pink-50'
  }
];

const THEME_KEY = 'lovelink_active_theme';
const WALLPAPER_KEY = 'lovelink_chat_wallpaper';

export function getStoredTheme(): string {
  try {
    return localStorage.getItem(THEME_KEY) || 'theme_cloud_romance';
  } catch {
    return 'theme_cloud_romance';
  }
}

export function applyTheme(themeId: string) {
  try {
    localStorage.setItem(THEME_KEY, themeId);
    const theme = THEMES_LIST.find(t => t.id === themeId) || THEMES_LIST[0];
    
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-soft', theme.primarySoft);
    root.style.setProperty('--theme-bg-light', theme.bgLight);
    root.style.setProperty('--theme-text-dark', theme.textDark);
    root.style.setProperty('--theme-accent', theme.accent);

    // If theme has a dedicated wallpaper preset, auto-apply it
    if (WALLPAPER_PRESETS.some(w => w.id === theme.id)) {
      applyWallpaper(theme.id);
    }

    window.dispatchEvent(new CustomEvent('lovelink-theme-change', { detail: themeId }));
  } catch (err) {
    console.warn('Could not apply theme:', err);
  }
}

export function getStoredWallpaper(): string {
  try {
    return localStorage.getItem(WALLPAPER_KEY) || 'blush_gradient';
  } catch {
    return 'blush_gradient';
  }
}

export function applyWallpaper(wallpaperId: string) {
  try {
    localStorage.setItem(WALLPAPER_KEY, wallpaperId);
    window.dispatchEvent(new CustomEvent('lovelink-wallpaper-change', { detail: wallpaperId }));
  } catch (err) {
    console.warn('Could not apply wallpaper:', err);
  }
}
