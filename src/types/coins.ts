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
  // VIRTUAL GIFTS (Gift Garden)
  // ==========================================
  // A. Romantic Classics
  {
    id: 'gift_single_rose',
    name: 'Single Rose',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 50,
    description: 'A velvet red rose with dewdrops and a gilded stem to show your tender affection.',
    icon: '🌹',
    image: '/src/assets/images/gift_single_rose_1791977103530.jpg',
    isAnimated: true
  },
  {
    id: 'gift_bouquet_roses',
    name: 'Rose Bouquet',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 200,
    description: 'A magnificent bouquet of fresh roses with a magical cascading petal animation.',
    icon: '💐',
    image: '/src/assets/images/gift_bouquet_roses_1791976799394.jpg',
    isAnimated: true,
    popularity: 'Most Popular'
  },
  {
    id: 'gift_love_letter',
    name: 'Love Letter',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 75,
    description: 'A sealed wax-stamp vintage envelope that delivers your custom heartfelt message.',
    icon: '💌',
    image: '/src/assets/images/gift_love_letter_1791977158702.jpg',
    isAnimated: true
  },
  {
    id: 'gift_heart_cake',
    name: 'Heart-Shaped Cake',
    category: 'gifts',
    subCategory: 'Romantic Classics',
    cost: 150,
    description: 'A gourmet strawberry cream cake with sparkler candles to sweeten their day.',
    icon: '🎂',
    image: '/src/assets/images/gift_heart_cake_1791976879124.jpg',
    isAnimated: true
  },

  // B. Cuddle Corner
  {
    id: 'gift_cuddle_teddy',
    name: 'Cuddle Teddy',
    category: 'gifts',
    subCategory: 'Cuddle Corner',
    cost: 100,
    description: 'A fluffy plush teddy bear holding a glowing heart that bounces into your partner\'s space.',
    icon: '🧸',
    image: '/src/assets/images/gift_cuddle_teddy_1791976822448.jpg',
    isAnimated: true
  },
  {
    id: 'gift_heart_pillow',
    name: 'Heart Pillow',
    category: 'gifts',
    subCategory: 'Cuddle Corner',
    cost: 120,
    description: 'A warm cloud-soft velvet cushion designed for sweet afternoon cuddles.',
    icon: '💖',
    image: '/src/assets/images/gift_cuddle_teddy_1791976822448.jpg',
    isAnimated: true
  },
  {
    id: 'gift_tiny_bear',
    name: 'Tiny Love Bear',
    category: 'gifts',
    subCategory: 'Cuddle Corner',
    cost: 140,
    description: 'An adorable pocket-sized teddy that radiates comforting warmth.',
    icon: '🐻',
    image: '/src/assets/images/gift_cuddle_teddy_1791976822448.jpg',
    isAnimated: true
  },

  // C. Dreamy Surprises
  {
    id: 'gift_crystal_heart',
    name: 'Glass Heart',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 300,
    description: 'A radiant hand-blown crystal heart that refracts rainbow starlight in 3D.',
    icon: '💎',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    isAnimated: true
  },
  {
    id: 'gift_snow_globe',
    name: 'Heart Snow Globe',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 400,
    description: 'A dreamy 3D glass heart snow globe on pastel clouds with golden swirling sparkles.',
    icon: '🔮',
    image: '/src/assets/images/gift_snow_globe_1792055201240.jpg',
    isAnimated: true,
    popularity: 'Featured'
  },
  {
    id: 'gift_starlight_box',
    name: 'Starlight Gift Box',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 550,
    description: 'A magical gift box tied with golden silk ribbon emitting celestial hearts and sparkles.',
    icon: '🎁',
    image: '/src/assets/images/gift_starlight_box_1792055203067.jpg',
    isAnimated: true
  },
  {
    id: 'gift_floating_lantern',
    name: 'Floating Lantern',
    category: 'gifts',
    subCategory: 'Dreamy Surprises',
    cost: 650,
    description: 'A delicate glowing sky lantern carrying your wish into the tranquil night sky.',
    icon: '🏮',
    image: '/src/assets/images/theme_moonlight_sky_1791976914876.jpg',
    isAnimated: true
  },

  // D. Celestial Gifts
  {
    id: 'gift_shooting_star',
    name: 'Shooting Star',
    category: 'gifts',
    subCategory: 'Celestial Gifts',
    cost: 1200,
    description: 'A dazzling celestial shooting star heart leaving an iridescent stardust trail.',
    icon: '🌠',
    image: '/src/assets/images/gift_shooting_star_1792055225008.jpg',
    isAnimated: true
  },
  {
    id: 'gift_moonlight_gift',
    name: 'Moonlight Gift',
    category: 'gifts',
    subCategory: 'Celestial Gifts',
    cost: 1500,
    description: 'A serene twilight crescent moon that bathes your couple space in silver radiance.',
    icon: '🌙',
    image: '/src/assets/images/theme_moonlight_sky_1791976914876.jpg',
    isAnimated: true
  },
  {
    id: 'gift_crystal_galaxy_heart',
    name: 'Crystal Galaxy Heart',
    category: 'gifts',
    subCategory: 'Celestial Gifts',
    cost: 1800,
    description: 'A cosmic heart gemstone containing an entire miniature swirl of sparkling galaxies.',
    icon: '🌌',
    image: '/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg',
    isAnimated: true
  },
  {
    id: 'gift_constellation_bouquet',
    name: 'Constellation Bouquet',
    category: 'gifts',
    subCategory: 'Celestial Gifts',
    cost: 2200,
    description: 'A glowing arrangement of astral blossoms woven from genuine zodiac stars.',
    icon: '✨',
    image: '/src/assets/images/gift_shooting_star_1792055225008.jpg',
    isAnimated: true
  },

  // E. Legendary Keepsakes
  {
    id: 'gift_dream_castle',
    name: 'Dream Castle',
    category: 'gifts',
    subCategory: 'Legendary Keepsakes',
    cost: 3000,
    description: 'A floating fairy-tale cloud castle keepsake reserved for extraordinary milestones.',
    icon: '🏰',
    image: '/src/assets/images/theme_cloud_romance_1791977048928.jpg',
    isAnimated: true
  },
  {
    id: 'gift_heart_palace',
    name: 'Crystal Heart Palace',
    category: 'gifts',
    subCategory: 'Legendary Keepsakes',
    cost: 4500,
    description: 'A monumental crystal sanctuary built in the clouds to honor your eternal devotion.',
    icon: '🏛️',
    image: '/src/assets/images/theme_royal_hearts_1791977003556.jpg',
    isAnimated: true
  },
  {
    id: 'gift_heart_fireworks',
    name: 'Aurora Heart',
    category: 'gifts',
    subCategory: 'Legendary Keepsakes',
    cost: 6000,
    description: 'A dancing screen-wide polar aurora forming pulsing luminous hearts across the sky.',
    icon: '🎆',
    image: '/src/assets/images/theme_royal_hearts_1791977003556.jpg',
    isAnimated: true
  },
  {
    id: 'gift_soulmate_galaxy',
    name: 'Eternal Stars',
    category: 'gifts',
    subCategory: 'Legendary Keepsakes',
    cost: 8000,
    description: 'A legendary cosmic stardust spectacle celebrating unbreakable eternal love.',
    icon: '♾️',
    image: '/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg',
    isAnimated: true
  },

  // ==========================================
  // APP THEMES (Dream Skies)
  // ==========================================
  {
    id: 'theme_cloud_romance',
    name: 'Cloud Romance',
    category: 'themes',
    cost: 0,
    description: 'Soft pink clouds, floating hearts and cream surfaces that make every chat magical.',
    icon: '☁️',
    image: '/src/assets/images/theme_cloud_romance_1791977048928.jpg',
    previewColor: '#F2A7BE',
    popularity: 'Popular'
  },
  {
    id: 'theme_moonlight_sky',
    name: 'Moonlight Dreams',
    category: 'themes',
    cost: 1000,
    description: 'Calming lavender twilight sky with crescent moon, soft blue-purple surfaces and stars.',
    icon: '🌙',
    image: '/src/assets/images/theme_moonlight_sky_1791976914876.jpg',
    previewColor: '#8B5CF6'
  },
  {
    id: 'theme_royal_hearts',
    name: 'Royal Hearts',
    category: 'themes',
    cost: 2500,
    description: 'Elegant rose gradients, warm gold accents, decorative heart motifs and refined surfaces.',
    icon: '👑',
    image: '/src/assets/images/theme_royal_hearts_1791977003556.jpg',
    previewColor: '#E11D48'
  },
  {
    id: 'theme_soulmate_galaxy',
    name: 'Soulmate Galaxy',
    category: 'themes',
    cost: 5000,
    description: 'Dreamy cosmic lavender, glowing stars, glass hearts and deep violet accents.',
    icon: '🌌',
    image: '/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg',
    previewColor: '#9333EA'
  },

  // ==========================================
  // BADGES & FRAMES (Constellation Collection)
  // ==========================================
  {
    id: 'badge_first_spark',
    name: 'First Spark',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 100,
    description: 'Completed your first qualifying couple activity in the Love Link ecosystem.',
    icon: '✨',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    badgeLabel: '✨ First Spark'
  },
  {
    id: 'badge_gift_giver',
    name: 'Gift Giver',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 150,
    description: 'Honors loving partners who delight each other with thoughtful virtual surprises.',
    icon: '🎁',
    image: '/src/assets/images/gift_love_letter_1791977158702.jpg',
    badgeLabel: '🎁 Gift Giver'
  },
  {
    id: 'badge_memory_keeper',
    name: 'Memory Keeper',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 200,
    description: 'Celebrates couples who lovingly curate scrapbook moments and memories.',
    icon: '📸',
    image: '/src/assets/images/gift_cuddle_teddy_1791976822448.jpg',
    badgeLabel: '📸 Memory Keeper'
  },
  {
    id: 'badge_streak_star',
    name: 'Streak Star',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 250,
    description: 'A flaming star emblem celebrating consistent daily dedication to your bond.',
    icon: '🔥',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    badgeLabel: '🔥 Streak Star'
  },
  {
    id: 'badge_loveverse_explorer',
    name: 'Loveverse Explorer',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 300,
    description: 'Awarded to adventurous couples who unlock and explore features in Loveverse.',
    icon: '⭐',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    badgeLabel: '⭐ Explorer'
  },
  {
    id: 'badge_constellation_collector',
    name: 'Constellation Collector',
    category: 'badges',
    subCategory: 'Achievement Badges',
    cost: 400,
    description: 'An elite crest honoring couples who collect rare keepsakes across constellations.',
    icon: '🌟',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    badgeLabel: '🌟 Collector'
  },
  {
    id: 'frame_golden_frame',
    name: 'Golden Heart Frame',
    category: 'badges',
    subCategory: 'Profile Decorations',
    cost: 350,
    description: 'An exquisite baroque golden heart frame adorned with pearls for your profile.',
    icon: '🖼️',
    image: '/src/assets/images/badge_golden_frame_1791977214324.jpg',
    badgeLabel: 'Golden Frame'
  },
  {
    id: 'frame_celestial_halo',
    name: 'Celestial Halo',
    category: 'badges',
    subCategory: 'Profile Decorations',
    cost: 500,
    description: 'A shimmering starlight halo frame with miniature glowing stars and crescent moon.',
    icon: '✨',
    image: '/src/assets/images/frame_celestial_halo_1792055201200.jpg',
    badgeLabel: 'Celestial Halo'
  },
  {
    id: 'frame_starlight_border',
    name: 'Starlight Border',
    category: 'badges',
    subCategory: 'Profile Decorations',
    cost: 450,
    description: 'A delicate sparkling starlight border framing your portrait with celestial embers.',
    icon: '💫',
    image: '/src/assets/images/frame_celestial_halo_1792055201200.jpg',
    badgeLabel: 'Starlight Border'
  },
  {
    id: 'frame_crystal_heart_emblem',
    name: 'Crystal Heart Emblem',
    category: 'badges',
    subCategory: 'Profile Decorations',
    cost: 600,
    description: 'A jewel-encrusted crystal wings crest that glows around your avatar.',
    icon: '💎',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg',
    badgeLabel: 'Crystal Emblem'
  },
  {
    id: 'frame_lavender_constellation',
    name: 'Lavender Constellation Frame',
    category: 'badges',
    subCategory: 'Profile Decorations',
    cost: 750,
    description: 'A majestic lavender zodiac constellation frame with glowing planetary gems.',
    icon: '🪐',
    image: '/src/assets/images/frame_celestial_halo_1792055201200.jpg',
    badgeLabel: 'Constellation Frame'
  },

  // ==========================================
  // GAME CONTENT & SPECIAL FEATURES
  // ==========================================
  {
    id: 'pack_deep_intimacy',
    name: 'Truth or Dare: Deep Vulnerability Pack',
    category: 'game_packs',
    cost: 100,
    description: '40 new deep emotional & intimacy questions to explore with your partner.',
    icon: '🔥',
    image: '/src/assets/images/gift_heart_cake_1791976879124.jpg'
  },
  {
    id: 'pack_romantic_date_roulette',
    name: 'Date Planner: Adventure Roulette Pack',
    category: 'game_packs',
    cost: 120,
    description: '30 spontaneous couples adventure prompts and date night ideas.',
    icon: '🎲',
    image: '/src/assets/images/gift_heart_cake_1791976879124.jpg'
  }
];
