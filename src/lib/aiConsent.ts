import { getActiveConsent, getTrackerPreferences, updateTrackerPreferences } from './dpdpService';

/**
 * AI features (AIRA, reply suggestions, vibe check, date planner, AI games) send text to Google Gemini.
 * They are opt-in: nothing goes to Gemini until the user turns this on.
 */
export function hasAiConsent(): boolean {
  try {
    if (getTrackerPreferences().aiAssistant) return true;
    const active = getActiveConsent();
    return Boolean(active && !active.withdrawn && active.purposes?.aiAssistance);
  } catch {
    return false;
  }
}

export function setAiConsent(granted: boolean): void {
  updateTrackerPreferences({ aiAssistant: granted });
}

/** Subscribe to consent changes (fired by updateTrackerPreferences). Returns an unsubscribe fn. */
export function onAiConsentChange(cb: (granted: boolean) => void): () => void {
  const handler = () => cb(hasAiConsent());
  window.addEventListener('lovelink:dpdp-trackers-updated', handler);
  return () => window.removeEventListener('lovelink:dpdp-trackers-updated', handler);
}
