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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'lovelink_auth_user_data';

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

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(() => getCachedUserData());
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
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
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
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
        setUserData(null);
        setCachedUserData(null);
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

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const signOut = async () => {
    setCachedUserData(null);
    setUserData(null);
    await auth.signOut();
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
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

