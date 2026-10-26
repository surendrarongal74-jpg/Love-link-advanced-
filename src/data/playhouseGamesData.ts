export interface PlayhouseGameDef {
  id: string;
  title: string;
  tagline: string;
  category: 'Creativity' | 'Intimacy' | 'Mystery' | 'Memory' | 'Playful' | 'Strategy' | 'Rhythm';
  icon: string;
  badge: string;
  gradient: string;
  accentColor: string;
  description: string;
  rules: string[];
  features: string[];
  image: string;
  cost?: number;
  isLockedByDefault?: boolean;
}

export const PLAYHOUSE_GAMES: PlayhouseGameDef[] = [
  {
    id: 'truth-or-dare',
    title: 'Truth or Dare',
    tagline: 'Alternate turns, choose Truth or Dare, and reveal prompts.',
    category: 'Intimacy',
    icon: '🍾',
    badge: 'Classic',
    gradient: 'from-rose-500 via-pink-500 to-purple-600',
    accentColor: 'rose-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Spin the bottle, alternate turns, and reveal heartfelt truths or playful romantic dares with your partner.',
    rules: [
      'Take turns spinning the romantic bottle',
      'Choose Truth for deep confessions or Dare for playful romantic actions',
      'Complete the prompt and earn couple intimacy points!'
    ],
    features: [
      'Interactive spinning bottle with sound feedback',
      'Curated romantic & playful prompt deck',
      'AIRA shuffle and completion counter'
    ],
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'love-quiz',
    title: 'Love Quiz',
    tagline: 'Ask questions about preferences and relationship memories.',
    category: 'Intimacy',
    icon: '💌',
    badge: 'Popular',
    gradient: 'from-pink-500 via-rose-500 to-amber-500',
    accentColor: 'pink-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Answer 5 deep questions about date habits, comfort languages, and dreams, then predict your partner’s picks to compare scores.',
    rules: [
      'Choose your honest personal preference for each question',
      'Predict what your partner would select',
      'Reveal answers side-by-side to celebrate your couple intuition!'
    ],
    features: [
      'Multi-category couple questions',
      'Side-by-side answer breakdown',
      'Celebratory particle burst'
    ],
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'daily-love-mission',
    title: 'Daily Love Mission',
    tagline: 'Daily romantic activity with streak tracking and 24h reset.',
    category: 'Playful',
    icon: '🎯',
    badge: 'Daily Streak',
    gradient: 'from-amber-400 via-rose-400 to-pink-500',
    accentColor: 'amber-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'A fresh, actionable daily micro-ritual designed to keep the spark alive every single day.',
    rules: [
      'Check today’s couple mission card',
      'Perform the romantic activity together in real life',
      'Tap to mark completed and build your daily connection streak!'
    ],
    features: [
      'Automatic daily deterministic rotation',
      'Persistent streak counter in storage',
      'Sensible midnight reset logic'
    ],
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'draw-guess',
    title: 'Draw It, Guess It',
    tagline: 'One partner sketches, the other guesses!',
    category: 'Creativity',
    icon: '🎨',
    badge: 'Popular',
    gradient: 'from-amber-400 via-rose-400 to-pink-500',
    accentColor: 'rose-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'A live shared drawing canvas where you take turns sketching secret prompts while your partner guesses against the clock.',
    rules: [
      'Choose a secret romantic, funny, or inside-joke word',
      'The artist draws on the live canvas using colors & brush sizes',
      'The guesser types guesses with real-time hints & timers',
      'Earn couple synergy stars and save masterpieces to shared memories!'
    ],
    features: [
      'Live shared synchronized canvas',
      'Curated couple word packs (Sweet, Flirty, Memories, Goofy)',
      'Brush tools, rainbow palettes, eraser, and clear canvas',
      'Auto-sync guess feedback and score tracking'
    ],
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'spin-the-wheel',
    title: 'Spin the Wheel',
    tagline: 'Spin for tonight’s sweet romantic destiny!',
    category: 'Playful',
    icon: '🎡',
    badge: 'Trending',
    gradient: 'from-rose-500 via-pink-500 to-purple-600',
    accentColor: 'rose-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'An interactive spinning wheel featuring sweet date favors, massages, slow dances, and loving dares.',
    rules: [
      'Take turns spinning the wheel',
      'Honor whatever sweet destiny the wheel lands on',
      'Earn couple synergy points and spark joyful spontaneous moments!'
    ],
    features: [
      'Real animated physics wheel with 8 romantic actions',
      'Confetti celebrations and audio cues',
      'History tracking for recent spins'
    ],
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'would-you-rather',
    title: 'Would You Rather?',
    tagline: 'Playful romantic dilemmas for couples.',
    category: 'Playful',
    icon: '⚖️',
    badge: 'Classic',
    gradient: 'from-pink-400 via-rose-500 to-purple-500',
    accentColor: 'pink-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Provocative, funny, and cozy dilemmas. Lock in your choice and see if your partner chose the same!',
    rules: [
      'Read Option A and Option B carefully',
      'Both partners select privately',
      'Reveal answers simultaneously and compare your romantic synergy!'
    ],
    features: [
      'Dozens of curated couple prompts',
      'Instant answer comparison',
      'Sync streak tracking'
    ],
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'compatibility-challenge',
    title: 'Compatibility Challenge',
    tagline: 'Test your romantic intuition & synchronicity.',
    category: 'Intimacy',
    icon: '💖',
    badge: 'Sync Match',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    accentColor: 'purple-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Answer 5 deep questions about date habits, comfort languages, and dreams, then predict your partner’s picks to calculate your harmony match score.',
    rules: [
      'Step 1: Choose your honest personal preferences',
      'Step 2: Predict your partner\'s choices',
      'View your transparent intuition percentage score and breakdown!'
    ],
    features: [
      'Transparent percentage calculation (non-clinical, high engagement)',
      'Question-by-question harmony breakdown',
      'Instant replay with fresh prompts'
    ],
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'couple-challenges',
    title: 'Couple Challenges',
    tagline: 'Wholesome 5-minute micro adventures.',
    category: 'Intimacy',
    icon: '🎯',
    badge: 'Habits',
    gradient: 'from-emerald-400 via-teal-500 to-indigo-600',
    accentColor: 'emerald-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Simple, actionable intimacy micro-challenges like 60-second eye gazing, digital sunset detox, and surprise love deliveries.',
    rules: [
      'Pick an active challenge for today',
      'Complete the romantic task with your partner',
      'Tap to mark complete, earn points, and build your love score!'
    ],
    features: [
      'Categorized by Quality Time, Touch, Service & Laughter',
      'Persistent completion tracking in local & cloud storage',
      'Celebration confetti bursts on completion'
    ],
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'couples-trivia',
    title: 'Romantic Trivia Quiz',
    tagline: 'Test how well you know couple habits & romance lore.',
    category: 'Memory',
    icon: '🧠',
    badge: 'High Score',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentColor: 'amber-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Fun trivia questions about romantic milestones, love languages, and relationship psychology.',
    rules: [
      'Read the multiple choice prompt',
      'Pick the best answer before the timer expires',
      'Compete with your partner for high scores and bragging rights!'
    ],
    features: [
      'Score tracking and celebratory sound effects',
      'Curated question bank',
      'Instant feedback with fun romantic facts'
    ],
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'guess-answer',
    title: 'Guess My Answer',
    tagline: 'Predict your partner’s secret choice before the reveal!',
    category: 'Intimacy',
    icon: '💭',
    badge: 'High Intimacy',
    gradient: 'from-pink-500 via-rose-500 to-rose-600',
    accentColor: 'rose-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Answer spicy, thoughtful, or hilarious questions privately, predict what your partner picked, and watch both answers unlock simultaneously.',
    rules: [
      'Select a deck: Firsts, Deep Feelings, Quirks, or Future Dreams',
      'Submit your honest answer and predict your partner\'s choice',
      'Once both lock in, the answers flip over together with confetti'
    ],
    features: [
      'Private locked predictions before synchronized reveal',
      'Card packs: Romantic, Quirky, Deep Soul, Date Night',
      'Streak counter for consecutive matching predictions'
    ],
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'emoji-decoder',
    title: 'Emoji Cipher Puzzle',
    tagline: 'Decode secret couple dates and love messages.',
    category: 'Mystery',
    icon: '🔐',
    badge: 'Puzzles',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    accentColor: 'indigo-500',
    cost: 0,
    isLockedByDefault: false,
    description: 'Puzzles where series of emojis represent secret date destinations, movies, and love memories.',
    rules: [
      'Look at the emoji cipher',
      'Type or select the correct date or activity phrase',
      'Earn stars and unlock hints when stuck'
    ],
    features: [
      'Hint lifelines',
      'Interactive letter keyboards',
      'Celebratory particle effects'
    ],
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'memory-guess',
    title: 'Memory Guess',
    tagline: 'Decipher clues about your shared milestones.',
    category: 'Memory',
    icon: '🗝️',
    badge: 'Milestones',
    gradient: 'from-rose-400 via-fuchsia-500 to-indigo-600',
    accentColor: 'rose-500',
    cost: 250,
    isLockedByDefault: true,
    description: 'Uncover progressive clues about your first dates, funniest moments, and secret memories to guess the exact milestone.',
    rules: [
      'Read Clue 1 carefully',
      'Reveal additional clues if needed (-5 score each)',
      'Guess the milestone and test your couple memory accuracy!'
    ],
    features: [
      'Progressive clue reveals',
      'Milestone trivia validation',
      'High score vault'
    ],
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mystery-island',
    title: 'Two Hearts Mystery',
    tagline: 'Cooperative escape riddle adventure.',
    category: 'Mystery',
    icon: '🧩',
    badge: 'Co-op Story',
    gradient: 'from-emerald-500 via-teal-600 to-indigo-600',
    accentColor: 'teal-500',
    cost: 500,
    isLockedByDefault: true,
    description: 'Two partners receive complementary halves of ancient clues. Combine your findings and enter the secret cipher code together to advance.',
    rules: [
      'Partner A receives the Map; Partner B receives the Cipher keys',
      'Discuss clues together to find the solution code',
      'Enter the secret code to unlock Chapter 2 and beyond!'
    ],
    features: [
      'Asymmetric dual-device cooperation',
      'Multiple story chapters with riddles',
      'Save state progress'
    ],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'constellation-puzzle',
    title: 'Constellation Connect',
    tagline: 'Connect stellar stars to illuminate couple symbols.',
    category: 'Strategy',
    icon: '✨',
    badge: 'Stellar',
    gradient: 'from-sky-400 via-indigo-500 to-purple-600',
    accentColor: 'sky-500',
    cost: 350,
    isLockedByDefault: true,
    description: 'A soothing cooperative celestial puzzle where you trace stellar lines between star nodes to reveal glowing celestial hearts and memories.',
    rules: [
      'Tap stars in proper numerical or harmonic sequence',
      'Complete the constellation lines together',
      'Unlock glowing astrological couple blessings!'
    ],
    features: [
      'Interactive Canvas particle rendering',
      'Calming ambient audio tones',
      'Zodiac and celestial symbols'
    ],
    image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'heartbeat-harmony',
    title: 'Heartbeat Harmony',
    tagline: 'Sync your touch pulses in rhythmic harmony.',
    category: 'Rhythm',
    icon: '💓',
    badge: 'Rhythm Sync',
    gradient: 'from-red-500 via-rose-500 to-pink-600',
    accentColor: 'rose-500',
    cost: 300,
    isLockedByDefault: true,
    description: 'Hold down the haptic touch pulse together and match your partner’s heartbeat waves in real-time tempo.',
    rules: [
      'Place your thumb on the glowing heart pad',
      'Match the target pulse rhythm',
      'Achieve 90%+ synchronicity for special couple audio chimes!'
    ],
    features: [
      'Live synchronized wave visualizer',
      'Real-time pulse accuracy calculation',
      'Haptic feedback support'
    ],
    image: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=800&q=80'
  }
];
