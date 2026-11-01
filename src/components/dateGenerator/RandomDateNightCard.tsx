import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Flame,
  MessageCircle,
  Music,
  ExternalLink,
  Heart,
  Share2,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Navigation,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { RandomDateNightData } from '../../types/randomDate';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';

interface RandomDateNightCardProps {
  dateNight: RandomDateNightData;
  onLockInDate: (date: RandomDateNightData) => Promise<void>;
  onReroll: () => void;
  isSaving?: boolean;
  isLockedIn?: boolean;
}

export const RandomDateNightCard: React.FC<RandomDateNightCardProps> = ({
  dateNight,
  onLockInDate,
  onReroll,
  isSaving = false,
  isLockedIn = false,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'dare' | 'conversation' | 'soundtrack'>('itinerary');

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(
      `Date Night Question for Us: "${dateNight.conversationCard.question}"\nFollow-up: "${dateNight.conversationCard.followUp}"`
    );
    setCopiedPrompt(true);
    sound.pop();
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleOpenGoogleMaps = () => {
    sound.pop();
    const query = encodeURIComponent(dateNight.mapQuery || `${dateNight.mainActivity.name} ${dateNight.locationAnchor}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCalendarDownload = () => {
    sound.pop();
    const startDate = new Date();
    startDate.setHours(19, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

    const formatCalDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LoveLink//DateNightGenerator//EN',
      'BEGIN:VEVENT',
      `UID:datenight-${dateNight.id}@lovelink.app`,
      `DTSTAMP:${formatCalDate(new Date())}`,
      `DTSTART:${formatCalDate(startDate)}`,
      `DTEND:${formatCalDate(endDate)}`,
      `SUMMARY:❤️ Date Night: ${dateNight.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${dateNight.tagline.replace(/,/g, '\\,')} \\n\\nMain: ${dateNight.mainActivity.name} \\nAfter: ${dateNight.secondaryActivity.name} \\n\\nConversation: ${dateNight.conversationCard.question}`,
      `LOCATION:${dateNight.locationAnchor.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `date-night-${dateNight.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full bg-gradient-to-b from-slate-900 via-purple-950/70 to-slate-950 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl text-white relative overflow-hidden"
    >
      {/* Background Ambience Shimmer */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl filter drop-shadow-md">{dateNight.diceRollEmoji}</span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
              {dateNight.vibe}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 font-semibold text-amber-300">
              <DollarSign className="w-3.5 h-3.5" />
              {dateNight.budgetCategory} ({dateNight.estimatedCost})
            </span>
            <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 font-semibold text-sky-300">
              <Clock className="w-3.5 h-3.5" />
              {dateNight.duration}
            </span>
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-300 via-rose-200 to-amber-200 bg-clip-text text-transparent">
          {dateNight.title}
        </h3>
        <p className="text-sm sm:text-base text-slate-300 mt-1 font-medium leading-relaxed">
          {dateNight.tagline}
        </p>

        {/* Location Anchor Bar */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/20 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-rose-200">{dateNight.locationAnchor}</span>
          </div>
          <button
            onClick={handleOpenGoogleMaps}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition font-medium bg-indigo-950/60 hover:bg-indigo-900/60 px-2.5 py-1 rounded-xl border border-indigo-500/30"
          >
            <span>Open in Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feature Tabs: Itinerary, Spontaneity Dare, Conversation Card, Soundtrack */}
      <div className="relative z-10 mt-5 border-b border-slate-800 flex gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'itinerary'
              ? 'border-pink-400 text-pink-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Plan ({dateNight.bestTime})</span>
        </button>

        <button
          onClick={() => setActiveTab('dare')}
          className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'dare'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Spontaneity Dare</span>
        </button>

        <button
          onClick={() => setActiveTab('conversation')}
          className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'conversation'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Conversation Card</span>
        </button>

        <button
          onClick={() => setActiveTab('soundtrack')}
          className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'soundtrack'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Soundtrack</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="relative z-10 py-5 min-h-[190px]">
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            {/* Main Activity */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-pink-500/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold flex items-center justify-center border border-pink-500/40">
                    1
                  </span>
                  <h4 className="font-bold text-base text-pink-200">{dateNight.mainActivity.name}</h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">{dateNight.mainActivity.duration}</span>
              </div>
              <span className="text-[11px] font-semibold text-pink-400 block mt-1">
                📍 {dateNight.mainActivity.spotType} • {dateNight.mainActivity.localNeighborhood}
              </span>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {dateNight.mainActivity.vividDescription}
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-xs text-pink-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Insider Tip:</strong> {dateNight.mainActivity.proTip}</span>
              </div>
            </div>

            {/* Secondary Activity / Sweet Transition */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-purple-500/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center border border-purple-500/40">
                    2
                  </span>
                  <h4 className="font-bold text-base text-purple-200">{dateNight.secondaryActivity.name}</h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">{dateNight.secondaryActivity.duration}</span>
              </div>
              <span className="text-[11px] font-semibold text-purple-400 block mt-1">
                🌙 {dateNight.secondaryActivity.spotType}
              </span>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {dateNight.secondaryActivity.vividDescription}
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2">
                <Heart className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Pro Tip:</strong> {dateNight.secondaryActivity.proTip}</span>
              </div>
            </div>

            {/* Outfit / Weather Tip */}
            {dateNight.weatherOutfitTip && (
              <div className="text-xs text-slate-400 flex items-center gap-2 px-1">
                <span>🧥</span>
                <span><strong>Outfit & Vibe Tip:</strong> {dateNight.weatherOutfitTip}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dare' && (
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-950/40 to-slate-900 border border-amber-500/30 text-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <h4 className="font-bold text-lg text-amber-300">{dateNight.spontaneityChallenge.title}</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                +{dateNight.spontaneityChallenge.pointsReward} Couple XP
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-200 font-medium">
              {dateNight.spontaneityChallenge.instructions}
            </p>
            <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs text-slate-400 flex items-center justify-between">
              <span>Complete this micro-challenge together during the date to earn your badge!</span>
            </div>
          </div>
        )}

        {activeTab === 'conversation' && (
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyan-950/40 to-slate-900 border border-cyan-500/30 text-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Theme: {dateNight.conversationCard.theme}
              </span>
              <button
                onClick={handleCopyPrompt}
                className="text-xs flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 transition"
                title="Copy Question"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <blockquote className="text-base sm:text-lg font-serif italic text-cyan-100 leading-snug border-l-2 border-cyan-400 pl-4 my-3">
              "{dateNight.conversationCard.question}"
            </blockquote>
            <p className="text-xs text-slate-300 mt-3">
              <strong className="text-cyan-300">Follow-up Spark:</strong> {dateNight.conversationCard.followUp}
            </p>
          </div>
        )}

        {activeTab === 'soundtrack' && (
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-purple-950/40 to-slate-900 border border-purple-500/30 text-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-base text-purple-200">{dateNight.soundtrack.playlistTitle}</h4>
              </div>
              <span className="text-[11px] text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                Official Soundtrack
              </span>
            </div>
            <div className="my-3 p-3 rounded-xl bg-slate-900/90 border border-purple-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Featured Song</span>
                <span className="text-base font-bold text-white block mt-0.5">{dateNight.soundtrack.featuredTrack}</span>
              </div>
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(dateNight.soundtrack.spotifySearchQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
              >
                <span>Listen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {dateNight.soundtrack.vibeNote}
            </p>
          </div>
        )}
      </div>

      {/* Why This Matches Note */}
      {dateNight.whyThisMatches && (
        <div className="relative z-10 my-3 text-[11px] text-slate-400/90 italic border-t border-slate-800/80 pt-3">
          💡 {dateNight.whyThisMatches}
        </div>
      )}

      {/* Master Action Footer */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onReroll}
          className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition active:scale-95 border border-slate-700/60 shadow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Spin Another Date 🎲</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Add to Calendar */}
          <button
            onClick={handleCalendarDownload}
            className="p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700/60 shadow"
            title="Download Calendar .ics"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Lock In Date Button */}
          <button
            onClick={() => {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24']
              });
              onLockInDate(dateNight);
            }}
            disabled={isSaving || isLockedIn}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 transition active:scale-95 ${
              isLockedIn
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/25'
            }`}
          >
            {isLockedIn ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Locked In! 💖</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white" />
                <span>{isSaving ? 'Locking in...' : 'Lock In This Date Night!'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
