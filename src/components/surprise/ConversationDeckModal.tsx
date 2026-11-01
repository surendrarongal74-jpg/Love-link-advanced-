import React, { useState } from 'react';
import { ConversationPrompt } from '../../types/surprise';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, ChevronLeft, ChevronRight, X, Shuffle, Star } from 'lucide-react';
import { sound } from '../../lib/sound';

interface ConversationDeckModalProps {
  prompts: ConversationPrompt[];
  onClose: () => void;
  partnerName: string;
}

export function ConversationDeckModal({ prompts, onClose, partnerName }: ConversationDeckModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [starredIds, setStarredIds] = useState<string[]>([]);

  const filteredPrompts = selectedCategory === 'all'
    ? prompts
    : prompts.filter(p => p.category === selectedCategory);

  const activeIndex = Math.min(currentIndex, Math.max(0, filteredPrompts.length - 1));
  const currentPrompt = filteredPrompts[activeIndex];

  const handleNext = () => {
    sound.tap();
    if (activeIndex < filteredPrompts.length - 1) {
      setCurrentIndex(activeIndex + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    sound.tap();
    if (activeIndex > 0) {
      setCurrentIndex(activeIndex - 1);
    } else {
      setCurrentIndex(filteredPrompts.length - 1);
    }
  };

  const handleShuffle = () => {
    sound.playPop();
    const rand = Math.floor(Math.random() * filteredPrompts.length);
    setCurrentIndex(rand);
  };

  const toggleStar = (id: string) => {
    sound.playHeartbeat();
    setStarredIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'warmUp': return 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40';
      case 'deepConnection': return 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/40';
      case 'nostalgia': return 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40';
      case 'futureDreams': return 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/40';
      default: return 'from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">Curated Conversation Deck</h3>
              <p className="text-xs text-zinc-400">Take turns asking each other with {partnerName}</p>
            </div>
          </div>
          <button
            onClick={() => { sound.tap(); onClose(); }}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-none">
          {[
            { id: 'all', label: 'All Prompts' },
            { id: 'warmUp', label: '✨ Warm-Up' },
            { id: 'deepConnection', label: '💖 Deep Soul' },
            { id: 'nostalgia', label: '🕰️ Nostalgia' },
            { id: 'futureDreams', label: '🌟 Future' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.tap();
                setSelectedCategory(tab.id);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === tab.id
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* The Card View */}
        <div className="flex-1 flex flex-col items-center justify-center my-4 min-h-[260px]">
          {currentPrompt ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPrompt.id + activeIndex}
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -12 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-700/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative min-h-[240px]"
              >
                {/* Category & Star Badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-gradient-to-r ${getCategoryColor(currentPrompt.category)}`}>
                    {currentPrompt.categoryLabel || currentPrompt.category}
                  </span>

                  <button
                    onClick={() => toggleStar(currentPrompt.id)}
                    className="p-1.5 rounded-full hover:bg-zinc-800 transition"
                    title="Favorite this question"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        starredIds.includes(currentPrompt.id)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Prompt Question */}
                <div className="my-6 text-center">
                  <p className="font-serif text-lg sm:text-xl text-zinc-100 font-medium leading-relaxed italic">
                    "{currentPrompt.question}"
                  </p>
                </div>

                {/* Card index indicator */}
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800/60">
                  <span>Card {activeIndex + 1} of {filteredPrompts.length}</span>
                  <span className="flex items-center gap-1 text-pink-400/80">
                    <Heart className="w-3.5 h-3.5 fill-pink-500/40" /> Listen with presence
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center text-zinc-500 py-10">No prompts in this category.</div>
          )}
        </div>

        {/* Deck Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
          <button
            onClick={handlePrev}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1 transition active:scale-95 border border-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleShuffle}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-purple-300 hover:text-purple-200 text-xs flex items-center gap-1.5 transition active:scale-95 border border-purple-500/30"
            title="Random Card"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-rose-500/20 hover:opacity-95 transition active:scale-95"
          >
            Next Card <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
