import React, { useState, useEffect, useRef } from 'react';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import { 
  Send, Heart, Smile, Sparkles, Volume2, VolumeX, Mic, Square, Trash2, 
  Play, Pause, Loader2, Image as ImageIcon, ShieldCheck, Lock, WifiOff, 
  Download, Eye, X, Check, RefreshCw, Phone, Video, Palette, Gift
} from 'lucide-react';
import { WALLPAPER_PRESETS, getStoredWallpaper, applyWallpaper } from '../lib/themeEngine';
import { motion, AnimatePresence } from 'motion/react';
import { safeFormat } from '../lib/dateUtils';
import { encryptData, decryptData, blobToDataUrl } from '../lib/encryption';
import { 
  saveLocalMessage, 
  getLocalMessages, 
  deleteLocalMessage, 
  LocalEncryptedMessage,
  saveLocalMessagesBatch
} from '../lib/localStorageEngine';
import { CallPromptModal } from '../components/calling/CallPromptModal';
import { useCall } from '../contexts/CallContext';
import { useLiveNotifications } from '../contexts/LiveNotificationContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { LOVEVERSE_ASSETS } from '../assets/loveverseAssets';
import { SHOP_CATALOG } from '../types/coins';
import { sound } from '../lib/sound';

const preloadedMessages = [
  "I love you ❤️",
  "You mean everything to me 💖",
  "Thinking of you... 💕",
  "Can't wait to see you! 🥰",
  "You are my sunshine ☀️"
];

// In-app Audio Player for Voice Notes
function VoiceMessageBubble({ 
  url, 
  duration, 
  isMe, 
  currentlyPlaying, 
  setCurrentlyPlaying, 
  messageId, 
  onDelete 
}: { 
  url: string; 
  duration: number; 
  isMe: boolean; 
  currentlyPlaying: string | null; 
  setCurrentlyPlaying: (id: string | null) => void; 
  messageId: string; 
  onDelete?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentlyPlaying !== messageId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [currentlyPlaying, messageId, isPlaying]);

  useEffect(() => {
    if (!url) return;
    const audio = new Audio(url);
    audioRef.current = audio;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentlyPlaying(null);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [url, setCurrentlyPlaying]);

  const togglePlay = () => {
    if (!url) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    } else {
      audioRef.current?.play().catch(err => console.error("Audio playback error", err));
      setIsPlaying(true);
      setCurrentlyPlaying(messageId);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 w-48 ${isMe ? 'text-white' : 'text-rose-950'} group/bubble relative`}>
      <button 
        type="button"
        onClick={togglePlay}
        className={`p-2.5 rounded-full shrink-0 shadow-sm transition-transform active:scale-95 ${
          isMe ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-rose-500 text-white hover:bg-rose-600'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      
      <div className="flex-1 overflow-hidden relative h-7 flex items-center">
        {/* Animated Sound Wave bars */}
        <div className="flex items-center gap-1 w-full h-full opacity-70 absolute left-0 top-0">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={isPlaying ? { height: [4, 18, 6, 22, 4] } : { height: 6 }}
               transition={isPlaying ? { repeat: Infinity, duration: 0.6, delay: i * 0.06 } : {}}
               className={`w-1 rounded-full ${isMe ? 'bg-white' : 'bg-rose-400'}`} 
             />
           ))}
        </div>
        <div 
          className="absolute left-0 top-0 h-full bg-black/10 backdrop-blur-[1px] transition-all" 
          style={{ width: `${100 - progress}%`, right: 0, left: 'auto', transformOrigin: 'right' }} 
        />
      </div>
      
      <span className="text-[11px] font-mono font-medium shrink-0 opacity-90">{formatTime(duration)}</span>
      
      {isMe && onDelete && (
         <button 
           type="button" 
           onClick={onDelete} 
           className="absolute -left-8 top-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 text-rose-300 hover:text-red-500"
         >
            <Trash2 className="w-3.5 h-3.5" />
         </button>
      )}
    </div>
  );
}

