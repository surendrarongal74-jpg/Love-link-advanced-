export interface UserWallet {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dailyEarnedToday: number;
  lastEarnDate: string;
  maxDailyQuota: number;
  streakDays?: number;
  lastCheckInDate?: string;
  updatedAt: number;
}

export type TransactionType = 
  | 'mission_reward' 
  | 'referral_bonus' 
  | 'virtual_gift' 
  | 'item_purchase' 
  | 'coupon_redeem'
  | 'daily_checkin';

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  referenceId?: string;
  createdAt: number;
}

export interface UserInventory {
  userId: string;
  ownedThemes: string[];
  activeTheme: string;
  ownedBadges: string[];
  equippedBadge: string;
  ownedGamePacks: string[];
  streakFreezeTokens: number;
  updatedAt: number;
}

export interface RomanticMission {
  id: string;
  title: string;
  category: 'daily' | 'weekly';
  coinsReward: number;
  description: string;
  proofType: 'photo' | 'text';
  promptHint: string;
  cooldownHours: number;
  estimatedMinutes?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'gifts' | 'themes' | 'badges' | 'game_packs';
  cost: number;
  description: string;
  icon: string;
  image?: string;
  subCategory?: string;
  isAnimated?: boolean;
  popularity?: string;
  previewColor?: string;
  badgeLabel?: string;
}

export interface VirtualGiftSent {
  id: string;
  coupleSpaceId: string;
  senderId: string;
  recipientId?: string;
  giftId: string;
  giftName: string;
  cost: number;
  note?: string;
  image?: string;
  createdAt: number;
}

export interface ProofAnalysisResult {
  approved: boolean;
  reason: string;
  feedback: string;
  coinsAwarded: number;
  romanticSparkScore: number;
}

export const MISSIONS_CATALOG: RomanticMission[] = [
  {
    id: 'mission_love_note',
    title: 'Handwritten Love Note',
    category: 'daily',
    coinsReward: 50,
    description: 'Write a sweet physical note to your partner and take a photo of it.',
    proofType: 'photo',
    promptHint: 'Upload a photo showing your handwritten note with warm words.',
    cooldownHours: 12
  },
  {
    id: 'mission_reflection',
    title: 'Mindful Gratitude Reflection',
    category: 'daily',
    coinsReward: 35,
    description: 'Write 3 heartfelt sentences describing a small moment your partner made your day brighter.',
    proofType: 'text',
    promptHint: 'Write at least 3 sentences of authentic gratitude for your partner.',
    cooldownHours: 8
  },
  {
    id: 'mission_meal_together',
    title: 'Cook or Share a Meal',
    category: 'daily',
    coinsReward: 60,
    description: 'Share a homemade dinner or dessert with your partner.',
    proofType: 'photo',
    promptHint: 'Upload a picture of the food, coffee, or dessert plate you shared.',
    cooldownHours: 18
  },
  {
    id: 'mission_sunset_stroll',
    title: 'Sunset Walk or Outdoor Date',
    category: 'weekly',
    coinsReward: 100,
    description: 'Step outside together for a sunset walk, park stroll, or scenic view.',
    proofType: 'photo',
    promptHint: 'Upload a photo of the scenery, path, or a couple selfie outside.',
    cooldownHours: 36
  },
  {
    id: 'mission_memory_scrapbook',
    title: 'Milestone Scrapbook Entry',
    category: 'weekly',
    coinsReward: 90,
    description: 'Upload a meaningful throwback photo or ticket stub with a heartfelt reflection.',
    proofType: 'photo',
    promptHint: 'Upload the photo/memory and write why it is unforgettable.',
    cooldownHours: 48
  },
  {
    id: 'mission_surprise_date',
    title: 'Spontaneous Surprise Date Execution',
    category: 'weekly',
    coinsReward: 150,
    description: 'Plan and execute a sweet surprise date or thoughtful romantic favor for your partner.',
    proofType: 'photo',
    promptHint: 'Upload a photo or write detailed proof of the surprise experience.',
    cooldownHours: 72
  }
];

