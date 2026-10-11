import React, { useState } from 'react';
import { Phone, Video, ShieldCheck, Heart, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCall, CallType } from '../../contexts/CallContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';

interface CallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallPromptModal: React.FC<CallPromptModalProps> = ({ isOpen, onClose }) => {
  const { startCall } = useCall();
  const { partnerData } = useCoupleSpace();
  const [isStarting, setIsStarting] = useState(false);

  if (!isOpen) return null;

  const partnerFirstName = partnerData?.displayName?.split(' ')[0] || 'Partner';

  const handleInitiate = async (type: CallType) => {
    setIsStarting(true);
    try {
      await startCall(type);
      onClose();
    } catch {
      // Handled inside CallContext
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 50, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-rose-100 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative avatar */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 p-1 shadow-lg shadow-rose-200">
              <div className="w-full h-full rounded-full bg-rose-50 flex items-center justify-center text-2xl font-serif font-bold text-rose-600">
                {partnerFirstName.charAt(0)}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight">
            Call {partnerFirstName}
          </h3>
          <p className="text-xs text-rose-800/70 font-medium mt-1 mb-6 max-w-xs">
            Direct peer-to-peer WebRTC connection. Enjoy crystal clear, private audio & video.
          </p>

          {/* Call Options */}
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            {/* Voice Call */}
            <button
              disabled={isStarting}
              onClick={() => handleInitiate('voice')}
              className="p-4 rounded-2xl bg-gradient-to-b from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-200/80 flex flex-col items-center gap-2 group transition active:scale-95 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-300 group-hover:scale-105 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Voice Call</span>
                <span className="text-[10px] text-gray-500">Audio only</span>
              </div>
            </button>

            {/* Video Call */}
            <button
              disabled={isStarting}
              onClick={() => handleInitiate('video')}
              className="p-4 rounded-2xl bg-gradient-to-b from-rose-500 to-pink-500 text-white flex flex-col items-center gap-2 group shadow-lg shadow-rose-300/50 hover:brightness-105 transition active:scale-95 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Video Call</span>
                <span className="text-[10px] text-rose-100">Face to Face</span>
              </div>
            </button>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Encrypted Peer-to-Peer</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
