import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Type, 
  Smile, 
  Clock, 
  Send, 
  X, 
  Sparkles, 
  Trash2, 
  Check, 
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Flame,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { sound } from '../../lib/sound';
import { compressImageFile } from '../../lib/imageCompressor';

export interface QuickSnapData {
  id: string;
  coupleSpaceId: string;
  senderId: string;
  senderName: string;
  imageUrl: string; // compressed canvas image (base64)
  caption?: string;
  stickers?: { emoji: string; x: number; y: number; scale: number }[];
  durationMinutes: number; // e.g. 5, 15, 30, 60, 180, 720, 1440
  createdAt: number;
  expiresAt: number;
}

interface QuickSnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapSent?: () => void;
}

const STICKER_PALETTE = [
  '❤️', '💖', '🥰', '😘', '🔥', '✨', '👑', '💍', 
  '🧸', '💌', '🌸', '🌹', '💋', '👀', '🎉', '🌟'
];

const DURATION_OPTIONS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '3 hours', minutes: 180 },
  { label: '12 hours', minutes: 720 },
  { label: '24 hours', minutes: 1440 },
];

export const QuickSnapModal: React.FC<QuickSnapModalProps> = ({
  isOpen,
  onClose,
  onSnapSent
}) => {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  // Step: 'capture' | 'edit'
  const [step, setStep] = useState<'capture' | 'edit'>('capture');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Editing state
  const [caption, setCaption] = useState('');
  const [captionColor, setCaptionColor] = useState('#ffffff');
  const [captionBg, setCaptionBg] = useState(true);
  const [stickers, setStickers] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60); // default 1 hour
  const [isSending, setIsSending] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize camera when opened in capture mode
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (step === 'capture') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, step, facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(media);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err) {
      console.warn('Camera access error or unsupported:', err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const flipCamera = () => {
    sound.tap();
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture snapshot from live camera feed
  const handleSnap = () => {
    sound.tap();
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If using user facing camera, mirror it horizontally like a selfie
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedImage(dataUrl);
    stopCamera();
    setStep('edit');
  };

  // Upload or capture photo using fast client-side compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sound.tap();

    try {
      setIsCompressing(true);
      setErrorMessage(null);
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.82,
        outputFormat: 'image/jpeg'
      });
      setCapturedImage(compressedDataUrl);
      stopCamera();
      setStep('edit');
    } catch (err) {
      console.warn('Image processing error:', err);
      setErrorMessage('Could not process photo. Please choose another image.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRetake = () => {
    sound.pop();
    setCapturedImage(null);
    setCaption('');
    setStickers([]);
    setErrorMessage(null);
    setStep('capture');
  };

  const addSticker = (emoji: string) => {
    sound.pop();
    setStickers(prev => [
      ...prev,
      {
        id: `stk_${Date.now()}_${Math.random()}`,
        emoji,
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20
      }
    ]);
    setShowStickerPicker(false);
  };

  const removeSticker = (id: string) => {
    sound.pop();
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  // Bake caption and stickers into the final image
  const generateFinalImage = async (): Promise<string> => {
    if (!capturedImage) return '';

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(capturedImage);
          return;
        }

        // Draw original photo
        ctx.drawImage(img, 0, 0);

        // Render stickers
        stickers.forEach((stk) => {
          const posX = (stk.x / 100) * canvas.width;
          const posY = (stk.y / 100) * canvas.height;
          ctx.font = `${Math.floor(canvas.width * 0.12)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stk.emoji, posX, posY);
        });

        // Render caption overlay bar
        if (caption.trim()) {
          const barHeight = Math.floor(canvas.height * 0.12);
          const barY = canvas.height - barHeight - Math.floor(canvas.height * 0.08);

          if (captionBg) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(0, barY, canvas.width, barHeight);
          }

          ctx.fillStyle = captionColor;
          ctx.font = `bold ${Math.floor(canvas.width * 0.045)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(caption.trim(), canvas.width / 2, barY + barHeight / 2);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = capturedImage;
    });
  };

  // Send Snap to partner's Home Widget via Firestore
  const handleSendSnap = async () => {
    if (!space?.id || !userData?.id || isSending) return;
    setIsSending(true);
    sound.chime();

    try {
      const finalImgData = await generateFinalImage();
      const now = Date.now();
      const expiresAt = now + durationMinutes * 60 * 1000;

      const snapPayload: Record<string, any> = {
        id: `snap_${now}_${userData.id}`,
        coupleSpaceId: space.id,
        senderId: userData.id,
        senderName: userData.displayName?.split(' ')[0] || 'Partner',
        imageUrl: finalImgData,
        durationMinutes,
        createdAt: now,
        expiresAt,
      };

      if (caption && caption.trim().length > 0) {
        snapPayload.caption = caption.trim();
      }

      if (stickers && stickers.length > 0) {
        snapPayload.stickers = stickers.map(s => ({ emoji: s.emoji, x: s.x, y: s.y, scale: 1 }));
      }

      // Set directly as the active snap document for this couple space
      await setDoc(doc(db, `coupleSpaces/${space.id}/quickSnaps`, 'active'), snapPayload);

      sound.success();
      onSnapSent?.();
      handleClose();
    } catch (err) {
      console.error('Failed to send quick snap:', err);
      setErrorMessage('Could not deliver Quick Snap. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setStep('capture');
    setCapturedImage(null);
    setCaption('');
    setStickers([]);
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 md:p-6 text-white font-sans overflow-hidden">
      {/* Hidden file inputs: gallery vs camera capture */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="w-full max-w-md h-full md:h-auto md:max-h-[92vh] md:rounded-[2.5rem] bg-stone-950 md:border md:border-white/20 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Error banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 inset-x-4 z-40 bg-rose-600/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-lg border border-rose-300/40 flex items-center justify-between"
            >
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-80">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TOP BAR --- */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between z-20 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-300/30 flex items-center justify-center text-rose-300">
              <Zap className="w-4 h-4 fill-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Quick Snap Widget</h3>
              <p className="text-[10px] text-rose-300">
                Displays on {partnerData?.displayName?.split(' ')[0] || "Partner"}'s Home Screen
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-white/70 hover:text-white rounded-full bg-white/10 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- MAIN CAMERA / PREVIEW CANVAS AREA --- */}
        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden min-h-[300px]">
          {isCompressing && (
            <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-rose-200">Processing photo...</p>
            </div>
          )}

          {step === 'capture' ? (
            <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden relative bg-stone-900 border-2 border-white/20 shadow-2xl flex items-center justify-center">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-stone-400 gap-3">
                  <Camera className="w-12 h-12 text-rose-400" />
                  <p className="text-xs max-w-xs text-stone-300">
                    Snap live from your device camera or pick any favorite couple memory from your gallery!
                  </p>
                  <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choose From Gallery</span>
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition flex items-center gap-1.5 border border-white/20 active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* In-camera flip button */}
              {isCameraActive && (
                <button
                  onClick={flipCamera}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 active:scale-90 transition shadow-md"
                  title="Flip Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            /* --- EDITING CANVAS --- */
            <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden relative bg-black border-2 border-rose-300/40 shadow-2xl">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured Snap"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Draggable / Positioned Stickers Overlay */}
              {stickers.map((stk) => (
                <motion.div
                  key={stk.id}
                  drag
                  dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                  className="absolute text-5xl cursor-move select-none active:scale-125 transition-transform"
                  style={{ left: `${stk.x}%`, top: `${stk.y}%` }}
                  onDoubleClick={() => removeSticker(stk.id)}
                >
                  {stk.emoji}
                </motion.div>
              ))}

              {/* Caption Text Banner Overlay */}
              {caption.trim() && (
                <div 
                  className={`absolute bottom-6 inset-x-0 mx-3 py-2 px-3 rounded-xl text-center backdrop-blur-md transition-all ${
                    captionBg ? 'bg-black/60 border border-white/20' : ''
                  }`}
                >
                  <p 
                    className="text-sm font-bold tracking-wide drop-shadow-md"
                    style={{ color: captionColor }}
                  >
                    {caption}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- BOTTOM CONTROLS --- */}
        <div className="px-5 pb-6 pt-2 z-20 shrink-0 border-t border-white/10">
          {step === 'capture' ? (
            /* CAPTURE BUTTON BAR */
            <div className="flex items-center justify-around max-w-sm mx-auto">
              {/* Gallery Upload */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90 flex flex-col items-center gap-1"
                title="Pick photo from gallery"
              >
                <ImageIcon className="w-6 h-6" />
                <span className="text-[9px] font-semibold opacity-75">Gallery</span>
              </button>

              {/* Big Shutter Button */}
              {isCameraActive ? (
                <button
                  onClick={handleSnap}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 shadow-2xl active:scale-95 transition"
                  title="Snap photo"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 shadow-inner flex items-center justify-center">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 shadow-2xl active:scale-95 transition"
                  title="Take photo with camera"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 shadow-inner flex items-center justify-center">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                </button>
              )}

              {/* Native Camera or Flip */}
              {isCameraActive ? (
                <button
                  onClick={flipCamera}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90 flex flex-col items-center gap-1"
                  title="Flip camera"
                >
                  <FlipHorizontal className="w-6 h-6" />
                  <span className="text-[9px] font-semibold opacity-75">Flip</span>
                </button>
              ) : (
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90 flex flex-col items-center gap-1"
                  title="Take photo"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[9px] font-semibold opacity-75">Camera</span>
                </button>
              )}
            </div>
          ) : (
            /* EDIT & SEND CONTROLS */
            <div className="space-y-3 max-w-sm mx-auto">
              {/* Editing Tools Row */}
              <div className="flex items-center justify-between gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                {/* Caption input */}
                <div className="flex-1 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-rose-300 shrink-0" />
                  <input
                    type="text"
                    maxLength={60}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a loving caption..."
                    className="bg-transparent text-xs text-white placeholder-white/40 focus:outline-none w-full"
                  />
                </div>

                {/* Add Sticker Button */}
                <button
                  onClick={() => setShowStickerPicker(prev => !prev)}
                  className={`p-1.5 rounded-lg text-sm transition ${showStickerPicker ? 'bg-rose-500' : 'bg-white/10 hover:bg-white/20'}`}
                  title="Add Stickers"
                >
                  🥰
                </button>

                {/* Text Color / Bg Toggle */}
                <button
                  onClick={() => setCaptionBg(prev => !prev)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
                  title="Toggle caption background"
                >
                  <Palette className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Sticker Picker Drawer */}
              <AnimatePresence>
                {showStickerPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-stone-900/90 border border-white/20 p-2.5 rounded-2xl flex flex-wrap gap-2 justify-center max-h-28 overflow-y-auto"
                  >
                    {STICKER_PALETTE.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addSticker(emoji)}
                        className="text-2xl hover:scale-125 transition-transform p-1 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Disappearing Timer Selector */}
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-rose-200">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-semibold">Show for:</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.minutes}
                      onClick={() => {
                        sound.pop();
                        setDurationMinutes(opt.minutes);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                        durationMinutes === opt.minutes
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Retake vs Send */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleRetake}
                  disabled={isSending}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>

                <button
                  onClick={handleSendSnap}
                  disabled={isSending}
                  className="flex-[2] py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-500/40 hover:brightness-105 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <span>Sending to Widget...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to {partnerData?.displayName?.split(' ')[0] || "Partner"}'s Widget</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
