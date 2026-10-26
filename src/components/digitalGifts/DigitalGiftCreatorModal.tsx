import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, ChevronRight, ChevronLeft, Image as ImageIcon, 
  Eye, Check, Coins, Plus, Trash2, Heart, Share2, AlertCircle
} from 'lucide-react';
import { 
  DigitalGift, 
  DigitalGiftProductId, 
  DIGITAL_GIFT_PRODUCTS, 
  GiftPhotoItem, 
  DigitalGiftProductMeta 
} from '../../types/digitalGifts';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../../contexts/LoveCoinsContext';
import { createOrUpdateDigitalGift, generateShareToken, saveLocalDraft, clearLocalDraft } from '../../lib/digitalGiftsService';
import { compressImageFile } from '../../lib/imageCompressor';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { DigitalGiftExperienceRenderer } from './DigitalGiftExperienceRenderer';

interface Props {
  initialProductId?: DigitalGiftProductId;
  initialGift?: DigitalGift | null;
  isOpen: boolean;
  onClose: () => void;
  onGiftCreated?: (gift: DigitalGift) => void;
}

export function DigitalGiftCreatorModal({
  initialProductId = 'ever_tide',
  initialGift,
  isOpen,
  onClose,
  onGiftCreated
}: Props) {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { wallet, spendCoins } = useLoveCoins();

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<DigitalGiftProductId>(
    initialGift?.productId || initialProductId
  );

  const productMeta: DigitalGiftProductMeta = 
    DIGITAL_GIFT_PRODUCTS.find(p => p.id === selectedProductId) || DIGITAL_GIFT_PRODUCTS[0];

  // Wizard steps: 1: Product, 2: Personalize, 3: Photos/Chapters, 4: Theme & Sharing, 5: Review & Publish
  const [currentStep, setCurrentStep] = useState<number>(initialGift ? 2 : 1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Form Fields
  const [title, setTitle] = useState(initialGift?.title || productMeta.title);
  const [recipientName, setRecipientName] = useState(
    initialGift?.recipientName || partnerData?.displayName || 'My Beloved'
  );
  const [creatorName, setCreatorName] = useState(
    initialGift?.creatorName || userData?.displayName || 'Your Love'
  );
  const [message, setMessage] = useState(
    initialGift?.content?.message || productMeta.defaultContent.message || ''
  );
  const [question, setQuestion] = useState(
    initialGift?.content?.question || productMeta.defaultContent.question || ''
  );
  const [dedication, setDedication] = useState(
    initialGift?.content?.dedication || productMeta.defaultContent.dedication || ''
  );
  const [dateStr, setDateStr] = useState(
    initialGift?.content?.date || productMeta.defaultContent.date || ''
  );
  const [locationStr, setLocationStr] = useState(
    initialGift?.content?.location || productMeta.defaultContent.location || ''
  );
  const [selectedTheme, setSelectedTheme] = useState(
    initialGift?.theme || productMeta.themes[0].id
  );
  const [isPublicShare, setIsPublicShare] = useState(initialGift?.isPublicShare ?? true);
  const [photos, setPhotos] = useState<GiftPhotoItem[]>(
    initialGift?.content?.photos || productMeta.defaultContent.photos || []
  );

  // Answer Choices
  const [choices, setChoices] = useState<string[]>(
    initialGift?.content?.answerChoices || productMeta.defaultContent.answerChoices || [
      'Yes, forever and ever! 💖',
      'Always and unconditionally! ✨'
    ]
  );
  const [newChoiceInput, setNewChoiceInput] = useState('');

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Build the draft gift object for preview or saving
  const currentGiftObj: DigitalGift = {
    id: initialGift?.id || `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    coupleSpaceId: space?.id || 'demo_space',
    creatorId: userData?.id || 'demo_user',
    creatorName: creatorName.trim() || 'Your Love',
    recipientId: partnerData?.id || '',
    recipientName: recipientName.trim() || 'My Soulmate',
    productId: selectedProductId,
    title: title.trim() || productMeta.title,
    theme: selectedTheme,
    status: 'published',
    isPublicShare,
    shareToken: initialGift?.shareToken || generateShareToken(),
    content: {
      message: message.trim(),
      question: question.trim(),
      dedication: dedication.trim(),
      date: dateStr.trim(),
      location: locationStr.trim(),
      photos,
      answerChoices: choices,
      chapters: productMeta.defaultContent.chapters
    },
    cost: productMeta.coinCost,
    createdAt: initialGift?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  const handleSelectProduct = (id: DigitalGiftProductId) => {
    setSelectedProductId(id);
    const meta = DIGITAL_GIFT_PRODUCTS.find(p => p.id === id) || DIGITAL_GIFT_PRODUCTS[0];
    setTitle(meta.title);
    setSelectedTheme(meta.themes[0].id);
    setMessage(meta.defaultContent.message || '');
    setQuestion(meta.defaultContent.question || '');
    setDedication(meta.defaultContent.dedication || '');
    setDateStr(meta.defaultContent.date || '');
    setLocationStr(meta.defaultContent.location || '');
    setPhotos(meta.defaultContent.photos || []);
    setChoices(meta.defaultContent.answerChoices || ['Yes, forever! 💖', 'Always! ✨']);
    sound.tap();
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    setIsUploading(true);
    sound.tap();

    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.82
      });

      const newPhoto: GiftPhotoItem = {
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        url: compressedDataUrl,
        caption: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
        date: 'Precious Moment',
        order: photos.length + 1
      };

      setPhotos(prev => [...prev, newPhoto]);
      sound.playPop();
    } catch (err) {
      console.error('Error adding photo:', err);
      setErrorMessage('Could not process photo. Please choose a JPG or PNG.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    sound.pop();
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleAddChoice = () => {
    if (!newChoiceInput.trim()) return;
    setChoices(prev => [...prev, newChoiceInput.trim()]);
    setNewChoiceInput('');
    sound.tap();
  };

  const handleRemoveChoice = (index: number) => {
    sound.pop();
    setChoices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    const draft: DigitalGift = {
      ...currentGiftObj,
      status: 'draft'
    };
    saveLocalDraft(draft);
    sound.playSuccess();
    onClose();
  };

  const handlePublishGift = async () => {
    if (isSubmitting) return;
    setErrorMessage(null);

    // Coin check for premium experiences
    if (!productMeta.isFreeStarter && productMeta.coinCost > 0) {
      const balance = wallet?.balance ?? 50;
      if (balance < productMeta.coinCost) {
        setErrorMessage(
          `You need ${productMeta.coinCost} Love Coins to unlock this premium digital gift (Current balance: ${balance} coins). Complete daily quests to earn more coins!`
        );
        sound.pop();
        return;
      }

      // Spend coins
      const spendRes = await spendCoins(productMeta.id, 'digital_gift', productMeta.coinCost);
      if (!spendRes.success) {
        setErrorMessage(spendRes.error || 'Failed to unlock with Love Coins.');
        return;
      }
    }

    setIsSubmitting(true);
    sound.playHeartbeat();

    try {
      const res = await createOrUpdateDigitalGift(space?.id || 'demo_space', currentGiftObj);
      if (res.success) {
        clearLocalDraft(space?.id || 'demo_space', selectedProductId);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#F2A7BE', '#E8547A', '#FFF6F9', '#FFD1DC', '#F59E0B']
        });
        sound.playSuccess();
        if (onGiftCreated) onGiftCreated(currentGiftObj);
        onClose();
      } else {
        setErrorMessage(res.error || 'Could not publish digital gift. Please try again.');
      }
    } catch (err: any) {
      console.error('Error publishing gift:', err);
      setErrorMessage(err.message || 'An error occurred while creating your gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Live Preview Mode Overlay */}
      {isPreviewMode && (
        <div className="fixed inset-0 z-[120]">
          <DigitalGiftExperienceRenderer
            gift={currentGiftObj}
            isPreview={true}
            onClose={() => setIsPreviewMode(false)}
          />
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130]">
            <button
              onClick={() => setIsPreviewMode(false)}
              className="py-2.5 px-6 rounded-full bg-stone-900/90 text-white font-bold text-xs shadow-2xl border border-white/30 backdrop-blur-md flex items-center gap-2 hover:bg-black transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" /> Exit Preview & Continue Editing
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#FFF6F9] rounded-3xl shadow-2xl border-2 border-rose-200 overflow-hidden text-rose-950 flex flex-col max-h-[92vh]"
      >
        {/* Studio Header */}
        <div className="p-4 sm:p-5 border-b border-rose-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center text-xl shadow-md shadow-rose-300/40">
              {productMeta.icon}
            </div>
            <div>
              <h2 className="font-serif font-black text-base sm:text-lg text-rose-950 leading-tight">
                Gift Personalization Studio
              </h2>
              <div className="flex items-center gap-2 text-xs text-rose-600 font-medium">
                <span>Step {currentStep} of 4</span>
                <span>•</span>
                <span className="font-bold">{productMeta.title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewMode(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Preview Experience"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Preview</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="px-5 py-2.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {[
              { num: 1, label: 'Experience' },
              { num: 2, label: 'Message & Names' },
              { num: 3, label: 'Photos & Choices' },
              { num: 4, label: 'Theme & Publish' }
            ].map(s => (
              <button
                key={s.num}
                onClick={() => {
                  sound.tap();
                  setCurrentStep(s.num);
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  currentStep === s.num
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white/80 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                {s.num}. {s.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Coins className="w-3 h-3 text-amber-600" />
            <span>Balance: {wallet?.balance ?? 50} coins</span>
          </div>
        </div>

        {/* Error Notification Bar */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 font-bold text-xs">✕</button>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ================= STEP 1: SELECT EXPERIENCE ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg text-rose-950">
                  Select a Digital Gift Experience
                </h3>
                <p className="text-xs text-rose-700">
                  Choose from our 7 signature interactive worlds and animated letters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {DIGITAL_GIFT_PRODUCTS.map(p => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-50 border-rose-600 shadow-md ring-2 ring-rose-300'
                          : 'bg-white hover:bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-rose-100/80">{p.icon}</span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">
                            {p.categoryLabel}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-rose-950 mt-1 truncate">
                            {p.title}
                          </h4>
                          <p className="text-[11px] text-rose-800 line-clamp-2 mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-rose-500 font-mono">
                          {p.isFreeStarter ? 'Free Starter' : `${p.coinCost} Coins`}
                        </span>
                        {isSelected && (
                          <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                            Selected <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: PERSONALIZE NAMES & MESSAGE ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg text-rose-950">
                  Personalize the Details
                </h3>
                <p className="text-xs text-rose-700">
                  Tailor the names and messages that will appear in {productMeta.title}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Your Name / Sender Display
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    placeholder="Your nickname"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Recipient / Partner Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Partner's sweet nickname"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  Gift Experience Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. For My Favorite Person Under the Sun"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Dedication for Museum or Archive */}
              {(selectedProductId === 'our_museum' || selectedProductId === 'memory_archive') && (
                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Brass Plaque / Dedication Text
                  </label>
                  <input
                    type="text"
                    value={dedication}
                    onChange={e => setDedication(e.target.value)}
                    placeholder="Plaque dedication on entrance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              )}

              {/* Heartfelt Note / Letter Text */}
              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  Heartfelt Message or Love Letter
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your genuine feelings, sweet memories, or loving words..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              {/* Question to Ask */}
              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  Interactive Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. Will you always be my favorite person to watch sunsets with?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Date & Location for Paris Together */}
              {selectedProductId === 'paris_together' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Event / Rendezvous Date
                    </label>
                    <input
                      type="text"
                      value={dateStr}
                      onChange={e => setDateStr(e.target.value)}
                      placeholder="e.g. This Saturday • 7:30 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Romantic Location / Venue
                    </label>
                    <input
                      type="text"
                      value={locationStr}
                      onChange={e => setLocationStr(e.target.value)}
                      placeholder="e.g. Under the Golden Starlight"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: PHOTOS & ANSWER CHOICES ================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Photo Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-serif font-black text-base text-rose-950">
                      Couple Photographs ({photos.length})
                    </h3>
                    <p className="text-xs text-rose-700">
                      Upload photos to be framed in the museum, scrapbook, or letter.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isUploading ? 'Compressing...' : 'Add Photo'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAddPhoto}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {photos.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-rose-200 rounded-2xl text-center bg-white/60 hover:bg-white cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-rose-900">
                      Tap to upload your first couple photo
                    </p>
                    <p className="text-[11px] text-rose-500 mt-1">
                      Automatically optimized for fast mobile display
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative group rounded-xl overflow-hidden border border-rose-200 bg-white shadow-xs p-1"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-rose-50">
                          <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                        </div>
                        <input
                          type="text"
                          value={item.caption || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setPhotos(prev =>
                              prev.map(p => (p.id === item.id ? { ...p, caption: val } : p))
                            );
                          }}
                          placeholder="Caption..."
                          className="w-full mt-1 px-1.5 py-0.5 text-[11px] font-medium border-none outline-none text-rose-950 placeholder:text-rose-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(item.id)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 shadow-md"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Response Choices */}
              <div className="pt-4 border-t border-rose-200/70">
                <h3 className="font-serif font-black text-base text-rose-950 mb-1">
                  Recipient Answer Buttons
                </h3>
                <p className="text-xs text-rose-700 mb-3">
                  Buttons your partner can tap to respond to your romantic question.
                </p>

                <div className="space-y-2 mb-3">
                  {choices.map((choice, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-rose-200"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <input
                        type="text"
                        value={choice}
                        onChange={e => {
                          const val = e.target.value;
                          setChoices(prev => prev.map((c, i) => (i === idx ? val : c)));
                        }}
                        className="flex-1 text-xs font-semibold text-rose-950 outline-none bg-transparent"
                      />
                      {choices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(idx)}
                          className="text-rose-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {choices.length < 4 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChoiceInput}
                      onChange={e => setNewChoiceInput(e.target.value)}
                      placeholder="Add another sweet answer option..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChoice();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-xs font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddChoice}
                      className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 4: THEME & PUBLISH ================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif font-black text-lg text-rose-950">
                  Theme & Visual Styling
                </h3>
                <p className="text-xs text-rose-700">
                  Choose the atmospheric color palette for {productMeta.title}.
                </p>
              </div>

              {/* Theme Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {productMeta.themes.map(t => {
                  const isSelected = selectedTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTheme(t.id);
                        sound.tap();
                      }}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50 shadow-md ring-2 ring-rose-300'
                          : 'border-rose-200 bg-white hover:bg-rose-50/50'
                      }`}
                    >
                      <div
                        className={`w-full h-12 rounded-xl bg-gradient-to-r ${t.bgGradient} shadow-inner mb-2`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-950">{t.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sharing & Privacy Settings */}
              <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-rose-950">
                      Private Couple Space & Shareable Link
                    </h4>
                    <p className="text-[11px] text-rose-700">
                      Gifts always appear securely in your connected Couple Space.
                    </p>
                  </div>
                  <Share2 className="w-4 h-4 text-rose-500" />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-rose-900 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isPublicShare}
                    onChange={e => setIsPublicShare(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400"
                  />
                  <span>
                    Also generate an unguessable web link so partner can open this on any browser
                  </span>
                </label>
              </div>

              {/* Unlock Requirement Summary */}
              <div className="p-4 rounded-2xl bg-rose-100/60 border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-rose-950">
                  <span>Price / Unlock Cost:</span>
                  <span className="flex items-center gap-1 font-mono text-amber-800">
                    {productMeta.isFreeStarter ? (
                      <span className="text-emerald-700">Free Starter Experience</span>
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        {productMeta.coinCost} Love Coins
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Once published, this experience will be permanently saved in your shared Loveverse Gift History.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-rose-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setCurrentStep(prev => prev - 1);
                }}
                className="py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-800 font-bold text-xs flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-all"
              >
                Save as Draft
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className="py-2.5 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setCurrentStep(prev => prev + 1);
                }}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-300/40 transition-all active:scale-95"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublishGift}
                disabled={isSubmitting}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:brightness-105 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-400/50 transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Creating Gift...' : 'Create & Send Gift'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
