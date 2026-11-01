import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, enableFirestoreNetwork } from '../lib/firebase';
import { handleFirestoreError, OperationType, isUnavailableOrNetworkError } from '../lib/errorHandler';

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  coupleSpaceId: string;
  mood?: string;
  loveLanguage?: string;
}

export type ReachabilityStatus = 'online' | 'offline' | 'degraded';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  isOnline: boolean;
  isReachable: boolean;
  reachabilityStatus: ReachabilityStatus;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithDemo: (role?: 'alex' | 'taylor') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'lovelink_auth_user_data';
const DEMO_SESSION_KEY = 'lovelink_demo_session';

function getCachedUserData(): UserData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUserData(data: UserData | null) {
  try {
    if (data) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or access issues
  }
}

function createSyntheticUser(id: string, name: string, email: string): FirebaseUser {
  return {
    uid: id,
    email,
    displayName: name,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'demo_token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'demo',
  } as unknown as FirebaseUser;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(() => getCachedUserData());
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isReachable, setIsReachable] = useState<boolean>(true);

  // Monitor network reachability
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReachable(true);
      enableFirestoreNetwork();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check if a demo session was active
    try {
      const demoRaw = localStorage.getItem(DEMO_SESSION_KEY);
      if (demoRaw) {
        const demo = JSON.parse(demoRaw);
        if (demo && demo.id) {
          const synth = createSyntheticUser(demo.id, demo.displayName, demo.email);
          setUser(synth);
          setUserData(demo);
          setCachedUserData(demo);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse demo session:", e);
    }

    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        localStorage.removeItem(DEMO_SESSION_KEY);

        // Immediate local cache hydration if ID matches
        const cached = getCachedUserData();
        if (cached && cached.id === currentUser.uid) {
          setUserData(cached);
        }

        const userDocRef = doc(db, 'users', currentUser.uid);

        // Realtime listener with offline persistence
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          { includeMetadataChanges: true },
          async (userDoc) => {
            if (userDoc.exists()) {
              const freshData = userDoc.data() as UserData;
              setUserData(freshData);
              setCachedUserData(freshData);
              setIsReachable(true);
            } else {
              // If offline or cache miss on initial boot, keep local cached data if available
              const existingCached = getCachedUserData();
              if (existingCached && existingCached.id === currentUser.uid) {
                setUserData(existingCached);
              } else if (navigator.onLine) {
                // Only create a brand new profile if online and document truly does not exist
                const newUserData: UserData = {
                  id: currentUser.uid,
                  email: currentUser.email || '',
                  displayName: currentUser.displayName || 'Anonymous User',
                  coupleSpaceId: '',
                };
                try {
                  await setDoc(userDocRef, newUserData);
                  setUserData(newUserData);
                  setCachedUserData(newUserData);
                } catch (e) {
                  if (isUnavailableOrNetworkError(e)) {
                    console.warn("Could not save initial user doc while offline:", e);
                    setUserData(newUserData);
                    setCachedUserData(newUserData);
                  } else {
                    handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
                  }
                }
              }
            }
            setLoading(false);
          },
          (err) => {
            if (isUnavailableOrNetworkError(err)) {
              console.warn("Firestore user sync unavailable (operating offline):", err.message);
              setIsReachable(false);
              // Fall back to cached user profile so user is not locked out
              const fallback = getCachedUserData();
              if (fallback && fallback.id === currentUser.uid) {
                setUserData(fallback);
              }
            } else {
              handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
            }
            setLoading(false);
          }
        );
      } else {
        // If not in demo session, clear data
        if (!localStorage.getItem(DEMO_SESSION_KEY)) {
          setUserData(null);
          setCachedUserData(null);
        }
        setLoading(false);
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = undefined;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    try {
      await enableFirestoreNetwork();
      setIsReachable(true);
    } catch (e) {
      console.warn("Could not reconnect Firestore:", e);
    }
  }, [user]);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error: any) {
      console.error("Sign in failed:", error);
      const code = error?.code || '';
      let message = error?.message || 'Authentication failed. Please try again.';
      if (code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked by your browser. Please allow popups for this site, or use Quick Demo Sign-in below.';
      } else if (code === 'auth/unauthorized-domain') {
        message = 'This preview domain is not whitelisted in Firebase Auth. Please use the Quick Demo Sign-in below to test immediately.';
      } else if (code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled before completing.';
      }
      return { success: false, error: message };
    }
  };

  const signInWithDemo = async (role: 'alex' | 'taylor' = 'alex'): Promise<void> => {
    const isAlex = role === 'alex';
    const id = isAlex ? 'demo_user_alex' : 'demo_user_taylor';
    const name = isAlex ? 'Alex (Boy)' : 'Taylor (Galaxia)';
    const email = isAlex ? 'alex@lovelink.demo' : 'taylor@lovelink.demo';
    const partnerId = isAlex ? 'demo_user_taylor' : 'demo_user_alex';
    const partnerName = isAlex ? 'Taylor (Galaxia)' : 'Alex (Boy)';
    const spaceId = 'demo_lovespace_42';

    const demoUser: UserData = {
      id,
      email,
      displayName: name,
      coupleSpaceId: spaceId,
      mood: 'Excited to explore 3D worlds! 💖',
      loveLanguage: 'Quality Time',
    };

    // Pre-seed couple space and partner cache in localStorage
    const demoSpace = {
      id: spaceId,
      partner1Id: 'demo_user_alex',
      partner2Id: 'demo_user_taylor',
      inviteCode: 'LOVE42',
      streak: 42,
      lastInteractionAt: Date.now(),
      createdAt: Date.now() - 42 * 86400000,
      xp: 1250,
      level: 5,
      anniversaryDate: '2024-05-14',
    };

    const demoPartner = {
      id: partnerId,
      displayName: partnerName,
      mood: 'Ready for our 3D adventure! ✨',
      loveLanguage: 'Words of Affirmation',
    };

    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
      localStorage.setItem(`lovelink_space_${spaceId}`, JSON.stringify(demoSpace));
      localStorage.setItem(`lovelink_partner_${spaceId}`, JSON.stringify(demoPartner));
      localStorage.setItem(
        'lovelink_device_permissions',
        JSON.stringify({
          microphone: true,
          notifications: true,
          cameraAndPhotos: true,
          localVault: true,
        })
      );
    } catch {}

    const synth = createSyntheticUser(id, name, email);
    setUser(synth);
    setUserData(demoUser);
    setCachedUserData(demoUser);
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    setCachedUserData(null);
    setUserData(null);
    setUser(null);
    try {
      await auth.signOut();
    } catch {}
  };

  const reachabilityStatus: ReachabilityStatus = !isOnline
    ? 'offline'
    : !isReachable
    ? 'degraded'
    : 'online';

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isOnline,
        isReachable,
        reachabilityStatus,
        signInWithGoogle,
        signInWithDemo,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
