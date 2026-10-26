export type DigitalGiftProductId = 
  | 'ever_tide'
  | 'our_museum'
  | 'paris_together'
  | 'kitty_letter'
  | 'sakura_night'
  | 'infinite_love'
  | 'memory_archive';

export type DigitalGiftCategory = 
  | 'virtual_worlds'
  | 'animated_letters'
  | 'romantic_invitations'
  | 'memory_archives'
  | 'personalized_gifts';

export interface GiftPhotoItem {
  id: string;
  url: string;
  caption?: string;
  date?: string;
  order?: number;
}

export interface ScrollChapterItem {
  id: string;
  title: string;
  text: string;
  photoUrl?: string;
  order: number;
}

export interface DigitalGiftContent {
  message?: string;
  question?: string;
  answerChoices?: string[];
  date?: string;
  location?: string;
  photos?: GiftPhotoItem[];
  chapters?: ScrollChapterItem[];
  dedication?: string;
  avatar1Style?: string;
  avatar2Style?: string;
  visualVariant?: string;
  musicTrack?: string;
}

export interface RecipientGiftResponse {
  answer: string;
  note?: string;
  respondedAt: number;
  reactionEmoji?: string;
}

export interface DigitalGift {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  creatorName: string;
  recipientId?: string;
  recipientName?: string;
  productId: DigitalGiftProductId;
  title: string;
  theme: string;
  musicTrack?: string;
  status: 'draft' | 'published';
  isPublicShare: boolean;
  shareToken?: string;
  content: DigitalGiftContent;
  recipientResponse?: RecipientGiftResponse;
  viewsCount?: number;
  cost?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DigitalGiftProductMeta {
  id: DigitalGiftProductId;
  title: string;
  tagline: string;
  category: DigitalGiftCategory;
  categoryLabel: string;
  icon: string;
  badge: string;
  description: string;
  coinCost: number;
  isFreeStarter: boolean;
  features: string[];
  themes: { id: string; name: string; color: string; bgGradient: string }[];
  defaultContent: DigitalGiftContent;
}

export const DIGITAL_GIFT_PRODUCTS: DigitalGiftProductMeta[] = [
  {
    id: 'ever_tide',
    title: 'Ever Tide: Our Sunset Island',
    tagline: 'An interactive tropical sunset paradise for two soulmates',
    category: 'virtual_worlds',
    categoryLabel: 'Virtual Worlds',
    icon: '🏝️',
    badge: 'Popular World',
    description: 'A breathtaking sunset island with gentle ocean waves, personalized couple avatars on the shoreline, and a drifting sky-banner asking your heartfelt question.',
    coinCost: 0,
    isFreeStarter: true,
    features: [
      'Interactive animated sunset ocean & swaying palms',
      'Personalized couple avatars sitting together',
      'Floating sky-banner with your custom question',
      'Secret message bottle unwrap with celebratory heart waves',
      'Soothing ambient sound & customizable themes'
    ],
    themes: [
      { id: 'sunset_peach', name: 'Sunset Peach', color: '#F97316', bgGradient: 'from-amber-400 via-rose-500 to-indigo-900' },
      { id: 'twilight_dusk', name: 'Twilight Lavender', color: '#8B5CF6', bgGradient: 'from-pink-500 via-purple-600 to-slate-950' },
      { id: 'golden_dawn', name: 'Golden Sunrise', color: '#F59E0B', bgGradient: 'from-yellow-300 via-orange-400 to-rose-700' }
    ],
    defaultContent: {
      message: 'Across every ocean and under every sky, there is no place I would rather be than right beside you.',
      question: 'Will you always be my favorite person to watch sunsets with?',
      answerChoices: ['Yes, forever and ever! 💖', 'Always and unconditionally! ✨', 'You hold my heart! 🌊'],
      avatar1Style: 'style_casual',
      avatar2Style: 'style_cozy',
      visualVariant: 'sunset_peach'
    }
  },
  {
    id: 'our_museum',
    title: 'Our Museum: Shared Memories',
    tagline: 'A private high-elegance virtual art gallery for your greatest love story',
    category: 'memory_archives',
    categoryLabel: 'Memory Archives',
    icon: '🏛️',
    badge: 'Couples Masterpiece',
    description: 'An interactive virtual museum dedicated to your relationship with framed photos, custom brass dedication plaque, and spotlight close-up examinations.',
    coinCost: 150,
    isFreeStarter: false,
    features: [
      'Framed virtual gallery with dynamic wall layouts',
      'Personalized museum entrance brass dedication plaque',
      'Tap-to-inspect artwork with museum curatorial notes',
      'Upload and organize 6 to 45 couple photos with captions',
      'Atmospheric classical gallery lighting & color themes'
    ],
    themes: [
      { id: 'classic_marble', name: 'Classic Marble Wing', color: '#E2E8F0', bgGradient: 'from-slate-800 via-slate-900 to-black' },
      { id: 'modern_loft', name: 'Rose Gold Salon', color: '#FB7185', bgGradient: 'from-rose-950 via-purple-950 to-slate-950' },
      { id: 'candlelit_salon', name: 'Candlelit Louvre', color: '#D97706', bgGradient: 'from-amber-950 via-stone-900 to-black' }
    ],
    defaultContent: {
      dedication: 'Dedicated to the countless moments, silly laughs, and quiet adventures that make us who we are.',
      message: 'Every picture tells a chapter of how deeply I cherish you. Welcome to the museum of our love.',
      photos: [
        {
          id: 'photo_demo_1',
          url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
          caption: 'Where our story first sparked into warmth.',
          date: 'The Beginning',
          order: 1
        },
        {
          id: 'photo_demo_2',
          url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
          caption: 'Pure laughter and golden hours under the warm sun.',
          date: 'Summer Romance',
          order: 2
        },
        {
          id: 'photo_demo_3',
          url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
          caption: 'Hand in hand through every season and city.',
          date: 'Adventures Together',
          order: 3
        }
      ]
    }
  },
  {
    id: 'paris_together',
    title: 'Paris Together: A Romantic Invitation',
    tagline: 'An animated Parisian sunset invitation with glowing lights & fireworks',
    category: 'romantic_invitations',
    categoryLabel: 'Romantic Invitations',
    icon: '🗼',
    badge: 'Enchanting Date',
    description: 'An animated romantic invitation set against the illuminated Eiffel Tower at sunset with Parisian bistro lanterns, custom rendezvous date, and interactive celebration.',
    coinCost: 0,
    isFreeStarter: true,
    features: [
      'Eiffel Tower sunset scene with glowing street lamps',
      'Personalized boarding pass & wax seal invitation',
      'Custom date, time, venue, and intimate invitation message',
      'Interactive response question with celebratory fireworks burst',
      'Romantic French café chime & accordion ambience'
    ],
    themes: [
      { id: 'paris_sunset', name: 'Parisian Sunset', color: '#F43F5E', bgGradient: 'from-orange-400 via-rose-600 to-indigo-950' },
      { id: 'midnight_lights', name: 'City of Lights', color: '#6366F1', bgGradient: 'from-indigo-900 via-purple-950 to-black' },
      { id: 'champagne_blush', name: 'Champagne Blush', color: '#EC4899', bgGradient: 'from-pink-400 via-rose-500 to-amber-900' }
    ],
    defaultContent: {
      message: 'Pack your heart and let’s steal away into an unforgettable evening made just for the two of us.',
      question: 'Will you join me for this special romantic rendezvous?',
      location: 'Under the Golden Starlight (Our Special Place)',
      date: 'This Saturday Evening • 7:30 PM',
      answerChoices: ['Oui! A thousand times yes! 🗼', 'I would follow you anywhere! 🍷', 'Counting down every second! ✨']
    }
  },
  {
    id: 'kitty_letter',
    title: 'Kitty Letter: Paws & Love Whispers',
    tagline: 'An adorable kitten-delivered love letter with interactive unfolding animation',
    category: 'animated_letters',
    categoryLabel: 'Animated Letters',
    icon: '🐱',
    badge: 'Cute & Sweet',
    description: 'A heartwarming animated letter carried by an adorable illustrated kitten messenger. Tap the wax seal to watch the parchment unfold with heartfelt words.',
    coinCost: 0,
    isFreeStarter: true,
    features: [
      'Animated sweet kitten messenger with ribbon envelope',
      'Delightful wax-seal breaking and paper-unfolding physics',
      'Custom title, personalized love note, and photo polaroid',
      'Interactive cuddle/kiss reaction buttons',
      'Multiple messenger themes (Kitten, Teddy Bear, Star Messenger)'
    ],
    themes: [
      { id: 'pastel_kitten', name: 'Pastel Kitten', color: '#F472B6', bgGradient: 'from-pink-100 via-rose-200 to-purple-200' },
      { id: 'teddy_bear', name: 'Warm Teddy Bear', color: '#D97706', bgGradient: 'from-amber-100 via-orange-200 to-rose-200' },
      { id: 'star_messenger', name: 'Starlight Bunny', color: '#818CF8', bgGradient: 'from-indigo-100 via-purple-200 to-pink-200' }
    ],
    defaultContent: {
      message: 'Just a tiny reminder that you are the sweetest, kindest, most wonderful person in the universe. My heart purrs whenever you are around! 🐾❤️',
      question: 'Will you accept this warm delivery of endless cuddles?',
      answerChoices: ['Accept with a huge cuddle! 🤗', 'Paw-mise to love you forever! 🐾', 'You made my whole day! 💖']
    }
  },
  {
    id: 'sakura_night',
    title: 'Sakura Night: Cherry Blossom Promise',
    tagline: 'An anime-aesthetic moonlit sky with softly drifting cherry blossoms',
    category: 'romantic_invitations',
    categoryLabel: 'Romantic Invitations',
    icon: '🌸',
    badge: 'Dreamy Anime',
    description: 'A serene Japanese nightscape featuring a luminous crescent moon, torii gate silhouette, glowing personalized calligraphy, and falling sakura petals.',
    coinCost: 100,
    isFreeStarter: false,
    features: [
      'Drifting sakura cherry blossom particle animation',
      'Luminous crescent moon and torii gate silhouette',
      'Glowing couple name calligraphy and lantern lights',
      'Custom date invitation or heartfelt dedication question',
      'Petal storm celebration upon recipient interaction'
    ],
    themes: [
      { id: 'midnight_blossom', name: 'Midnight Blossom', color: '#EC4899', bgGradient: 'from-slate-900 via-indigo-950 to-pink-950' },
      { id: 'twilight_petals', name: 'Twilight Purple', color: '#A855F7', bgGradient: 'from-purple-900 via-indigo-950 to-black' },
      { id: 'moonlight_pink', name: 'Moonlit Rose', color: '#F43F5E', bgGradient: 'from-rose-900 via-purple-950 to-slate-950' }
    ],
    defaultContent: {
      message: 'Just as cherry blossoms make the world softer and more beautiful, your love has transformed my whole life.',
      question: 'Under these moonlit blossoms, will you promise your heart to me once more?',
      answerChoices: ['Forever and always! 🌸', 'My heart has always been yours! 🌙', 'Yes, a million times! 💖']
    }
  },
  {
    id: 'infinite_love',
    title: 'Infinite Love: Cosmic Scroll Journey',
    tagline: 'An animated scroll experience taking your partner on a cosmic journey',
    category: 'animated_letters',
    categoryLabel: 'Animated Letters',
    icon: '🌌',
    badge: 'Epic Love Story',
    description: 'Begin high above the Earth and scroll through deep cosmic nebulae, revealing milestones, photos, and messages along a radiant constellation pathway.',
    coinCost: 200,
    isFreeStarter: false,
    features: [
      'Immersive starfield scroll journey from Earth to deep cosmos',
      'Multi-chapter love story milestones with glowing polaroids',
      'Constellation progress tracker showing journey depth',
      'Grand finale crystal supernova heart explosion',
      'Add, reorder, and customize chapters and photos'
    ],
    themes: [
      { id: 'soulmate_nebula', name: 'Soulmate Nebula', color: '#C084FC', bgGradient: 'from-slate-950 via-purple-950 to-black' },
      { id: 'stardust_galaxy', name: 'Stardust Rose', color: '#FB7185', bgGradient: 'from-slate-950 via-rose-950 to-black' },
      { id: 'aurora_borealis', name: 'Cosmic Aurora', color: '#34D399', bgGradient: 'from-slate-950 via-emerald-950 to-indigo-950' }
    ],
    defaultContent: {
      message: 'In a universe of billions of galaxies and infinite stars, finding you was the miracle of my lifetime.',
      chapters: [
        {
          id: 'chap_1',
          title: 'The Spark',
          text: 'It started with a simple hello that quickly turned into conversations we never wanted to end.',
          order: 1
        },
        {
          id: 'chap_2',
          title: 'Falling Deeper',
          text: 'Every day revealed another reason why you are completely irreplaceable to me.',
          order: 2
        },
        {
          id: 'chap_3',
          title: 'To Infinity & Beyond',
          text: 'No matter where life takes us, my love for you expands with every heartbeat.',
          order: 3
        }
      ],
      question: 'Will you travel across this infinite universe with me forever?',
      answerChoices: ['To infinity and beyond! 🚀', 'My soul belongs with yours! ✨', 'Forever in your orbit! 💖']
    }
  },
  {
    id: 'memory_archive',
    title: 'The Memory Archive: Vintage Scrapbook',
    tagline: 'A permanent digital desk and scrapbook with flip Polaroids and handwritten notes',
    category: 'memory_archives',
    categoryLabel: 'Memory Archives',
    icon: '📔',
    badge: 'Keepsake Treasure',
    description: 'A cozy virtual wooden desk with textured scrapbook pages, washi tape accents, and double-sided Polaroid prints you can tap to flip and read handwritten confessions.',
    coinCost: 100,
    isFreeStarter: false,
    features: [
      'Vintage wooden desk & textured paper aesthetic',
      'Interactive double-sided Polaroids that flip on tap',
      'Washi tape, wax seals, stamps, and handwritten note styling',
      'Organized chronological memory pages',
      'Saved permanently in your shared couple keepsake vault'
    ],
    themes: [
      { id: 'vintage_rose', name: 'Vintage Rosewood', color: '#E11D48', bgGradient: 'from-amber-900/20 via-stone-900 to-stone-950' },
      { id: 'kraft_paper', name: 'Warm Kraft Paper', color: '#B45309', bgGradient: 'from-amber-950 via-stone-900 to-neutral-950' },
      { id: 'lavender_dreams', name: 'Pressed Lavender', color: '#7C3AED', bgGradient: 'from-purple-950 via-slate-900 to-black' }
    ],
    defaultContent: {
      dedication: 'Our Treasured Keepsake Scrapbook • Volume I',
      message: 'A collection of the little moments that make our love grand, gentle, and everlasting.',
      photos: [
        {
          id: 'polaroid_1',
          url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
          caption: 'The day we laughed until our stomachs hurt. I will never forget that smile.',
          date: 'October Memories',
          order: 1
        },
        {
          id: 'polaroid_2',
          url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
          caption: 'Your hand in mine, warm against the cool evening breeze.',
          date: 'Starlight Walk',
          order: 2
        }
      ]
    }
  }
];