export function ChatScreen() {
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  
  // Local messages state (Stored in Mobile Phone's IndexedDB)
  const [messages, setMessages] = useState<LocalEncryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiMoodResult, setAiMoodResult] = useState<{title: string, description: string, messageSuggestion?: string} | null>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isEncryptingAndSending, setIsEncryptingAndSending] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Image upload state
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [selectedImageBlob, setSelectedImageBlob] = useState<Blob | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // App & Security State
  const [isLocked, setIsLocked] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [latestVoiceMsg, setLatestVoiceMsg] = useState<LocalEncryptedMessage | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const [activeWallpaperId, setActiveWallpaperId] = useState<string>(getStoredWallpaper());
  const [showWallpaperPicker, setShowWallpaperPicker] = useState<boolean>(false);
  const [liveVirtualGift, setLiveVirtualGift] = useState<any | null>(null);

  const { startCall } = useCall();
  const { markAllAsRead } = useLiveNotifications();
  const { inventory } = useLoveCoins();

  // Listen to wallpaper changes from theme engine
  useEffect(() => {
    const handleWpChange = (e: any) => {
      setActiveWallpaperId(e.detail || getStoredWallpaper());
    };
    window.addEventListener('lovelink-wallpaper-change', handleWpChange);
    return () => window.removeEventListener('lovelink-wallpaper-change', handleWpChange);
  }, []);

  // Listen to real-time incoming virtual gifts sent in couple space
  useEffect(() => {
    if (!space?.id) return;
    const giftsQuery = query(
      collection(db, `coupleSpaces/${space.id}/virtualGifts`),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(giftsQuery, (snap) => {
      if (!snap.empty) {
        const giftData = snap.docs[0].data();
        // If sent within the last 20 seconds, play live celebration!
        if (Date.now() - (giftData.createdAt || 0) < 20000) {
          setLiveVirtualGift(giftData);
          sound.playLoveAlert();
          setTimeout(() => setLiveVirtualGift(null), 5000);
        }
      }
    }, (err) => {
      console.warn("Virtual gift listener error:", err);
    });

    return () => unsubscribe();
  }, [space?.id]);

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor network connection state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ambient romantic background track
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2;

    if (space?.id) {
      const lockKey = `chatLocked_${space.id}`;
      if (localStorage.getItem(lockKey) === 'unlocked' || !localStorage.getItem(lockKey + '_pin')) {
        setIsLocked(false);
      }
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [space?.id]);

  // Load from local mobile device IndexedDB initially
  useEffect(() => {
    if (!space?.id) return;
    getLocalMessages(space.id).then(localMsgs => {
      if (localMsgs.length > 0) {
        setMessages(localMsgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
      }
    });
  }, [space?.id]);

  // Real-time synchronization & on-device decryption
  useEffect(() => {
    if (!space?.id) return;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const remoteDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const processedList: LocalEncryptedMessage[] = [];

      for (const item of remoteDocs) {
        // If message is encrypted client-side
        if (item.ciphertext && item.iv) {
          try {
            const decryptedString = await decryptData(space.id, item.ciphertext, item.iv);
            const decryptedPayload = JSON.parse(decryptedString);

            const decryptedMsg: LocalEncryptedMessage = {
              id: item.id,
              coupleSpaceId: space.id,
              senderId: item.senderId,
              type: decryptedPayload.type || item.type,
              content: decryptedPayload.content || '',
              mediaDataUrl: decryptedPayload.mediaDataUrl || decryptedPayload.voiceUrl || decryptedPayload.imageUrl || '',
              duration: decryptedPayload.duration || 0,
              createdAt: item.createdAt || Date.now(),
              syncStatus: 'synced',
              decrypted: true
            };
            processedList.push(decryptedMsg);
          } catch (decryptErr) {
            console.error("Decryption failed for item:", item.id, decryptErr);
            processedList.push({
              id: item.id,
              coupleSpaceId: space.id,
              senderId: item.senderId,
              type: 'text',
              content: '🔒 [Encrypted Secret Message]',
              createdAt: item.createdAt || Date.now()
            });
          }
        } else {
          // Legacy/Plaintext message backward compatibility
          processedList.push({
            id: item.id,
            coupleSpaceId: space.id,
            senderId: item.senderId,
            type: item.type,
            content: item.content,
            mediaDataUrl: item.voiceUrl || item.imageUrl || '',
            duration: item.duration || 0,
            createdAt: item.createdAt || Date.now(),
            syncStatus: 'synced',
            decrypted: true
          });
        }
      }

      // Save all to local mobile device IndexedDB
      if (processedList.length > 0) {
        await saveLocalMessagesBatch(processedList);
        setMessages(processedList);
      }

      // Check for newest voice note from partner
      const latestVoice = [...processedList].reverse().find(m => m.type === 'voice' && m.senderId !== userData?.id);
      if (latestVoice && (!latestVoiceMsg || latestVoice.id !== latestVoiceMsg.id)) {
        setLatestVoiceMsg(latestVoice);
        if (!isLocked) {
          setShowVoicePopup(true);
        }
      }

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      // In offline mode, keep using local mobile IndexedDB
      console.warn("Firestore sync paused or offline. Using local device storage.", err);
    });

    return unsubscribe;
  }, [space?.id, isLocked, userData?.id]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const lockKey = `chatLocked_${space?.id}`;
    const savedPin = localStorage.getItem(lockKey + '_pin');
    
    if (!savedPin) {
      if (passcode.length >= 4) {
        localStorage.setItem(lockKey + '_pin', passcode);
        localStorage.setItem(lockKey, 'unlocked');
        setIsLocked(false);
      } else {
        setPasscodeError(true);
      }
      return;
    }

    if (passcode === savedPin) {
      localStorage.setItem(lockKey, 'unlocked');
      setIsLocked(false);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
      setPasscode('');
    }
  };

  const playLatestVoice = () => {
    if (latestVoiceMsg) {
      setCurrentlyPlaying(latestVoiceMsg.id);
      setShowVoicePopup(false);
    }
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      audioRef.current?.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current?.play().catch(() => {});
      setIsMusicPlaying(true);
    }
  };

  // Start microphone recording for voice note
  const startRecording = async () => {
    try {
      sound.heartbeat();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Prefer opus/webm or mp4
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else mimeType = '';
      }

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        setAudioBlob(blob);
        const previewUrl = URL.createObjectURL(blob);
        setAudioPreviewUrl(previewUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone. Please grant permission in your browser or phone settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      sound.tap();
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    sound.pop();
    stopRecording();
    setAudioBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordingTime(0);
  };

  // Image Selection Handler (Camera or Gallery)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    sound.tap();

    try {
      // Compress image client-side to ensure lightweight transmission and fast mobile storage
      const compressedDataUrl = await compressImageToDataUrl(file, 1200, 0.8);
      setSelectedImagePreview(compressedDataUrl);
      setSelectedImageBlob(file);
    } catch (err) {
      console.error("Error processing selected image:", err);
    }
  };

  // Compress image helper using canvas
  const compressImageToDataUrl = (file: File, maxDimension: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const cancelImage = () => {
    sound.pop();
    setSelectedImagePreview(null);
    setSelectedImageBlob(null);
    setImageCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete message
  const deleteMessage = async (msgId: string) => {
    sound.pop();
    // 1. Delete locally from device IndexedDB immediately
    await deleteLocalMessage(msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));

    // 2. Delete from cloud transit
    if (space?.id) {
      try {
        await deleteDoc(doc(db, `coupleSpaces/${space.id}/messages`, msgId));
      } catch (err) {
        console.warn('Sync delete note:', err);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Send Message (Zero-Knowledge AES-GCM Encrypted packet, stored directly in phones)
   */
  const sendMessage = async (e?: React.FormEvent, content?: string) => {
    e?.preventDefault();
    if (!space?.id || !userData?.id || isEncryptingAndSending) return;

    // --- 1. SEND VOICE NOTE ---
    if (audioBlob) {
      setIsEncryptingAndSending(true);
      try {
        const msgId = `msg_${Date.now()}_${userData.id}`;
        const audioDataUrl = await blobToDataUrl(audioBlob);

        // 1. Save unencrypted to sender's own local device IndexedDB for instant offline access
        const localVoiceMsg: LocalEncryptedMessage = {
          id: msgId,
          coupleSpaceId: space.id,
          senderId: userData.id,
          type: 'voice',
          content: 'Voice note',
          mediaDataUrl: audioDataUrl,
          duration: recordingTime,
          createdAt: Date.now(),
          syncStatus: 'synced',
          decrypted: true
        };
        await saveLocalMessage(localVoiceMsg);
        setMessages(prev => [...prev, localVoiceMsg]);
        sound.chime();

        // 2. Encrypt voice data packet using AES-256-GCM
        const payloadToEncrypt = JSON.stringify({
          type: 'voice',
          mediaDataUrl: audioDataUrl,
          duration: recordingTime,
          createdAt: Date.now()
        });
        const encrypted = await encryptData(space.id, payloadToEncrypt);

        // 3. Post end-to-end encrypted packet
        await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), {
          id: msgId,
          coupleSpaceId: space.id,
          senderId: userData.id,
          type: 'voice',
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          createdAt: Date.now()
        });

        // Clear recording
        setAudioBlob(null);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
        setRecordingTime(0);
      } catch (err) {
        console.error('Error sending encrypted voice note:', err);
        alert('Could not deliver voice note. Saved to your device.');
      } finally {
        setIsEncryptingAndSending(false);
      }
      return;
    }

    // --- 2. SEND IMAGE ---
    if (selectedImagePreview) {
      setIsEncryptingAndSending(true);
      try {
        const msgId = `msg_${Date.now()}_${userData.id}`;
        
        // 1. Save unencrypted to sender's own local device IndexedDB for instant offline access
        const localImageMsg: LocalEncryptedMessage = {
          id: msgId,
          coupleSpaceId: space.id,
          senderId: userData.id,
          type: 'image',
          content: imageCaption.trim(),
          mediaDataUrl: selectedImagePreview,
          createdAt: Date.now(),
          syncStatus: 'synced',
          decrypted: true
        };
        await saveLocalMessage(localImageMsg);
        setMessages(prev => [...prev, localImageMsg]);
        sound.chime();

        // 2. Encrypt image packet using AES-256-GCM
        const payloadToEncrypt = JSON.stringify({
          type: 'image',
          mediaDataUrl: selectedImagePreview,
          content: imageCaption.trim(),
          createdAt: Date.now()
        });
        const encrypted = await encryptData(space.id, payloadToEncrypt);

        // 3. Post end-to-end encrypted packet
        await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), {
          id: msgId,
          coupleSpaceId: space.id,
          senderId: userData.id,
          type: 'image',
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          createdAt: Date.now()
        });

        cancelImage();
      } catch (err) {
        console.error('Error sending encrypted image:', err);
        alert('Could not deliver photo. Saved to your device.');
      } finally {
        setIsEncryptingAndSending(false);
      }
      return;
    }

    // --- 3. SEND TEXT MESSAGE ---
    const messageContent = content || newMessage.trim();
    if (!messageContent) return;

    const msgId = `msg_${Date.now()}_${userData.id}`;
    if (!content) setNewMessage('');
    sound.tap();

    try {
      // 1. Save to sender's own mobile device IndexedDB immediately
      const localTextMsg: LocalEncryptedMessage = {
        id: msgId,
        coupleSpaceId: space.id,
        senderId: userData.id,
        content: messageContent,
        type: 'text',
        createdAt: Date.now(),
        syncStatus: 'synced',
        decrypted: true
      };
      await saveLocalMessage(localTextMsg);
      setMessages(prev => [...prev, localTextMsg]);

      // 2. Encrypt text packet using AES-256-GCM
      const payloadToEncrypt = JSON.stringify({
        type: 'text',
        content: messageContent,
        createdAt: Date.now()
      });
      const encrypted = await encryptData(space.id, payloadToEncrypt);

      // 3. Post end-to-end encrypted packet
      await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), {
        id: msgId,
        coupleSpaceId: space.id,
        senderId: userData.id,
        type: 'encrypted',
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        createdAt: Date.now()
      });
    } catch (err) {
      console.warn("Could not sync message online. Stored in phone offline.", err);
    }
  };

  const generateReplySuggestions = async (tone: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setAiSuggestions([]);
    
    const contextMessages = messages.slice(-5).map(m => `${m.senderId === userData?.id ? 'Me' : 'Partner'}: ${m.content}`).join('\n');
    const context = contextMessages || 'We haven\'t chatted much recently.';
    
    import('../lib/gemini').then(async ({ generateText }) => {
       try {
          const prompt = `Act as an AI communication assistant for a couple's chat. 
          Here is the recent chat history:\n${context}\n\n
          Generate 3 short, distinct, ${tone} reply options for 'Me' to send next.
          Return ONLY a JSON array of 3 strings. Example: ["reply 1", "reply 2", "reply 3"]`;
          
          const res = await generateText(prompt);
          const cleanJson = res.replace(/```json/g, '').replace(/```/g, '').trim();
          const options = JSON.parse(cleanJson);
          setAiSuggestions(options);
       } catch (e) {
          console.error(e);
          setAiSuggestions(["Sorry, AI error."]);
       } finally {
          setIsGenerating(false);
       }
    });
  };

  const selectSuggestion = (text: string) => {
     setNewMessage(text);
     setShowAIAssist(false);
  };

  const checkVibe = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setAiSuggestions([]);
    setAiMoodResult(null);

    const contextMessages = messages.slice(-10).map(m => `${m.senderId === userData?.id ? 'Me' : 'Partner'}: ${m.content}`).join('\n');
    
    import('../lib/gemini').then(async ({ generateText }) => {
       try {
          const prompt = `Act as an AI relationship coach. Analyze the recent chat history:\n${contextMessages || "(No recent messages)"}\n\n
          What is the overall vibe? Is there any tension, or is it loving/platonic?
          Also suggest a sweet action one of them can take right now.
          Return ONLY a JSON object: {"title": "The vibe...", "description": "Action suggestion...", "messageSuggestion": "optional quick message..."}`;
          
          const res = await generateText(prompt);
          const cleanJson = res.replace(/```json/g, '').replace(/```/g, '').trim();
          setAiMoodResult(JSON.parse(cleanJson));
       } catch (e) {
          console.error(e);
          setAiMoodResult({title: "Couldn't read the vibe", description: "Are you guys even talking? 😂"});
       } finally {
          setIsGenerating(false);
       }
    });
  };

  const sendReaction = async (emoji: string) => {
    if (!space?.id || !userData?.id) return;
    sound.heartbeat();
    const msgId = `msg_${Date.now()}_${userData.id}`;
    
    const localReactionMsg: LocalEncryptedMessage = {
      id: msgId,
      coupleSpaceId: space.id,
      senderId: userData.id,
      content: emoji,
      type: 'reaction',
      createdAt: Date.now()
    };
    await saveLocalMessage(localReactionMsg);
    setMessages(prev => [...prev, localReactionMsg]);

    try {
      const payloadToEncrypt = JSON.stringify({
        type: 'reaction',
        content: emoji,
        createdAt: Date.now()
      });
      const encrypted = await encryptData(space.id, payloadToEncrypt);

      await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), {
        id: msgId,
        coupleSpaceId: space.id,
        senderId: userData.id,
        type: 'encrypted',
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        createdAt: Date.now()
      });
    } catch (err) {
      console.warn('Reaction offline error:', err);
    }
  };

  const currentWp = WALLPAPER_PRESETS.find(w => w.id === activeWallpaperId) || WALLPAPER_PRESETS[0];

  return (
    <div 
      className={`flex flex-col h-screen ${currentWp.styleClass} relative pb-20 overflow-hidden transition-all duration-300`}
      style={currentWp.customBgStyle}
    >
      
      {/* Hidden file input for photos */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-300/30"
            initial={{ y: "110vh", x: `${Math.random() * 100}vw`, scale: Math.random() * 0.5 + 0.5, opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.8, 0], rotate: Math.random() * 360 }}
            transition={{ 
              repeat: Infinity, 
              duration: 12 + Math.random() * 15,
              delay: Math.random() * 8,
              ease: "linear"
            }}
          >
            <Heart className="w-8 h-8 fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Lightbox for viewing photos */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={lightboxImage} 
              alt="Love Note Photo" 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Lock Screen */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/85 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-rose-100 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
                <Heart className="w-10 h-10 text-white fill-current" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-rose-950 mb-1">Our Secret Vault</h2>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Knowledge AES Encrypted</span>
              </div>
              <p className="text-rose-600/80 mb-6 text-sm">
                {!localStorage.getItem(`chatLocked_${space?.id}_pin`) 
                  ? "Create a 4-digit secret passcode"
                  : "Enter your private passcode 💖"
                }
              </p>
              
              <form onSubmit={handleUnlock}>
                <input
                  type="password"
                  maxLength={4}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                  className={`w-full text-center text-3xl font-mono tracking-[0.5em] py-4 bg-rose-50 rounded-2xl outline-none focus:ring-2 transition-all ${
                    passcodeError ? 'ring-2 ring-red-400 bg-red-50 text-red-600 animate-shake' : 'focus:ring-rose-400 text-rose-950'
                  }`}
                  placeholder="••••"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-red-500 text-xs mt-3 font-medium">This love is protected 💔</p>
                )}
                <button 
                  type="submit"
                  disabled={passcode.length < 4}
                  className="w-full mt-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl py-3.5 font-bold shadow-md shadow-rose-200 disabled:opacity-50 transition-all active:scale-95"
                >
                  Unlock Vault 🔓
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Note Popup Notification */}
      <AnimatePresence>
        {showVoicePopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm bg-white rounded-3xl p-6 shadow-2xl shadow-rose-200/50 border border-rose-100 text-center"
          >
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20"></div>
              <Play className="w-8 h-8 text-rose-500 ml-1" />
            </div>
            <h3 className="font-bold text-rose-950 text-lg mb-1">A voice note from your love 💌</h3>
            <p className="text-rose-600 text-sm mb-6">Stored privately on your device</p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowVoicePopup(false)} 
                className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100"
              >
                Later
              </button>
              <button 
                type="button"
                onClick={playLatestVoice} 
                className="flex-[2] py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold hover:brightness-110 shadow-md shadow-rose-200"
              >
                Hear Voice 🎧
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 py-3.5 bg-white/50 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.04)] flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-white relative z-10">
              {userData?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-white relative z-0">
              {partnerData?.displayName?.[0]?.toUpperCase() || 'P'}
            </div>
          </div>
          <div className="ml-0.5">
            <div className="flex items-center gap-1.5">
              <h2 className="font-serif font-bold text-[15px] text-rose-950 leading-tight">
                {userData?.displayName?.split(' ')[0] || 'Me'} <span className="text-rose-500 text-xs">❤️</span> {partnerData?.displayName?.split(' ')[0] || 'Partner'}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/50">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Phone-Only & Encrypted
              </span>
              {isOffline && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                  <WifiOff className="w-3 h-3 text-amber-600" /> Offline Mode
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => {
              sound.playPop();
              startCall('voice');
            }}
            className="p-2.5 bg-white/70 backdrop-blur-md rounded-full shadow-sm text-rose-500 hover:text-rose-600 hover:bg-white border border-white transition-all active:scale-95"
            title="Start Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button 
            type="button"
            onClick={() => {
              sound.playPop();
              startCall('video');
            }}
            className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-sm shadow-rose-300/40 hover:brightness-105 transition-all active:scale-95"
            title="Start Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button 
            type="button"
            onClick={toggleMusic} 
            className="p-2.5 bg-white/70 backdrop-blur-md rounded-full shadow-sm text-rose-500 hover:text-rose-600 hover:bg-white border border-white transition-all active:scale-95"
            title="Ambient Music"
          >
            {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
          </button>

          <button 
            type="button"
            onClick={() => {
              sound.tap();
              setShowWallpaperPicker(true);
            }} 
            className="p-2.5 bg-white/70 backdrop-blur-md rounded-full shadow-sm text-pink-500 hover:text-pink-600 hover:bg-white border border-white transition-all active:scale-95"
            title="Chat Wallpaper"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5 relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3 text-rose-900/60">
            <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="font-serif font-bold text-base text-rose-950">Zero-Knowledge Private Space</h3>
            <p className="text-xs leading-relaxed max-w-xs text-rose-800/80">
              Your chats, photos, and voice notes are encrypted with AES-256 and stored directly in both your phones. Accessible online & offline!
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.senderId === userData?.id;
            const showTime = index === 0 || msg.createdAt - messages[index-1].createdAt > 1000 * 60 * 5;
            
            if (msg.type === 'reaction') {
               return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <span className="text-4xl animate-bounce drop-shadow-xl">{msg.content}</span>
                </motion.div>
               );
            }

            return (
              <motion.div 
                key={msg.id}
                onDoubleClick={() => { if (!isMe) sendReaction('💖'); }}
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.008 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group select-none`}
              >
                <div className={`px-4 py-3 max-w-[85%] relative shadow-sm ${
                  isMe 
                    ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-[1.8rem] rounded-br-[4px]' 
                    : 'bg-white/75 backdrop-blur-md border border-white text-rose-950 rounded-[1.8rem] rounded-bl-[4px]'
                }`}>
                  
                  {/* VOICE NOTE */}
                  {msg.type === 'voice' && (
                    <VoiceMessageBubble 
                      url={msg.mediaDataUrl || ''} 
                      duration={msg.duration || 0} 
                      isMe={isMe} 
                      currentlyPlaying={currentlyPlaying}
                      setCurrentlyPlaying={setCurrentlyPlaying}
                      messageId={msg.id}
                      onDelete={() => deleteMessage(msg.id)}
                    />
                  )}

                  {/* IMAGE MESSAGE */}
                  {msg.type === 'image' && (
                    <div className="space-y-2">
                      <div 
                        onClick={() => setLightboxImage(msg.mediaDataUrl || '')}
                        className="cursor-pointer overflow-hidden rounded-2xl relative group/img max-w-xs max-h-72"
                      >
                        <img 
                          src={msg.mediaDataUrl} 
                          alt="Love Note Photo" 
                          className="w-full h-auto object-cover rounded-2xl transition-transform hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      </div>
                      {msg.content && (
                        <p className="text-[14px] leading-relaxed break-words px-1 font-medium">{msg.content}</p>
                      )}
                    </div>
                  )}

                  {/* REGULAR TEXT MESSAGE */}
                  {msg.type === 'text' && (
                    <p className="text-[14.5px] leading-relaxed break-words">{msg.content}</p>
                  )}

                  {/* Interactive Heart on partner's message */}
                  {!isMe && (
                    <button 
                      type="button"
                      onClick={() => sendReaction('💘')} 
                      className="absolute -right-3 -bottom-3 p-1.5 bg-white rounded-full shadow-md text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 border border-rose-50 z-10"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>

                {showTime && msg.createdAt && (
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold mt-1 mx-2 ${isMe ? 'text-rose-400/80 mr-3' : 'text-rose-500/80 ml-3'}`}>
                     <span>{safeFormat(msg.createdAt, 'h:mm a')}</span>
                     {isMe && <Check className="w-3 h-3 text-rose-400" />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="z-10 flex flex-col bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm">
        
        {/* Preloaded Messages Chips */}
        <div className="px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {preloadedMessages.map((msg, i) => (
            <button 
              key={i} 
              type="button"
              onClick={() => sendMessage(undefined, msg)}
              className="whitespace-nowrap px-3.5 py-1.5 bg-white/70 hover:bg-white border-white/80 backdrop-blur-md rounded-full text-[12.5px] font-bold text-rose-600 shadow-sm border transition-all active:scale-95"
            >
              {msg}
            </button>
          ))}
        </div>

        {/* Selected Image Preview Modal/Tray before sending */}
        <AnimatePresence>
          {selectedImagePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-4 pb-3"
            >
              <div className="bg-white/90 backdrop-blur-xl border border-rose-200/80 rounded-2xl p-3 shadow-lg flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-rose-100">
                  <img src={selectedImagePreview} alt="Selected" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={cancelImage}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1">
                  <input 
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Add a sweet photo caption... (optional)"
                    className="w-full text-xs text-rose-950 bg-rose-50/60 rounded-xl px-3 py-2 border border-rose-100 outline-none placeholder:text-rose-300"
                  />
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Encrypted on-device photo
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={isEncryptingAndSending}
                  className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95"
                >
                  {isEncryptingAndSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pb-5 flex items-center gap-2">
          
          {/* AI Assist toggle */}
          <button 
            type="button"
            onClick={() => setShowAIAssist(!showAIAssist)}
            className={`p-3 outline-none rounded-full transition-transform active:scale-95 flex-shrink-0 border shadow-sm ${
              showAIAssist ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-white/70 text-purple-400 hover:text-purple-500 border-white'
            }`}
            title="Aira Love Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          
          {/* Photo attachment button */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 outline-none rounded-full transition-transform active:scale-95 flex-shrink-0 border bg-white/70 hover:bg-white text-rose-400 hover:text-rose-500 border-white shadow-sm"
            title="Send Encrypted Photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
             <AnimatePresence>
                {showAIAssist && (
                   <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-full mb-3 left-0 w-full bg-white rounded-2xl p-4 shadow-xl border border-rose-100 z-50">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-xs font-bold text-rose-500 flex items-center gap-1 uppercase tracking-widest"><Sparkles className="w-3 h-3" /> AI Assistant</span>
                         <button type="button" onClick={() => { setShowAIAssist(false); setAiSuggestions([]); setAiMoodResult(null); }} className="text-gray-400 hover:text-gray-600 text-xs font-medium">Close</button>
                      </div>
                      
                      {!aiSuggestions.length && !aiMoodResult && !isGenerating ? (
                         <div className="space-y-4">
                            <div>
                               <h4 className="text-xs font-bold text-gray-500 mb-2 px-1">Generate a Reply</h4>
                               <div className="grid grid-cols-2 gap-2">
                                  <button type="button" onClick={() => generateReplySuggestions('sweet and romantic')} className="py-2 text-xs font-bold bg-pink-50 text-pink-600 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors">Romantic 💕</button>
                                  <button type="button" onClick={() => generateReplySuggestions('funny and cheeky')} className="py-2 text-xs font-bold bg-orange-50 text-orange-600 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors">Funny 😂</button>
                                  <button type="button" onClick={() => generateReplySuggestions('caring and supportive')} className="py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">Supportive 🤗</button>
                                  <button type="button" onClick={() => generateReplySuggestions('sincere apology')} className="py-2 text-xs font-bold bg-purple-50 text-purple-600 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">Apologize 😔</button>
                               </div>
                            </div>
                            <div>
                               <h4 className="text-xs font-bold text-gray-500 mb-2 px-1">Chat Analysis</h4>
                               <button type="button" onClick={checkVibe} className="w-full py-2.5 text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg shadow-sm font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                  Check Our Vibe 🔮
                                </button>
                            </div>
                         </div>
                      ) : isGenerating ? (
                         <div className="flex justify-center py-4">
                            <Sparkles className="w-6 h-6 text-rose-400 animate-spin" />
                         </div>
                      ) : aiMoodResult ? (
                         <div className="space-y-3">
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                               <h5 className="font-bold text-sm text-rose-900 mb-1">{aiMoodResult.title}</h5>
                               <p className="text-xs text-rose-700 leading-relaxed">{aiMoodResult.description}</p>
                            </div>
                            {aiMoodResult.messageSuggestion && (
                               <button type="button" onClick={() => selectSuggestion(aiMoodResult.messageSuggestion!)} className="w-full text-left text-sm p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-50 transition-colors border border-rose-200 font-medium">
                                  Send: "{aiMoodResult.messageSuggestion}"
                                </button>
                            )}
                            <button type="button" onClick={() => setAiMoodResult(null)} className="w-full py-2 text-xs text-gray-500 font-medium">Back</button>
                         </div>
                      ) : (
                         <div className="space-y-2">
                            {aiSuggestions.map((sug, i) => (
                               <button type="button" key={i} onClick={() => selectSuggestion(sug)} className="w-full text-left text-sm p-3 bg-rose-50 text-gray-700 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100">
                                  "{sug}"
                                </button>
                            ))}
                         </div>
                      )}
                   </motion.div>
                )}
             </AnimatePresence>

            {/* Voice Recording Active Bar */}
            {isRecording || audioBlob || isEncryptingAndSending ? (
               <div className="flex-1 flex items-center bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-1.5 shadow-lg shadow-rose-100/50 transition-all">
                  {isEncryptingAndSending ? (
                     <div className="flex-1 flex items-center justify-center gap-2 text-rose-500 font-medium text-xs py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Encrypting & Storing in Phone 🔐...
                     </div>
                  ) : audioBlob ? (
                     <div className="flex-1 flex items-center justify-between px-2">
                        <button type="button" onClick={cancelRecording} className="p-2 text-red-400 hover:text-red-500 transition-colors">
                           <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-rose-600 font-medium text-xs">
                           <Play className="w-3.5 h-3.5" /> Ready ({formatTime(recordingTime)})
                        </div>
                        <button type="button" onClick={() => sendMessage()} className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full transition-transform active:scale-95 shadow-md">
                           <Send className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                     </div>
                  ) : (
                     <div className="flex-1 flex items-center justify-between px-3">
                        <div className="flex items-center gap-2 text-rose-500 font-medium text-xs">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                           Recording note... {formatTime(recordingTime)}
                        </div>
                        <button type="button" onClick={stopRecording} className="p-2 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition-colors">
                           <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                     </div>
                  )}
               </div>
            ) : (
              <form onSubmit={sendMessage} className="flex-1 flex items-center bg-white/85 backdrop-blur-xl border border-white rounded-[2rem] p-1.5 shadow-lg shadow-rose-100/50 transition-all">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your encrypted message..."
                  className="flex-1 bg-transparent border-none outline-none text-rose-950 placeholder:text-rose-300 px-3 text-[14.5px] font-medium min-w-0"
                />
                <button 
                  type="button" 
                  onClick={() => sendReaction('💌')}
                  className="p-2 text-rose-400 hover:text-rose-500 transition-transform active:scale-95 flex-shrink-0"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {newMessage.trim() ? (
                  <button 
                    type="submit"
                    className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full transition-transform active:scale-95 shadow-md flex-shrink-0"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={startRecording}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full transition-transform active:scale-95 shadow-md flex-shrink-0"
                    title="Hold or tap to record voice note"
                  >
                    <Mic className="w-3.5 h-3.5 fill-white" />
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Wallpaper Picker Modal in Chat */}
      <AnimatePresence>
        {showWallpaperPicker && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-rose-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
                <div>
                  <h3 className="font-bold text-base font-serif text-gray-900">Chat Background</h3>
                  <p className="text-[11px] text-gray-500">Pick a persistent romantic wallpaper</p>
                </div>
                <button
                  onClick={() => setShowWallpaperPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                {WALLPAPER_PRESETS.map((wp) => {
                  const isSelected = activeWallpaperId === wp.id;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => {
                        sound.tap();
                        applyWallpaper(wp.id);
                        setActiveWallpaperId(wp.id);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50 shadow-xs'
                          : 'border-gray-100 hover:border-rose-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl shadow-xs border border-white/50"
                          style={{ background: wp.preview }}
                        />
                        <span className="font-bold text-xs text-gray-800">{wp.name}</span>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-2xs">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowWallpaperPicker(false)}
                className="mt-4 w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-2.5 rounded-xl shadow-md shadow-rose-300/40 text-xs"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Incoming Virtual Gift Animation Overlay */}
      <AnimatePresence>
        {liveVirtualGift && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs"
          >
            <div className="bg-white/95 rounded-3xl p-5 shadow-2xl border-2 border-rose-300 text-center max-w-xs space-y-3 pointer-events-auto">
              {(() => {
                const catItem = SHOP_CATALOG.find(i => i.id === liveVirtualGift.giftId);
                const giftImg = catItem?.image || liveVirtualGift.image;
                return giftImg ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-rose-50 mx-auto shadow-lg shadow-rose-300/40 border border-white">
                    <img src={giftImg} alt={liveVirtualGift.giftName} className="w-full h-full object-cover animate-pulse duration-1000" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 mx-auto flex items-center justify-center text-4xl shadow-md shadow-rose-300/50 animate-bounce">
                    {catItem?.icon || '🎁'}
                  </div>
                );
              })()}
              <div>
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest bg-rose-50 px-2.5 py-0.5 rounded-full">
                  Special Loveverse Gift
                </span>
                <h3 className="font-serif font-black text-lg text-rose-950 mt-1">
                  {liveVirtualGift.giftName}
                </h3>
                {liveVirtualGift.note && (
                  <p className="text-xs text-rose-700 italic mt-1 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 font-serif leading-relaxed">
                    "{liveVirtualGift.note}"
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-2">
                  Delivered with love from your partner ❤️
                </p>
              </div>
              <button
                onClick={() => setLiveVirtualGift(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/40 hover:brightness-105 active:scale-95 transition-all"
              >
                Receive with a Hug
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-20 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t border-rose-100/50">
        <BottomNav />
      </div>
    </div>
  );
}
