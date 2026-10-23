/// <reference types="vite/client" />
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, LOVEVERSE_THEMES } from '../contexts/ThemeContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import {
  MapPin,
  Plus,
  Navigation,
  Image as ImageIcon,
  X,
  Shield,
  Heart,
  Sparkles,
  Search,
  Compass,
  Trash2,
  ExternalLink,
  Layers,
  Globe,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Radio,
  Send,
  ArrowLeft,
  Info,
  Bookmark,
  Utensils,
  Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTrackerPreferences, updateTrackerPreferences } from '../lib/dpdpService';
import { sound } from '../lib/sound';
import { triggerHeartBurstConfetti } from '../lib/celebrationEffects';
import { ROMANTIC_DESTINATIONS, ROMANTIC_PHOTO_PRESETS, RomanticDestination } from '../data/romanticDestinations';
import { THEME_MAP_STYLES, MapStyleKey, MAP_STYLE_OPTIONS } from '../data/mapStyles';
import { Link } from 'react-router-dom';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

export type PrimaryCategory = 'all' | 'date_spots' | 'memories' | 'travel_wishlist';

export interface MapMemory {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  type: string;
  markerType: string;
  title: string;
  content: string;
  location: { lat: number; lng: number };
  photoUrl?: string;
  date: string;
}

export interface CategoryMeta {
  id: 'date_spots' | 'memories' | 'travel_wishlist';
  label: string;
  emoji: string;
  description: string;
  color: string;
  bgLight: string;
  borderLight: string;
  badgeClass: string;
  subTypes: string[];
}

export const MAP_CATEGORIES: CategoryMeta[] = [
  {
    id: 'date_spots',
    label: 'Date Spots',
    emoji: '🥂',
    description: 'Romantic restaurants, intimate cafes & special date nights',
    color: '#D97706',
    bgLight: 'rgba(254, 243, 199, 0.95)',
    borderLight: '#FDE68A',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    subTypes: ['date', 'date_spots', 'dining', 'cafe', 'bar']
  },
  {
    id: 'memories',
    label: 'Memories',
    emoji: '💖',
    description: 'First meets, first kiss, proposals, our home & emotional milestones',
    color: '#E11D48',
    bgLight: 'rgba(255, 228, 230, 0.95)',
    borderLight: '#FECDD3',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    subTypes: ['first_meet', 'memories', 'home', 'milestone', 'special']
  },
  {
    id: 'travel_wishlist',
    label: 'Travel Wishlist',
    emoji: '✈️',
    description: 'Dream vacations, bucket list getaways & future romantic escapes',
    color: '#4F46E5',
    bgLight: 'rgba(224, 231, 255, 0.95)',
    borderLight: '#C7D2FE',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    subTypes: ['trip', 'bucket_list', 'travel_wishlist', 'vacation']
  }
];

// Helper to normalize any existing marker to one of the 3 primary categories
export function getMarkerCategory(markerType: string): 'date_spots' | 'memories' | 'travel_wishlist' {
  if (markerType === 'date' || markerType === 'date_spots' || markerType === 'dining' || markerType === 'cafe') {
    return 'date_spots';
  }
  if (markerType === 'trip' || markerType === 'bucket_list' || markerType === 'travel_wishlist' || markerType === 'vacation') {
    return 'travel_wishlist';
  }
  return 'memories';
}

export function getCategoryMeta(markerType: string): CategoryMeta {
  const catId = getMarkerCategory(markerType);
  return MAP_CATEGORIES.find((c) => c.id === catId) || MAP_CATEGORIES[1];
}

