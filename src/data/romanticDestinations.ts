export interface RomanticDestination {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  category: 'trip' | 'date' | 'first_meet' | 'bucket_list' | 'milestone';
  description: string;
  photoUrl: string;
  emoji: string;
}

export const ROMANTIC_DESTINATIONS: RomanticDestination[] = [
  {
    id: 'paris_eiffel',
    name: 'Eiffel Tower & Champ de Mars',
    city: 'Paris',
    country: 'France',
    lat: 48.8584,
    lng: 2.2945,
    category: 'bucket_list',
    description: 'Golden sparkles lighting up the Parisian night sky while holding hands by the Seine.',
    photoUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
    emoji: '🗼'
  },
  {
    id: 'venice_gondola',
    name: 'Grand Canal & Rialto Bridge',
    city: 'Venice',
    country: 'Italy',
    lat: 45.4371,
    lng: 12.3326,
    category: 'trip',
    description: 'Drifting along serene canals at sunset with accordion serenades echoing off ancient palazzo walls.',
    photoUrl: 'https://images.unsplash.com/photo-1523906834658-6e2522d4282d?auto=format&fit=crop&w=800&q=80',
    emoji: '🚣'
  },
  {
    id: 'santorini_oia',
    name: 'Oia Blue Domes Sunset',
    city: 'Santorini',
    country: 'Greece',
    lat: 36.4618,
    lng: 25.3753,
    category: 'bucket_list',
    description: 'Whitewashed cliffside terraces overlooking the Aegean caldera bathed in warm rose-gold twilight.',
    photoUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    emoji: '🌅'
  },
  {
    id: 'kyoto_bamboo',
    name: 'Arashiyama Bamboo & Cherry Blossom Path',
    city: 'Kyoto',
    country: 'Japan',
    lat: 35.0165,
    lng: 135.6713,
    category: 'trip',
    description: 'Whispering green stalks, gentle paper lanterns, and blooming pink petals floating in the breeze.',
    photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    emoji: '🌸'
  },
  {
    id: 'maldives_lagoon',
    name: 'Overwater Turquoise Lagoon',
    city: 'Male Atoll',
    country: 'Maldives',
    lat: 4.1755,
    lng: 73.5093,
    category: 'bucket_list',
    description: 'Private stilt villas above crystal-clear waters where bioluminescent waves glow at night.',
    photoUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
    emoji: '🏝️'
  },
  {
    id: 'nyc_central_park',
    name: 'Bow Bridge & Strawberry Fields',
    city: 'New York',
    country: 'USA',
    lat: 40.7758,
    lng: -73.9712,
    category: 'date',
    description: 'Rowing vintage wooden boats beneath the iconic cast-iron bridge framed by autumn foliage.',
    photoUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80',
    emoji: '🗽'
  },
  {
    id: 'bali_ubud',
    name: 'Tegallalang Sacred Valley & Swing',
    city: 'Bali',
    country: 'Indonesia',
    lat: -8.4312,
    lng: 115.2813,
    category: 'trip',
    description: 'Soaring high above emerald terrace valleys with warm tropical breezes and floating flower baths.',
    photoUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    emoji: '🌺'
  },
  {
    id: 'agra_taj',
    name: 'Taj Mahal Monument of Eternal Love',
    city: 'Agra',
    country: 'India',
    lat: 27.1751,
    lng: 78.0421,
    category: 'milestone',
    description: 'The world’s most magnificent tribute to eternal romantic devotion reflected in still marble pools.',
    photoUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    emoji: '🕌'
  },
  {
    id: 'swiss_valley',
    name: 'Lauterbrunnen Valley of 72 Waterfalls',
    city: 'Lauterbrunnen',
    country: 'Switzerland',
    lat: 46.5935,
    lng: 7.9091,
    category: 'trip',
    description: 'Cozy timber chalets nestled beneath towering Alpine peaks with cascading mountain mist.',
    photoUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    emoji: '⛰️'
  },
  {
    id: 'seoul_namsan',
    name: 'N Seoul Tower Love Locks Terrace',
    city: 'Seoul',
    country: 'South Korea',
    lat: 37.5512,
    lng: 126.9882,
    category: 'milestone',
    description: 'Locking two engraved padlocks together against the twinkling city skyline and throwing away the key.',
    photoUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    emoji: '🔒'
  }
];

export const ROMANTIC_PHOTO_PRESETS = [
  {
    id: 'sunset_beach',
    title: 'Sunset Beach Walk',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'candle_dinner',
    title: 'Candlelit Dinner',
    url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'paris_night',
    title: 'Starlight Paris',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cozy_cabin',
    title: 'Mountain Cabin',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'coffee_date',
    title: 'Cozy Cafe Date',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cherry_blossom',
    title: 'Cherry Blossom Park',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'stars_night',
    title: 'Stargazing Night',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'roses_bouquet',
    title: 'Fresh Rose Bouquet',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
  }
];
