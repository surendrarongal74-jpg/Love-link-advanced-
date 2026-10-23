// Custom Google Maps Styles tuned for Loveverse Romantic Universes

export type MapStyleKey = 'cloud' | 'moonlight' | 'royal' | 'galaxy' | 'daylight';

export const THEME_MAP_STYLES: Record<MapStyleKey, google.maps.MapTypeStyle[]> = {
  // 1. Cloud Romance - Soft pinks, whipped cream, lavender accents, dreamy skies
  cloud: [
    {
      "featureType": "all",
      "elementType": "geometry.fill",
      "stylers": [{ "weight": "2.00" }]
    },
    {
      "featureType": "all",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#FBCFE8" }, { "weight": "0.8" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFF5F8" }]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFF0F5" }]
    },
    {
      "featureType": "landscape.natural",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFF8FA" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFFFFF" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#FCE7F3" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFE4EC" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#F472B6" }, { "weight": "0.6" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9D4EDD" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#FFFFFF" }, { "weight": "2" }]
    },
    {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [{ "visibility": "simplified" }, { "color": "#E9D5FF" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FDE2E8" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#BE185D" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#FFF0F5" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#F472B6" }, { "weight": "1" }]
    },
    {
      "featureType": "administrative",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#831843" }]
    }
  ],

  // 2. Moonlight Dreams - Deep night sky, lavender glow, silver stars, luminous roads
  moonlight: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#0B1120" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#C084FC" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#0B1120" }]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#6366F1" }, { "weight": "1.2" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#111827" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#1E293B" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#334155" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#3B0764" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#A855F7" }, { "weight": "0.8" }]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [{ "color": "#1E1B4B" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#1E1B4B" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#E0E7FF" }]
    }
  ],

  // 3. Royal Hearts - Champagne gold, warm ivory, antique rose, luxury palace feel
  royal: [
    {
      "featureType": "all",
      "elementType": "geometry.fill",
      "stylers": [{ "weight": "2.00" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FAF6F0" }]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFFDF7" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFFFFF" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#FDE68A" }, { "weight": "0.8" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FEF3C7" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#F59E0B" }, { "weight": "0.7" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#92400E" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#FFFBEB" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FEF3C7" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#B45309" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#D97706" }]
    }
  ],

  // 4. Soulmate Galaxy - Cosmic nebula, indigo violet, neon starlight accents
  galaxy: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#130924" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#F472B6" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#130924" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#1C0F38" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2D1554" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#581C87" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#EC4899" }, { "weight": "0.8" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2E1065" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#38BDF8" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#C084FC" }]
    }
  ],

  // 5. Clean Daylight - Soft romantic minimalist
  daylight: [
    {
      "featureType": "all",
      "elementType": "geometry.fill",
      "stylers": [{ "weight": "2.00" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#F8FAFC" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFFFFF" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#E2E8F0" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#FFE4E6" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#475569" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#E0F2FE" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#0284C7" }]
    }
  ]
};

export const MAP_STYLE_OPTIONS: { id: MapStyleKey; label: string; icon: string; desc: string }[] = [
  { id: 'cloud', label: 'Cloud Romance', icon: '☁️', desc: 'Pastel pinks & soft cream skies' },
  { id: 'moonlight', label: 'Moonlight Dreams', icon: '🌙', desc: 'Midnight slate & glowing stars' },
  { id: 'royal', label: 'Royal Hearts', icon: '👑', desc: 'Champagne gold & warm amber' },
  { id: 'galaxy', label: 'Soulmate Galaxy', icon: '🌌', desc: 'Cosmic violet & neon nebula' },
  { id: 'daylight', label: 'Soft Daylight', icon: '☀️', desc: 'Clean, airy romantic daylight' },
];
