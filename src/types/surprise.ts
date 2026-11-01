export type DateStyle = 'in_person' | 'virtual' | 'cozy_home' | 'outdoor';

export interface DateNightActivity {
  id: string;
  name: string;
  timeEstimate: string; // e.g. "45 mins"
  description: string;
  sparkleTip: string;
  completed?: boolean;
}

export type ConversationCategory = 'warmUp' | 'deepConnection' | 'nostalgia' | 'futureDreams';

export interface ConversationPrompt {
  id: string;
  category: ConversationCategory;
  categoryLabel?: string;
  question: string;
  favorite?: boolean;
}

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  reasonForInclusion: string;
  idealMoment: string;
  upvotes?: string[]; // Array of user IDs who love this track
}

export interface DateNightPlaylist {
  playlistName: string;
  vibeDescription: string;
  tracks: PlaylistTrack[];
}

export interface SurpriseUserPreferences {
  dateStyle: string;
  mood: string;
  dietary: string;
  musicGenre: string;
  budget: string;
  duration: string;
  specialOccasion?: string;
  customNotes?: string;
}

export interface PastSurpriseSummary {
  id: string;
  title: string;
  rating: number; // 1-5
  review?: string;
  dateStyle?: string;
  mood?: string;
  favoriteMoments?: string;
}

export interface DateNightPlan {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  creatorName?: string;
  type: 'date_plan' | 'surprise_message';
  title: string;
  tagline: string;
  overview: string;
  style: DateStyle;
  mood: string;
  budget: string;
  duration: string;
  suggestedPreparation: string[];
  activities: DateNightActivity[];
  conversationPrompts: ConversationPrompt[];
  playlist: DateNightPlaylist;
  surpriseTwist: string;
  reasoningFromPastSurprises?: string;
  
  // Surprise Delivery & Status
  deliverAt: string; // ISO string
  isLocked: boolean; // True until deliverAt arrives
  isCompleted?: boolean;
  completedAt?: string;
  rating?: number; // 1-5 stars from partner or couple
  review?: string; // e.g. "We loved the stargazing and chocolate fondue!"
  
  userPreferencesUsed?: SurpriseUserPreferences;
  createdAt: string; // ISO string
  updatedAt?: string;
}

export interface SurpriseMessage {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  type: 'surprise';
  content: string;
  deliverAt: string;
  date: string;
}
