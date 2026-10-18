import { 
  ConsentPurposes, 
  ConsentRecord, 
  TrackerPreferences, 
  DataRightsRequest, 
  DataRightsType,
  OFFICIAL_GRIEVANCE_OFFICER 
} from '../types/dpdp';
import { db, auth } from './firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

const STORAGE_KEY_CONSENTS = 'lovelink_dpdp_consents_history';
const STORAGE_KEY_ACTIVE_CONSENT = 'lovelink_dpdp_active_consent';
const STORAGE_KEY_TRACKERS = 'lovelink_dpdp_tracker_preferences';
const STORAGE_KEY_REQUESTS = 'lovelink_dpdp_rights_requests';

export const CURRENT_NOTICE_VERSION = 'dpdp-2023-v1.0';

export const DEFAULT_TRACKER_PREFERENCES: TrackerPreferences = {
  necessary: true,
  locationMaps: false,
  aiAssistant: false,
  analytics: false,
  decidedAt: 0,
};

/**
 * Get active consent record from localStorage
 */
export function getActiveConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_CONSENT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Record a verifiable affirmative consent under DPDP Act Section 6(1)
 */
export async function recordConsent(
  userId: string,
  userEmail: string,
  purposes: ConsentPurposes
): Promise<ConsentRecord> {
  const consentId = `consent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = Date.now();
  const record: ConsentRecord = {
    consentId,
    userId,
    userEmail,
    purposes,
    noticeVersion: CURRENT_NOTICE_VERSION,
    timestamp,
    isoDate: new Date(timestamp).toISOString(),
    ipNotice: 'Client Origin Verified TLS (DPDP Section 6)',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    withdrawn: false,
  };

  // 1. Save locally
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_CONSENT, JSON.stringify(record));
    const historyRaw = localStorage.getItem(STORAGE_KEY_CONSENTS);
    const history: ConsentRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.push(record);
    localStorage.setItem(STORAGE_KEY_CONSENTS, JSON.stringify(history));
    
    // Also update legacy terms approval flag for backwards compatibility
    if (purposes.coreSync && purposes.mediaProcessing) {
      localStorage.setItem('lovelink_terms_approved', 'true');
      localStorage.setItem('lovelink_terms_accepted_at', record.isoDate);
    }
  } catch (err) {
    console.warn('Could not persist consent locally:', err);
  }

  // 2. Sync tracker preferences based on granted consents
  updateTrackerPreferences({
    necessary: true,
    locationMaps: purposes.locationServices,
    aiAssistant: purposes.aiAssistance,
    analytics: false,
    decidedAt: timestamp,
  });

  // 3. Persist to Firestore if user is authenticated
  if (auth.currentUser && userId) {
    try {
      await setDoc(doc(db, 'users', userId, 'dpdp_consents', consentId), {
        ...record,
        persistedAt: timestamp,
      });
    } catch (err) {
      console.warn('Firestore consent record sync failed, saved locally:', err);
    }
  }

  // 4. Also notify server endpoint for audit log
  try {
    await fetch('/api/dpdp/consent-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // Graceful offline degradation
  }

  return record;
}

/**
 * Withdraw an existing consent (DPDP Section 6(4))
 */
export async function withdrawConsent(
  purposeKey?: keyof ConsentPurposes
): Promise<ConsentRecord | null> {
  const active = getActiveConsent();
  if (!active) return null;

  const now = Date.now();
  if (purposeKey) {
    active.purposes[purposeKey] = false;
  } else {
    active.withdrawn = true;
    active.withdrawnAt = now;
    active.purposes = {
      coreSync: false,
      mediaProcessing: false,
      locationServices: false,
      aiAssistance: false,
    };
  }

  localStorage.setItem(STORAGE_KEY_ACTIVE_CONSENT, JSON.stringify(active));

  // Sync tracker preferences
  updateTrackerPreferences({
    necessary: true,
    locationMaps: active.purposes.locationServices,
    aiAssistant: active.purposes.aiAssistance,
    analytics: false,
    decidedAt: now,
  });

  if (auth.currentUser && active.userId) {
    try {
      await setDoc(doc(db, 'users', active.userId, 'dpdp_consents', `withdrawal_${now}`), {
        action: 'withdrawal',
        consentId: active.consentId,
        withdrawnAt: now,
        updatedPurposes: active.purposes,
        timestamp: now,
      });
    } catch (err) {
      console.warn('Firestore withdrawal sync failed:', err);
    }
  }

  return active;
}

/**
 * Get Tracker & Cookie Preferences
 */
export function getTrackerPreferences(): TrackerPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRACKERS);
    if (!raw) return DEFAULT_TRACKER_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      locationMaps: Boolean(parsed.locationMaps),
      aiAssistant: Boolean(parsed.aiAssistant),
      analytics: Boolean(parsed.analytics),
      decidedAt: parsed.decidedAt || 0,
    };
  } catch {
    return DEFAULT_TRACKER_PREFERENCES;
  }
}

/**
 * Update Tracker Preferences
 */
export function updateTrackerPreferences(prefs: Partial<TrackerPreferences>): TrackerPreferences {
  const current = getTrackerPreferences();
  const updated: TrackerPreferences = {
    ...current,
    ...prefs,
    necessary: true, // Strictly non-negotiable
    decidedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY_TRACKERS, JSON.stringify(updated));
    // Dispatch custom event so gated components update instantly
    window.dispatchEvent(new CustomEvent('lovelink:dpdp-trackers-updated', { detail: updated }));
  } catch (err) {
    console.warn('Could not save tracker preferences:', err);
  }

  return updated;
}

/**
 * Submit a formal Data Rights Request under DPDP Act 2023
 */
export async function submitDataRightsRequest(params: {
  userId: string;
  userEmail: string;
  coupleSpaceId?: string;
  fullName: string;
  requestType: DataRightsType;
  details: string;
  nomineeDetails?: {
    name: string;
    contact: string;
    relationship: string;
  };
}): Promise<DataRightsRequest> {
  const now = Date.now();
  const deadlineDays = 30; // Statutory DPDP Act SLA
  const deadlineAt = now + (deadlineDays * 24 * 60 * 60 * 1000);
  const ticketNumber = `DPDP-${params.requestType.toUpperCase().substring(0, 3)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const id = `req_${now}_${Math.random().toString(36).substring(2, 8)}`;

  const request: DataRightsRequest = {
    id,
    ticketNumber,
    userId: params.userId,
    userEmail: params.userEmail,
    coupleSpaceId: params.coupleSpaceId,
    fullName: params.fullName,
    requestType: params.requestType,
    details: params.details,
    nomineeDetails: params.nomineeDetails,
    status: 'submitted',
    submittedAt: now,
    deadlineAt,
  };

  // 1. Save locally
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: DataRightsRequest[] = raw ? JSON.parse(raw) : [];
    list.unshift(request);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not store data rights request locally:', err);
  }

  // 2. Persist to Firestore if logged in
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'dpdp_requests', id), request);
    } catch (err) {
      console.warn('Could not sync request to Firestore:', err);
    }
  }

  // 3. Post to backend endpoint
  try {
    await fetch('/api/dpdp/rights-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch (err) {
    console.warn('Could not post rights request to server:', err);
  }

  return request;
}

