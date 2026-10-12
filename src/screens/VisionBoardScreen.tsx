import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { sound } from '../lib/sound';
import { generateVisionBoardIdeas, VisionBoardIdea } from '../lib/ai';
import { BottomNav } from '../components/BottomNav';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Compass, Sparkles, Heart, Plus, Image as ImageIcon, CheckCircle2,
  Trash2, Wand2, Filter, Calendar, Star, ChevronLeft, RefreshCw,
  Camera, X, Lightbulb, Flame, BookmarkCheck, ArrowUpRight
} from 'lucide-react';

export interface VisionItem {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  creatorName: string;
  category: string;
  title: string;
  description?: string;
  imageUrl?: string;
  targetYear?: string;
  completed?: boolean;
  likes?: string[];
  createdAt: number;
  updatedAt: number;
}

const CATEGORIES = [
  'All',
  'Travel & Adventures',
  'Home & Sanctuary',
  'Life Milestones',
  'Personal Growth',
  'Fun & Quirky',
  'Financial & Career'
];

const PRESET_INSPIRATIONS: VisionBoardIdea[] = [
  {
    title: "Morning Oceanfront Balcony Coffee",
    description: "Sit in oversized robes listening to the waves crash as the sun paints the sky pastel orange.",
    category: "Travel & Adventures",
    targetYear: "Next Summer",
    suggestedEmoji: "🌅",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Cozy Plant-Filled Dream Kitchen",
    description: "Hang copper pans, bake sourdough bread together on Saturday mornings, and brew fresh pour-over coffee.",
    category: "Home & Sanctuary",
    targetYear: "2-3 Years",
    suggestedEmoji: "🏡",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Adopt a Golden Retriever Puppy",
    description: "Name him together, take him on long autumn hikes, and cuddle together on the couch.",
    category: "Life Milestones",
    targetYear: "Within 1 Year",
    suggestedEmoji: "🐕",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Northern Lights in a Glass Igloo",
    description: "Stay in Finnish Lapland holding warm cocoa under the dancing green aurora borealis.",
    category: "Travel & Adventures",
    targetYear: "5 Years",
    suggestedEmoji: "🌌",
    imageUrl: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80"
  }
];

