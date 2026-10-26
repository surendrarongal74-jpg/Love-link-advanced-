import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X, RotateCw, Calendar, BookOpen, Box, Layers } from 'lucide-react';
import { DigitalGift, GiftPhotoItem } from '../../types/digitalGifts';
import { sound } from '../../lib/sound';
import { Loveverse3DViewer } from './3d/Loveverse3DViewer';
import { ExperienceErrorBoundary } from './3d/ExperienceErrorBoundary';

interface Props {
  gift: DigitalGift;
  isPreview?: boolean;
  onClose?: () => void;
}

export function MemoryArchiveExperience({ gift, isPreview, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedPolaroid, setSelectedPolaroid] = useState<GiftPhotoItem | null>(null);
  const [isScrapbookOpen, setIsScrapbookOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'My Soulmate';
  const dedication = gift.content?.dedication || 'Our Treasured Keepsake Scrapbook • Volume I';
  const message = gift.content?.message || 'A collection of the little moments that make our love grand, gentle, and everlasting.';

  const photos = gift.content?.photos?.length
    ? gift.content.photos
    : [
        {
          id: 'polaroid_1',
          url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
          caption: 'The day we laughed until our stomachs hurt. I will never forget the joy in your eyes.',
          date: 'Golden Afternoon',
          order: 1
        },
        {
          id: 'polaroid_2',
          url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
          caption: 'Your hand in mine, warm against the cool evening breeze.',
          date: 'Starlight Walk',
          order: 2
        }
      ];

  const toggleFlip = (id: string) => {
    sound.tap();
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1E1412] text-amber-100 overflow-hidden select-none flex flex-col">
      {/* Warm Wood Desk Texture Background */}
      <div className="fixed inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-stone-950 to-black" />

      {/* Header */}
      <header className="relative z-40 px-4 py-3.5 border-b border-amber-900/50 bg-[#140E0C]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📔</span>
          <div>
            <h1 className="text-sm font-serif font-black text-amber-200">The Memory Archive</h1>
            <p className="text-[10px] text-amber-500 font-mono">
              {viewMode === '3d' ? '3D Vintage Study Room' : 'Vintage Keepsake Desk'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800/40 transition-all text-xs flex items-center gap-1.5 active:scale-95"
            title="Toggle between 3D Study and 2D Scrapbook"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-rose-300" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {viewMode === '3d' ? '3D Study' : '2D Scrapbook'}
            </span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 3D vs 2D Body */}
      {viewMode === '3d' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <ExperienceErrorBoundary
            fallbackTo2D={() => setViewMode('2d')}
            experienceName="The Memory Archive"
          >
            <Loveverse3DViewer
              gift={gift}
              onInteract={(action, payload) => {
                sound.tap();
                if (action === 'inspect_polaroid' && payload?.photo) {
                  setSelectedPolaroid(payload.photo);
                } else if (action === 'open_scrapbook') {
                  setIsScrapbookOpen(true);
                } else if (action === 'open_memory_jar') {
                  sound.playSuccess();
                }
              }}
              onSwitchTo2D={() => setViewMode('2d')}
            />
          </ExperienceErrorBoundary>

          {/* Quick CTA in 3D */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            <button
              onClick={() => setIsScrapbookOpen(true)}
              className="px-4 py-2 rounded-full bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-700/60 font-bold text-xs shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-transform active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Dedication</span>
            </button>
            <button
              onClick={() => setSelectedPolaroid(photos[0])}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-stone-950 font-bold text-xs shadow-xl flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <span>🖼️</span>
              <span>Inspect Memories</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2D Scrapbook Layout */
        <main className="relative z-20 flex-1 overflow-y-auto max-w-4xl mx-auto px-4 py-8 space-y-8 w-full">
        {/* Scrapbook Cover / Title Plaque */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#2A1D1A] border-2 border-amber-700/40 shadow-2xl text-center space-y-2 relative overflow-hidden">
          {/* Faux Washi Tape Accents */}
          <div className="absolute -top-3 left-8 w-20 h-7 bg-amber-300/30 backdrop-blur-xs transform -rotate-3 border border-amber-200/40" />
          <div className="absolute -top-3 right-8 w-20 h-7 bg-rose-300/30 backdrop-blur-xs transform rotate-2 border border-rose-200/40" />

          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-black">
            Vault Keepsake • Handcrafted by {creatorName}
          </span>
          <h2 className="font-serif font-black text-2xl md:text-3xl text-amber-100">
            {dedication}
          </h2>
          <p className="font-serif italic text-sm md:text-base text-amber-200/80 max-w-lg mx-auto">
            "{message}"
          </p>
          <div className="text-[11px] text-amber-400/80 pt-2 font-mono">
            Tap any Polaroid print to flip and read handwritten memory confessions
          </div>
        </div>

        {/* Polaroids Scatter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8">
          {photos.map((item, idx) => {
            const isFlipped = !!flippedCards[item.id || idx.toString()];
            const rotation = (idx % 2 === 0 ? -2 : 2.5);

            return (
              <div
                key={item.id || idx}
                style={{ transform: `rotate(${rotation}deg)` }}
                className="relative cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-30 hover:rotate-0"
                onClick={() => toggleFlip(item.id || idx.toString())}
              >
                {/* Washi Tape on Top Center */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-amber-200/40 backdrop-blur-xs border border-white/30 shadow-xs z-20 pointer-events-none" />

                {/* Flip Card Container */}
                <div className="w-full bg-[#FFFDF9] rounded-2xl p-4 shadow-2xl border border-stone-200 text-stone-900 min-h-[360px] flex flex-col justify-between transition-all">
                  {!isFlipped ? (
                    /* Front: Classic Polaroid Photo */
                    <div className="space-y-3 flex-1 flex flex-col">
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-stone-200 relative shadow-inner">
                        <img
                          src={item.url}
                          alt={item.caption || 'Memory'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono text-white flex items-center gap-1">
                          <RotateCw className="w-2.5 h-2.5 animate-spin duration-3000" />
                          Tap to flip
                        </div>
                      </div>

                      <div className="pt-2 text-center">
                        <p className="font-serif font-bold text-sm text-stone-800 truncate">
                          {item.caption || 'Cherished Memory'}
                        </p>
                        {item.date && (
                          <p className="text-[10px] font-mono uppercase text-stone-400">
                            {item.date}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Back: Handwritten Memory confession */
                    <div className="p-4 flex-1 flex flex-col justify-between bg-amber-50/50 rounded-xl border border-dashed border-amber-300">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold block mb-2">
                          Handwritten Memory #{idx + 1}
                        </span>
                        <p className="font-serif text-sm md:text-base text-stone-900 leading-relaxed italic">
                          "{item.caption}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-amber-200 flex items-center justify-between text-xs text-amber-800">
                        <span className="font-mono text-[10px]">{item.date || 'Forever Stored'}</span>
                        <div className="flex items-center gap-1 font-bold text-[10px]">
                          <span>Turn back</span>
                          <RotateCw className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    )}

    {/* 3D Mode Polaroid Inspect Lightbox Modal */}
    <AnimatePresence>
      {viewMode === '3d' && selectedPolaroid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-[#FFFDF9] rounded-3xl p-5 shadow-2xl border-2 border-amber-200 text-stone-900 relative"
          >
            <button
              onClick={() => setSelectedPolaroid(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-3">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-stone-200 shadow-inner">
                <img
                  src={selectedPolaroid.url}
                  alt={selectedPolaroid.caption || 'Polaroid Memory'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pt-1">
                {selectedPolaroid.date && (
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-800">
                    {selectedPolaroid.date}
                  </span>
                )}
                <p className="font-serif italic text-sm text-stone-900 mt-1 leading-relaxed">
                  "{selectedPolaroid.caption || 'A Treasured Moment'}"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* 3D Mode Scrapbook Dedication Modal */}
    <AnimatePresence>
      {viewMode === '3d' && isScrapbookOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-[#2A1D1A] border-2 border-amber-600/50 rounded-3xl p-6 md:p-8 shadow-2xl text-amber-100 relative space-y-4 text-center"
          >
            <button
              onClick={() => setIsScrapbookOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-950 hover:bg-amber-900 flex items-center justify-center text-amber-300 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
              📔
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Keepsake Dedication
              </span>
              <h3 className="font-serif font-black text-2xl text-amber-100 mt-1">
                {dedication}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/40">
              <p className="font-serif italic text-sm md:text-base text-amber-200/90 leading-relaxed">
                "{message}"
              </p>
            </div>

            <p className="text-xs text-amber-400/80 font-mono">
              Handcrafted with unconditional love by {creatorName} for {recipientName}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
);
}
