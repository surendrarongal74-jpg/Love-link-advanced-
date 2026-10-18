import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { TermsAndConditionsModal } from '../components/legal/TermsAndConditionsModal';
import { playSound } from '../lib/sound';
import { recordConsent } from '../lib/dpdpService';

export function AuthScreen() {
  const { user, signInWithGoogle } = useAuth();
  const [coreSyncConsent, setCoreSyncConsent] = useState<boolean>(false);
  const [mediaConsent, setMediaConsent] = useState<boolean>(false);
  const [locationConsent, setLocationConsent] = useState<boolean>(false);
  const [aiConsent, setAiConsent] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/onboarding" />;
  }

  const handleSignIn = async () => {
    if (!coreSyncConsent || !mediaConsent) {
      playSound('pop');
      setValidationError('Affirmative consent for Core Account & Media Processing is required to create your private couple space.');
      return;
    }

    try {
      // Record verifiable consent record
      await recordConsent(
        'pending_auth',
        'auth_pending@user.local',
        {
          coreSync: coreSyncConsent,
          mediaProcessing: mediaConsent,
          locationServices: locationConsent,
          aiAssistance: aiConsent,
        }
      );
    } catch {}

    await signInWithGoogle();
  };

  const handleModalAccept = () => {
    setCoreSyncConsent(true);
    setMediaConsent(true);
    setValidationError(null);
    setShowTermsModal(false);
  };

  const isRequiredConsentMet = coreSyncConsent && mediaConsent;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-rose-950 px-6 relative overflow-hidden py-10">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl -ml-20 -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl -mr-20 -mb-20"></div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-4 p-6 bg-white/70 backdrop-blur-xl rounded-full shadow-2xl shadow-rose-200/50 relative z-10"
      >
        <Heart className="w-14 h-14 text-rose-500 fill-rose-500 animate-heartbeat" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center relative z-10 w-full max-w-sm"
      >
        <h1 className="text-3xl font-serif font-bold mb-1.5 bg-gradient-to-r from-rose-600 to-purple-600 text-transparent bg-clip-text pb-1">Love Link</h1>
        <p className="text-xs font-serif text-rose-500/80 italic mb-5 font-medium">A private encrypted space just for the two of you.</p>

        {/* DPDP Section 6 Notice & Per-Purpose Consent Accordion Box */}
        <div className={`mb-5 p-4 rounded-3xl border transition-all text-left space-y-3 ${
          validationError 
            ? 'bg-rose-50/90 border-rose-400 shadow-md ring-2 ring-rose-300' 
            : 'bg-white/85 border-rose-150 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-1 border-b border-rose-100">
            <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              <span>DPDP Consent (India Act, 2023)</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Per-Purpose Opt-in</span>
          </div>

          <p className="text-[10px] text-gray-500 leading-snug">
            In compliance with Section 6 of the DPDP Act, please provide affirmative consent for each purpose. Checkboxes are unticked by default:
          </p>

          <div className="space-y-2.5 text-xs text-gray-700">
            {/* Purpose 1: Core Account */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={coreSyncConsent}
                onChange={(e) => {
                  setCoreSyncConsent(e.target.checked);
                  setValidationError(null);
                  if (e.target.checked) playSound('pop');
                }}
                className="mt-0.5 rounded text-rose-500 focus:ring-rose-400 w-4 h-4 shrink-0"
              />
              <div className="leading-tight">
                <span className="font-bold text-gray-900 text-[11px] block">
                  1. Core Account & Couple Pairing <span className="text-rose-500 text-[10px]">*Required</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Process Google identity to establish your private, isolated couple space.
                </span>
              </div>
            </label>

            {/* Purpose 2: Intimate Communications */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mediaConsent}
                onChange={(e) => {
                  setMediaConsent(e.target.checked);
                  setValidationError(null);
                  if (e.target.checked) playSound('pop');
                }}
                className="mt-0.5 rounded text-rose-500 focus:ring-rose-400 w-4 h-4 shrink-0"
              />
              <div className="leading-tight">
                <span className="font-bold text-gray-900 text-[11px] block">
                  2. Encrypted Messages & Intimate Media <span className="text-rose-500 text-[10px]">*Required</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Store and synchronize encrypted chats, voice notes, photos, and diary records exclusively with your partner.
                </span>
              </div>
            </label>

            {/* Purpose 3: Location (Optional) */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={locationConsent}
                onChange={(e) => {
                  setLocationConsent(e.target.checked);
                  if (e.target.checked) playSound('pop');
                }}
                className="mt-0.5 rounded text-indigo-500 focus:ring-indigo-400 w-4 h-4 shrink-0"
              />
              <div className="leading-tight">
                <span className="font-semibold text-gray-800 text-[11px] block">
                  3. Geolocation & Love Map <span className="text-indigo-600 text-[10px]">(Optional)</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Allow Google Maps Platform to process coordinates for couple location pins.
                </span>
              </div>
            </label>

            {/* Purpose 4: AI Companion (Optional) */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => {
                  setAiConsent(e.target.checked);
                  if (e.target.checked) playSound('pop');
                }}
                className="mt-0.5 rounded text-purple-500 focus:ring-purple-400 w-4 h-4 shrink-0"
              />
              <div className="leading-tight">
                <span className="font-semibold text-gray-800 text-[11px] block">
                  4. AI Relationship Companion <span className="text-purple-600 text-[10px]">(Optional)</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Send opted-in chat context to Google Gemini for AIRA advice and date plans.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-1.5 border-t border-rose-100 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-rose-600 underline font-semibold hover:text-rose-700"
            >
              Read Full Terms & DPDP Notice
            </button>
            <span className="text-gray-400">Notice: v1.0</span>
          </div>

          {validationError && (
            <div className="p-2 rounded-xl bg-rose-100/70 text-rose-800 text-[10px] font-semibold flex items-center gap-1.5 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSignIn}
          className={`w-full font-semibold py-3.5 px-6 rounded-full shadow-lg transition-all outline-none flex items-center justify-center gap-2.5 active:scale-95 ${
            isRequiredConsentMet
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-300 hover:shadow-xl hover:shadow-rose-400 hover:-translate-y-0.5 cursor-pointer'
              : 'bg-gradient-to-r from-rose-400/80 to-pink-400/80 text-white/90 shadow-rose-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold">Sign In & Connect with Partner</span>
        </button>

        <p className="mt-2 text-[10px] text-gray-400">
          You may modify or withdraw optional consents anytime in App Settings.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 items-center justify-center text-[10px] text-gray-500">
          <button
            onClick={() => setShowTermsModal(true)}
            className="text-rose-600 hover:underline font-semibold"
          >
            Terms of Service
          </button>
          <span>•</span>
          <a
            href="/privacy"
            className="text-rose-600 hover:underline font-semibold"
          >
            Privacy Notice
          </a>
          <span>•</span>
          <a
            href="/data-rights"
            className="text-indigo-600 hover:underline font-semibold"
          >
            Data Rights Form
          </a>
        </div>
      </motion.div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleModalAccept}
        showAcceptButton={!isRequiredConsentMet}
      />
    </div>
  );
}
