import React, { useState } from 'react';
import { DateNightPlan, DateNightActivity, PlaylistTrack } from '../../types/surprise';
import { ConversationDeckModal } from './ConversationDeckModal';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Music,
  MessageCircle,
  Heart,
  Star,
  Award,
  Gift,
  X,
  Volume2,
  Copy,
  Check
} from 'lucide-react';

interface ActiveDateCompanionModalProps {
  plan: DateNightPlan;
  partnerName: string;
  onClose: () => void;
  onCompleteDate: (rating: number, review: string) => Promise<void>;
  onToggleActivity: (activityId: string) => void;
  onVoteTrack: (trackId: string) => void;
  currentUserId: string;
}

export function ActiveDateCompanionModal({
  plan,
  partnerName,
  onClose,
  onCompleteDate,
  onToggleActivity,
  onVoteTrack,
  currentUserId,
}: ActiveDateCompanionModalProps) {
  const [showDeck, setShowDeck] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTracklist, setCopiedTracklist] = useState(false);
  const [twistRevealed, setTwistRevealed] = useState(false);

  const completedCount = plan.activities.filter(a => a.completed).length;
  const progressPct = Math.round((completedCount / Math.max(1, plan.activities.length)) * 100);

  const handleCopyPlaylist = () => {
    sound.tap();
    const text = `${plan.playlist.playlistName} — Date Night Soundtrack\n\n` +
      plan.playlist.tracks.map((t, idx) => `${idx + 1}. ${t.title} - ${t.artist} (${t.idealMoment})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTracklist(true);
    setTimeout(() => setCopiedTracklist(false), 2500);
  };

  const handleFinishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      sound.playSuccess();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      await onCompleteDate(rating, review);
      setShowFinishModal(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col text-white overflow-hidden select-none">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400 bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-700/40">
                ACTIVE DATE NIGHT COMPANION
              </span>
              <span className="text-xs text-zinc-400">with {partnerName}</span>
            </div>
            <h2 className="text-base font-bold font-serif text-white truncate max-w-xs sm:max-w-md">
              {plan.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFinishModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:opacity-95 transition active:scale-95 flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Complete Date</span>
          </button>
          <button
            onClick={() => { sound.tap(); onClose(); }}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-900 h-1.5">
        <div
          className="bg-gradient-to-r from-pink-500 to-purple-500 h-1.5 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Tagline & Atmosphere */}
        <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900/80 to-rose-950/40 border border-zinc-800 rounded-3xl p-5 text-center">
          <p className="text-sm font-serif italic text-pink-200/90 leading-relaxed max-w-xl mx-auto">
            "{plan.tagline}"
          </p>
          <p className="text-xs text-zinc-400 mt-2 max-w-lg mx-auto">
            {plan.overview}
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-zinc-400">
            <span>⏱️ {plan.duration}</span>
            <span>•</span>
            <span>💰 {plan.budget}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{completedCount}/{plan.activities.length} Steps Done</span>
          </div>
        </div>

        {/* Section 1: Itinerary / Step-by-Step Activities */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Date Night Activities Itinerary</span>
          </h3>

          <div className="space-y-3">
            {plan.activities.map((activity, idx) => (
              <div
                key={activity.id || idx}
                onClick={() => {
                  sound.playPop();
                  onToggleActivity(activity.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  activity.completed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-zinc-300 opacity-80'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-white'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-emerald-400 shrink-0"
                >
                  {activity.completed ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-zinc-950" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600 hover:text-pink-400 transition" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold ${activity.completed ? 'line-through text-zinc-400' : 'text-white'}`}>
                      {activity.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40 shrink-0">
                      {activity.timeEstimate}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {activity.description}
                  </p>

                  {activity.sparkleTip && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span><strong>Secret flourish:</strong> {activity.sparkleTip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Conversation Prompts Deck Quick Launcher */}
        <div className="bg-gradient-to-r from-pink-950/50 via-purple-950/50 to-indigo-950/50 border border-pink-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-pink-500/20 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-300 bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-700/40">
                INTERACTIVE CONVERSATION DECK
              </span>
              <h4 className="text-base font-bold text-white mt-1">Curated Date Night Cards</h4>
              <p className="text-xs text-pink-200/80">8 questions: Warm-ups, soul connection, nostalgia, and future dreams.</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.chime();
              setShowDeck(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-xl shadow-purple-500/20 transition active:scale-95 shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Conversation Cards Deck</span>
          </button>
        </div>

        {/* Section 3: Collaborative Soundtrack Playlist */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-400" />
                <span>Collaborative Soundtrack Playlist</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{plan.playlist.playlistName} • {plan.playlist.vibeDescription}</p>
            </div>

            <button
              onClick={handleCopyPlaylist}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-800 transition active:scale-95 shrink-0"
              title="Copy songs list to clipboard" aria-label="Copy songs list to clipboard"
            >
              {copiedTracklist ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy List</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.playlist.tracks.map((track, idx) => {
              const hasVoted = Array.isArray(track.upvotes) && track.upvotes.includes(currentUserId);
              return (
                <div
                  key={track.id || idx}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 hover:border-zinc-700 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{track.title}</span>
                      <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 bg-zinc-800 rounded-md shrink-0">{track.genre}</span>
                    </div>
                    <p className="text-xs text-pink-300 font-medium">{track.artist}</p>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 italic">
                      "{track.reasonForInclusion}"
                    </p>
                    <span className="text-[10px] text-purple-300 mt-1 block">
                      📍 {track.idealMoment}
                    </span>
                  </div>

                  <button
                    onClick={() => onVoteTrack(track.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center transition active:scale-90 ${
                      hasVoted
                        ? 'bg-pink-950/80 border-pink-500/60 text-pink-300'
                        : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:text-white'
                    }`}
                    title="Heart this song"
                  >
                    <Heart className={`w-4 h-4 ${hasVoted ? 'fill-pink-500 text-pink-500' : ''}`} />
                    <span className="text-[10px] font-bold mt-0.5">
                      {track.upvotes?.length || 0}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Secret Surprise Twist */}
        <div className="bg-zinc-900/50 border border-dashed border-purple-500/40 rounded-3xl p-5 text-center">
          <div className="w-10 h-10 rounded-2xl bg-purple-900/50 text-purple-300 mx-auto flex items-center justify-center mb-2">
            <Gift className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="text-sm font-bold text-white">Secret Climax Micro-Surprise</h4>
          {twistRevealed ? (
            <div className="mt-3 p-4 rounded-2xl bg-purple-950/50 border border-purple-500/40 text-sm text-purple-100 font-serif leading-relaxed italic animate-fade-in">
              "{plan.surpriseTwist}"
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-xs text-zinc-400 mb-3">Keep this hidden from your partner until the date climax!</p>
              <button
                onClick={() => {
                  sound.playPop();
                  setTwistRevealed(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-500/40 transition active:scale-95"
              >
                Reveal Secret Twist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Cards Deck Modal */}
      {showDeck && (
        <ConversationDeckModal
          prompts={plan.conversationPrompts}
          partnerName={partnerName}
          onClose={() => setShowDeck(false)}
        />
      )}

      {/* Date Completion & Review Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-white relative">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-slate-950 shadow-xl shadow-pink-500/20 mb-3">
              <Award className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-center bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Date Night Completed!
            </h3>
            <p className="text-xs text-zinc-400 text-center mt-1">
              Rate your experience together. Your feedback helps the AI create even more tailored surprises next time!
            </p>

            <form onSubmit={handleFinishSubmit} className="mt-5 space-y-4">
              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setRating(star);
                    }}
                    className="p-1 transition hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Review Note */}
              <div>
                <label className="text-xs text-zinc-400 font-semibold mb-1 block">
                  Favorite memory or reflection:
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="e.g. Loved the stargazing and acoustic playlist! Best pasta we've made."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 outline-none focus:border-rose-500 resize-none h-20 placeholder:text-zinc-600"
                  maxLength={300}
                />
              </div>

              {/* Reward Badge */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Completion Rewards:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  🪙 +50 Coins • +100 XP
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 hover:opacity-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Celebrate 💖'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
