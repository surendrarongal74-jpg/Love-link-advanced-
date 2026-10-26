import React, { useState } from 'react';
import { Shield, Lock, HardDrive, Mic, Bell, Heart, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-rose-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-rose-950">Love Link Trust & Privacy</h2>
                <p className="text-xs text-rose-600 font-medium">Terms of Service & Private Device Policy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-rose-100 px-5 pt-3 gap-4 bg-rose-50/40">
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'terms'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pb-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'privacy'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Privacy & Local Storage
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700 space-y-5 leading-relaxed">
            {activeTab === 'terms' ? (
              <>
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Designed Exclusively for Two:</strong> Love Link connects you and your partner in a dedicated, private relationship sanctuary. By connecting, you and your partner agree to mutual respect and shared ownership.
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs flex items-center justify-center font-bold">1</span>
                    Mutual Relationship Consent
                  </h3>
                  <p className="text-xs text-gray-600">
                    Pairing requires mutual agreement via a unique 6-digit invitation code. Only two accounts can occupy a shared space. Either partner can unlink at any time from their app settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs flex items-center justify-center font-bold">2</span>
                    Device Permissions Required Before Connecting
                  </h3>
                  <p className="text-xs text-gray-600">
                    To deliver an intimate couple experience, Love Link requires permission for:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1.5 pl-3 list-disc marker:text-rose-400">
                    <li><strong className="text-gray-800">Microphone:</strong> For voice notes, audio whispers, and playful voice messages.</li>
                    <li><strong className="text-gray-800">Camera & Photos:</strong> For couple drawings, photo memories, and avatars.</li>
                    <li><strong className="text-gray-800">Notifications:</strong> For real-time love alerts, pings, and questions.</li>
                    <li><strong className="text-gray-800">Local Device Vault:</strong> For storing all encrypted chats and media securely on your device.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs flex items-center justify-center font-bold">3</span>
                    Zero Unsolicited Sharing & Content Ownership
                  </h3>
                  <p className="text-xs text-gray-600">
                    You and your partner retain 100% intellectual property and ownership over all photos, voice notes, drawings, and chats shared between you. Love Link never sells, licenses, or displays your private couple content.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs flex items-center justify-center font-bold">4</span>
                    Appropriate Use & Safety
                  </h3>
                  <p className="text-xs text-gray-600">
                    Users must be at least 18 years old (or legal digital adulthood in India). Harassment, abusive behavior, non-consensual sharing of intimate media, or unauthorized access violates community standards and terminates service immediately.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-rose-150">
                  <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-[10px] text-amber-900 font-mono">
                    <strong>[LEGAL REVIEW REQUIRED - STATUTORY DATA PROTECTION CLAUSE UNDER DIGITAL PERSONAL DATA PROTECTION ACT, 2023]</strong>
                  </div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">5</span>
                    Data Protection Clause (DPDP Act, 2023)
                  </h3>
                  <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
                    <p>
                      <strong>5.1 Roles:</strong> For the purposes of the Digital Personal Data Protection Act, 2023 ("DPDP Act"), you acknowledge and agree that you are the <em>Data Principal</em> and Love Link Digital Sanctuary (India) Private Limited acts as the <em>Data Fiduciary</em>.
                    </p>
                    <p>
                      <strong>5.2 Consent & Lawful Processing:</strong> We process your digital personal data solely on the basis of your affirmative, specific, and unconditional consent obtained under Section 6 of the DPDP Act. You may withdraw consent at any time via App Settings or by submitting a statutory request.
                    </p>
                    <p>
                      <strong>5.3 Security Safeguards & Breach Notice:</strong> In compliance with Section 8(5) and Section 8(6) of the DPDP Act, we implement reasonable technical and organizational safeguards (including AES-GCM encryption and access control). In the event of a verified personal data breach, we will notify the Data Protection Board of India (DPBI) and affected Data Principals within 72 hours.
                    </p>
                    <p>
                      <strong>5.4 Grievance Redressal & Escalation:</strong> If you have any complaint regarding data processing, you may contact our designated Data Protection Grievance Officer at <code>grievance-dpdp@love-link.app</code>. We commit to acknowledging grievances within 48 hours and resolving them within 30 calendar days. If unresolved, you may appeal to the Data Protection Board of India pursuant to Section 13(3).
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Local-Only Device Storage Guarantee:</strong> All your voice notes, pictures, and chats are encrypted and stored inside your devices (Phone, Tablet & PC). No central servers read or keep your intimate media.
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-rose-500" />
                    How Local Device Storage Works
                  </h3>
                  <p className="text-xs text-gray-600">
                    When you record a voice note or share an image, the file is securely encoded and written to your device&apos;s local IndexedDB encrypted storage. When your partner is connected, the encrypted packet synchronizes directly to their device and is stored locally on their device as well.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500" />
                    Offline Access
                  </h3>
                  <p className="text-xs text-gray-600">
                    Because your chat history, voice recordings, and memories reside directly in your device&apos;s storage, you can browse, listen to past voice notes, and review memories even when in airplane mode or with no internet connectivity!
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-rose-500" />
                    Microphone & Audio Privacy
                  </h3>
                  <p className="text-xs text-gray-600">
                    The microphone is only active while you are holding down or tapping the voice recording button. Background listening is strictly disabled. Audio blobs are encrypted before leaving your browser.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-500" />
                    Right to Delete & Export
                  </h3>
                  <p className="text-xs text-gray-600">
                    You can clear local chat history or wipe your device&apos;s local vault at any time in App Settings. Deleting the app removes all locally cached chats and voice notes.
                  </p>
                </div>

                <div className="space-y-3 pt-1 border-t border-rose-100/60">
                  <h3 className="font-bold text-gray-900 text-xs">
                    Contact & Privacy Inquiries
                  </h3>
                  <p className="text-xs text-gray-600">
                    Have questions about your couple space privacy or terms? Email our dedicated team at{' '}
                    <a
                      href="mailto:support@lovelinkapp.com?subject=Love%20Link%20Inquiry"
                      className="text-rose-600 underline font-semibold hover:text-rose-700"
                    >
                      support@lovelinkapp.com
                    </a>.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-rose-100 bg-gray-50 flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Updated & Effective October 2026</span>
            </div>
            
            {showAcceptButton ? (
              <button
                onClick={() => {
                  if (onAccept) onAccept();
                  onClose();
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-xs py-2.5 px-6 rounded-full shadow-md shadow-rose-200 hover:shadow-lg transition active:scale-95"
              >
                I Agree & Accept
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs py-2 px-4 rounded-full transition active:scale-95"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
