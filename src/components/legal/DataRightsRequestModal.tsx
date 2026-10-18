import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Send, 
  CheckCircle2, 
  FileText, 
  Trash2, 
  UserCheck, 
  Undo2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DataRightsType, 
  DataRightsRequest, 
  OFFICIAL_GRIEVANCE_OFFICER 
} from '../../types/dpdp';
import { 
  submitDataRightsRequest, 
  exportLocalDataBundle, 
  purgeLocalVault,
  getSavedDataRightsRequests 
} from '../../lib/dpdpService';
import { useAuth } from '../../contexts/AuthContext';
import { sound } from '../../lib/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DataRightsRequestModal({ isOpen, onClose }: Props) {
  const { user, userData } = useAuth();
  
  const [requestType, setRequestType] = useState<DataRightsType>('access');
  const [fullName, setFullName] = useState(userData?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [details, setDetails] = useState('');
  
  // Nominee fields (Section 14)
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeContact, setNomineeContact] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<DataRightsRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [purgeConfirmed, setPurgeConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.tap();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full name and email are required to verify your identity as a Data Principal.');
      return;
    }

    if (!details.trim()) {
      setErrorMsg('Please specify the details or scope of your request.');
      return;
    }

    if (requestType === 'nomination' && (!nomineeName.trim() || !nomineeContact.trim())) {
      setErrorMsg('Nominee name and verified contact details are required.');
      return;
    }

    setSubmitting(true);
    try {
      const nomineeDetails = requestType === 'nomination' ? {
        name: nomineeName.trim(),
        contact: nomineeContact.trim(),
        relationship: nomineeRelationship.trim() || 'Designated Representative',
      } : undefined;

      const req = await submitDataRightsRequest({
        userId: user?.uid || userData?.id || 'guest_user',
        userEmail: email.trim(),
        coupleSpaceId: userData?.coupleSpaceId || undefined,
        fullName: fullName.trim(),
        requestType,
        details: details.trim(),
        nomineeDetails,
      });

      setSubmittedTicket(req);
      sound.playSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not submit request. Please email grievance-dpdp@love-link.app directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfServiceExport = () => {
    sound.tap();
    exportLocalDataBundle(user?.uid || userData?.id || 'guest', userData?.coupleSpaceId);
  };

  const handleExecuteLocalPurge = () => {
    sound.tap();
    if (window.confirm("Are you sure you want to purge all local couple cache and chat memories from this device? This action cannot be undone.")) {
      purgeLocalVault();
      setPurgeConfirmed(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const existingRequests = getSavedDataRightsRequests();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-rose-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Data Principal Rights Form</h2>
                <p className="text-[11px] text-rose-100">Digital Personal Data Protection Act, 2023</p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.tap();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-rose-100 bg-rose-50/50 px-5 pt-2.5 gap-4 text-xs font-semibold">
            <button
              onClick={() => {
                sound.tap();
                setShowHistory(false);
              }}
              className={`pb-2.5 border-b-2 transition-all ${
                !showHistory 
                  ? 'border-rose-500 text-rose-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Submit New Request
            </button>
            <button
              onClick={() => {
                sound.tap();
                setShowHistory(true);
              }}
              className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                showHistory 
                  ? 'border-rose-500 text-rose-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Track Existing Requests</span>
              {existingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] flex items-center justify-center font-bold">
                  {existingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 text-xs text-gray-700 space-y-4 leading-relaxed">
            {submittedTicket ? (
              <div className="space-y-4 py-3 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Request Submitted Successfully</h3>
                  <p className="text-gray-500 text-[11px] mt-1">
                    Your request has been logged with the Data Protection & Grievance Cell.
                  </p>
                </div>

                <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Tracking Ticket</span>
                    <span className="font-mono font-bold text-rose-600 text-xs px-2 py-0.5 bg-white rounded border border-rose-200">
                      {submittedTicket.ticketNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Request Type</span>
                    <span className="font-semibold text-gray-800 capitalize">{submittedTicket.requestType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Statutory SLA</span>
                    <span className="font-semibold text-indigo-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 30 Calendar Days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Resolution Deadline</span>
                    <span className="font-medium text-gray-700">
                      {new Date(submittedTicket.deadlineAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-normal">
                  Our Grievance Officer (<strong className="text-gray-700">{OFFICIAL_GRIEVANCE_OFFICER.name}</strong>) will acknowledge this within 48 hours and fulfill your request.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setDetails('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold text-gray-700 transition"
                  >
                    Submit Another
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : showHistory ? (
              <div className="space-y-3">
                {existingRequests.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="font-bold text-gray-600">No requests submitted yet</p>
                    <p className="text-[11px] text-gray-400">You can submit an access, erasure, or correction request anytime.</p>
                  </div>
                ) : (
                  existingRequests.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-rose-600">{req.ticketNumber}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold capitalize">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium">Type: {req.requestType.replace('_', ' ')}</p>
                      <p className="text-gray-500 text-[10px] line-clamp-2">{req.details}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                        <span>Submitted: {new Date(req.submittedAt).toLocaleDateString()}</span>
                        <span>SLA: {new Date(req.deadlineAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Instant Self-Service Tools Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/60 space-y-2">
                  <span className="font-bold text-purple-950 block text-xs">
                    ⚡ Instant Self-Service Tools
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelfServiceExport}
                      className="flex-1 py-2 px-3 rounded-xl bg-white border border-purple-200 hover:border-purple-300 text-purple-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Data Export</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteLocalPurge}
                      className="py-2 px-3 rounded-xl bg-white border border-rose-200 hover:border-rose-300 text-rose-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Local Vault</span>
                    </button>
                  </div>
                  {purgeConfirmed && (
                    <span className="text-[10px] text-emerald-600 font-bold block animate-fade-in">
                      ✓ Local vault purged. Reloading app...
                    </span>
                  )}
                </div>

                {/* Right Selection Radio Group */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-900 block">Select Statutory Right to Exercise</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        type: 'access',
                        title: 'Right to Access (Section 11)',
                        desc: 'Summary of personal data processed, identities of third-party processors, and processing purposes.',
                      },
                      {
                        type: 'correction',
                        title: 'Right to Correction & Updating (Section 12)',
                        desc: 'Correct inaccurate, misleading, or outdated personal information in your account or space.',
                      },
                      {
                        type: 'erasure',
                        title: 'Right to Erasure / Forgotten (Section 12)',
                        desc: 'Request complete deletion of your user account, couple space records, and uploaded intimate media.',
                      },
                      {
                        type: 'withdraw_consent',
                        title: 'Right to Withdraw Consent (Section 6(4))',
                        desc: 'Revoke consent previously granted for specific features (e.g. location, AI companion).',
                      },
                      {
                        type: 'nomination',
                        title: 'Right to Nominate (Section 14)',
                        desc: 'Designate a trusted representative to exercise data rights in the event of death or incapacity.',
                      },
                    ].map((item) => (
                      <label
                        key={item.type}
                        onClick={() => sound.tap()}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                          requestType === item.type
                            ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200 shadow-2xs'
                            : 'border-gray-200 hover:border-rose-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="requestType"
                          value={item.type}
                          checked={requestType === item.type}
                          onChange={() => setRequestType(item.type as DataRightsType)}
                          className="mt-0.5 text-rose-500 focus:ring-rose-400"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-900 block text-xs">{item.title}</span>
                          <p className="text-[10px] text-gray-500 leading-snug">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data Principal Details */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="font-bold text-gray-800 block mb-1">Data Principal Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priyadarshini Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-rose-500 bg-gray-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 block mb-1">Registered Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-rose-500 bg-gray-50/50"
                      required
                    />
                  </div>

                  {requestType === 'nomination' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5 animate-fade-in">
                      <span className="font-bold text-amber-900 block text-xs">
                        Nominee Information (Section 14)
                      </span>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-700 block mb-1">Nominee Full Name *</label>
                        <input
                          type="text"
                          value={nomineeName}
                          onChange={(e) => setNomineeName(e.target.value)}
                          placeholder="Nominee's legal name"
                          className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-700 block mb-1">Contact Phone or Email *</label>
                          <input
                            type="text"
                            value={nomineeContact}
                            onChange={(e) => setNomineeContact(e.target.value)}
                            placeholder="Email or phone"
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-700 block mb-1">Relationship</label>
                          <input
                            type="text"
                            value={nomineeRelationship}
                            onChange={(e) => setNomineeRelationship(e.target.value)}
                            placeholder="e.g. Spouse, Sibling"
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-gray-800 block mb-1">
                      Request Scope & Specific Instructions *
                    </label>
                    <textarea
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Please describe specifically what data, records, or actions you request..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-rose-500 bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-200/50 flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Registering Statutory Request...' : 'Submit Data Rights Request'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 text-center">
                  Requests are governed by the statutory 30-day timeline mandated by the DPDP Act, 2023.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
