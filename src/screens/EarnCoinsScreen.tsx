import React, { useState, useRef } from 'react';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { BottomNav } from '../components/BottomNav';
import { 
  Coins, Sparkles, CheckCircle2, Clock, Upload, Camera, 
  ArrowLeft, Share2, Copy, Check, Flame, AlertCircle, 
  HelpCircle, ShieldCheck, Heart, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { RomanticMission } from '../types/coins';

export function EarnCoinsScreen() {
  const { wallet, missions, dailyRemainingQuota, submitMissionProof, claimReferral, claimDailyCheckIn } = useLoveCoins();
  const { userData } = useAuth();
  const { space } = useCoupleSpace();
  const navigate = useNavigate();

  const [selectedMission, setSelectedMission] = useState<any | null>(null);
  const [proofType, setProofType] = useState<'photo' | 'text'>('photo');
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [proofText, setProofText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<{ text: string; error?: boolean; coins?: number } | null>(null);

  // Daily Streak State
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);

  // Referral State
  const [referralInput, setReferralInput] = useState('');
  const [referralClaiming, setReferralClaiming] = useState(false);
  const [referralMsg, setReferralMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const balance = wallet?.balance ?? 50;
  const dailyEarned = wallet?.dailyEarnedToday ?? 0;
  const maxQuota = wallet?.maxDailyQuota ?? 250;
  const quotaPercent = Math.min(100, Math.round((dailyEarned / maxQuota) * 100));

  const todayStr = new Date().toISOString().split('T')[0];
  const hasClaimedToday = wallet?.lastCheckInDate === todayStr;
  const currentStreak = wallet?.streakDays || 0;

  const handleDailyCheckIn = async () => {
    if (hasClaimedToday || isCheckingIn) return;
    setIsCheckingIn(true);
    sound.tap();
    try {
      const res = await claimDailyCheckIn();
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.4 }
        });
        setCheckInFeedback(`+${res.coinsAwarded} Love Coins earned! Streak day ${res.streakDays} 🔥`);
        setTimeout(() => setCheckInFeedback(null), 4000);
      } else {
        sound.pop();
        setCheckInFeedback(res.error || 'Failed to claim today.');
        setTimeout(() => setCheckInFeedback(null), 3000);
      }
    } catch {
      setCheckInFeedback('Network error claiming check-in.');
      setTimeout(() => setCheckInFeedback(null), 3000);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const myReferralCode = (space?.inviteCode || userData?.id?.substring(0, 6) || 'LOVE50').toUpperCase();

  const handleOpenMission = (mission: any) => {
    sound.tap();
    setSelectedMission(mission);
    setProofType(mission.proofType);
    setProofImagePreview(null);
    setProofText('');
    setReflectionText('');
    setEvaluationFeedback(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    sound.tap();

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProofImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    if (!selectedMission) return;
    const content = proofType === 'photo' ? proofImagePreview : proofText;

    if (!content || !content.trim()) {
      sound.pop();
      setEvaluationFeedback({ text: `Please provide your ${proofType} proof before submitting.`, error: true });
      return;
    }

    setIsEvaluating(true);
    setEvaluationFeedback(null);

    try {
      const res = await submitMissionProof(
        selectedMission.id,
        proofType,
        content,
        reflectionText
      );

      if (!res.success) {
        sound.pop();
        setEvaluationFeedback({ text: res.error || 'Proof verification failed.', error: true });
      } else {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 }
        });
        setEvaluationFeedback({
          text: res.feedback || `Verified! +${res.coinsAwarded} Love Coins awarded!`,
          coins: res.coinsAwarded
        });
        setTimeout(() => {
          setSelectedMission(null);
          setEvaluationFeedback(null);
        }, 2600);
      }
    } catch (err: any) {
      setEvaluationFeedback({ text: 'Error evaluating proof. Please try again.', error: true });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myReferralCode);
      setCopiedCode(true);
      sound.playSuccess();
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralInput.trim()) return;

    setReferralClaiming(true);
    setReferralMsg(null);
    try {
      const res = await claimReferral(referralInput.trim());
      if (!res.success) {
        sound.pop();
        setReferralMsg({ text: res.error || 'Invalid referral code.', error: true });
      } else {
        confetti({ particleCount: 50, spread: 60 });
        setReferralMsg({ text: `Success! Welcome bonus +${res.coinsAwarded} Love Coins credited!` });
        setReferralInput('');
      }
    } catch (err) {
      setReferralMsg({ text: 'Failed to verify referral code.', error: true });
    } finally {
      setReferralClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#2B1A2E] pb-28">
      {/* Top Header */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-rose-100 px-4 py-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                sound.tap();
                navigate(-1);
              }}
              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold font-serif leading-tight">Earn Love Coins</h1>
              <p className="text-[11px] text-[#9B7A87]">Complete romantic actions & invite</p>
            </div>
          </div>

          {/* Balance Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="font-extrabold text-xs text-amber-900">{balance}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Daily Love Streak & Check-in Card */}
        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-5 text-white shadow-lg shadow-rose-300/40 relative overflow-hidden">
          {/* Decorative Sparkle Highlights */}
          <div className="absolute top-2 right-2 opacity-20 pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>

          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                <span className="font-extrabold text-xs tracking-tight">
                  {currentStreak > 0 ? `${currentStreak} Day Streak` : 'Start Your Streak'}
                </span>
              </div>
              <span className="text-[11px] text-pink-100 font-medium">Resets at midnight</span>
            </div>

            <div>
              <h2 className="text-lg font-serif font-black tracking-tight leading-snug">
                Daily Loveverse Check-in
              </h2>
              <p className="text-xs text-pink-100/90 leading-relaxed mt-0.5">
                Check in every day to keep your flame glowing and earn multiplying Love Coins.
              </p>
            </div>

            {/* 7-Day Streak Pills */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {[
                { day: 1, reward: 20 },
                { day: 2, reward: 25 },
                { day: 3, reward: 30 },
                { day: 4, reward: 35 },
                { day: 5, reward: 40 },
                { day: 6, reward: 45 },
                { day: 7, reward: 60, crown: true }
              ].map(item => {
                const isCompleted = currentStreak >= item.day;
                const isCurrent = (currentStreak % 7) + (hasClaimedToday ? 0 : 1) === item.day;

                return (
                  <div
                    key={item.day}
                    className={`rounded-2xl py-2 px-1 text-center transition-all flex flex-col items-center justify-between border ${
                      isCompleted
                        ? 'bg-white/30 border-white/60 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-white text-rose-600 border-white shadow-md scale-105 font-black'
                        : 'bg-black/15 border-white/20 text-white/70'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold tracking-tight">D{item.day}</span>
                    <span className="text-xs font-black my-1 flex items-center justify-center">
                      {isCompleted ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        `+${item.reward}`
                      )}
                    </span>
                    <span className="text-[8px] opacity-80">{item.crown ? '👑' : '🪙'}</span>
                  </div>
                );
              })}
            </div>

            {/* Claim Action Button */}
            <div className="pt-1">
              {hasClaimedToday ? (
                <div className="w-full bg-black/20 backdrop-blur-md rounded-2xl py-2.5 px-4 text-center text-xs font-bold border border-white/30 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Checked In Today • Streak Protected ✨</span>
                </div>
              ) : (
                <button
                  onClick={handleDailyCheckIn}
                  disabled={isCheckingIn}
                  className="w-full bg-white text-rose-600 hover:bg-rose-50 active:scale-98 rounded-2xl py-2.5 px-4 text-center text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{isCheckingIn ? 'Claiming...' : `Claim Day ${(currentStreak % 7) + 1} Coins`}</span>
                </button>
              )}

              {checkInFeedback && (
                <p className="text-[11px] font-bold text-center mt-2 bg-black/30 backdrop-blur-md py-1 px-3 rounded-full text-pink-100">
                  {checkInFeedback}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Quota Card */}
        <div className="bg-white rounded-3xl p-4.5 border border-rose-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-xs">Today's Action Earnings</h3>
                <p className="text-[11px] text-[#9B7A87]">Daily fair play cap</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-extrabold text-sm text-rose-600">{dailyEarned}</span>
              <span className="text-xs text-gray-400"> / {maxQuota} Coins</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-rose-50 h-2.5 rounded-full overflow-hidden border border-rose-100/60">
            <div 
              className="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-[#9B7A87] leading-relaxed flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Remaining quota today: <strong className="text-rose-600 font-bold">{dailyRemainingQuota} coins</strong>. Resets at midnight.</span>
          </p>
        </div>

        {/* Action Missions Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="font-bold text-xs uppercase tracking-wider text-gray-500">
              Active Connection Missions
            </h2>
            <span className="text-[11px] text-rose-500 font-semibold">AIRA Verified</span>
          </div>

          <div className="space-y-2.5">
            {missions.map(mission => {
              const canSubmit = mission.canSubmit;
              return (
                <div
                  key={mission.id}
                  className={`bg-white rounded-3xl p-4 border transition-all ${
                    canSubmit 
                      ? 'border-rose-100 shadow-2xs hover:shadow-md' 
                      : 'border-gray-100 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                          mission.category === 'daily'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200/50'
                            : 'bg-purple-50 text-purple-600 border border-purple-200/50'
                        }`}>
                          {mission.category}
                        </span>
                        <h3 className="font-bold text-xs text-[#2B1A2E] leading-snug">
                          {mission.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#9B7A87] leading-relaxed">
                        {mission.description}
                      </p>
                    </div>

                    {/* Reward Pill */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0 font-bold text-xs">
                      <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>+{mission.coinsReward}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-rose-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      {mission.proofType === 'photo' ? (
                        <>
                          <Camera className="w-3.5 h-3.5 text-rose-400" />
                          <span>Photo proof required</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                          <span>3-sentence reflection</span>
                        </>
                      )}
                    </div>

                    {canSubmit ? (
                      <button
                        onClick={() => handleOpenMission(mission)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-2xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Submit Proof</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span>Cooldown: {mission.nextAvailableInHours}h</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verified Referral Program Card */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-3xl p-4.5 border border-purple-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-2xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-purple-950">Refer a Couple (+50 Coins)</h3>
              <p className="text-[11px] text-purple-800/70">Share Love Link with other couples</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-purple-100/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Your Referral Code</span>
              <span className="font-mono font-extrabold text-sm text-purple-900 tracking-wider">{myReferralCode}</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Have a Referral Code Input */}
          <form onSubmit={handleClaimReferral} className="flex gap-2">
            <input
              type="text"
              value={referralInput}
              onChange={e => setReferralInput(e.target.value)}
              placeholder="Enter friend's referral code"
              className="flex-1 bg-white text-xs px-3 py-2 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase font-mono"
            />
            <button
              type="submit"
              disabled={referralClaiming || !referralInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs disabled:opacity-50 hover:bg-purple-700 transition-colors"
            >
              {referralClaiming ? 'Verifying...' : 'Claim 25c'}
            </button>
          </form>

          {referralMsg && (
            <p className={`text-xs font-semibold ${referralMsg.error ? 'text-red-600' : 'text-emerald-700'}`}>
              {referralMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Proof Submission Modal */}
      <AnimatePresence>
        {selectedMission && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full border border-rose-100 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                  {selectedMission.category} Quest • +{selectedMission.coinsReward} Coins
                </span>
                <h3 className="font-bold text-base font-serif">{selectedMission.title}</h3>
                <p className="text-xs text-[#9B7A87] leading-relaxed">{selectedMission.description}</p>
              </div>

              {/* Upload or Text Area based on proof type */}
              {proofType === 'photo' ? (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {proofImagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-rose-200 aspect-video bg-black/5">
                      <img 
                        src={proofImagePreview} 
                        alt="Proof preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setProofImagePreview(null)}
                        className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg hover:bg-black/80"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-rose-200 rounded-2xl p-6 text-center hover:bg-rose-50/50 cursor-pointer transition-colors space-y-2"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-gray-700">Tap to upload photo proof</p>
                      <p className="text-[11px] text-gray-400">Handwritten note, shared dinner, or outdoor walk</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Your Reflection</label>
                  <textarea
                    value={proofText}
                    onChange={e => setProofText(e.target.value)}
                    placeholder="Write at least 3 genuine sentences expressing gratitude for your partner..."
                    rows={4}
                    className="w-full text-xs p-3 rounded-2xl border border-rose-100 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                  />
                </div>
              )}

              {/* Additional Reflection note */}
              <div className="mt-3 space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Partner Note / Memory Context</label>
                <input
                  type="text"
                  value={reflectionText}
                  onChange={e => setReflectionText(e.target.value)}
                  placeholder="Optional note for your memory timeline"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-rose-100 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Feedback or Evaluating state */}
              {isEvaluating && (
                <div className="mt-3 p-3 bg-purple-50 rounded-2xl border border-purple-100 text-center space-y-1">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-purple-600 rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-purple-900">AIRA is analyzing your submission...</p>
                  <p className="text-[10px] text-purple-700">Verifying relevance and authentic action</p>
                </div>
              )}

              {evaluationFeedback && (
                <div className={`mt-3 p-3 rounded-2xl text-xs font-semibold ${
                  evaluationFeedback.error 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <p>{evaluationFeedback.text}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setSelectedMission(null)}
                  disabled={isEvaluating}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={isEvaluating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/40 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verify with AIRA</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
