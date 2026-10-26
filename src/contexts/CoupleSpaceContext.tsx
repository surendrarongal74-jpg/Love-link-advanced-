import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, enableFirestoreNetwork } from '../lib/firebase';
import { useAuth, ReachabilityStatus } from './AuthContext';
import { handleFirestoreError, OperationType, isUnavailableOrNetworkError } from '../lib/errorHandler';

export interface CoupleSpaceData {
  id: string;
  partner1Id: string;
  partner2Id: string;
  inviteCode: string;
  streak: number;
  streakDays?: number;
  lastInteractionAt: number;
  createdAt: number;
  xp: number;
  level: number;
  anniversaryDate?: string;
  members?: string[];
}

export interface PartnerData {
  id: string;
  displayName: string;
  mood?: string;
  loveLanguage?: string;
  photoURL?: string;
  batteryLevel?: number;
}

export interface CoupleSpaceContextType {
  space: CoupleSpaceData | null;
  loading: boolean;
  partnerData: PartnerData | null;
  partnerInfo: PartnerData | null; // Compatibility alias
  isOnline: boolean;
  isReachable: boolean;
  reachabilityStatus: ReachabilityStatus;
  reconnect: () => Promise<void>;
}

const SPACE_STORAGE_PREFIX = 'lovelink_space_';
const PARTNER_STORAGE_PREFIX = 'lovelink_partner_';

function getCachedSpace(spaceId: string): CoupleSpaceData | null {
  try {
    const raw = localStorage.getItem(`${SPACE_STORAGE_PREFIX}${spaceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedSpace(spaceId: string, data: CoupleSpaceData | null) {
  try {
    if (data) {
      localStorage.setItem(`${SPACE_STORAGE_PREFIX}${spaceId}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`${SPACE_STORAGE_PREFIX}${spaceId}`);
    }
  } catch {}
}

function getCachedPartner(spaceId: string): PartnerData | null {
  try {
    const raw = localStorage.getItem(`${PARTNER_STORAGE_PREFIX}${spaceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedPartner(spaceId: string, data: PartnerData | null) {
  try {
    if (data) {
      localStorage.setItem(`${PARTNER_STORAGE_PREFIX}${spaceId}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`${PARTNER_STORAGE_PREFIX}${spaceId}`);
    }
  } catch {}
}

const CoupleSpaceContext = createContext<CoupleSpaceContextType>({} as CoupleSpaceContextType);

export function CoupleSpaceProvider({ children }: { children: React.ReactNode }) {
  const { userData, isOnline } = useAuth();
  const [space, setSpace] = useState<CoupleSpaceData | null>(() => {
    return userData?.coupleSpaceId ? getCachedSpace(userData.coupleSpaceId) : null;
  });
  const [partnerData, setPartnerData] = useState<PartnerData | null>(() => {
    return userData?.coupleSpaceId ? getCachedPartner(userData.coupleSpaceId) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isReachable, setIsReachable] = useState(true);

  const reconnect = useCallback(async () => {
    try {
      await enableFirestoreNetwork();
      setIsReachable(true);
    } catch (err) {
      console.warn("CoupleSpace reconnect error:", err);
    }
  }, []);

  useEffect(() => {
    if (!userData?.coupleSpaceId) {
      setSpace(null);
      setPartnerData(null);
      setLoading(false);
      return;
    }

    const currentSpaceId = userData.coupleSpaceId;

    // Hydrate immediately from device cache for instant rendering
    const cachedSpace = getCachedSpace(currentSpaceId);
    if (cachedSpace) {
      setSpace(cachedSpace);
    }
    const cachedPartner = getCachedPartner(currentSpaceId);
    if (cachedPartner) {
      setPartnerData(cachedPartner);
    }

    const spaceRef = doc(db, 'coupleSpaces', currentSpaceId);
    setLoading(!cachedSpace);

    let unsubscribePartner: (() => void) | undefined;

    const unsubscribe = onSnapshot(
      spaceRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CoupleSpaceData;
          setSpace(data);
          setCachedSpace(currentSpaceId, data);
          setIsReachable(true);

          // Fetch partner info
          const partnerId = data.partner1Id === userData.id ? data.partner2Id : data.partner1Id;
          if (partnerId) {
            if (!unsubscribePartner) {
              unsubscribePartner = onSnapshot(
                doc(db, 'users', partnerId),
                { includeMetadataChanges: true },
                (pDoc) => {
                  if (pDoc.exists() && pDoc.data()?.coupleSpaceId === data.id) {
                    const pInfo: PartnerData = {
                      id: partnerId,
                      displayName: pDoc.data()?.displayName || 'Partner',
                      mood: pDoc.data()?.mood,
                      loveLanguage: pDoc.data()?.loveLanguage
                    };
                    setPartnerData(pInfo);
                    setCachedPartner(currentSpaceId, pInfo);
                  } else if (pDoc.exists()) {
                    setPartnerData(null);
                    setCachedPartner(currentSpaceId, null);
                  }
                },
                (err) => {
                  if (isUnavailableOrNetworkError(err)) {
                    console.warn(`Partner sync unavailable for user ${partnerId} (offline)`);
                    setIsReachable(false);
                  } else {
                    handleFirestoreError(err, OperationType.GET, `users/${partnerId}`);
                  }
                }
              );
            }
          } else {
            setPartnerData(null);
            setCachedPartner(currentSpaceId, null);
            if (unsubscribePartner) {
              unsubscribePartner();
              unsubscribePartner = undefined;
            }
          }
        } else {
          // If server reports non-existent and we are not offline
          const fromCache = (snapshot as any)?.metadata?.fromCache;
          if (navigator.onLine && !fromCache) {
            setSpace(null);
            setPartnerData(null);
            setCachedSpace(currentSpaceId, null);
            setCachedPartner(currentSpaceId, null);
          }
        }
        setLoading(false);
      },
      (err) => {
        if (isUnavailableOrNetworkError(err)) {
          console.warn(`Firestore coupleSpace sync unavailable (operating offline):`, err.message);
          setIsReachable(false);
          // Keep existing cached data so the user remains logged in
        } else {
          handleFirestoreError(err, OperationType.GET, `coupleSpaces/${currentSpaceId}`);
        }
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (unsubscribePartner) {
        unsubscribePartner();
      }
    };
  }, [userData?.coupleSpaceId, userData?.id]);

  const reachabilityStatus: ReachabilityStatus = !isOnline
    ? 'offline'
    : !isReachable
    ? 'degraded'
    : 'online';

  return (
    <CoupleSpaceContext.Provider
      value={{
        space,
        loading,
        partnerData,
        partnerInfo: partnerData,
        isOnline,
        isReachable,
        reachabilityStatus,
        reconnect,
      }}
    >
      {children}
    </CoupleSpaceContext.Provider>
  );
}

export const useCoupleSpace = () => useContext(CoupleSpaceContext);


