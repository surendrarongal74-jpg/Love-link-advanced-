import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { Player3DState, PuzzleState, Game3DSessionDoc, CharacterType, GameMovementState } from './gameTypes';
import { WorldPhysicsValidator } from './WorldPhysicsValidator';

interface UseGame3DSessionProps {
  worldId: string;
  characterType: CharacterType;
}

export const DEFAULT_PUZZLE: PuzzleState = {
  switchAActive: false,
  switchBActive: false,
  bridgeExtended: false,
  crystalsCollected: [],
  portalUnlocked: false,
};

/**
 * Strips out undefined values and recurses cleanly so Firestore never rejects data.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirestore(val);
    }
  }
  return cleanObj as T;
}

export function useGame3DSession({ worldId, characterType }: UseGame3DSessionProps) {
  const { user } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const spaceId = space?.id || 'demo_couple_space';
  const myUserId = user?.uid || 'local_user';
  const myDisplayName = user?.displayName || 'Player 1';
  const partnerId = partnerData?.id || (space?.partner1Id === myUserId ? space?.partner2Id : space?.partner1Id) || 'partner_user';
  const partnerName = partnerData?.displayName || 'My Love';

  const [session, setSession] = useState<Game3DSessionDoc>({
    id: worldId,
    spaceId,
    worldId,
    players: {},
    puzzle: { ...DEFAULT_PUZZLE },
    updatedAt: Date.now(),
    winnerIds: [],
  });

  const [partnerOnlineInGame, setPartnerOnlineInGame] = useState(false);
  const [partnerState, setPartnerState] = useState<Player3DState | null>(null);
  const [partnerEmote, setPartnerEmote] = useState<{ emote: string; timestamp: number } | null>(null);

  const lastPushTimeRef = useRef<number>(0);
  const localPlayerStateRef = useRef<Player3DState>({
    userId: myUserId,
    displayName: myDisplayName,
    characterType,
    position: { x: -1.5, y: 0.4, z: 2.0 },
    heading: 0,
    verticalVelocity: 0,
    isGrounded: true,
    movementState: 'idle',
    activeMoment: 'idle',
    lastActive: Date.now(),
  });

  // 1. Subscribe to Firestore real-time session
  useEffect(() => {
    if (!spaceId || spaceId === 'demo_couple_space') {
      // In offline/demo mode, run local authoritative state
      return;
    }

    const sessionDocRef = doc(db, 'coupleSpaces', spaceId, 'game3dSession', worldId);

    const unsubscribe = onSnapshot(
      sessionDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawData = (snapshot.data() || {}) as Partial<Game3DSessionDoc>;

          const safePuzzle: PuzzleState = {
            ...DEFAULT_PUZZLE,
            ...(rawData.puzzle || {}),
            crystalsCollected: Array.isArray(rawData.puzzle?.crystalsCollected)
              ? rawData.puzzle.crystalsCollected
              : [],
          };

          const safeSession: Game3DSessionDoc = {
            id: rawData.id || worldId,
            spaceId: rawData.spaceId || spaceId,
            worldId: rawData.worldId || worldId,
            players: rawData.players || {},
            puzzle: safePuzzle,
            updatedAt: rawData.updatedAt || Date.now(),
            winnerIds: Array.isArray(rawData.winnerIds) ? rawData.winnerIds : [],
          };

          setSession(safeSession);

          // If the existing Firestore doc was missing puzzle data, heal it in Firestore
          if (!rawData.puzzle) {
            setDoc(
              sessionDocRef,
              sanitizeForFirestore({ puzzle: DEFAULT_PUZZLE, updatedAt: Date.now() }),
              { merge: true }
            ).catch(() => {});
          }

          // Check if partner is active in the last 15 seconds
          const pState = safeSession.players?.[partnerId];
          if (pState && Date.now() - pState.lastActive < 15000) {
            setPartnerOnlineInGame(true);

            // Server-validated collision check on remote partner position
            const validatedPartner = WorldPhysicsValidator.validateAndResolvePosition(
              pState.position,
              pState.position,
              pState.isGrounded,
              Boolean(safeSession.puzzle?.bridgeExtended)
            );

            const safePartnerState: Player3DState = {
              ...pState,
              position: validatedPartner.position,
              isGrounded: validatedPartner.isGrounded,
            };

            setPartnerState(safePartnerState);
            if (pState.activeMoment && pState.activeMoment !== 'idle') {
              setPartnerEmote({ emote: pState.activeMoment, timestamp: pState.lastActive });
            }
          } else {
            setPartnerOnlineInGame(false);
          }
        } else {
          // Initialize session doc safely without any undefined values
          const initialData: Game3DSessionDoc = {
            id: worldId,
            spaceId,
            worldId,
            players: {
              [myUserId]: {
                userId: myUserId,
                displayName: myDisplayName,
                characterType,
                position: { x: -1.5, y: 0.4, z: 2.0 },
                heading: 0,
                verticalVelocity: 0,
                isGrounded: true,
                movementState: 'idle',
                activeMoment: 'idle',
                lastActive: Date.now(),
              },
            },
            puzzle: { ...DEFAULT_PUZZLE },
            updatedAt: Date.now(),
            winnerIds: [],
          };
          setDoc(sessionDocRef, sanitizeForFirestore(initialData), { merge: true }).catch((err) => {
            console.warn('Game session init non-blocking note:', err);
          });
        }
      },
      (error) => {
        console.warn('Game session Firestore snapshot fallback:', error);
      }
    );

    return () => unsubscribe();
  }, [spaceId, worldId, myUserId, partnerId, myDisplayName, characterType]);

  // 2. Throttled Position & State Publisher (~10 updates / sec max)
  const publishLocalState = useCallback(
    (
      pos: { x: number; y: number; z: number },
      heading: number,
      movementState: GameMovementState,
      isGrounded: boolean,
      moment?: string
    ) => {
      const now = Date.now();
      const safeMoment = moment && typeof moment === 'string' && moment.trim() ? moment : 'idle';

      // Authoritative physical validation against world geometry, floors & walls
      const validated = WorldPhysicsValidator.validateAndResolvePosition(
        pos,
        localPlayerStateRef.current.position,
        isGrounded,
        Boolean(session?.puzzle?.bridgeExtended)
      );

      localPlayerStateRef.current = {
        userId: myUserId,
        displayName: myDisplayName,
        characterType,
        position: validated.position,
        heading: Number(heading.toFixed(2)) || 0,
        verticalVelocity: 0,
        isGrounded: validated.isGrounded,
        movementState: movementState || 'idle',
        activeMoment: safeMoment,
        lastActive: now,
      };

      // Throttle Firestore write to every 100ms
      if (now - lastPushTimeRef.current > 100 && spaceId && spaceId !== 'demo_couple_space') {
        lastPushTimeRef.current = now;
        const sessionDocRef = doc(db, 'coupleSpaces', spaceId, 'game3dSession', worldId);
        const playerPayload = sanitizeForFirestore(localPlayerStateRef.current);

        setDoc(
          sessionDocRef,
          {
            players: {
              [myUserId]: playerPayload,
            },
            updatedAt: now,
          },
          { merge: true }
        ).catch(() => {
          // Silent catch for rapid network bursts
        });
      }
    },
    [myUserId, myDisplayName, characterType, spaceId, worldId]
  );

  // 3. Update Puzzle State (switches, crystals, portal)
  const updatePuzzleState = useCallback(
    (newPuzzle: Partial<PuzzleState>) => {
      setSession((prev) => {
        const currentPuzzle = prev?.puzzle || DEFAULT_PUZZLE;
        const mergedPuzzle: PuzzleState = {
          ...DEFAULT_PUZZLE,
          ...currentPuzzle,
          ...newPuzzle,
        };

        // Bridge extends if both switch A and B are active
        const bridgeExtended = Boolean(mergedPuzzle.switchAActive && mergedPuzzle.switchBActive);
        mergedPuzzle.bridgeExtended = bridgeExtended;

        // Portal unlocks if bridge extended and at least 2 crystals collected
        if (bridgeExtended && (mergedPuzzle.crystalsCollected?.length || 0) >= 2) {
          mergedPuzzle.portalUnlocked = true;
        }

        const nextSession: Game3DSessionDoc = {
          ...(prev || {}),
          id: prev?.id || worldId,
          spaceId: prev?.spaceId || spaceId,
          worldId: prev?.worldId || worldId,
          players: prev?.players || {},
          puzzle: mergedPuzzle,
          updatedAt: Date.now(),
          winnerIds: prev?.winnerIds || [],
        };

        if (spaceId && spaceId !== 'demo_couple_space') {
          const sessionDocRef = doc(db, 'coupleSpaces', spaceId, 'game3dSession', worldId);
          setDoc(
            sessionDocRef,
            sanitizeForFirestore({ puzzle: mergedPuzzle, updatedAt: Date.now() }),
            { merge: true }
          ).catch(() => {});
        }

        return nextSession;
      });
    },
    [spaceId, worldId]
  );

  // 4. Collect Crystal Action
  const collectCrystal = useCallback(
    (crystalId: string) => {
      setSession((prev) => {
        const currentPuzzle = prev?.puzzle || DEFAULT_PUZZLE;
        const currentCrystals = currentPuzzle.crystalsCollected || [];
        if (currentCrystals.includes(crystalId)) return prev;
        const updatedCrystals = [...currentCrystals, crystalId];
        const portalUnlocked =
          Boolean(currentPuzzle.bridgeExtended) && updatedCrystals.length >= 2;

        const nextPuzzle: PuzzleState = {
          ...currentPuzzle,
          crystalsCollected: updatedCrystals,
          portalUnlocked,
        };

        if (spaceId && spaceId !== 'demo_couple_space') {
          const sessionDocRef = doc(db, 'coupleSpaces', spaceId, 'game3dSession', worldId);
          setDoc(
            sessionDocRef,
            sanitizeForFirestore({ puzzle: nextPuzzle, updatedAt: Date.now() }),
            { merge: true }
          ).catch(() => {});
        }

        return {
          ...(prev || {}),
          id: prev?.id || worldId,
          spaceId: prev?.spaceId || spaceId,
          worldId: prev?.worldId || worldId,
          players: prev?.players || {},
          puzzle: nextPuzzle,
          updatedAt: Date.now(),
          winnerIds: prev?.winnerIds || [],
        };
      });
    },
    [spaceId, worldId]
  );

  // 5. Reset Expedition / Puzzle
  const resetPuzzle = useCallback(() => {
    const emptyPuzzle: PuzzleState = { ...DEFAULT_PUZZLE };
    setSession((prev) => ({
      ...(prev || {}),
      id: prev?.id || worldId,
      spaceId: prev?.spaceId || spaceId,
      worldId: prev?.worldId || worldId,
      players: prev?.players || {},
      puzzle: emptyPuzzle,
      winnerIds: [],
      updatedAt: Date.now(),
    }));
    if (spaceId && spaceId !== 'demo_couple_space') {
      const sessionDocRef = doc(db, 'coupleSpaces', spaceId, 'game3dSession', worldId);
      setDoc(
        sessionDocRef,
        sanitizeForFirestore({ puzzle: emptyPuzzle, winnerIds: [], updatedAt: Date.now() }),
        { merge: true }
      ).catch(() => {});
    }
  }, [spaceId, worldId]);

  return {
    session,
    partnerOnlineInGame,
    partnerState,
    partnerEmote,
    partnerName,
    myDisplayName,
    myUserId,
    publishLocalState,
    updatePuzzleState,
    collectCrystal,
    resetPuzzle,
  };
}