// Generate high-DPI custom SVG pin data URI with drop shadow and category badge
function createCustomPinSvg(catId: 'date_spots' | 'memories' | 'travel_wishlist'): string {
  const meta = MAP_CATEGORIES.find((c) => c.id === catId) || MAP_CATEGORIES[1];
  const pinColor = meta.color;
  const emoji = meta.emoji;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="54" viewBox="0 0 46 54">
    <defs>
      <filter id="pinShadow" x="-25%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="3.5" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
    </defs>
    <!-- Outer Pin Teardrop -->
    <path d="M23 2 C11.5 2 2 11.5 2 23 C2 35.5 23 52 23 52 C23 52 44 35.5 44 23 C44 11.5 34.5 2 23 2 Z" 
          fill="${pinColor}" 
          stroke="#FFFFFF" 
          stroke-width="2.5" 
          filter="url(#pinShadow)"/>
    <!-- Inner White Circle -->
    <circle cx="23" cy="21" r="14" fill="#FFFFFF"/>
    <!-- Category Emoji -->
    <text x="23" y="26.5" font-size="15" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${emoji}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function LoveMapScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || LOVEVERSE_THEMES.theme_cloud_romance;
  const activeThemeId = themeContext?.activeThemeId || 'theme_cloud_romance';
  const { space } = useCoupleSpace();
  const { userData } = useAuth();

  // DPDP affirmative consent check
  const [hasLocationConsent, setHasLocationConsent] = useState<boolean>(() => {
    return getTrackerPreferences().locationMaps;
  });

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setHasLocationConsent(Boolean(e.detail.locationMaps));
      }
    };
    window.addEventListener('lovelink:dpdp-trackers-updated', handleUpdate);
    return () => window.removeEventListener('lovelink:dpdp-trackers-updated', handleUpdate);
  }, []);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasLocationConsent ? apiKey : ''
  });

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [markers, setMarkers] = useState<MapMemory[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMemory | null>(null);
  const [liveLocations, setLiveLocations] = useState<any[]>([]);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  // Active theme mapping for Google Maps style
  const defaultThemeStyleKey: MapStyleKey = useMemo(() => {
    if (activeThemeId === 'theme_moonlight_sky') return 'moonlight';
    if (activeThemeId === 'theme_royal_hearts') return 'royal';
    if (activeThemeId === 'theme_soulmate_galaxy') return 'galaxy';
    return 'cloud';
  }, [activeThemeId]);

  const [activeMapStyleKey, setActiveMapStyleKey] = useState<MapStyleKey>(defaultThemeStyleKey);

  useEffect(() => {
    setActiveMapStyleKey(defaultThemeStyleKey);
  }, [defaultThemeStyleKey]);

  // Category Filter & Legend state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<PrimaryCategory>('all');
  const [showLegend, setShowLegend] = useState(false);

  // UI Drawer / Modal states
  const [showDestinationsDrawer, setShowDestinationsDrawer] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showCarousel, setShowCarousel] = useState(true);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Add marker state
  const [addingLocation, setAddingLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPrimaryCategory, setNewPrimaryCategory] = useState<'date_spots' | 'memories' | 'travel_wishlist'>('date_spots');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loveWaveFeedback, setLoveWaveFeedback] = useState<string | null>(null);

  // Pre-generate custom pin icons for each category
  const pinIcons = useMemo(() => {
    return {
      date_spots: createCustomPinSvg('date_spots'),
      memories: createCustomPinSvg('memories'),
      travel_wishlist: createCustomPinSvg('travel_wishlist')
    };
  }, []);

  // Map Lifecycle
  const onMapLoad = useCallback(function callback(m: google.maps.Map) {
    setMap(m);
  }, []);

  const onMapUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Fetch couple's pinned memories
  useEffect(() => {
    if (!space?.id) return;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/memories`),
      where('type', '==', 'map_marker')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const markersData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any)
        })) as MapMemory[];
        setMarkers(markersData);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/memories`);
      }
    );

    const liveLocationsQ = query(collection(db, `coupleSpaces/${space.id}/liveLocations`));
    const unsubscribeLiveLocations = onSnapshot(
      liveLocationsQ,
      (snapshot) => {
        const locs = snapshot.docs.map((docSnap) => docSnap.data());
        // Only show locations updated within the last 24h
        setLiveLocations(
          locs.filter((l) => l.sharingEnabled && Date.now() - l.updatedAt < 1000 * 60 * 60 * 24)
        );

        const myLoc = locs.find((l) => l.userId === userData?.id);
        if (myLoc) {
          setIsSharingLocation(myLoc.sharingEnabled);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/liveLocations`);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeLiveLocations();
    };
  }, [space?.id, userData?.id]);

  // Live location watcher
  useEffect(() => {
    let watchId: number | undefined;

    if (isSharingLocation && space?.id && userData?.id) {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            setDoc(
              doc(db, `coupleSpaces/${space.id}/liveLocations`, userData.id),
              {
                userId: userData.id,
                coupleSpaceId: space.id,
                lat,
                lng,
                updatedAt: Date.now(),
                sharingEnabled: true
              },
              { merge: true }
            ).catch((err) => {
              console.warn('Failed to update live location document:', err);
            });
          },
          (err) => {
            // Gracefully handle browser/iframe permission denial, unavailable signal or timeout
            console.warn(`Geolocation watch position unavailable (code ${err?.code || 'unknown'}): ${err?.message || 'Permission or signal unavailable'}`);
            setIsSharingLocation(false);
            if (err?.code === 1 /* PERMISSION_DENIED */) {
              setLoveWaveFeedback('📍 Location access not granted by browser');
              setTimeout(() => setLoveWaveFeedback(null), 4000);
            }
          },
          {
            enableHighAccuracy: false,
            maximumAge: 30000,
            timeout: 15000
          }
        );
      } else {
        setIsSharingLocation(false);
      }
    }

    return () => {
      if (watchId !== undefined && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isSharingLocation, space?.id, userData?.id]);

  // Initial user location center
  useEffect(() => {
    if (navigator.geolocation && markers.length === 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => null
      );
    }
  }, [markers.length]);

  // Partner's location helper
  const partnerLocation = useMemo(() => {
    return liveLocations.find((l) => l.userId !== userData?.id);
  }, [liveLocations, userData?.id]);

  const myLocation = useMemo(() => {
    return liveLocations.find((l) => l.userId === userData?.id);
  }, [liveLocations, userData?.id]);

  // Distance calculation
  const distanceInfo = useMemo(() => {
    if (!myLocation || !partnerLocation) return null;
    const km = calculateDistanceKm(myLocation.lat, myLocation.lng, partnerLocation.lat, partnerLocation.lng);
    const miles = Math.round(km * 0.621371);

    let status = '';
    let emoji = '💕';
    if (km < 0.5) {
      status = "In each other's arms 🫂";
      emoji = '💖';
    } else if (km < 30) {
      status = 'In the same city — one heartbeat away! 🏙️';
      emoji = '✨';
    } else if (km < 500) {
      status = 'A sweet road trip apart! 🚗';
      emoji = '💌';
    } else {
      status = 'Connected across skies & constellations ✨';
      emoji = '💫';
    }

    return { km, miles, status, emoji };
  }, [myLocation, partnerLocation]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: markers.length,
      date_spots: 0,
      memories: 0,
      travel_wishlist: 0
    };
    markers.forEach((m) => {
      const cat = getMarkerCategory(m.markerType);
      counts[cat]++;
    });
    return counts;
  }, [markers]);

  // Filtered markers based on selectedCategoryFilter
  const filteredMarkers = useMemo(() => {
    if (selectedCategoryFilter === 'all') return markers;
    return markers.filter((m) => getMarkerCategory(m.markerType) === selectedCategoryFilter);
  }, [markers, selectedCategoryFilter]);

  // Map Click handler
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      sound.playPop();
      setAddingLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
      setSelectedMarker(null);
    }
  }, []);

  // Center to user GPS
  const handleCenterUser = () => {
    sound.tap();
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(userPos);
          if (map) {
            map.panTo(userPos);
            map.setZoom(15);
          }
        },
        (err) => {
          console.warn('Could not access device GPS position:', err?.message);
          setLoveWaveFeedback('📍 GPS location unavailable on this device');
          setTimeout(() => setLoveWaveFeedback(null), 3500);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      setLoveWaveFeedback('📍 Geolocation not available');
      setTimeout(() => setLoveWaveFeedback(null), 3500);
    }
  };

  // Center to partner
  const handleCenterPartner = () => {
    sound.tap();
    if (partnerLocation && map) {
      const pPos = { lat: partnerLocation.lat, lng: partnerLocation.lng };
      map.panTo(pPos);
      map.setZoom(14);
    } else {
      setLoveWaveFeedback("📍 Partner hasn't shared their live location yet");
      setTimeout(() => setLoveWaveFeedback(null), 3500);
    }
  };

  // Fit all memory markers
  const handleFitAllMarkers = () => {
    sound.tap();
    if (!map || markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filteredMarkers.forEach((m) => {
      bounds.extend(m.location);
    });
    if (partnerLocation) {
      bounds.extend({ lat: partnerLocation.lat, lng: partnerLocation.lng });
    }
    map.fitBounds(bounds, { top: 110, bottom: 220, left: 50, right: 50 });
  };

  // Add new marker
  const handleAddMarker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space?.id || !userData?.id || !addingLocation || !newTitle.trim()) return;

    setIsSubmitting(true);
    const markerId = `marker_${Date.now()}`;
    const markerData: MapMemory = {
      id: markerId,
      coupleSpaceId: space.id,
      creatorId: userData.id,
      type: 'map_marker',
      markerType: newPrimaryCategory,
      title: newTitle.trim(),
      content: newNotes.trim(),
      location: addingLocation,
      photoUrl: newPhotoUrl.trim(),
      date: newDate || new Date().toISOString()
    };

    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/memories`, markerId), markerData);
      triggerHeartBurstConfetti();
      sound.success();
      setAddingLocation(null);
      setNewTitle('');
      setNewNotes('');
      setNewPrimaryCategory('date_spots');
      setNewPhotoUrl('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/memories`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete marker
  const handleDeleteMarker = async (markerId: string) => {
    if (!space?.id || !window.confirm('Delete this location pin from our Love Map?')) return;
    try {
      sound.playPop();
      await deleteDoc(doc(db, `coupleSpaces/${space.id}/memories`, markerId));
      setSelectedMarker(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupleSpaces/${space.id}/memories`);
    }
  };

  // Toggle live location broadcast
  const toggleLocationSharing = async () => {
    if (!space?.id || !userData?.id) return;
    sound.tap();

    const newSharingState = !isSharingLocation;
    setIsSharingLocation(newSharingState);

    try {
      await setDoc(
        doc(db, `coupleSpaces/${space.id}/liveLocations`, userData.id),
        {
          userId: userData.id,
          coupleSpaceId: space.id,
          lat: center.lat,
          lng: center.lng,
          updatedAt: Date.now(),
          sharingEnabled: newSharingState
        },
        { merge: true }
      );
      if (newSharingState) {
        sound.chime();
      }
    } catch (err) {
      console.error('Failed to toggle sharing', err);
      setIsSharingLocation(!newSharingState);
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/liveLocations`);
    }
  };

  // Send a Love Wave signal to partner
  const handleSendLoveWave = () => {
    sound.chime();
    triggerHeartBurstConfetti(0.5, 0.3);
    setLoveWaveFeedback('💖 Love wave beamed across the map!');
    setTimeout(() => {
      setLoveWaveFeedback(null);
    }, 3500);
  };

  // React to a specific memory pin
  const handleReactToMarker = (marker: MapMemory) => {
    sound.chime();
    triggerHeartBurstConfetti(0.5, 0.5);
    setLoveWaveFeedback(`💕 Sent a sweet heart pulse for "${marker.title}"!`);
    setTimeout(() => {
      setLoveWaveFeedback(null);
    }, 3200);
  };

  // Select a preset dream destination
  const handleSelectDestination = (dest: RomanticDestination) => {
    sound.tap();
    const destLoc = { lat: dest.lat, lng: dest.lng };
    setCenter(destLoc);
    if (map) {
      map.panTo(destLoc);
      map.setZoom(14);
    }
    setAddingLocation(destLoc);
    setNewTitle(dest.name);
    setNewNotes(dest.description);
    setNewPhotoUrl(dest.photoUrl);
    setNewPrimaryCategory(dest.category === 'date' ? 'date_spots' : 'travel_wishlist');
    setShowDestinationsDrawer(false);
  };

  // Filtered destinations in explore drawer
  const filteredDestinations = useMemo(() => {
    if (!destinationSearch.trim()) return ROMANTIC_DESTINATIONS;
    const queryTerm = destinationSearch.toLowerCase();
    return ROMANTIC_DESTINATIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(queryTerm) ||
        d.city.toLowerCase().includes(queryTerm) ||
        d.country.toLowerCase().includes(queryTerm)
    );
  }, [destinationSearch]);

  return (
    <div
      className="flex flex-col h-screen relative overflow-hidden select-none"
      style={{
        background: theme.colors.screenBg,
        color: theme.colors.textMain
      }}
    >
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 pb-1 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Back button and title */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              onClick={() => sound.tap()}
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md backdrop-blur-xl border transition-all active:scale-95"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder,
                color: theme.colors.textMain
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div
              className="px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-xl border flex items-center gap-2"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              <span className="text-base">{theme.decorations.symbol}</span>
              <div>
                <h1 className="text-xs font-bold leading-tight" style={{ color: theme.colors.textMain }}>
                  Love Map
                </h1>
                <p className="text-[10px] font-medium leading-none" style={{ color: theme.colors.textMuted }}>
                  {filteredMarkers.length} of {markers.length} places
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5">
            {/* Map Legend Toggle Button */}
            <button
              onClick={() => {
                sound.tap();
                setShowLegend(!showLegend);
              }}
              className={`px-2.5 py-1.5 rounded-2xl shadow-md backdrop-blur-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                showLegend ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: showLegend ? theme.colors.primary : theme.colors.cardBg,
                borderColor: showLegend ? theme.colors.primary : theme.colors.cardBorder,
                color: showLegend ? '#FFFFFF' : theme.colors.textMain
              }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Legend</span>
            </button>

            {/* Explore Dream Destinations */}
            <button
              onClick={() => {
                sound.tap();
                setShowDestinationsDrawer(true);
              }}
              className="px-2.5 py-1.5 rounded-2xl shadow-md backdrop-blur-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder,
                color: theme.colors.primary
              }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            {/* Live Location Broadcast */}
            <button
              onClick={toggleLocationSharing}
              className={`px-2.5 py-1.5 rounded-2xl shadow-md backdrop-blur-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                isSharingLocation ? 'text-white' : 'text-gray-500'
              }`}
              style={{
                backgroundColor: isSharingLocation ? theme.colors.primary : theme.colors.cardBg,
                borderColor: isSharingLocation ? theme.colors.primary : theme.colors.cardBorder
              }}
            >
              <Radio className={`w-3.5 h-3.5 ${isSharingLocation ? 'animate-pulse text-white' : ''}`} />
              <span>{isSharingLocation ? 'Live' : 'Radar'}</span>
            </button>
          </div>
        </div>

        {/* 2. CATEGORY FILTER BAR (Date Spots | Memories | Travel Wishlist) */}
        <div className="pointer-events-auto flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-hide max-w-lg w-full mx-auto">
          {/* All Pins Filter */}
          <button
            onClick={() => {
              sound.tap();
              setSelectedCategoryFilter('all');
            }}
            className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold whitespace-nowrap shadow-md backdrop-blur-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
              selectedCategoryFilter === 'all' ? 'text-white scale-102 ring-2 ring-white/50' : 'opacity-85 hover:opacity-100'
            }`}
            style={{
              backgroundColor: selectedCategoryFilter === 'all' ? theme.colors.primary : theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
              color: selectedCategoryFilter === 'all' ? '#FFFFFF' : theme.colors.textMain
            }}
          >
            <span>✨</span>
            <span>All Pins</span>
            <span
              className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ml-0.5"
              style={{
                backgroundColor: selectedCategoryFilter === 'all' ? 'rgba(255,255,255,0.25)' : theme.colors.primarySoft,
                color: selectedCategoryFilter === 'all' ? '#FFFFFF' : theme.colors.primary
              }}
            >
              {categoryCounts.all}
            </span>
          </button>

          {/* Individual Category Filter Pills */}
          {MAP_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id];
            const isSelected = selectedCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.tap();
                  setSelectedCategoryFilter(isSelected ? 'all' : cat.id);
                }}
                className={`px-2.5 py-1.5 rounded-2xl text-[11px] font-bold whitespace-nowrap shadow-md backdrop-blur-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSelected ? 'text-white scale-102 ring-2 ring-white/50' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isSelected ? cat.color : theme.colors.cardBg,
                  borderColor: isSelected ? cat.color : theme.colors.cardBorder,
                  color: isSelected ? '#FFFFFF' : theme.colors.textMain
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span
                  className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ml-0.5"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                    color: isSelected ? '#FFFFFF' : cat.color
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. INTERACTIVE MAP LEGEND POPOVER (Distinguish Date Spots, Memories & Travel Wishlist) */}
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="pointer-events-auto max-w-sm w-full mx-auto"
            >
              <div
                className="p-3.5 rounded-3xl shadow-2xl backdrop-blur-2xl border flex flex-col gap-2.5"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder
                }}
              >
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.colors.cardBorder }}>
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: theme.colors.textMain }}>
                      Map Legend & Markers
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="p-1 rounded-full opacity-60 hover:opacity-100"
                    style={{ color: theme.colors.textMain }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {MAP_CATEGORIES.map((cat) => {
                    const isFiltered = selectedCategoryFilter === cat.id;
                    const count = categoryCounts[cat.id];

                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          sound.tap();
                          setSelectedCategoryFilter(isFiltered ? 'all' : cat.id);
                        }}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isFiltered ? 'ring-2 shadow-xs' : 'hover:scale-[1.01]'
                        }`}
                        style={{
                          backgroundColor: cat.bgLight,
                          borderColor: cat.borderLight
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Visual pin avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-xs shrink-0"
                            style={{ backgroundColor: '#FFFFFF', color: cat.color }}
                          >
                            {cat.emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold" style={{ color: cat.color }}>
                                {cat.label}
                              </span>
                              <span className="text-[10px] font-semibold text-gray-500">
                                ({count} {count === 1 ? 'spot' : 'spots'})
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 line-clamp-1">{cat.description}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white shadow-2xs shrink-0" style={{ color: cat.color }}>
                          {isFiltered ? 'Filtered' : 'Filter'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1 text-[10px] text-center opacity-70" style={{ color: theme.colors.textMuted }}>
                  Tap any marker on the map to preview its note & memory details
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. LOVE RADAR DISTANCE PILL (When partners connected) */}
        {distanceInfo && !showLegend && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto self-center max-w-sm w-full mx-auto"
          >
            <div
              className="p-2 px-3 rounded-2xl shadow-md backdrop-blur-2xl border flex items-center justify-between gap-2"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: theme.colors.primarySoft, color: theme.colors.primary }}
                >
                  {distanceInfo.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold truncate" style={{ color: theme.colors.textMain }}>
                      {distanceInfo.km.toLocaleString()} km apart
                    </span>
                    <span className="text-[10px] opacity-60">({distanceInfo.miles.toLocaleString()} mi)</span>
                  </div>
                  <p className="text-[10px] truncate" style={{ color: theme.colors.textMuted }}>
                    {distanceInfo.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleSendLoveWave}
                  title="Send Love Wave"
                  className="p-1 px-2 rounded-xl text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Send className="w-3 h-3" />
                  <span>Wave</span>
                </button>

                <button
                  onClick={handleCenterPartner}
                  title="Fly to partner"
                  className="p-1 rounded-xl border text-xs flex items-center justify-center transition-transform active:scale-95"
                  style={{
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.primary,
                    backgroundColor: theme.colors.cardBg
                  }}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Love wave feedback toast */}
        <AnimatePresence>
          {loveWaveFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto self-center bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{loveWaveFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 5. FLOATING RIGHT TOOLBAR */}
      <div className="absolute right-3 top-36 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Recenter My GPS */}
        <button
          onClick={handleCenterUser}
          title="My Location"
          className="w-10 h-10 rounded-2xl shadow-lg backdrop-blur-xl border flex items-center justify-center transition-all active:scale-90 hover:scale-105"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            color: theme.colors.primary
          }}
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Center Partner */}
        {partnerLocation && (
          <button
            onClick={handleCenterPartner}
            title="Partner's Location"
            className="w-10 h-10 rounded-2xl shadow-lg backdrop-blur-xl border flex items-center justify-center transition-all active:scale-90 hover:scale-105"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
              color: '#F43F5E'
            }}
          >
            <Heart className="w-4 h-4 fill-current animate-pulse" />
          </button>
        )}

        {/* Fit All Markers */}
        {markers.length > 0 && (
          <button
            onClick={handleFitAllMarkers}
            title="Fit All Pinned Places"
            className="w-10 h-10 rounded-2xl shadow-lg backdrop-blur-xl border flex items-center justify-center transition-all active:scale-90 hover:scale-105"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
              color: theme.colors.textMain
            }}
          >
            <Compass className="w-4 h-4" />
          </button>
        )}

        {/* Map Vibe Theme Switcher */}
        <button
          onClick={() => {
            sound.tap();
            setShowStylePicker(!showStylePicker);
          }}
          title="Map Style"
          className="w-10 h-10 rounded-2xl shadow-lg backdrop-blur-xl border flex items-center justify-center transition-all active:scale-90 hover:scale-105"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            color: theme.colors.primary
          }}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Map Style Picker Popover */}
      <AnimatePresence>
        {showStylePicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="absolute right-16 top-40 z-30 p-2 rounded-2xl shadow-2xl backdrop-blur-2xl border w-56 flex flex-col gap-1"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider opacity-60">
              Map Universe Vibe
            </div>
            {MAP_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  sound.tap();
                  setActiveMapStyleKey(opt.id);
                  setShowStylePicker(false);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                  activeMapStyleKey === opt.id
                    ? 'text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: activeMapStyleKey === opt.id ? theme.colors.primary : 'transparent',
                  color: activeMapStyleKey === opt.id ? '#FFFFFF' : theme.colors.textMain
                }}
              >
                <span className="text-base">{opt.icon}</span>
                <div className="min-w-0">
                  <div className="leading-tight">{opt.label}</div>
                  <div className="text-[9px] opacity-75 font-normal truncate">{opt.desc}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. PRIMARY GOOGLE MAP VIEW */}
      <div className="flex-1 w-full relative">
        {/* DPDP Consent Gate */}
        {!hasLocationConsent ? (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-rose-50/70 via-pink-50/50 to-white">
            <div
              className="max-w-sm rounded-3xl p-6 border shadow-2xl text-center space-y-3.5 backdrop-blur-xl"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-xs text-xl"
                style={{ backgroundColor: theme.colors.primarySoft, color: theme.colors.primary }}
              >
                📍
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: theme.colors.textMain }}>
                  Google Maps & Couple Geolocation Paused
                </h3>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: theme.colors.primary }}>
                  DPDP Act (India, 2023) Privacy Gate
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                Loading interactive Google Maps and broadcasting your partner distance radar requires affirmative tracker consent.
              </p>
              <div className="pt-1 space-y-2">
                <button
                  onClick={() => {
                    sound.tap();
                    updateTrackerPreferences({ locationMaps: true });
                  }}
                  className="w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Grant Consent & Load Interactive Map
                </button>
                <a
                  href="/privacy"
                  className="block text-[11px] underline opacity-70 hover:opacity-100"
                  style={{ color: theme.colors.textMuted }}
                >
                  Review DPDP Privacy Notice
                </a>
              </div>
            </div>
          </div>
        ) : !apiKey || loadError ? (
          /* High-Fidelity Interactive Vector Map Fallback (Zero Dead Screens) */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-950 overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:24px_24px]" />

            <div
              className="z-10 max-w-md w-full p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl text-center space-y-4"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-purple-500 text-white flex items-center justify-center mx-auto text-2xl shadow-lg">
                🗺️
              </div>
              <div>
                <h3 className="text-base font-extrabold" style={{ color: theme.colors.textMain }}>
                  Romantic Vector Love Map
                </h3>
                <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                  Explore your pinned Date Spots, Memories, and Travel Wishlist destinations.
                </p>
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    sound.tap();
                    setAddingLocation({ lat: 48.8584, lng: 2.2945 });
                  }}
                  className="p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 shadow-xs transition active:scale-95"
                  style={{
                    backgroundColor: theme.colors.primarySoft,
                    color: theme.colors.primary,
                    borderColor: theme.colors.cardBorder
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Pin New Place</span>
                </button>

                <button
                  onClick={() => {
                    sound.tap();
                    setShowDestinationsDrawer(true);
                  }}
                  className="p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 shadow-xs transition active:scale-95"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    color: theme.colors.textMain,
                    borderColor: theme.colors.cardBorder
                  }}
                >
                  <Globe className="w-4 h-4" />
                  <span>Dream Spots</span>
                </button>
              </div>

              {filteredMarkers.length > 0 && (
                <div className="text-left pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-2 opacity-60">
                    Spots ({filteredMarkers.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {filteredMarkers.map((m) => {
                      const meta = getCategoryMeta(m.markerType);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            sound.chime();
                            setSelectedMarker(m);
                          }}
                          className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer hover:bg-black/5"
                          style={{ borderColor: theme.colors.cardBorder }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>{meta.emoji}</span>
                            <div className="truncate">
                              <span className="font-bold truncate block">{m.title}</span>
                              <span className="text-[10px] text-gray-500 italic truncate block">"{m.content}"</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMarker(m.id);
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : !isLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-rose-50/50">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <MapPin className="w-10 h-10 animate-bounce" style={{ color: theme.colors.primary }} />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-amber-400 animate-spin" />
              </div>
              <p className="text-sm font-bold tracking-wide" style={{ color: theme.colors.primary }}>
                Opening Our Loveverse Map...
              </p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={4}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={onMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: THEME_MAP_STYLES[activeMapStyleKey] || THEME_MAP_STYLES.cloud,
              gestureHandling: 'greedy'
            }}
          >
            {/* Couple Geodesic Distance Polyline */}
            {myLocation && partnerLocation && (
              <Polyline
                path={[
                  { lat: myLocation.lat, lng: myLocation.lng },
                  { lat: partnerLocation.lat, lng: partnerLocation.lng }
                ]}
                options={{
                  strokeColor: theme.colors.primary,
                  strokeOpacity: 0.85,
                  strokeWeight: 3,
                  geodesic: true
                }}
              />
            )}

            {/* Pinned Couple Memory Markers with Distinct Category Pins */}
            {filteredMarkers.map((marker) => {
              const catId = getMarkerCategory(marker.markerType);
              const customPinUrl = pinIcons[catId];

              return (
                <Marker
                  key={marker.id}
                  position={marker.location}
                  onClick={() => {
                    sound.chime();
                    setSelectedMarker(marker);
                    setAddingLocation(null);
                  }}
                  icon={
                    window.google
                      ? {
                          url: customPinUrl,
                          scaledSize: new google.maps.Size(40, 48),
                          anchor: new google.maps.Point(20, 48)
                        }
                      : customPinUrl
                  }
                  title={`${marker.title} (${getCategoryMeta(marker.markerType).label})`}
                />
              );
            })}

            {/* Live Locations of Both Partners */}
            {liveLocations.map((loc) => {
              const isPartner = loc.userId !== userData?.id;
              return (
                <Marker
                  key={`live_${loc.userId}`}
                  position={{ lat: loc.lat, lng: loc.lng }}
                  label={{
                    text: isPartner ? '💖' : '👤',
                    fontSize: '24px'
                  }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 1,
                    fillColor: isPartner ? '#F43F5E' : '#3B82F6',
                    fillOpacity: 0.5,
                    strokeWeight: 0
                  }}
                  title={isPartner ? "Partner's Live Location" : 'My Live Location'}
                />
              );
            })}

            {/* 7. INTERACTIVE STYLED TOOLTIP (IN-MAP INFOWINDOW) */}
            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.location}
                onCloseClick={() => setSelectedMarker(null)}
                options={{
                  pixelOffset: window.google ? new google.maps.Size(0, -42) : undefined
                }}
              >
                <div className="p-1 max-w-[260px] text-gray-900 select-text">
                  {/* Category Pill Tag */}
                  {(() => {
                    const meta = getCategoryMeta(selectedMarker.markerType);
                    return (
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${meta.badgeClass}`}
                        >
                          <span>{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(selectedMarker.date).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Marker Title */}
                  <h3 className="font-extrabold text-gray-950 text-sm mb-1 leading-snug">
                    {selectedMarker.title}
                  </h3>

                  {/* Photo Preview Thumbnail */}
                  {selectedMarker.photoUrl && (
                    <div
                      onClick={() => setPreviewPhotoUrl(selectedMarker.photoUrl || null)}
                      className="w-full h-28 mb-2 rounded-xl overflow-hidden bg-gray-100 shadow-xs border border-gray-100 cursor-pointer relative group"
                    >
                      <img
                        src={selectedMarker.photoUrl}
                        alt="Memory preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Tap to zoom
                      </div>
                    </div>
                  )}

                  {/* Interactive Note Preview */}
                  {selectedMarker.content ? (
                    <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-xl p-2 border border-rose-100/80 my-1">
                      <p className="text-xs text-gray-700 leading-relaxed italic">
                        “{selectedMarker.content}”
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic my-1">No notes recorded yet</p>
                  )}

                  {/* Interactive Actions in Tooltip */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReactToMarker(selectedMarker)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg transition-transform active:scale-95"
                      >
                        <Heart className="w-3 h-3 fill-current" />
                        <span>Send Heart</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.location.lat},${selectedMarker.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Directions
                      </a>
                    </div>

                    {selectedMarker.creatorId === userData?.id && (
                      <button
                        onClick={() => handleDeleteMarker(selectedMarker.id)}
                        className="text-[11px] font-medium text-red-500 hover:text-red-700 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Dropped Pin Indicator InfoWindow */}
            {addingLocation && (
              <InfoWindow
                position={addingLocation}
                onCloseClick={() => setAddingLocation(null)}
              >
                <div className="p-1 text-center">
                  <p className="text-xs font-bold text-rose-600 mb-1">📍 New Location Selected</p>
                  <p className="text-[10px] text-gray-500">Fill the card below to pin this spot</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* 8. INTERACTIVE BOTTOM TOOLTIP PREVIEW CARD (Mobile-first pinned card on marker tap) */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-20 left-3 right-3 z-30 max-w-md mx-auto pointer-events-auto"
          >
            {(() => {
              const meta = getCategoryMeta(selectedMarker.markerType);

              return (
                <div
                  className="p-3.5 rounded-3xl shadow-2xl backdrop-blur-2xl border relative flex flex-col gap-2"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.cardBorder
                  }}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full border opacity-70 hover:opacity-100 transition-colors"
                    style={{
                      borderColor: theme.colors.cardBorder,
                      backgroundColor: theme.colors.cardBg,
                      color: theme.colors.textMain
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-start gap-3">
                    {/* Photo or Category Badge Avatar */}
                    {selectedMarker.photoUrl ? (
                      <div
                        onClick={() => setPreviewPhotoUrl(selectedMarker.photoUrl || null)}
                        className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-xs border cursor-pointer relative group"
                        style={{ borderColor: meta.borderLight }}
                      >
                        <img
                          src={selectedMarker.photoUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs"
                        style={{ backgroundColor: meta.bgLight, border: `1px solid ${meta.borderLight}` }}
                      >
                        {meta.emoji}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold flex items-center gap-1 border ${meta.badgeClass}`}
                        >
                          <span>{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] opacity-60" style={{ color: theme.colors.textMuted }}>
                          {new Date(selectedMarker.date).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold truncate" style={{ color: theme.colors.textMain }}>
                        {selectedMarker.title}
                      </h4>

                      {/* Memory Note Excerpt */}
                      {selectedMarker.content && (
                        <p className="text-xs line-clamp-2 mt-0.5 italic" style={{ color: theme.colors.textMuted }}>
                          “{selectedMarker.content}”
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t mt-1" style={{ borderColor: theme.colors.cardBorder }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReactToMarker(selectedMarker)}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>Send Heart</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.location.lat},${selectedMarker.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-transform active:scale-95"
                        style={{
                          borderColor: theme.colors.cardBorder,
                          color: theme.colors.textMain,
                          backgroundColor: theme.colors.cardBg
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>
                    </div>

                    {selectedMarker.creatorId === userData?.id && (
                      <button
                        onClick={() => handleDeleteMarker(selectedMarker.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 transition-colors"
                        title="Delete Marker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. FLOATING PRIMARY ACTION BUTTON: "+ PIN MEMORY" */}
      {!addingLocation && !selectedMarker && (
        <div className="absolute right-3 bottom-24 z-20 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              sound.tap();
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setAddingLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  },
                  () => {
                    setAddingLocation(center);
                  }
                );
              } else {
                setAddingLocation(center);
              }
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full text-white font-extrabold text-xs shadow-2xl border border-white/30 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%)`
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Pin Memory</span>
            <Sparkles className="w-3.5 h-3.5 opacity-80" />
          </motion.button>
        </div>
      )}

      {/* 10. BOTTOM MEMORY CAROUSEL DRAWER (When no marker selected) */}
      {markers.length > 0 && !addingLocation && !selectedMarker && (
        <div className="absolute bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-0 right-0 z-20 px-3 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto flex flex-col gap-1.5">
            {/* Header toggle pill */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 backdrop-blur-md shadow-xs">
                Pinned Locations ({filteredMarkers.length})
              </span>

              <button
                onClick={() => setShowCarousel(!showCarousel)}
                className="w-7 h-7 rounded-full shadow-md backdrop-blur-xl border flex items-center justify-center shrink-0 ml-1 transition-transform"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  color: theme.colors.textMain
                }}
              >
                {showCarousel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Cards Carousel */}
            <AnimatePresence>
              {showCarousel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-hide snap-x"
                >
                  {filteredMarkers.map((marker) => {
                    const meta = getCategoryMeta(marker.markerType);

                    return (
                      <div
                        key={marker.id}
                        onClick={() => {
                          sound.tap();
                          setSelectedMarker(marker);
                          if (map) {
                            map.panTo(marker.location);
                            map.setZoom(15);
                          }
                        }}
                        className="min-w-[210px] max-w-[230px] p-2.5 rounded-2xl shadow-xl backdrop-blur-2xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 snap-start"
                        style={{
                          backgroundColor: theme.colors.cardBg,
                          borderColor: theme.colors.cardBorder
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {marker.photoUrl ? (
                            <img
                              src={marker.photoUrl}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs border border-white/20"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                              style={{ backgroundColor: meta.bgLight }}
                            >
                              {meta.emoji}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold truncate" style={{ color: theme.colors.textMain }}>
                              {marker.title}
                            </h4>
                            <p className="text-[10px] truncate" style={{ color: theme.colors.textMuted }}>
                              {marker.content || new Date(marker.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-black/5 dark:border-white/5">
                          <span className="font-bold text-[9px] flex items-center gap-1" style={{ color: meta.color }}>
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                          <span className="font-bold flex items-center gap-0.5" style={{ color: theme.colors.primary }}>
                            Preview <MapPin className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 11. SLIDE-UP MODAL: ADD SPECIAL PLACE */}
      <AnimatePresence>
        {addingLocation && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto px-4 pb-8"
          >
            <div
              className="max-w-md mx-auto rounded-[2.5rem] p-6 shadow-2xl border relative backdrop-blur-3xl"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setAddingLocation(null)}
                className="absolute top-5 right-5 p-2 rounded-full border transition-colors opacity-70 hover:opacity-100"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  color: theme.colors.textMain
                }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📍</span>
                <div>
                  <h3 className="text-base font-extrabold" style={{ color: theme.colors.textMain }}>
                    Pin a Special Location
                  </h3>
                  <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>
                    Coordinate: {addingLocation.lat.toFixed(4)}, {addingLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddMarker} className="space-y-3.5">
                {/* 3 Core Category Selection Cards */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 opacity-70">
                    Category Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MAP_CATEGORIES.map((cat) => {
                      const isSelected = newPrimaryCategory === cat.id;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sound.tap();
                            setNewPrimaryCategory(cat.id);
                          }}
                          className={`p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                            isSelected
                              ? 'ring-2 scale-102 shadow-md text-white'
                              : 'opacity-75 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isSelected ? cat.color : cat.bgLight,
                            borderColor: cat.borderLight,
                            color: isSelected ? '#FFFFFF' : cat.color
                          }}
                        >
                          <span className="text-xl mb-1">{cat.emoji}</span>
                          <span className="text-[11px] font-extrabold leading-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Title */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-70">
                    Place Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Our First Date Cafe, Eiffel Tower, Starlight Beach..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold border outline-none transition-all shadow-xs"
                    style={{
                      backgroundColor: theme.colors.inputBg,
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.textMain
                    }}
                  />
                </div>

                {/* Date Picker */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-70">
                    Date of Memory / Dream Trip
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2 text-xs font-medium border outline-none transition-all shadow-xs"
                    style={{
                      backgroundColor: theme.colors.inputBg,
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.textMain
                    }}
                  />
                </div>

                {/* Love Note / Memory Content */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-70">
                    Memory Note & Thoughts
                  </label>
                  <textarea
                    placeholder="Write a sweet memory, favorite dish, or reason this spot is special..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-2xl px-4 py-2.5 text-xs border outline-none resize-none transition-all shadow-xs"
                    style={{
                      backgroundColor: theme.colors.inputBg,
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.textMain
                    }}
                  />
                </div>

                {/* Photo Presets & Custom URL */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 opacity-70">
                    Photo (Choose Preset or Enter URL)
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
                    {ROMANTIC_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          sound.tap();
                          setNewPhotoUrl(preset.url);
                        }}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-transform active:scale-95 ${
                          newPhotoUrl === preset.url ? 'ring-2 scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: newPhotoUrl === preset.url ? theme.colors.primary : 'transparent'
                        }}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                        {newPhotoUrl === preset.url && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="relative mt-2">
                    <input
                      type="url"
                      placeholder="Or paste custom photo URL..."
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="w-full rounded-xl pl-9 pr-3 py-2 text-xs border outline-none transition-all shadow-xs"
                      style={{
                        backgroundColor: theme.colors.inputBg,
                        borderColor: theme.colors.inputBorder,
                        color: theme.colors.textMain
                      }}
                    />
                    <ImageIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-50" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!newTitle.trim() || isSubmitting}
                  className="w-full text-white font-extrabold text-sm py-3 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%)`
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Pin...' : 'Save Special Place'}</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 12. SLIDE-UP DRAWER: EXPLORE DREAM ROMANTIC DESTINATIONS */}
      <AnimatePresence>
        {showDestinationsDrawer && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto px-4 pb-8"
          >
            <div
              className="max-w-md mx-auto rounded-[2.5rem] p-6 shadow-2xl border relative backdrop-blur-3xl"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDestinationsDrawer(false)}
                className="absolute top-5 right-5 p-2 rounded-full border transition-colors opacity-70 hover:opacity-100"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  color: theme.colors.textMain
                }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="text-base font-extrabold" style={{ color: theme.colors.textMain }}>
                    Dream Romantic Destinations
                  </h3>
                  <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>
                    Add to your Travel Wishlist or mark where you've visited!
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative my-3">
                <input
                  type="text"
                  placeholder="Search city, landmark, or country..."
                  value={destinationSearch}
                  onChange={(e) => setDestinationSearch(e.target.value)}
                  className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold border outline-none shadow-xs"
                  style={{
                    backgroundColor: theme.colors.inputBg,
                    borderColor: theme.colors.inputBorder,
                    color: theme.colors.textMain
                  }}
                />
                <Search className="w-4 h-4 absolute left-3 top-3 opacity-50" />
              </div>

              {/* Destinations List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredDestinations.map((dest) => (
                  <div
                    key={dest.id}
                    onClick={() => handleSelectDestination(dest)}
                    className="p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 shadow-xs"
                    style={{
                      borderColor: theme.colors.cardBorder,
                      backgroundColor: theme.colors.cardBg
                    }}
                  >
                    <img
                      src={dest.photoUrl}
                      alt={dest.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{dest.emoji}</span>
                        <h4 className="text-xs font-extrabold truncate" style={{ color: theme.colors.textMain }}>
                          {dest.name}
                        </h4>
                      </div>
                      <p className="text-[10px] font-medium" style={{ color: theme.colors.primary }}>
                        {dest.city}, {dest.country}
                      </p>
                      <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: theme.colors.textMuted }}>
                        {dest.description}
                      </p>
                    </div>

                    <button
                      className="p-2 rounded-xl text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <span>Fly</span>
                      <MapPin className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 13. PHOTO LIGHTBOX MODAL */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPhotoUrl(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative max-w-lg w-full max-h-[80vh] flex flex-col items-center">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="absolute -top-12 right-0 p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewPhotoUrl}
                alt="Enlarged photo"
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 14. BOTTOM NAVIGATION BAR */}
      <BottomNav />
    </div>
  );
}
