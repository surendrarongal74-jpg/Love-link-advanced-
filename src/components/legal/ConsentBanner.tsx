import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Check, X, Settings2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getTrackerPreferences, 
  updateTrackerPreferences, 
  DEFAULT_TRACKER_PREFERENCES 
} from '../../lib/dpdpService';
import { TrackerPreferences } from '../../types/dpdp';
import { sound } from '../../lib/sound';

interface Props {
  onOpenPrivacyNotice?: () => void;
}

export function ConsentBanner({ onOpenPrivacyNotice }: Props) {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<TrackerPreferences>(DEFAULT_TRACKER_PREFERENCES);

  useEffect(() => {
    // Check if user has already made a tracker choice
    const saved = getTrackerPreferences();
    if (saved.decidedAt === 0) {
      setVisible(true);
      setPreferences(saved);
    }
  }, []);

  const handleAcceptAll = () => {
    sound.tap();
    const updated = updateTrackerPreferences({
      necessary: true,
      locationMaps: true,
      aiAssistant: true,
      analytics: true,
    });
    setPreferences(updated);
    setVisible(false);
    sound.playSuccess();
  };

  const handleEssentialOnly = () => {
    sound.tap();
    const updated = updateTrackerPreferences({
      necessary: true,
      locationMaps: false,
      aiAssistant: false,
      analytics: false,
    });
    setPreferences(updated);
    setVisible(false);
    sound.playPop();
  };

  const handleSaveCustom = () => {
    sound.tap();
    updateTrackerPreferences(preferences);
    setVisible(false);
    sound.playSuccess();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none font-sans">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl border border-rose-200/90 rounded-3xl p-5 shadow-2xl shadow-rose-950/15 text-xs text-gray-700 pointer-events-auto space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Cookie className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">Privacy & Tracker Consent</h3>
                <p className="text-[10px] text-rose-600 font-medium">Digital Personal Data Protection (DPDP) Act, 2023</p>
              </div>
            </div>
            <button
              onClick={handleEssentialOnly}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss with essential only"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Love Link uses strictly necessary device storage to power your couple space encryption. We gate non-essential third parties (such as <strong>Google Maps location pins</strong> and <strong>Gemini AI assistance</strong>) behind your explicit consent under Indian DPDP law.
          </p>

          {/* Customization Accordion */}
          {showCustomize && (
            <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2.5 animate-fade-in text-[11px]">
              {/* Essential */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-rose-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-900 block text-xs">Strictly Essential Storage</span>
                  <p className="text-[10px] text-gray-500">End-to-end encryption keys, partner pairing token, session persistence.</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">Required</span>
              </div>

              {/* Location & Google Maps */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-rose-100 cursor-pointer">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-gray-900 block text-xs">Google Maps & Geolocation</span>
                  <p className="text-[10px] text-gray-500">Loads Google Maps JavaScript SDK and transmits coordinates for shared pins.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.locationMaps}
                  onChange={(e) => setPreferences({ ...preferences, locationMaps: e.target.checked })}
                  className="rounded text-rose-500 focus:ring-rose-400 w-4 h-4"
                />
              </label>

              {/* AI Assistance */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-rose-100 cursor-pointer">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-gray-900 block text-xs">AI Relationship Companion (Gemini)</span>
                  <p className="text-[10px] text-gray-500">Sends opted-in chat context to Google Gemini for AIRA responses and date ideas.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.aiAssistant}
                  onChange={(e) => setPreferences({ ...preferences, aiAssistant: e.target.checked })}
                  className="rounded text-rose-500 focus:ring-rose-400 w-4 h-4"
                />
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-100/70">
            <button
              onClick={() => {
                sound.tap();
                setShowCustomize(!showCustomize);
              }}
              className="text-[11px] font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showCustomize ? 'Hide Preferences' : 'Customize'}</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              {showCustomize ? (
                <button
                  onClick={handleSaveCustom}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition"
                >
                  Save Preferences
                </button>
              ) : (
                <>
                  <button
                    onClick={handleEssentialOnly}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition"
                  >
                    Accept All
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
