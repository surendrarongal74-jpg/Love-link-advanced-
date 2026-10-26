import React, { useState, useEffect, useRef } from 'react';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import { 
  Camera, Calendar, PlayCircle, Sparkles, Plus, Image as ImageIcon, 
  Video as VideoIcon, Heart, Grid, Clock, ChevronLeft, ChevronRight, X, 
  Maximize2, Share2, Volume2, Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeFormat, parseSafeDate } from '../lib/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { sound } from '../lib/sound';
import { LoveButton } from '../components/ui/LoveButton';
import { LoveCard } from '../components/ui/LoveCard';
import confetti from 'canvas-confetti';

const DB_NAME = 'MemoriesStore';
const DB_VERSION = 1;
const STORE_NAME = 'media';

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

type ViewMode = 'grid' | 'timeline';

interface MemoryItem {
  id: string | number;
  source: 'local' | 'cloud';
  title?: string;
  content?: string;
  date: string;
  type: string;
  url?: string;
  file?: File;
}

export function MemoriesScreen() {
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  const { theme, isDark } = useTheme();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<MemoryItem | null>(null);

  // Story mode state
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Create Memory Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Load IndexedDB media
  const loadLocalMedia = async () => {
    if (!space?.id) return;
    try {
      const dbInstance = await openDB();
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const spaceMedia = (req.result || [])
          .filter((item: any) => item.spaceId === space.id)
          .map((item: any) => ({
            id: `local-${item.id}`,
            source: 'local' as const,
            title: item.title || 'Precious Moment',
            content: item.content || '',
            date: item.date || new Date().toISOString(),
            type: item.type || (item.file?.type ? item.file.type : 'image/jpeg'),
            file: item.file,
            url: item.file ? URL.createObjectURL(item.file) : undefined
          }));
        setLocalMedia(spaceMedia);
      };
    } catch (e) {
      console.error('Error loading local media', e);
    }
  };

  const [localMedia, setLocalMedia] = useState<MemoryItem[]>([]);

  // Fetch Firestore memories
  useEffect(() => {
    loadLocalMedia();
  }, [space?.id]);

  useEffect(() => {
    if (!space?.id) return;
    const fetchMemories = async () => {
      try {
        const snap = await getDocs(collection(db, `coupleSpaces/${space.id}/memories`));
        const allMemories = snap.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            source: 'cloud' as const,
            title: d.title || 'Couple Memory',
            content: d.content || '',
            date: d.date || d.createdAt || new Date().toISOString(),
            type: d.mediaType || (d.photoUrl ? 'image/jpeg' : d.mediaUrl?.includes('.mp4') ? 'video/mp4' : 'text'),
            url: d.photoUrl || d.mediaUrl
          };
        });
        const filtered = allMemories.filter((m: any) => m.type !== 'daily_note' && m.type !== 'surprise');
        setCloudMemories(filtered);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, `coupleSpaces/${space.id}/memories`);
      }
    };
    fetchMemories();
  }, [space?.id]);

  const [cloudMemories, setCloudMemories] = useState<MemoryItem[]>([]);

  // Merge and sort all items chronologically (newest first)
  const combinedItems = React.useMemo(() => {
    const list = [...localMedia, ...cloudMemories];
    list.sort((a, b) => parseSafeDate(b.date).getTime() - parseSafeDate(a.date).getTime());
    return list;
  }, [localMedia, cloudMemories]);

  // Story image slideshow
  const visualItems = combinedItems.filter(m => m.type.startsWith('image/') || m.url || m.file);

  useEffect(() => {
    let interval: any;
    if (isPlayingStory && visualItems.length > 0) {
      interval = setInterval(() => {
        setCurrentStoryIndex(prev => (prev + 1) % visualItems.length);
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [isPlayingStory, visualItems.length]);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !space?.id) return;
    const file = e.target.files[0];
    sound.playPop();
    try {
      const dbInstance = await openDB();
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add({
        spaceId: space.id,
        file,
        type: file.type,
        date: new Date().toISOString(),
        title: 'Instant Snapshot'
      });
      tx.oncomplete = () => {
        loadLocalMedia();
        confetti({ particleCount: 40, spread: 60 });
        sound.playSuccess();
      };
    } catch (err) {
      console.error('Error saving file', err);
    }
  };

  const handleSaveNewMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space?.id) return;
    setIsSaving(true);
    sound.playPop();

    try {
      if (selectedFile) {
        const dbInstance = await openDB();
        const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.add({
          spaceId: space.id,
          file: selectedFile,
          type: selectedFile.type,
          date: newDate ? new Date(newDate).toISOString() : new Date().toISOString(),
          title: newTitle.trim() || 'Sweet Memory',
          content: newContent.trim()
        });
        tx.oncomplete = () => {
          loadLocalMedia();
        };
      } else if (newContent.trim() || newTitle.trim()) {
        // Text memory in Firestore
        await addDoc(collection(db, `coupleSpaces/${space.id}/memories`), {
          title: newTitle.trim() || 'Romantic Note',
          content: newContent.trim(),
          date: newDate ? new Date(newDate).toISOString() : new Date().toISOString(),
          createdAt: serverTimestamp(),
          authorId: userData?.id || 'unknown'
        });
        // re-fetch cloud memories
        const snap = await getDocs(collection(db, `coupleSpaces/${space.id}/memories`));
        const allMemories = snap.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            source: 'cloud' as const,
            title: d.title || 'Couple Memory',
            content: d.content || '',
            date: d.date || d.createdAt || new Date().toISOString(),
            type: d.mediaType || 'text',
            url: d.photoUrl || d.mediaUrl
          };
        });
        setCloudMemories(allMemories);
      }

      confetti({ particleCount: 50, spread: 70 });
      sound.playSuccess();
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
    } catch (err) {
      console.error('Error saving memory', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative pb-28 md:pb-16 overflow-x-hidden transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.screenBg,
        color: theme.colors.textMain
      }}
    >
      {/* ======================================================== */}
      {/* FULLSCREEN LIVING STORY PLAYBACK                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isPlayingStory && visualItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col justify-between items-center select-none"
          >
            {/* Top Progress Bars */}
            <div className="w-full max-w-lg px-4 pt-6 z-50 flex items-center gap-1.5">
              {visualItems.map((_, idx) => (
                <div 
                  key={idx}
                  className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
                >
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: idx === currentStoryIndex ? '100%' : idx < currentStoryIndex ? '100%' : '0%' 
                    }}
                    transition={{ 
                      duration: idx === currentStoryIndex ? 4.5 : 0, 
                      ease: "linear" 
                    }}
                    className="h-full bg-white shadow-xs"
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="w-full max-w-lg px-4 pt-3 flex items-center justify-between text-white z-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-500/80 flex items-center justify-center font-bold text-xs shadow-md">
                  ❤️
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm leading-none">
                    {visualItems[currentStoryIndex]?.title || 'Our Love Story'}
                  </h4>
                  <span className="text-[10px] text-white/70">
                    {safeFormat(visualItems[currentStoryIndex]?.date, 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => {
                  sound.playPop();
                  setIsPlayingStory(false);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                title="Exit Story"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Artwork */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-4">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentStoryIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full h-full flex items-center justify-center relative"
                >
                  {/* Atmospheric Glow backdrop */}
                  {visualItems[currentStoryIndex]?.url && (
                    <img 
                      src={visualItems[currentStoryIndex].url}
                      alt="Story glow" 
                      className="w-full h-full object-cover blur-3xl opacity-25 absolute inset-0 scale-125"
                    />
                  )}

                  {visualItems[currentStoryIndex]?.type?.startsWith('video/') ? (
                    <video 
                      src={visualItems[currentStoryIndex].url}
                      controls 
                      autoPlay 
                      className="max-h-[75vh] w-auto max-w-full rounded-3xl object-contain drop-shadow-2xl z-10"
                    />
                  ) : (
                    <img 
                      src={visualItems[currentStoryIndex]?.url} 
                      alt="Memory Slide" 
                      className="max-h-[75vh] w-auto max-w-full rounded-3xl object-contain drop-shadow-2xl z-10"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next Click Zones */}
              <button 
                onClick={() => {
                  sound.playPop();
                  setCurrentStoryIndex(prev => (prev - 1 + visualItems.length) % visualItems.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-24 flex items-center justify-start text-white/40 hover:text-white z-40 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={() => {
                  sound.playPop();
                  setCurrentStoryIndex(prev => (prev + 1) % visualItems.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-24 flex items-center justify-end text-white/40 hover:text-white z-40 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Story Caption Footer */}
            {visualItems[currentStoryIndex]?.content && (
              <div className="w-full max-w-md px-6 pb-10 text-center z-50">
                <motion.p 
                  key={`cap-${currentStoryIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white text-sm font-serif italic drop-shadow-md bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10"
                >
                  "{visualItems[currentStoryIndex].content}"
                </motion.p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* STICKY TOP RESPONSIVE HEADER                             */}
      {/* ======================================================== */}
      <header 
        className="sticky top-0 z-30 px-4 md:px-8 py-3.5 backdrop-blur-2xl border-b transition-colors duration-500"
        style={{
          backgroundColor: theme.colors.headerBg,
          borderColor: theme.colors.cardBorder
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-xl md:text-2xl tracking-tight">
                Scrapbook & Memories
              </h1>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: theme.colors.primarySoft,
                  color: theme.colors.primary
                }}
              >
                {combinedItems.length} Moments
              </span>
            </div>
            <p className="text-xs opacity-70 font-medium">
              Encrypted timeline of all your cherished milestones
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div 
              className="p-1 rounded-xl flex items-center border"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              <button
                onClick={() => {
                  sound.playPop();
                  setViewMode('grid');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-rose-500 text-white shadow-xs' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Polaroid Scrapbook Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  sound.playPop();
                  setViewMode('timeline');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-rose-500 text-white shadow-xs' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Chronological Timeline"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>

            {/* Play Slideshow Button */}
            {visualItems.length > 0 && (
              <LoveButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  sound.playHeartbeat();
                  setCurrentStoryIndex(0);
                  setIsPlayingStory(true);
                }}
                icon={PlayCircle}
                className="hidden sm:inline-flex"
              >
                Play Story
              </LoveButton>
            )}

            {/* Add Memory Button */}
            <LoveButton
              variant="primary"
              size="sm"
              onClick={() => {
                sound.playPop();
                setIsCreateModalOpen(true);
              }}
              icon={Plus}
            >
              Add Memory
            </LoveButton>

            {/* Hidden file upload for camera snap */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*,audio/*"
              onChange={handleQuickUpload} 
            />
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ======================================================== */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Banner Bar */}
        <div 
          className="rounded-3xl p-4 md:p-5 border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: theme.colors.primarySoft }}
            >
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm md:text-base leading-tight">
                Our Living Love Archive
              </h3>
              <p className="text-xs opacity-75 mt-0.5">
                Every photo, song snippet, and note is secured privately in your couple space.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder,
                color: theme.colors.primary
              }}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Quick Snap</span>
            </button>
            {visualItems.length > 0 && (
              <button
                onClick={() => {
                  sound.playHeartbeat();
                  setCurrentStoryIndex(0);
                  setIsPlayingStory(true);
                }}
                className="sm:hidden px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 shadow-xs"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Play</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {combinedItems.length === 0 && (
          <LoveCard className="p-12 text-center max-w-md mx-auto space-y-4">
            <div 
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner"
              style={{ backgroundColor: theme.colors.primarySoft }}
            >
              <Calendar className="w-8 h-8 text-rose-500 opacity-80" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg">No Memories Yet</h3>
              <p className="text-xs opacity-75 mt-1 leading-relaxed">
                Begin your couple journey by capturing your first anniversary, first date photo, or a sweet whispered memory.
              </p>
            </div>
            <LoveButton
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
              className="mx-auto"
            >
              Capture First Moment
            </LoveButton>
          </LoveCard>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 1: POLAROID SCRAPBOOK GRID                     */}
        {/* ======================================================== */}
        {viewMode === 'grid' && combinedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {combinedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className="group relative"
              >
                <div 
                  className="rounded-3xl p-3 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-full relative overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.cardBorder,
                    boxShadow: theme.colors.cardShadow
                  }}
                >
                  {/* Decorative Washi Tape style on top */}
                  <div className="w-14 h-3 bg-rose-200/50 backdrop-blur-xs rounded-xs mx-auto -mt-2 mb-2 shadow-2xs rotate-1" />

                  {/* Media Content */}
                  {item.url || item.file ? (
                    <div 
                      onClick={() => {
                        sound.playPop();
                        setSelectedLightboxMedia(item);
                      }}
                      className="aspect-square w-full rounded-2xl overflow-hidden bg-rose-50/50 relative cursor-pointer group-hover:brightness-105 transition-all flex items-center justify-center border border-black/5"
                    >
                      {item.type.startsWith('video/') ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                          <video src={item.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-md">
                              <Film className="w-5 h-5 fill-rose-600" />
                            </div>
                          </div>
                        </div>
                      ) : item.type.startsWith('audio/') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600">
                          <Volume2 className="w-12 h-12 mb-2 animate-pulse" />
                          <audio src={item.url} controls className="w-full scale-90" />
                        </div>
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.title || 'Memory'} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      )}

                      <span className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ) : (
                    <div 
                      className="aspect-square w-full rounded-2xl p-4 flex flex-col justify-center items-center text-center border border-dashed"
                      style={{
                        backgroundColor: theme.colors.primarySoft,
                        borderColor: theme.colors.primary
                      }}
                    >
                      <Heart className="w-8 h-8 text-rose-500 fill-rose-500 mb-2 opacity-70" />
                      <p className="font-serif italic text-xs leading-relaxed line-clamp-4">
                        "{item.content}"
                      </p>
                    </div>
                  )}

                  {/* Caption & Metadata */}
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] opacity-60 mb-1 font-bold uppercase tracking-wider">
                        <span>{safeFormat(item.date, 'MMM d, yyyy')}</span>
                        {item.source === 'local' && (
                          <span className="text-rose-500">Device Vault</span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-xs leading-tight line-clamp-1">
                        {item.title}
                      </h4>

                      {item.content && (
                        <p className="text-[11px] opacity-75 mt-1 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 2: CHRONOLOGICAL ROMANTIC TIMELINE              */}
        {/* ======================================================== */}
        {viewMode === 'timeline' && combinedItems.length > 0 && (
          <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-rose-400 before:via-pink-300 before:to-transparent">
            {combinedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="relative group"
              >
                {/* Timeline Pulsing Node */}
                <div 
                  className="absolute -left-[27px] md:-left-[35px] top-4 w-6 h-6 rounded-full border-4 flex items-center justify-center shadow-xs"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.screenBg
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                <div 
                  className="rounded-3xl p-4 md:p-6 border transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.cardBorder,
                    boxShadow: theme.colors.cardShadow
                  }}
                >
                  <div className="flex-1 space-y-2">
                    <span 
                      className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block"
                      style={{
                        backgroundColor: theme.colors.primarySoft,
                        color: theme.colors.primary
                      }}
                    >
                      {safeFormat(item.date, 'MMMM d, yyyy')}
                    </span>
                    <h3 className="font-serif font-black text-base md:text-lg">
                      {item.title}
                    </h3>
                    {item.content && (
                      <p className="text-xs md:text-sm opacity-80 leading-relaxed font-sans">
                        {item.content}
                      </p>
                    )}
                  </div>

                  {item.url && (
                    <div 
                      onClick={() => {
                        sound.playPop();
                        setSelectedLightboxMedia(item);
                      }}
                      className="w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-rose-50 shrink-0 cursor-pointer relative group-hover:scale-[1.02] transition-transform"
                    >
                      {item.type.startsWith('video/') ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* LIGHTBOX VIEWER MODAL                                    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedLightboxMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4"
          >
            <button 
              onClick={() => setSelectedLightboxMedia(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-3xl w-full flex flex-col items-center">
              {selectedLightboxMedia.type.startsWith('video/') ? (
                <video 
                  src={selectedLightboxMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl" 
                />
              ) : selectedLightboxMedia.url ? (
                <img 
                  src={selectedLightboxMedia.url} 
                  alt={selectedLightboxMedia.title} 
                  className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl object-contain" 
                />
              ) : (
                <div className="bg-white p-8 rounded-3xl text-center max-w-md">
                  <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <h3 className="font-serif font-black text-xl mb-2">{selectedLightboxMedia.title}</h3>
                  <p className="text-gray-700">{selectedLightboxMedia.content}</p>
                </div>
              )}

              <div className="mt-4 text-center text-white">
                <h4 className="font-serif font-bold text-base">{selectedLightboxMedia.title}</h4>
                <p className="text-xs text-white/70">{safeFormat(selectedLightboxMedia.date, 'MMMM d, yyyy')}</p>
                {selectedLightboxMedia.content && (
                  <p className="text-xs text-white/90 italic mt-1 max-w-md">{selectedLightboxMedia.content}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* CREATE MEMORY MODAL                                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: theme.colors.cardBg,
                color: theme.colors.textMain,
                borderColor: theme.colors.cardBorder
              }}
            >
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primarySoft }}
                >
                  <Sparkles className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg leading-none">
                    Capture New Memory
                  </h3>
                  <span className="text-[11px] opacity-70">
                    Add photos, notes, or milestones to your romantic timeline
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveNewMemory} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold block mb-1">Moment Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Starry Night Walk, First Trip Together..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-hidden transition-colors"
                    style={{
                      backgroundColor: theme.colors.screenBg,
                      borderColor: theme.colors.cardBorder,
                      color: theme.colors.textMain
                    }}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-bold block mb-1">Date of Moment</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-hidden transition-colors"
                    style={{
                      backgroundColor: theme.colors.screenBg,
                      borderColor: theme.colors.cardBorder,
                      color: theme.colors.textMain
                    }}
                  />
                </div>

                {/* Love Note / Caption */}
                <div>
                  <label className="text-xs font-bold block mb-1">Whispered Note / Story</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="How did you feel in this moment? Write a sweet story..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-hidden resize-none transition-colors"
                    style={{
                      backgroundColor: theme.colors.screenBg,
                      borderColor: theme.colors.cardBorder,
                      color: theme.colors.textMain
                    }}
                  />
                </div>

                {/* Photo / Media Picker */}
                <div>
                  <label className="text-xs font-bold block mb-1">Attach Photo or Video</label>
                  <div 
                    onClick={() => modalFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer hover:border-rose-400 transition-colors flex flex-col items-center justify-center gap-2"
                    style={{
                      borderColor: theme.colors.cardBorder,
                      backgroundColor: theme.colors.primarySoft
                    }}
                  >
                    {filePreviewUrl ? (
                      <div className="relative">
                        <img 
                          src={filePreviewUrl} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-xl shadow-md" 
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setFilePreviewUrl(null);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-rose-500 opacity-80" />
                        <span className="text-xs font-medium">Click to select photo or video</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={modalFileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setSelectedFile(file);
                        setFilePreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                {/* Submit Button */}
                <LoveButton
                  type="submit"
                  disabled={isSaving || (!newTitle.trim() && !selectedFile && !newContent.trim())}
                  loading={isSaving}
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                >
                  Save to Our Scrapbook
                </LoveButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
