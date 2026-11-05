import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ShieldCheck, Sparkles, AlertCircle, UserCheck, CheckCircle2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { TermsAndConditionsModal } from '../components/legal/TermsAndConditionsModal';
import { playSound } from '../lib/sound';
import { recordConsent } from '../lib/dpdpService';

export function AuthScreen() {
  const { user, signInWithGoogle, signInWithDemo } = useAuth();
  // DPDP s.6: consent must be an affirmative act, so nothing is pre-ticked.
  const [coreSyncConsent, setCoreSyncConsent] = useState<boolean>(false);
  const [mediaConsent, setMediaConsent] = useState<boolean>(false);
  const [locationConsent, setLocationConsent] = useState<boolean>(false);
  const [aiConsent, setAiConsent] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (user) {
    return <Navigate to="/onboarding" />;
  }

  const handleSignIn = async () => {
    if (!coreSyncConsent || !mediaConsent) {
      playSound('pop');
      setValidationError('Please accept the required Core Account and Messages & Media consents below to continue.');
      return;
    }

    setValidationError(null);
    setIsSigningIn(true);

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

    const res = await signInWithGoogle();
    setIsSigningIn(false);
    if (!res.success && res.error) {
      setValidationError(res.error);
      playSound('pop');
    }
  };

  const handleDemoSignIn = async (role: 'alex' | 'taylor') => {
    setValidationError(null);
    setIsSigningIn(true);
    playSound('chime');
    await signInWithDemo(role);
    setIsSigningIn(false);
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
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none"></div>

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
        <h1 className="text-3xl font-serif font-bold mb-1 bg-gradient-to-r from-rose-600 to-purple-600 text-transparent bg-clip-text pb-1">
          Love Link
        </h1>
        <p className="text-sm text-rose-900/80 mb-4 font-medium">
          One quick step: agree to how your data is used, then sign in.
        </p>

        {/* Validation / Error Banner */}
        {validationError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-100/90 border border-rose-300 text-rose-900 text-xs font-medium flex items-start gap-2 shadow-sm text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p>{validationError}</p>
              <p className="text-xs text-rose-800">
                Just looking around? Use a demo space below.
              </p>
            </div>
          </div>
        )}

        {/* DPDP Section 6 Notice & Per-Purpose Consent Accordion Box */}
        <div className={`mb-4 p-4 rounded-3xl border transition-all text-left space-y-2.5 ${
          validationError 
            ? 'bg-rose-50/90 border-rose-400 shadow-md ring-2 ring-rose-300' 
            : 'bg-white/85 border-rose-150 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-1 border-b border-rose-100">
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
              <span>Your consent (India DPDP Act, 2023)</span>
            </span>
            {isRequiredConsentMet && (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Ready
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs text-gray-700">
            {/* Purpose 1: Core Account */}
            <label className="flex items-start gap-3 cursor-pointer py-1.5">
              <input
                type="checkbox"
                checked={coreSyncConsent}
                onChange={(e) => {
                  setCoreSyncConsent(e.target.checked);
                  setValidationError(null);
                  if (e.target.checked) playSound('pop');
                }}
                className="mt-0.5 rounded accent-rose-600 w-5 h-5 shrink-0"
              />
              <div className="leading-tight">
                <span className="font-bold text-gray-900 text-xs block">
                  1. Core Account & Couple Pairing <span className="text-rose-700 text-[11px]">(required)</span>
                </span>
                <span className="text-[11px] text-gray-600 leading-snug block mt-0.5">
                  Process Google identity to establish your private, isolated couple space.
                </span>
              </div>
            </label>

            {/* Purpose 2: Intimate Communications */}
            <label className="flex items-start gap-3 cursor-pointer py-1.5">
              <input
                type="checkbox"
                checked={mediaConsent}
                onChange={(e) => {
                  setMediaConsent(e.target.checked);
                  setValidationError(null);
                  if (e.target.checked) playSound('pop');
                }}
                className="mt-0.5 rounded accent-rose-600 w-5 h-5 shrink-0"
              />
              <div className="leading-tight">
                <span className="font-bold text-gray-900 text-xs block">
                  2. Messages, Photos & Gifts <span className="text-rose-700 text-[11px]">(required)</span>
                </span>
                <span className="text-[11px] text-gray-600 leading-snug block mt-0.5">
                  Store your chats, photos, voice notes and memories in our cloud database (Google Firebase) so they sync with your partner.
                </span>
              </div>
            </label>
          </div>

          <p className="text-[11px] text-gray-600 leading-snug">
            Optional: AI features (AIRA) and location sharing stay off. We&apos;ll ask you if and when you use them.
          </p>
          <div className="pt-1 border-t border-rose-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="min-h-11 text-rose-700 underline font-semibold hover:text-rose-800"
            >
              Read Full Terms & DPDP Notice
            </button>
            <span className="text-gray-500">Notice v1.0</span>
          </div>
        </div>

        {/* Primary Google Login Button */}
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className={`w-full font-semibold py-3.5 px-6 rounded-full shadow-lg transition-all outline-none flex items-center justify-center gap-2.5 active:scale-95 ${
            isRequiredConsentMet
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-300 hover:shadow-xl hover:shadow-rose-400 hover:-translate-y-0.5 cursor-pointer'
              : 'bg-gradient-to-r from-rose-400/80 to-pink-400/80 text-white/90 shadow-rose-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold">
            {isSigningIn ? 'Signing In...' : 'Sign In with Google'}
          </span>
        </button>

        {/* 1-Click Quick Demo Sign-in for Preview Testing (Fixes Login Problem on any domain / webview) */}
        <div className="mt-4 pt-3 border-t border-rose-200/60">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            <span>Just looking? Try a demo space</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('alex')}
              className="min-h-12 px-3 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-sm transition active:scale-95 flex flex-col items-center gap-0.5"
            >
              <span>🧑 Demo as Alex</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('taylor')}
              className="min-h-12 px-3 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-purple-200 text-purple-800 text-xs font-bold shadow-sm transition active:scale-95 flex flex-col items-center gap-0.5"
            >
              <span>👧 Demo as Taylor</span>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600">
            Sample data on this device only. AI features need a Google sign-in.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-1 items-center justify-center text-xs text-gray-600">
          <a href="/" className="min-h-11 px-2 inline-flex items-center text-rose-700 hover:underline font-semibold">
            ← About Love Link
          </a>
          <span aria-hidden="true">•</span>
          <button
            onClick={() => setShowTermsModal(true)}
            className="min-h-11 px-2 inline-flex items-center text-rose-700 hover:underline font-semibold"
          >
            Terms of Service
          </button>
          <span aria-hidden="true">•</span>
          <a
            href="/privacy"
            className="min-h-11 px-2 inline-flex items-center text-rose-700 hover:underline font-semibold"
          >
            Privacy Notice
          </a>
          <span aria-hidden="true">•</span>
          <a
            href="/data-rights"
            className="min-h-11 px-2 inline-flex items-center text-indigo-700 hover:underline font-semibold"
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