/**
 * Retrieve user's submitted Data Rights Requests
 */
export function getSavedDataRightsRequests(): DataRightsRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Self-service Right to Access data export (JSON dump of local memory, settings, chats, consents)
 */
export function exportLocalDataBundle(userId: string, spaceId?: string): void {
  const bundle = {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      statutoryBasis: 'Right to Access - Section 11 of Digital Personal Data Protection Act, 2023',
      userId,
      coupleSpaceId: spaceId || 'None',
      noticeVersion: CURRENT_NOTICE_VERSION,
    },
    userConsents: {
      active: getActiveConsent(),
      trackerPreferences: getTrackerPreferences(),
      dataRightsRequests: getSavedDataRightsRequests(),
    },
    localVaultData: {
      termsApproved: localStorage.getItem('lovelink_terms_approved'),
      termsAcceptedAt: localStorage.getItem('lovelink_terms_accepted_at'),
      devicePermissions: localStorage.getItem('lovelink_device_permissions'),
      activeWallpaper: localStorage.getItem('lovelink_chat_wallpaper'),
      loveStreakNotice: localStorage.getItem('lovelink_streak_last_date'),
    },
    thirdPartyProcessorsDisclosed: [
      {
        name: 'Google Firebase (Cloud Firestore & Auth)',
        purpose: 'Identity verification and encrypted sync between partners',
        location: 'Google Cloud Platform (Whitelisted)',
      },
      {
        name: 'Google Gemini AI',
        purpose: 'AIRA love companion and date planning assistance (opt-in only)',
        location: 'Google Cloud Platform',
      },
      {
        name: 'Google Maps Platform',
        purpose: 'Interactive couple location pin sharing (opt-in only)',
        location: 'Google Cloud Platform',
      },
      {
        name: 'Google STUN Servers',
        purpose: 'WebRTC NAT traversal for peer-to-peer calling',
        location: 'Google Global Network',
      }
    ],
    grievanceContact: OFFICIAL_GRIEVANCE_OFFICER,
  };

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LoveLink_DataExport_${userId || 'User'}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Self-service Right to Erasure / Local Vault Purge
 */
export function purgeLocalVault(): void {
  const keysToKeep = [STORAGE_KEY_TRACKERS]; // Keep tracker preference so user isn't immediately re-prompted unless they wish
  const savedTrackers = localStorage.getItem(STORAGE_KEY_TRACKERS);

  // Clear all localStorage
  localStorage.clear();

  if (savedTrackers) {
    localStorage.setItem(STORAGE_KEY_TRACKERS, savedTrackers);
  }

  // Attempt to clear IndexedDB databases
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      indexedDB.deleteDatabase('firestore/[DEFAULT]/[DEFAULT]/main');
      indexedDB.deleteDatabase('lovelink_local_vault');
    } catch {
      // ignore
    }
  }
}
