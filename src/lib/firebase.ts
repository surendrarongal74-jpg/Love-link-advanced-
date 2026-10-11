import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  enableNetwork, 
  disableNetwork,
  doc,
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// @ts-ignore
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with robust IndexedDB multi-tab offline persistence
// and long polling to prevent streaming drops in low-bandwidth / proxy environments
function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch (err: any) {
    console.warn("Persistent cache initialization fallback:", err);
    try {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch {
      return getFirestore(app);
    }
  }
}

export const db = createFirestoreInstance();
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Reachability controls for low-connectivity environments
export async function enableFirestoreNetwork(): Promise<void> {
  try {
    await enableNetwork(db);
    console.log("Firestore network enabled (online sync active)");
  } catch (err) {
    console.warn("Could not enable Firestore network:", err);
  }
}

export async function disableFirestoreNetwork(): Promise<void> {
  try {
    await disableNetwork(db);
    console.log("Firestore network disabled (offline persistent cache mode)");
  } catch (err) {
    console.warn("Could not disable Firestore network:", err);
  }
}

// Global browser reachability synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    enableFirestoreNetwork();
  });

  window.addEventListener('offline', () => {
    disableFirestoreNetwork();
  });

  // Non-blocking initial connectivity verification as specified in skill guidelines
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn("Firestore notice: Client is offline or operating in local cache mode.");
      }
    }
  }, 1000);
}