export const SHOP_CATALOG: ShopItem[] = [
  // ==========================================
  // VIRTUAL GIFTS (12 Distinct Surprises)
  // ==========================================
  {
    id: 'gift_single_rose',
    name: 'Velvet Red Rose',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 50,
    description: 'A hand-picked scarlet rose glistening with morning dewdrops to show your tender affection.',
    icon: '🌹',
    image: '/src/assets/images/gift_single_rose_1791977103530.jpg',
    isAnimated: true
  },
  {
    id: 'gift_love_letter',
    name: 'Sealed Love Letter',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 75,
    description: 'A vintage wax-sealed parchment envelope delivering your heartfelt message.',
    icon: '💌',
    image: '/src/assets/images/gift_love_letter_1791977158702.jpg',
    isAnimated: true
  },
  {
    id: 'gift_cuddle_teddy',
    name: 'Plush Cuddle Bear',
    category: 'gifts',
    subCategory: 'Cuddle Corner',
    cost: 100,
    description: 'A cloud-soft teddy bear holding a glowing heart that bounces into your partner\'s space.',
    icon: '🧸',
    image: '/src/assets/images/gift_cuddle_teddy_1791976822448.jpg',
    isAnimated: true
  },
  {
    id: 'gift_heart_pillow',
    name: 'Embroidered Heart Pillow',
    category: 'gifts',
    subCategory: 'Cuddle Corner',
    cost: 125,
    description: 'A luxurious pink velvet heart pillow adorned with golden lace embroidery for cozy cuddles.',
    icon: '💖',
    image: '/src/assets/images/gift_heart_pillow_1792161124505.jpg',
    isAnimated: true
  },
  {
    id: 'gift_heart_cake',
    name: 'Strawberry Heart Cake',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 150,
    description: 'A gourmet strawberry cream sponge cake topped with sparkler candles to sweeten their day.',
    icon: '🎂',
    image: '/src/assets/images/gift_heart_cake_1791976879124.jpg',
    isAnimated: true
  },
  {
    id: 'gift_bouquet_roses',
    name: 'Royal Rose Bouquet',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 200,
    description: 'A grand arrangement of 24 fragrant roses that showers your partner\'s screen with petal confetti.',
    icon: '💐',
    image: '/src/assets/images/gift_bouquet_roses_1791976799394.jpg',
    isAnimated: true,
    popularity: 'Most Popular'
  },
  {
    id: 'gift_crystal_heart',
    name: 'Prismatic Glass Heart',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 300,
    description: 'A hand-carved crystal heart that refracts luminous rainbow starlight across the room.',
    icon: '💎',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    isAnimated: true
  },
  {
    id: 'gift_snow_globe',
    name: 'Cloud Snow Globe',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 400,
    description: 'A fairy-tale glass globe resting on pastel clouds with swirling golden stardust.',
    icon: '🔮',
    image: '/src/assets/images/gift_snow_globe_1792055201240.jpg',
    isAnimated: true,
    popularity: 'Featured'
  },
  {
    id: 'gift_starlight_box',
    name: 'Starlight Mystery Box',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 550,
    description: 'A shimmering chest tied with satin ribbon that bursts open with luminous celestial hearts.',
    icon: '🎁',
    image: '/src/assets/images/gift_starlight_box_1792055203067.jpg',
    isAnimated: true
  },
  {
    id: 'gift_floating_lantern',
    name: 'Sky Lantern of Wishes',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 700,
    description: 'A glowing warm lantern carrying your shared dreams into the twilight heavens.',
    icon: '🏮',
    image: '/src/assets/images/gift_floating_lantern_1792161141543.jpg',
    isAnimated: true
  },
  {
    id: 'gift_shooting_star',
    name: 'Celestial Shooting Star',
    category: 'gifts',
    subCategory: 'Celestial Gifts',
    cost: 1200,
    description: 'An iridescent cosmic comet tracing a sparkling stardust trail over your partner\'s device.',
    icon: '🌠',
    image: '/src/assets/images/gift_shooting_star_1792055225008.jpg',
    isAnimated: true
  },
  {
    id: 'gift_fireworks',
    name: 'Aurora Heart Fireworks',
    category: 'gifts',
    subCategory: 'Celestial Gifts',
    cost: 2500,
    description: 'A breathtaking midnight fireworks show exploding into pulsing heart constellations and aurora lights.',
    icon: '🎆',
    image: '/src/assets/images/gift_fireworks_1792161156207.jpg',
    isAnimated: true
  },

  // ==========================================
  // APP THEMES (4 Complete Environments)
  // ==========================================
  {
    id: 'theme_cloud_romance',
    name: 'Cloud Romance',
    category: 'themes',
    cost: 0,
    description: 'Dreamy cotton-candy skies, floating pastel hearts and warm cream cards.',
    icon: '☁️',
    image: '/src/assets/images/theme_cloud_romance_1791977048928.jpg',
    previewColor: '#F2A7BE',
    popularity: 'Default'
  },
  {
    id: 'theme_moonlight_sky',
    name: 'Moonlight Dreams',
    category: 'themes',
    cost: 1000,
    description: 'A tranquil twilight violet atmosphere with crescent moon highlights and starry accents.',
    icon: '🌙',
    image: '/src/assets/images/theme_moonlight_sky_1791976914876.jpg',
    previewColor: '#8B5CF6'
  },
  {
    id: 'theme_royal_hearts',
    name: 'Royal Hearts',
    category: 'themes',
    cost: 2500,
    description: 'Passionate crimson rose gradients, ornate filigree borders and warm golden chandeliers.',
    icon: '👑',
    image: '/src/assets/images/theme_royal_hearts_1791977003556.jpg',
    previewColor: '#E11D48'
  },
  {
    id: 'theme_soulmate_galaxy',
    name: 'Soulmate Galaxy',
    category: 'themes',
    cost: 5000,
    description: 'Deep cosmic violet space with shimmering nebulae and interstellar constellation glows.',
    icon: '🌌',
    image: '/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg',
    previewColor: '#9333EA'
  },

  // ==========================================
  // BADGES & PROFILE FRAMES (5 Unique Items)
  // ==========================================
  {
    id: 'badge_first_spark',
    name: 'First Spark Compass',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 100,
    description: 'An ornate golden compass medallion commemorating the very day your hearts first crossed paths.',
    icon: '🧭',
    image: '/src/assets/images/badge_first_spark_1792161236608.jpg',
    badgeLabel: '✨ First Spark'
  },
  {
    id: 'badge_streak_star',
    name: 'Flaming Streak Medal',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 250,
    description: 'A radiant fiery gold star crest honoring consistent daily devotion to your relationship.',
    icon: '🔥',
    image: '/src/assets/images/badge_streak_star_1792161172950.jpg',
    badgeLabel: '🔥 Streak Star'
  },
  {
    id: 'frame_golden_frame',
    name: 'Golden Baroque Frame',
    category: 'badges',
    subCategory: 'Frames',
    cost: 350,
    description: 'An opulent 24K baroque golden heart frame adorned with pearls for your profile picture.',
    icon: '🖼️',
    image: '/src/assets/images/badge_golden_frame_1791977214324.jpg',
    badgeLabel: 'Golden Frame'
  },
  {
    id: 'frame_celestial_halo',
    name: 'Celestial Halo Border',
    category: 'badges',
    subCategory: 'Frames',
    cost: 500,
    description: 'A shimmering white-gold halo of astral light with dancing diamond sparkles.',
    icon: '✨',
    image: '/src/assets/images/frame_celestial_halo_1792055201200.jpg',
    badgeLabel: 'Celestial Halo'
  },
  {
    id: 'frame_lavender_constellation',
    name: 'Lavender Zodiac Frame',
    category: 'badges',
    subCategory: 'Frames',
    cost: 750,
    description: 'A glowing amethyst crystal circle traced with shimmering astrological zodiac constellations.',
    icon: '🪐',
    image: '/src/assets/images/frame_lavender_constellation_1792161187419.jpg',
    badgeLabel: 'Constellation Frame'
  },

  // ==========================================
  // GAME CONTENT & SPECIAL EXPANSIONS
  // ==========================================
  {
    id: 'pack_deep_intimacy',
    name: 'Truth or Dare: Deep Intimacy Deck',
    category: 'game_packs',
    cost: 100,
    description: '40 deep vulnerability prompts and spicy romantic dares to spark late-night conversations.',
    icon: '🃏',
    image: '/src/assets/images/pack_truth_or_dare_1792161203631.jpg'
  },
  {
    id: 'pack_romantic_date_roulette',
    name: 'Date Planner: Adventure Roulette Deck',
    category: 'game_packs',
    cost: 120,
    description: '30 spontaneous couples escapades, mystery itinerary cards, and surprise activity prompts.',
    icon: '🎲',
    image: '/src/assets/images/pack_date_roulette_1792161220187.jpg'
  }
];
