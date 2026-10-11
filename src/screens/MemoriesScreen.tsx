import React, { useState, useEffect, useRef } from 'react';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import { Camera, Calendar, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { safeFormat, parseSafeDate } from '../lib/dateUtils';

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

export function MemoriesScreen() {
  const { space } = useCoupleSpace();
  const [memories, setMemories] = useState<any[]>([]);
  const [localMedia, setLocalMedia] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLocalMedia = async () => {
    if (!space?.id) return;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const spaceMedia = req.result.filter(item => item.spaceId === space.id);
        spaceMedia.sort((a, b) => parseSafeDate(b.date).getTime() - parseSafeDate(a.date).getTime());
        setLocalMedia(spaceMedia);
      };
    } catch (e) {
      console.error('Error loading local media', e);
    }
  };

  useEffect(() => {
    loadLocalMedia();
  }, [space?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !space?.id) return;
    const file = e.target.files[0];
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add({
        spaceId: space.id,
        file,
        type: file.type,
        date: new Date().toISOString()
      });
      tx.oncomplete = () => {
        loadLocalMedia();
      };
    } catch (err) {
      console.error('Error saving file', err);
      alert('Could not save media.');
    }
  };

  useEffect(() => {
    if (!space?.id) return;
    const fetchMemories = async () => {
      try {
        const snap = await getDocs(collection(db, `coupleSpaces/${space.id}/memories`));
        const allMemories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const filtered = allMemories.filter(m => m.type !== 'daily_note' && m.type !== 'surprise');
        filtered.sort((a, b) => parseSafeDate(b.date || b.createdAt).getTime() - parseSafeDate(a.date || a.createdAt).getTime());
        setMemories(filtered);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, `coupleSpaces/${space.id}/memories`);
      }
    };
    fetchMemories();
  }, [space?.id]);

  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imagesOnly = localMedia.filter(m => m.type.startsWith('image/'));

  useEffect(() => {
     let interval: any;
     if (isPlayingStory && imagesOnly.length > 0) {
         interval = setInterval(() => {
             setCurrentImageIndex(prev => (prev + 1) % imagesOnly.length);
         }, 4000);
     }
     return () => clearInterval(interval);
  }, [isPlayingStory, imagesOnly.length]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-rose-50 to-pink-50 relative pb-20 overflow-hidden">
      {isPlayingStory && imagesOnly.length > 0 && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col justify-center items-center">
            <button 
              onClick={() => setIsPlayingStory(false)}
              className="absolute top-8 right-8 z-50 text-white/50 hover:text-white"
            >
              Close
            </button>
            <motion.div 
               key={currentImageIndex}
               initial={{ opacity: 0, scale: 1.1 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none"
            >
               <img 
                 src={URL.createObjectURL(imagesOnly[currentImageIndex].file)} 
                 className="w-full h-full object-cover blur-md scale-110 opacity-30 absolute inset-0"
               />
               <img 
                 src={URL.createObjectURL(imagesOnly[currentImageIndex].file)} 
                 className="w-full max-h-[80%] object-contain relative z-10 drop-shadow-2xl"
               />
            </motion.div>
            <div className="absolute bottom-16 text-center z-10 w-full px-6">
                <motion.p 
                   key={`text-${currentImageIndex}`}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 }}
                   className="text-white text-xl font-serif italic drop-shadow-lg"
                >
                   {safeFormat(imagesOnly[currentImageIndex]?.date, 'MMMM d, yyyy')}
                </motion.p>
            </div>
         </div>
      )}

      <div className="px-6 py-8 pb-4 bg-white/60 backdrop-blur-xl shadow-sm border-b border-white z-10 sticky top-0 flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-serif font-bold text-rose-950">Timeline</h1>
        <div className="flex gap-2">
          {imagesOnly.length > 0 && (
            <button 
              onClick={() => {
                 setCurrentImageIndex(0);
                 setIsPlayingStory(true);
              }}
              className="bg-gradient-to-r from-rose-400 to-pink-500 p-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-white border border-rose-50"
            >
              <PlayCircle className="w-5 h-5" />
            </button>
          )}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="bg-white p-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-rose-500 border border-rose-50">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*,audio/*"
          onChange={handleFileUpload} 
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 relative">
        {/* Decorative background blobs */}
        <div className="absolute top-20 right-0 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-40 left-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        {/* Timeline Line */}
        <div className="absolute top-0 bottom-0 left-[34px] w-0.5 bg-gradient-to-b from-rose-300 via-rose-200 to-transparent -z-10" />
        
        <div className="space-y-12 ml-[19px]">
          {memories.length === 0 && localMedia.length === 0 && (
            <div className="ml-8 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white text-center text-rose-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Start capturing moments together.</p>
              <p className="text-sm mt-2 opacity-70">Memories are stored securely on your device.</p>
            </div>
          )}

          {localMedia.map((media, i) => {
            const url = URL.createObjectURL(media.file);
            return (
              <motion.div 
                key={`local-${i}`} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
                className="relative pl-8 group"
              >
                <div className="absolute -left-3 top-1 w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full border-4 border-rose-50 shadow-sm" />
                <p className="text-[10px] font-bold text-rose-400 mb-2 uppercase tracking-[0.2em]">{safeFormat(media.date, 'MMM d, yyyy')}</p>
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-lg shadow-rose-100/50 border border-white hover:-translate-y-1 transition-transform">
                  <div className="rounded-3xl mb-2 flex items-center justify-center overflow-hidden bg-rose-50">
                    {media.type.startsWith('image/') && (
                       <img src={url} alt="Memory" className="w-full h-auto max-h-64 object-cover" />
                    )}
                    {media.type.startsWith('video/') && (
                       <video src={url} controls className="w-full h-auto max-h-64 rounded-xl" />
                    )}
                    {media.type.startsWith('audio/') && (
                       <audio src={url} controls className="w-full mt-4 mb-4" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {memories.map((mem, i) => (
            <motion.div 
              key={mem.id} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative pl-8 group"
            >
              <div className="absolute -left-3 top-1 w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full border-4 border-rose-50 shadow-sm" />
              <p className="text-[10px] font-bold text-rose-400 mb-2 uppercase tracking-[0.2em]">{safeFormat(mem.date || mem.createdAt || mem.timestamp, 'MMM d, yyyy')}</p>
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg shadow-rose-100/50 border border-white">
                 {mem.title && <h3 className="font-bold text-rose-900 mb-1">{mem.title}</h3>}
                 {mem.content && <p className="text-rose-950">{mem.content}</p>}
                 {mem.photoUrl && (
                   <img src={mem.photoUrl} alt="Memory" className="mt-3 rounded-2xl w-full max-h-64 object-cover" />
                 )}
                 {mem.mediaUrl && mem.mediaType?.startsWith('video') && (
                   <video src={mem.mediaUrl} controls className="mt-3 rounded-2xl w-full max-h-64" />
                 )}
                 {mem.mediaUrl && !mem.mediaType?.startsWith('video') && (
                   <img src={mem.mediaUrl} alt="Memory" className="mt-3 rounded-2xl w-full max-h-64 object-cover" />
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
