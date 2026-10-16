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
}

export const PLAYHOUSE_GAMES: PlayhouseGameDef[] = [
  {
    id: 'draw-guess',
    title: 'Draw It, Guess It',
    tagline: 'One partner sketches, the other guesses!',
    category: 'Creativity',
    icon: '🎨',
    badge: 'Popular',
    gradient: 'from-amber-400 via-rose-400 to-pink-500',
    accentColor: 'rose-500',
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
      'Auto-sync guess feedback and score tracking',
      'Export and save favorite drawings directly into Memories Vault'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
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
    description: 'Answer spicy, thoughtful, or hilarious questions privately, predict what your partner picked, and watch both answers unlock simultaneously.',
    rules: [
      'Select a deck: Firsts, Deep Feelings, Quirks, or Future Dreams',
      'Submit your honest answer and predict your partner\'s choice',
      'Once both lock in, the answers flip over together with confetti',
      'Win points for telepathic matching accuracy and sync streaks'
    ],
    features: [
      'Private locked predictions before synchronized reveal',
      '5 distinct card packs: Romantic, Quirky, Deep Soul, Date Night, Naughty',
      'Streak counter for consecutive matching predictions',
      'Custom question generator for couples'
    ],
    image: 'https://images.openai.com/static-rsc-4/h4h2MR2Kp2wSxj5QutDPmNfAW2tP_BAJEokXOJdJR5EBE3LAUKCD6rgjp1eYrXkpIFt-vCLBKS0UzVEHX3wJO3WBf_mM-6U363P2l0vdTJr95aApFwPX_HdiF7g51HKrsTm7DONpmzbI1eEBqYg6k5iPgvxGPIWCu6y2JliDIxZLSNmE2b7fXQRZ4Ty1t7Ya?purpose=fullsize'
  },
  {
    id: 'mystery-island',
    title: 'Two Hearts Mystery',
    tagline: 'Cooperative clue-solving mystery escape adventure.',
    category: 'Mystery',
    icon: '🧩',
    badge: 'Co-op Story',
    gradient: 'from-emerald-500 via-teal-600 to-indigo-600',
    accentColor: 'teal-500',
    description: 'You and your partner receive different halves of mysterious clues. Communicate, piece together ancient map riddles, and unlock chapters together.',
    rules: [
      'Partner A receives the cryptic Map fragments; Partner B receives the Cipher keys',
      'Discuss clues and piece together the solution on the joint investigation board',
      'Enter the secret passcode together to unlock Chapter 2 and beyond',
      'Branching story choices that reflect your couple communication style'
    ],
    features: [
      'Asymmetric information: Partner A and Partner B get complementary clues',
      'Shared interactive corkboard with pins and thread',
      '4 immersive episodic chapters: The Whispering Lagoon, The Moonlit Ruins, The Secret Vault, and The Eternal Heart',
      'Hint lifeline and clue deciphering minigame'
    ],
    image: 'https://images.openai.com/static-rsc-4/7_yAPB9SGVgzdAGbz3NYTpETDKiV3lttpkkxA5MOohWG5xLzmAm7lb7ua9vIU1AiYL9MHKgBmBraMXfVhbM2b73kotUAd2YSSrLuj1uW0eiLI51M-FLUBe6yzoywLcrgYYKrpJThKZ70_rh3PQZRhSLneNA6kS7wqXGUioldSOZ6noMmSfWe2zEbiSzqYzG0?purpose=fullsize'
  },
  {
    id: 'memory-match',
    title: 'Love Memory Match',
    tagline: 'Uncover paired tiles of your favorite moments and love tokens.',
    category: 'Memory',
    icon: '🃏',
    badge: 'Playful',
    gradient: 'from-violet-500 via-purple-500 to-pink-500',
    accentColor: 'purple-500',
    description: 'A turn-based co-op memory tile flip game with custom couple badges, anniversary dates, and love symbols.',
    rules: [
      'Take turns flipping two cards on the board',
      'Find matching pairs of cute love tokens and romantic symbols',
      'Consecutive matches grant bonus combo multipliers and unlock love trivia',
      'Complete the board together under the timer for gold trophies'
    ],
    features: [
      '16-card and 24-card couple memory grids',
      'Smooth 3D flip card animations with tactile chime effects',
      'Turn indicator showing whose turn it is to flip',
      'Co-op score counter and highest streak badge'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
  },
  {
    id: 'story-weaver',
    title: 'One Word Story',
    tagline: 'Weave hilarious and fairy-tale stories one turn at a time.',
    category: 'Creativity',
    icon: '📖',
    badge: 'Endless Fun',
    gradient: 'from-amber-500 via-orange-400 to-rose-500',
    accentColor: 'amber-500',
    description: 'Alternate adding words or short sentences to build an epic, silly, or romantic fairy tale starring both of you.',
    rules: [
      'Take turns contributing 1 to 3 words (or 1 sentence)',
      'Pick from romantic themes: "How we saved the world", "Our magical cafe", "Alien abducted our date"',
      'Read the flowing story in real-time as it updates live',
      'Publish finished stories with a lovely title to your Couple Archive'
    ],
    features: [
      'Instant turn notification and live story typewriter effect',
      'Genre cards with whimsical opening starters',
      'Sentence counter, word tally, and chapter markers',
      'One-tap export to Memories screen as a keepsake story'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
  },
  {
    id: 'heartbeat-harmony',
    title: 'Heartbeat Harmony: Rhythm Wave',
    tagline: 'Synchronize taps to romantic beats, tempo waves & AIRA tracks.',
    category: 'Rhythm',
    icon: '🎵',
    badge: 'AIRA Rhythm',
    gradient: 'from-pink-500 via-rose-500 to-red-600',
    accentColor: 'rose-500',
    description: 'Listen to acoustic rhythm beats, match tempo frequencies with your partner, and keep the harmony streak alive across endless AIRA levels.',
    rules: [
      'Feel the rhythmic heartbeat pulses in sync with your partner',
      'Tap in tempo to the love waveform and lyric cues',
      'The closer your simultaneous taps, the higher your sync resonance climbs',
      'Unlock romantic couple rewards with 85%+ synchronization!'
    ],
    features: [
      'Web Audio synthesized heartbeat sounds & rhythm tracks',
      'Live synchronized frequency wave animation',
      'Real-time timestamp differential sync analyzer',
      'AIRA endless tracks generator with custom BPM & romantic perks'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
  },
  {
    id: 'constellation-puzzle',
    title: 'Constellation Connect',
    tagline: 'Cooperative star-linking puzzle to awaken celestial memories.',
    category: 'Mystery',
    icon: '✨',
    badge: 'Co-Op Puzzle',
    gradient: 'from-slate-900 via-indigo-900 to-purple-800',
    accentColor: 'indigo-500',
    description: 'Work together as Astral Guide and Celestial Navigator! Combine asymmetric clues to connect starry energy lines and awaken constellations.',
    rules: [
      'Partner A and Partner B receive different cosmic clues',
      'Tap pairs of glowing stars to forge glowing celestial lines',
      'Match the secret stellar outline to unlock the hidden couple memory',
      'Solve chapters together with endless maps created by AIRA'
    ],
    features: [
      'Interactive 2D star node grid with glowing vector beams',
      'Asymmetric information co-op gameplay',
      'Instant clue inspection modal for both partners',
      'AIRA endless constellation chapters generator'
    ],
    image: 'https://images.openai.com/static-rsc-4/7_yAPB9SGVgzdAGbz3NYTpETDKiV3lttpkkxA5MOohWG5xLzmAm7lb7ua9vIU1AiYL9MHKgBmBraMXfVhbM2b73kotUAd2YSSrLuj1uW0eiLI51M-FLUBe6yzoywLcrgYYKrpJThKZ70_rh3PQZRhSLneNA6kS7wqXGUioldSOZ6noMmSfWe2zEbiSzqYzG0?purpose=fullsize'
  },
  {
    id: 'love-tic-tac-toe',
    title: 'Tic-Tac-Love: Dare Edition',
    tagline: 'Classic 3x3 strategy with playful romantic consequences!',
    category: 'Strategy',
    icon: '❌⭕',
    badge: 'Quick Match',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    accentColor: 'indigo-500',
    description: 'Every cell contains a cute mystery task or sweet perk. Connect 3 in a row to win the round and claim your partner’s wager!',
    rules: [
      'Choose your symbol: 💖 Hearts vs 🌟 Stars',
      'Claim cells on the board; some cells trigger instant micro-dares',
      'First to form 3 in a row wins the round prize (e.g. 10-min back rub, cooking dinner)',
      'Rematch anytime with persistent head-to-head score tracking'
    ],
    features: [
      'Real-time synced grid moves',
      'Custom prize bets before match start (Breakfast in bed, movie pick, massage)',
      'Victory animations with romantic rewards declaration',
      'History of wins & friendly rivalry scoreboard'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
  },
  {
    id: 'emoji-decoder',
    title: 'Emoji Love Cipher',
    tagline: 'Decode secret messages encoded entirely in emojis!',
    category: 'Playful',
    icon: '🕵️‍♀️',
    badge: 'Hilarious',
    gradient: 'from-yellow-400 via-amber-500 to-rose-400',
    accentColor: 'amber-500',
    description: 'Send secret movie dates, compliments, or naughty thoughts using only emojis. Can your partner guess the exact sentence?',
    rules: [
      'The sender picks a secret phrase or creates a custom romantic message',
      'Convert it into a chain of emojis (e.g. 🍕 + 🛋️ + 🎬 +  cuddle = Pizza Movie Night)',
      'The receiver has 3 attempts to decrypt the hidden message with hint reveals',
      'Points awarded for clever decodes and quickest solves'
    ],
    features: [
      'Built-in emoji quick keyboard with couple categories',
      'Ready-made riddle decks: Famous Love Songs, First Dates, Inside Jokes',
      'Hint button revealing vowels or first letters',
      'Instant celebrate reveal with reaction chime'
    ],
    image: 'https://images.openai.com/static-rsc-4/h4h2MR2Kp2wSxj5QutDPmNfAW2tP_BAJEokXOJdJR5EBE3LAUKCD6rgjp1eYrXkpIFt-vCLBKS0UzVEHX3wJO3WBf_mM-6U363P2l0vdTJr95aApFwPX_HdiF7g51HKrsTm7DONpmzbI1eEBqYg6k5iPgvxGPIWCu6y2JliDIxZLSNmE2b7fXQRZ4Ty1t7Ya?purpose=fullsize'
  },
  {
    id: 'couples-trivia',
    title: 'Our Journey Trivia',
    tagline: 'Test who remembers the exact details of your love story!',
    category: 'Memory',
    icon: '👑',
    badge: 'Milestone',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    accentColor: 'blue-500',
    description: 'Answer fast-paced trivia questions about your relationship timeline, habits, favorite foods, and funny incidents.',
    rules: [
      'Take turns creating questions with 4 multiple choice options',
      'Partner answers without seeing your answer key until submitted',
      'Track your "Relationship IQ" score over time',
      'Unlock golden memory trophies for 100% quiz accuracy'
    ],
    features: [
      'Pre-populated relationship questions + custom quiz creator',
      'Timer countdown per question',
      'Instant scorecard and hilarious commentary on wrong answers',
      'Saves high scores in couple history'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
  },
  {
    id: 'would-you-rather',
    title: 'Would You Rather: Couple Edition',
    tagline: 'Dilemmas ranging from cozy dates to wildly embarrassing scenarios.',
    category: 'Playful',
    icon: '⚖️',
    badge: 'Spark Convos',
    gradient: 'from-fuchsia-500 via-rose-500 to-pink-500',
    accentColor: 'fuchsia-500',
    description: 'Hilarious and heart-warming dilemmas! Pick your choice and see if your partner would make the exact same decision.',
    rules: [
      'Read the 2 compelling options (Option A vs Option B)',
      'Both lock in their choices secretly',
      'Reveal card shows both selections and match percentage',
      'Prompts great conversations and cozy late-night laughter'
    ],
    features: [
      'Over 60+ couple-tailored scenarios: Travel, Co-living, Romance, Food, Fantasy',
      'Compatibility percentage calculation after each round',
      '"Discuss this!" prompt button to send directly to Chat screen',
      'Create your own custom dilemma for your partner'
    ],
    image: 'https://images.openai.com/static-rsc-4/SELBz22rC-lc9Xi-kmo7ymNL2Yomr3OC06pElG0v8OWFwBTmSZvGwHpEq2fQh4QaH3nGyKW_fZruVuKBynIxyEsO86yOFRV-dOrTXHLwphrCLumw4rI8ooNmq_9hwUPZQtPLB9b27jDzZge7L7S1na_RkH4B7Buy2Rlrw7tVWhEAxqq73e-z8LVzYQawmVHU?purpose=fullsize'
  }
];
