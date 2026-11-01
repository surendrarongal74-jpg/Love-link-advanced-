export interface RandomDateNightActivity {
  name: string;
  spotType: string;
  localNeighborhood: string;
  vividDescription: string;
  proTip: string;
  duration: string;
}

export interface RandomDateNightSecondary {
  name: string;
  spotType: string;
  vividDescription: string;
  proTip: string;
  duration: string;
}

export interface SpontaneityChallenge {
  title: string;
  instructions: string;
  pointsReward: number;
}

export interface ConversationCard {
  theme: string;
  question: string;
  followUp: string;
}

export interface DateSoundtrack {
  playlistTitle: string;
  featuredTrack: string;
  spotifySearchQuery: string;
  vibeNote: string;
}

export interface RandomDateNightData {
  id: string;
  title: string;
  tagline: string;
  locationAnchor: string;
  mapQuery: string;
  vibe: string;
  budgetCategory: string;
  estimatedCost: string;
  duration: string;
  bestTime: string;
  weatherOutfitTip: string;
  diceRollEmoji: string;
  mainActivity: RandomDateNightActivity;
  secondaryActivity: RandomDateNightSecondary;
  spontaneityChallenge: SpontaneityChallenge;
  conversationCard: ConversationCard;
  soundtrack: DateSoundtrack;
  whyThisMatches: string;
}

export interface SavedDateNightDoc {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  creatorName: string;
  status: 'planned' | 'in_progress' | 'completed';
  dateNight: RandomDateNightData;
  lockedInAt: number;
  scheduledDate?: string;
  rating?: number;
  reviewNote?: string;
  completedAt?: number;
}
