import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { TermsAndConditionsModal } from '../components/legal/TermsAndConditionsModal';
import { playSound } from '../lib/sound';

export function AuthScreen() {
  const { user, signInWithGoogle } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(() => {
    return localStorage.getItem('lovelink_terms_approved') === 'true';
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/onboarding" />;
  }

  const handleCheckboxChange = (checked: boolean) => {
    setAgreedToTerms(checked);
    setValidationError(null);
    if (checked) {
      localStorage.setItem('lovelink_terms_approved', 'true');
      localStorage.setItem('lovelink_terms_accepted_at', new Date().toISOString());
      playSound('success');
    } else {
      localStorage.removeItem('lovelink_terms_approved');
    }
  };

  const handleSignIn = async () => {
    if (!agreedToTerms) {
      playSound('pop');
      setValidationError('Please review and agree to the Terms & Conditions and Privacy Policy to continue.');
      setShowTermsModal(true);
      return;
    }
    await signInWithGoogle();
  };

  const handleModalAccept = () => {
    handleCheckboxChange(true);
    setShowTermsModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-rose-950 px-6 relative overflow-hidden py-10">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl -ml-20 -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl -mr-20 -mb-20"></div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-6 p-7 bg-white/70 backdrop-blur-xl rounded-full shadow-2xl shadow-rose-200/50 relative z-10"
      >
        <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-heartbeat" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center relative z-10 w-full max-w-sm"
      >
        <h1 className="text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-rose-600 to-purple-600 text-transparent bg-clip-text pb-1">Love Link</h1>
        <p className="text-base font-serif text-rose-500/80 italic mb-8 font-medium">A private encrypted space just for the two of you.</p>

        {/* Terms and Conditions Acceptance Box */}
        <div className={`mb-6 p-4 rounded-2xl border transition-all text-left ${
          validationError 
            ? 'bg-rose-50/90 border-rose-400 shadow-md ring-2 ring-rose-300' 
            : 'bg-white/80 border-rose-100 shadow-sm'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="pt-0.5 relative shrink-0">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                agreedToTerms 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-xs' 
                  : 'bg-white border-rose-300 hover:border-rose-400'
              }`}>
                {agreedToTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="text-xs text-gray-700 leading-snug">
              <span>I have read and agree to the </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
                className="font-bold text-rose-600 underline hover:text-rose-700 transition"
              >
                Terms & Conditions
              </button>
              <span> and </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
                className="font-bold text-rose-600 underline hover:text-rose-700 transition"
              >
                Privacy Policy
              </button>
              <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                <span>Zero-cloud media, encrypted local device storage</span>
              </div>
            </div>
          </label>

          {validationError && (
            <div className="mt-2 text-[11px] text-rose-600 font-semibold flex items-center gap-1.5 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSignIn}
          className={`w-full font-semibold py-4 px-8 rounded-full shadow-lg transition-all outline-none flex items-center justify-center gap-3 active:scale-95 ${
            agreedToTerms
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-300 hover:shadow-xl hover:shadow-rose-400 hover:-translate-y-0.5 cursor-pointer'
              : 'bg-gradient-to-r from-rose-400 to-pink-400 text-white/90 shadow-rose-200 hover:bg-rose-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-base font-bold">Sign In & Connect with Partner</span>
        </button>

        <p className="mt-3 text-[11px] text-gray-500">
          Sign in requires Terms approval and device permissions
        </p>

        <div className="mt-6 flex flex-col gap-2 items-center">
          <button
            onClick={() => setShowTermsModal(true)}
            className="text-xs text-rose-600 hover:text-rose-800 underline font-semibold flex items-center gap-1.5"
          >
            <span>📜 Review Terms & Privacy Policy</span>
          </button>
        </div>
      </motion.div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleModalAccept}
        showAcceptButton={!agreedToTerms}
      />
    </div>
  );
}
