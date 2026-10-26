import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, X, ZoomIn, Calendar, Sparkles, ChevronLeft, ChevronRight, 
  Heart, Image as ImageIcon, Volume2, VolumeX, Eye, Box, Layers
} from 'lucide-react';
import { DigitalGift, GiftPhotoItem } from '../../types/digitalGifts';
import { sound } from '../../lib/sound';
import { Loveverse3DViewer } from './3d/Loveverse3DViewer';
import { ExperienceErrorBoundary } from './3d/ExperienceErrorBoundary';

interface Props {
  gift: DigitalGift;
  isPreview?: boolean;
  onClose?: () => void;
}

export function OurMuseumExperience({ gift, isPreview, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedPhoto, setSelectedPhoto] = useState<GiftPhotoItem | null>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const photos = gift.content?.photos?.length
    ? gift.content.photos
    : [
        {
          id: 'demo_1',
          url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
          caption: 'Where our story first began to blossom.',
          date: 'Our First Spark',
          order: 1
        },
        {
          id: 'demo_2',
          url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
          caption: 'Laughing until twilight under the open summer sky.',
          date: 'Summer of Love',
          order: 2
        },
        {
          id: 'demo_3',
          url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
          caption: 'Quiet mornings and promises whispered in the dark.',
          date: 'Forever Season',
          order: 3
        }
      ];

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'My Beloved';
  const dedication = gift.content?.dedication || 'Dedicated to the moments, laughter, and promises that shape our journey.';
  const message = gift.content?.message || 'Every portrait in this gallery holds an irreplaceable piece of my heart.';

  // Split photos into "Museum Wings / Rooms" (6 per room for clean pagination)
  const pageSize = 6;
  const totalRooms = Math.ceil(photos.length / pageSize) || 1;
  const currentRoomPhotos = photos.slice(activeRoomIndex * pageSize, (activeRoomIndex + 1) * pageSize);

  // Soft classical harmonic synth using Web Audio API
  const toggleAudio = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      sound.playSuccess();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 text-stone-100 overflow-hidden flex flex-col select-none">
      {/* Background Museum Architecture Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-900 to-black" />

      {/* Top Museum Nav Bar */}
      <header className="relative z-30 px-4 py-3.5 border-b border-amber-900/40 bg-black/60 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-amber-500/20">
            🏛️
          </div>
          <div>
            <h1 className="text-sm md:text-base font-serif font-black tracking-tight text-amber-100">
              The Museum of Us
            </h1>
            <p className="text-[10px] text-amber-400/80 font-mono uppercase tracking-widest">
              {viewMode === '3d'
                ? `3D Virtual Hall • ${photos.length} Masterpieces`
                : `Wing ${activeRoomIndex + 1} of ${totalRooms} • ${photos.length} Masterpieces`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-amber-200 border border-stone-700 transition-all text-xs flex items-center gap-1.5 active:scale-95"
            title="Toggle between 3D Hall and 2D Gallery"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden sm:inline text-[11px] font-mono">
              {viewMode === '3d' ? '3D Hall' : '2D Gallery'}
            </span>
          </button>

          <button
            onClick={toggleAudio}
            className="p-2.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-amber-200 border border-stone-700 transition-all text-xs flex items-center gap-1.5"
            title="Toggle Ambient Audio"
          >
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-60" />
            )}
            <span className="hidden sm:inline text-[11px] font-mono">
              {isPlayingAudio ? 'Audio On' : 'Audio'}
            </span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all active:scale-95"
              title="Leave Museum"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 3D vs 2D Experience Body */}
      {viewMode === '3d' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <ExperienceErrorBoundary
            fallbackTo2D={() => setViewMode('2d')}
            experienceName="The Museum of Us"
          >
            <Loveverse3DViewer
              gift={gift}
              onInteract={(action, payload) => {
                if (action === 'select_photo' && payload?.photo) {
                  sound.playSuccess();
                  setSelectedPhoto(payload.photo);
                }
              }}
              onSwitchTo2D={() => setViewMode('2d')}
            />
          </ExperienceErrorBoundary>
        </div>
      ) : (
        /* Main Museum Hall 2D */
        <main className="relative z-20 flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-10 overflow-y-auto">
        {/* Entrance Brass Dedication Plaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-2xl mx-auto rounded-3xl p-6 md:p-8 bg-gradient-to-br from-amber-900/60 via-stone-900 to-amber-950/80 border-2 border-amber-500/40 shadow-2xl text-center space-y-3"
        >
          {/* Subtle Wall Spotlight */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-400/20 blur-2xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Permanent Couple Collection
          </div>

          <h2 className="font-serif font-black text-2xl md:text-3xl text-amber-200 tracking-tight">
            Curated by {creatorName} for {recipientName}
          </h2>

          <p className="font-serif text-sm md:text-base text-amber-100/90 italic leading-relaxed max-w-lg mx-auto">
            "{dedication}"
          </p>

          {message && (
            <p className="text-xs text-stone-300 pt-2 border-t border-amber-900/40 font-sans leading-relaxed">
              {message}
            </p>
          )}
        </motion.div>

        {/* Gallery Walls Section */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-800">
            <div>
              <h3 className="text-base font-serif font-bold text-amber-100">
                Gallery Exhibit: Moments in Time
              </h3>
              <p className="text-xs text-stone-400">
                Tap any artwork to inspect curatorial notes
              </p>
            </div>

            {totalRooms > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={activeRoomIndex === 0}
                  onClick={() => {
                    sound.tap();
                    setActiveRoomIndex(prev => Math.max(0, prev - 1));
                  }}
                  className="p-2 rounded-xl bg-stone-800 disabled:opacity-30 border border-stone-700 text-stone-200 hover:bg-stone-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-amber-400">
                  {activeRoomIndex + 1}/{totalRooms}
                </span>
                <button
                  disabled={activeRoomIndex >= totalRooms - 1}
                  onClick={() => {
                    sound.tap();
                    setActiveRoomIndex(prev => Math.min(totalRooms - 1, prev + 1));
                  }}
                  className="p-2 rounded-xl bg-stone-800 disabled:opacity-30 border border-stone-700 text-stone-200 hover:bg-stone-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Framed Photos Grid (2 to 3 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {currentRoomPhotos.map((photo, index) => (
              <motion.div
                key={photo.id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => {
                  sound.playPop();
                  setSelectedPhoto(photo);
                }}
                className="group relative cursor-pointer flex flex-col items-center"
              >
                {/* Museum Spotlight Over Each Frame */}
                <div className="w-24 h-6 bg-amber-400/15 blur-lg rounded-full mb-1 group-hover:bg-amber-400/30 transition-colors" />

                {/* Luxurious Museum Frame */}
                <div className="relative w-full aspect-4/5 p-3 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-900 to-yellow-600 shadow-[0_12px_30px_rgba(0,0,0,0.8)] border border-amber-500/40 group-hover:scale-[1.02] transition-transform duration-300">
                  {/* Passe-partout White Matting */}
                  <div className="w-full h-full bg-[#FAF7F2] p-2.5 rounded-xl shadow-inner flex flex-col">
                    <div className="relative w-full flex-1 rounded-lg overflow-hidden bg-stone-200">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Couple Exhibit'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>

                    {/* Museum Label at Bottom of Matting */}
                    <div className="pt-2 text-center">
                      <p className="text-[11px] font-serif font-black text-stone-900 truncate">
                        {photo.caption || 'Exhibit #' + (activeRoomIndex * pageSize + index + 1)}
                      </p>
                      {photo.date && (
                        <p className="text-[9px] font-mono uppercase text-stone-500">
                          {photo.date}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wall Brass Plaque Beneath Frame */}
                <div className="mt-3 px-3 py-1 rounded-md bg-stone-900 border border-amber-900/60 shadow-md flex items-center gap-1.5 text-stone-300">
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-mono text-amber-200/90">
                    Exhibit {(activeRoomIndex * pageSize) + index + 1}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    )}

      {/* Museum Close-Up Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full bg-stone-900 rounded-3xl overflow-hidden border border-amber-600/40 shadow-2xl flex flex-col md:flex-row max-h-[88vh]"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Master Artwork View */}
              <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || 'Exhibition Artwork'}
                  className="w-full h-full max-h-[60vh] md:max-h-[75vh] object-contain rounded-xl"
                />
              </div>

              {/* Curatorial Info Plaque */}
              <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-800 bg-stone-950">
                <div className="space-y-4">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono uppercase tracking-widest border border-amber-500/20">
                    Curator’s Note
                  </div>

                  <h3 className="font-serif font-black text-xl text-amber-100 leading-tight">
                    {selectedPhoto.caption || 'Untitled Masterpiece'}
                  </h3>

                  {selectedPhoto.date && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedPhoto.date}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300 font-serif leading-relaxed italic">
                    "Preserved in our permanent archives as an eternal testament of love, trust, and shared joy."
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Loveverse Museum Archives</span>
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
