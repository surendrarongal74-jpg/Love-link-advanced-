export type CharacterType = 'boy' | 'galaxia';

export type GameMovementState = 'idle' | 'walk' | 'run' | 'jump' | 'celebrate' | 'interact' | 'wave';

export interface Player3DState {
  userId: string;
  displayName: string;
  characterType: CharacterType;
  position: { x: number; y: number; z: number };
  heading: number; // Y rotation in radians
  verticalVelocity: number;
  isGrounded: boolean;
  movementState: GameMovementState;
  activeMoment: string;
  lastActive: number; // timestamp
}

export interface PuzzleState {
  switchAActive: boolean; // West pressure plate
  switchBActive: boolean; // East pressure plate
  bridgeExtended: boolean; // Materialized bridge
  crystalsCollected: string[]; // ['azure_crystal', 'rose_crystal', 'celestial_shard']
  portalUnlocked: boolean;
  completedAt?: number;
}

export interface Game3DSessionDoc {
  id: string;
  spaceId: string;
  worldId: string;
  players: Record<string, Player3DState>;
  puzzle: PuzzleState;
  updatedAt: number;
  winnerIds?: string[];
}

export interface WorldDefinition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  theme: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging' | 'Expert';
  rewardCoins: number;
  rewardXP: number;
  unlocked: boolean;
  badgeName: string;
  color: string;
}
