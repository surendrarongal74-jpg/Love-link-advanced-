import React, { useState } from 'react';
import { DateNightPlan } from '../../types/surprise';
import { sound } from '../../lib/sound';
import { safeFormat } from '../../lib/dateUtils';
import {
  Sparkles,
  Lock,
  Unlock,
  Play,
  Clock,
  Heart,
  Music,
  MessageCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Gift,
  Trash2,
  Calendar
} from 'lucide-react';

interface DateNightPlanCardProps {
  plan: DateNightPlan;
  isCreator: boolean;
  partnerName: string;
  now: number;
  onOpenCompanion: (plan: DateNightPlan) => void;
  onDelete?: (planId: string) => void;
}

export function DateNightPlanCard({
  plan,
  isCreator,
  partnerName,
  now,
  onOpenCompanion,
  onDelete,
}: DateNightPlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const deliverTime = new Date(plan.deliverAt).getTime();
  const isLocked = deliverTime > now && !isCreator;
  const isPendingDelivery = deliverTime > now && isCreator;
  const hasDelivered = deliverTime <= now;

  // Format countdown string
  const diffMs = Math.max(0, deliverTime - now);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const countdownText = diffHours > 24
    ? `${Math.floor(diffHours / 24)} days left`
    : diffHours > 0
    ? `${diffHours}h ${diffMins}m left`
    : `${diffMins} mins left`;

  const completedActivitiesCount = plan.activities?.filter(a => a.completed).length || 0;

  return (
    <div className={`rounded-3xl border transition-all duration-300 relative overflow-hidden ${
      isLocked
        ? 'bg-gradient-to-br from-zinc-950 via-purple-950/30 to-zinc-900 border-purple-500/30 shadow-xl'
        : plan.isCompleted
        ? 'bg-zinc-900/60 border-emerald-500/30'
        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 shadow-xl'
    }`}>
      {/* Top Banner Tag */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isCreator
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {isCreator ? 'Curated by You' : `Surprise from ${partnerName}`}
            </span>

            {isLocked && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Mystery Locked • {countdownText}</span>
              </span>
            )}

            {isPendingDelivery && (
              <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Scheduled for {safeFormat(plan.deliverAt, 'MMM d, h:mm a')}</span>
              </span>
            )}

            {plan.isCompleted && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Completed Date ✨
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {plan.rating && (
              <div className="flex items-center gap-0.5 text-amber-400 text-xs font-bold bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{plan.rating}.0</span>
              </div>
            )}

            {onDelete && isCreator && (
              <button
                onClick={() => onDelete(plan.id)}
                className="p-1 text-zinc-500 hover:text-rose-400 transition"
                title="Delete date plan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Locked View for Partner */}
        {isLocked ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-xl shadow-pink-500/20 animate-pulse">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                Mystery Date Night Surprise 🎁
              </h3>
              <p className="text-xs text-zinc-300 max-w-sm mx-auto mt-1">
                {partnerName} has prepared a customized secret evening plan for you! The activities, playlist, and conversation cards will unlock automatically.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-xs font-bold text-purple-300">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Unlocks {safeFormat(plan.deliverAt, 'EEEE, MMM d @ h:mm a')}</span>
            </div>
          </div>
        ) : (
          /* Unlocked Title & Details */
          <div>
            <h3 className="text-lg font-bold font-serif text-white tracking-tight leading-snug">
              {plan.title}
            </h3>
            <p className="text-xs font-serif italic text-pink-300/90 mt-0.5">
              "{plan.tagline}"
            </p>
            <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
              {plan.overview}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-zinc-400">
              <span className="px-2 py-0.5 bg-zinc-800/80 rounded-lg">⏱️ {plan.duration}</span>
              <span className="px-2 py-0.5 bg-zinc-800/80 rounded-lg">💰 {plan.budget}</span>
              <span className="px-2 py-0.5 bg-zinc-800/80 rounded-lg">✨ {plan.mood}</span>
              <span className="text-emerald-400 font-medium">
                {completedActivitiesCount}/{plan.activities?.length || 0} activities done
              </span>
            </div>

            {/* Past Surprises Reasoning Callout */}
            {plan.reasoningFromPastSurprises && (
              <div className="mt-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-200 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span><strong>AI Memory Match:</strong> {plan.reasoningFromPastSurprises}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Preview Details (When Unlocked) */}
      {!isLocked && isExpanded && (
        <div className="px-5 py-4 border-t border-zinc-800/80 bg-zinc-950/40 space-y-4 text-xs animate-fade-in">
          {/* Secret Preparations */}
          {plan.suggestedPreparation && plan.suggestedPreparation.length > 0 && (
            <div>
              <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block mb-1.5">
                Secret Advance Prep
              </span>
              <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                {plan.suggestedPreparation.map((prep, i) => (
                  <li key={i}>{prep}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Activities list */}
          <div>
            <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block mb-1.5">
              Activities Checklist
            </span>
            <div className="space-y-1.5">
              {plan.activities?.map((act, i) => (
                <div key={act.id || i} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${act.completed ? 'bg-emerald-400' : 'bg-pink-400'}`} />
                    <span className={`font-semibold ${act.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {act.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{act.timeEstimate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Playlist preview */}
          <div>
            <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block mb-1.5 flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-pink-400" />
              <span>Soundtrack: {plan.playlist?.playlistName} ({plan.playlist?.tracks?.length || 0} tracks)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {plan.playlist?.tracks?.slice(0, 4).map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-zinc-900 text-zinc-300 text-[10px] border border-zinc-800">
                  🎵 {t.title} - {t.artist}
                </span>
              ))}
              {(plan.playlist?.tracks?.length || 0) > 4 && (
                <span className="px-2 py-1 rounded-lg bg-zinc-900 text-zinc-500 text-[10px]">
                  +{(plan.playlist?.tracks?.length || 0) - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Review note if completed */}
          {plan.review && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-xs italic">
              "We completed this: {plan.review}"
            </div>
          )}
        </div>
      )}

      {/* Card Footer Actions */}
      {!isLocked && (
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              sound.tap();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
          >
            <span>{isExpanded ? 'Less details' : 'View full plan'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onOpenCompanion(plan);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch Date Mode</span>
          </button>
        </div>
      )}
    </div>
  );
}