export function VisionBoardScreen() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  const [items, setItems] = useState<VisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Travel & Adventures');
  const [targetYear, setTargetYear] = useState('Within 1 Year');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI Suggestions Drawer
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<VisionBoardIdea[]>(PRESET_INSPIRATIONS);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to Firestore collection
  useEffect(() => {
    if (!space?.id) return;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/visionBoard`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VisionItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setItems(list);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space.id}/visionBoard`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [space?.id]);

  // Request fresh AI vision ideas from AIRA
  const handleFetchAiIdeas = async (cat: string = selectedCategory) => {
    sound.playPop();
    setIsAiLoading(true);
    setShowAiDrawer(true);
    try {
      const existingTitles = items.map(i => i.title);
      const ideas = await generateVisionBoardIdeas(
        cat === 'All' ? 'Future Dreams & Goals' : cat,
        existingTitles,
        userData?.displayName || 'Partner 1',
        partnerData?.displayName || 'Partner 2'
      );
      if (ideas && ideas.length > 0) {
        setAiSuggestions(ideas);
      }
    } catch (e) {
      console.warn('Could not fetch AI ideas:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick accept AI idea into modal
  const handleAdoptAiIdea = (idea: VisionBoardIdea) => {
    sound.playChime();
    setTitle(idea.title);
    setDescription(idea.description);
    setCategory(idea.category || 'Travel & Adventures');
    setTargetYear(idea.targetYear || 'Within 1 Year');
    if (idea.imageUrl) setImageUrl(idea.imageUrl);
    setShowAiDrawer(false);
    setIsModalOpen(true);
  };

  // Convert uploaded image to compressed Base64 Data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    sound.playPop();
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setImageUrl(compressed);
        }
        setIsUploadingImage(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Create new Vision Board Card
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space?.id || !userData?.id || !title.trim() || isSaving) return;

    sound.playSuccess();
    setIsSaving(true);

    const newItemData = {
      coupleSpaceId: space.id,
      creatorId: userData.id,
      creatorName: userData.displayName || 'You',
      category,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      targetYear,
      completed: false,
      likes: [userData.id],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(db, `coupleSpaces/${space.id}/visionBoard`), {
        ...newItemData,
        id: 'temp'
      });
      await updateDoc(docRef, { id: docRef.id });

      confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/visionBoard`);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Completed Milestone
  const handleToggleCompleted = async (item: VisionItem) => {
    if (!space?.id) return;
    sound.playSuccess();
    if (!item.completed) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/visionBoard`, item.id), {
        completed: !item.completed,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/visionBoard`);
    }
  };

  // Toggle Love reaction
  const handleToggleLike = async (item: VisionItem) => {
    if (!space?.id || !userData?.id) return;
    sound.playPop();

    const currentLikes = item.likes || [];
    const hasLiked = currentLikes.includes(userData.id);
    const updatedLikes = hasLiked
      ? currentLikes.filter(id => id !== userData.id)
      : [...currentLikes, userData.id];

    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/visionBoard`, item.id), {
        likes: updatedLikes,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete card
  const handleDeleteItem = async (itemId: string) => {
    if (!space?.id) return;
    sound.playPop();
    try {
      await deleteDoc(doc(db, `coupleSpaces/${space.id}/visionBoard`, itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupleSpaces/${space.id}/visionBoard`);
    }
  };

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(i => i.category === selectedCategory);

  const completedCount = items.filter(i => i.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-purple-50/50 pb-28 text-gray-800">
      {/* Top Banner Navigation */}
      <div className="pt-6 px-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            onClick={() => sound.playPop()}
            className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100/80 rounded-full text-rose-700 text-xs font-bold border border-rose-200 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-rose-600" />
            <span>Shared Future & Dreams</span>
          </div>

          <button
            onClick={() => handleFetchAiIdeas(selectedCategory)}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all"
            title="Ask AIRA for new shared vision ideas"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AIRA Ideas</span>
          </button>
        </div>

        {/* Hero Banner Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-rose-200/90 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white p-5.5">
          <div className="relative z-10 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-block">
              ✨ Our Shared Vision Board
            </span>
            <h1 className="text-2xl font-serif font-black leading-tight text-white drop-shadow-sm">
              Dreams, Goals & Plans for Two
            </h1>
            <p className="text-xs text-rose-100 max-w-xs leading-relaxed">
              Curate the life you are building together. Pin photos, write memories in the making, and let AIRA spark new adventures.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] font-bold bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{items.length} Dreams Pinned</span>
              </span>
              <span className="text-[11px] font-bold bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{completedCount} Manifested</span>
              </span>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 mt-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { sound.playPop(); setSelectedCategory(cat); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-300/40'
                  : 'bg-white/80 hover:bg-white text-gray-600 border border-rose-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Add Button Bar */}
        <div className="flex items-center justify-between mt-1 pt-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {selectedCategory === 'All' ? 'All Shared Visions' : selectedCategory} ({filteredItems.length})
          </span>

          <button
            onClick={() => { sound.playPop(); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-400/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dream</span>
          </button>
        </div>
      </div>

      {/* Vision Board Grid */}
      <div className="px-4 space-y-3.5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-rose-500 animate-spin" />
            <p className="text-xs font-semibold text-gray-400">Loading your dreams together...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white/90 rounded-3xl p-8 border border-rose-100 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-3xl">
              🕊️
            </div>
            <h3 className="font-serif font-bold text-base text-gray-900">Your Vision Board is Ready</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Start pinning your shared bucket lists, future home aesthetics, romantic trips, or wedding ideas!
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                + Pin Our First Goal
              </button>
              <button
                onClick={() => handleFetchAiIdeas()}
                className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 active:scale-95 transition-all flex items-center gap-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Ask AIRA</span>
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-3xl border transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col ${
                  item.completed ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-100'
                }`}
              >
                {/* Visual Header Image if attached */}
                {item.imageUrl && (
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100 group">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Timeline Pill */}
                    {item.targetYear && (
                      <span className="absolute bottom-2.5 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-gray-900 shadow-2xs">
                        {item.targetYear}
                      </span>
                    )}

                    {/* Completed Overlay Badge */}
                    {item.completed && (
                      <span className="absolute top-2.5 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Manifested!
                      </span>
                    )}
                  </div>
                )}

                {/* Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {!item.imageUrl && item.targetYear && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.targetYear}
                        </span>
                      )}
                    </div>

                    <h3 className={`font-bold text-sm text-gray-900 leading-snug ${
                      item.completed ? 'line-through text-gray-500' : ''
                    }`}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Creator info, Likes, Completion, Delete */}
                  <div className="pt-2 border-t border-rose-50 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleLike(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-xl transition-all ${
                          item.likes?.includes(userData?.id || '')
                            ? 'text-rose-600 bg-rose-50 font-bold'
                            : 'text-gray-400 hover:text-rose-500'
                        }`}
                        title="Love this goal"
                      >
                        <Heart className={`w-3.5 h-3.5 ${
                          item.likes?.includes(userData?.id || '') ? 'fill-current' : ''
                        }`} />
                        <span>{item.likes?.length || 0}</span>
                      </button>

                      <span className="text-[10px] text-gray-400">
                        Added by {item.creatorId === userData?.id ? 'You' : item.creatorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCompleted(item)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                          item.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700'
                        }`}
                      >
                        {item.completed ? 'Completed ✨' : 'Mark Achieved'}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-lg text-gray-300 hover:text-rose-500 transition-colors"
                        title="Remove goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI Inspiration Drawer */}
      <AnimatePresence>
        {showAiDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
          >
            <motion.div
              initial={{ y: 80, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 80, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl border border-purple-100 max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">AIRA Future Vision Ideas</h3>
                    <p className="text-[11px] text-gray-400">Click any card to add to your board!</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFetchAiIdeas(selectedCategory)}
                    disabled={isAiLoading}
                    className="p-1.5 rounded-xl hover:bg-purple-50 text-purple-600 transition-colors disabled:opacity-40"
                    title="Generate more"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowAiDrawer(false)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isAiLoading ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-purple-500 animate-spin mx-auto" />
                  <p className="text-xs text-purple-700 font-semibold">AIRA is imagining romantic milestones for you two...</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aiSuggestions.map((idea, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAdoptAiIdea(idea)}
                      className="bg-purple-50/60 hover:bg-purple-50 p-3.5 rounded-2xl border border-purple-100 cursor-pointer transition-all active:scale-[0.98] group flex gap-3 items-center"
                    >
                      {idea.imageUrl ? (
                        <img
                          src={idea.imageUrl}
                          alt={idea.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-purple-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-purple-200/60 text-2xl flex items-center justify-center shrink-0">
                          {idea.suggestedEmoji || '💫'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full">
                            {idea.category}
                          </span>
                          <span className="text-[10px] text-purple-600 font-semibold">
                            {idea.targetYear}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                          {idea.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {idea.description}
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-purple-200/50 group-hover:bg-purple-600 group-hover:text-white text-purple-600 flex items-center justify-center shrink-0 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Pin Goal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
          >
            <motion.div
              initial={{ y: 80, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 80, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    📌
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Pin a New Vision</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-3.5">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Dream or Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Move into a sunlit loft with a puppy"
                    className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                {/* Category & Timeline */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Target Timeline
                    </label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      <option value="This Month">This Month</option>
                      <option value="Within 1 Year">Within 1 Year</option>
                      <option value="2-3 Years">2-3 Years</option>
                      <option value="5 Years">5 Years</option>
                      <option value="Someday Dream">Someday Dream</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Details & Notes for Each Other
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will this feel like when we achieve it together?"
                    className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                  />
                </div>

                {/* Image Upload or Web Link */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Vision Photo / Moodboard Image
                  </label>
                  
                  {imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden h-36 border border-rose-200 group">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full py-3 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-rose-600 bg-rose-50/40 hover:bg-rose-50 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isUploadingImage ? 'Compressing Image...' : 'Upload Photo from Device'}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 shrink-0">or Paste Image URL:</span>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-2.5 py-1.5 bg-rose-50/30 border border-rose-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!title.trim() || isSaving}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold text-xs rounded-2xl shadow-md disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>{isSaving ? 'Pinning to Board...' : 'Pin to Our Vision Board'}</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
