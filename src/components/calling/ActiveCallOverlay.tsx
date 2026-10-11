import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  SwitchCamera, 
  Heart, 
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCall } from '../../contexts/CallContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';

export const ActiveCallOverlay: React.FC = () => {
  const {
    callStatus,
    callType,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    duration,
    localStream,
    remoteStream,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    flipCamera
  } = useCall();

  const { partnerData } = useCoupleSpace();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Attach local stream to preview video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus, isMinimized]);

  // Attach remote stream to partner video / audio
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus, isMinimized]);

  if (callStatus === 'idle') return null;

  // Format call duration (MM:SS)
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const partnerName = partnerData?.displayName || 'My Love';

  // --- 1. INCOMING CALL SCREEN (Ringing) ---
  if (callStatus === 'incoming') {
    return (
      <div className="fixed inset-0 z-[200] bg-gradient-to-b from-rose-950/90 via-black/95 to-rose-950/90 backdrop-blur-2xl flex flex-col items-center justify-between p-8 text-white">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        
        {/* Header Badge */}
        <div className="pt-8 flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-widest text-rose-300 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            Incoming Love {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </span>
          <h2 className="text-3xl font-serif font-black tracking-tight mt-2 text-rose-50">
            {partnerName}
          </h2>
          <p className="text-sm text-rose-200/80 font-medium">Calling your private world...</p>
        </div>

        {/* Central Heart Avatar with pulsating rings */}
        <div className="relative flex items-center justify-center my-auto">
          <div className="absolute w-56 h-56 rounded-full bg-rose-500/20 animate-ping" />
          <div className="absolute w-44 h-44 rounded-full bg-rose-500/30 animate-pulse" />
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 p-1 shadow-2xl relative z-10 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-rose-900/80 flex items-center justify-center text-4xl font-serif font-bold text-white shadow-inner">
              {partnerName.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg border-2 border-white">
              {callType === 'video' ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <Phone className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Decline & Accept */}
        <div className="w-full max-w-xs pb-10 flex items-center justify-around gap-6">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={declineCall}
              aria-label="Decline Call"
              className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-rose-200 font-semibold">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              aria-label="Accept Call"
              className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform animate-bounce"
            >
              <Phone className="w-7 h-7" />
            </button>
            <span className="text-xs text-emerald-300 font-bold">Answer</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. OUTGOING / DIALING SCREEN ---
  if (callStatus === 'calling') {
    return (
      <div className="fixed inset-0 z-[200] bg-gradient-to-b from-rose-950/95 via-stone-950 to-rose-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 text-white">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        
        {/* Local Preview Camera in Video Call */}
        {callType === 'video' && localStream && !isVideoOff && (
          <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover filter blur-[2px]"
            />
          </div>
        )}

        {/* Top Info */}
        <div className="pt-8 flex flex-col items-center gap-2 text-center relative z-10">
          <span className="text-xs uppercase tracking-widest text-rose-300 font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur-md">
            Calling {callType === 'video' ? 'Video' : 'Voice'}...
          </span>
          <h2 className="text-3xl font-serif font-black tracking-tight mt-2 text-rose-50">
            {partnerName}
          </h2>
          <p className="text-sm text-rose-200/80 animate-pulse font-medium">Ringing partner device...</p>
        </div>

        {/* Avatar */}
        <div className="relative flex items-center justify-center my-auto z-10">
          <div className="absolute w-44 h-44 rounded-full bg-rose-500/20 animate-pulse" />
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 p-1 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-rose-950/80 flex items-center justify-center text-4xl font-serif font-bold text-white shadow-inner">
              {partnerName.charAt(0)}
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="w-full max-w-xs pb-10 flex flex-col items-center gap-2 z-10">
          <button
            onClick={endCall}
            aria-label="Cancel Call"
            className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <span className="text-xs text-rose-200 font-semibold">End Call</span>
        </div>
      </div>
    );
  }

  // --- 3. CALL ENDED BANNER / MODAL ---
  if (callStatus === 'ended') {
    return (
      <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <Heart className="w-8 h-8 fill-rose-500/40" />
        </div>
        <h3 className="text-xl font-serif font-bold">Call Ended</h3>
        <p className="text-sm text-gray-300 mt-1">Duration: {formatDuration(duration)}</p>
      </div>
    );
  }

  // --- 4. CONNECTED CALL SCREEN (Full Screen or Floating PiP) ---
  return (
    <>
      {/* Invisible audio element for remote WebRTC audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Minimized Floating Pill Mode */}
      {isMinimized ? (
        <motion.div
          drag
          dragConstraints={{ left: 10, right: 300, top: 10, bottom: 600 }}
          className="fixed bottom-24 right-4 z-[200] bg-rose-950/95 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border border-rose-300/30 flex items-center gap-3 cursor-move"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/30 flex items-center justify-center text-rose-300 relative">
            {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold leading-tight">{partnerName}</h4>
            <p className="text-[11px] font-mono text-emerald-400 font-medium">{formatDuration(duration)}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              title="Maximize"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={endCall}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              title="End Call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : (
        /* Full Screen Connected Call UI */
        <div className="fixed inset-0 z-[200] bg-gradient-to-b from-stone-950 via-rose-950 to-stone-950 text-white flex flex-col justify-between overflow-hidden">
          
          {/* Main Remote Video (if video call) */}
          {callType === 'video' ? (
            <div className="absolute inset-0 z-0 bg-stone-900 flex items-center justify-center overflow-hidden">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-stone-400">
                  <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center text-4xl font-serif font-bold text-rose-400 border border-stone-700">
                    {partnerName.charAt(0)}
                  </div>
                  <p className="text-sm font-medium animate-pulse">Connecting video stream...</p>
                </div>
              )}

              {/* Local Self-view PiP Video */}
              <div className="absolute top-16 right-4 z-20 w-28 h-40 bg-black/60 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
                {!isVideoOff && localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-xs text-stone-400">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span>Cam Off</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Voice Call Graphic Backdrop */
            <div className="relative z-0 flex-1 flex flex-col items-center justify-center my-auto">
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 p-1.5 shadow-2xl flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center text-5xl font-serif font-bold text-rose-300 shadow-inner">
                  {partnerName.charAt(0)}
                </div>
              </div>

              {/* Romantic Voice Visualizer Bars */}
              <div className="flex items-center gap-1.5 mt-8 h-8">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [6, 14 + Math.sin(i) * 16, 8, 26, 6]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8 + (i % 4) * 0.2,
                      delay: i * 0.05
                    }}
                    className="w-1.5 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Top Bar with partner details, timer and minimize button */}
          <div className="relative z-20 px-6 pt-12 pb-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-bold leading-tight text-white drop-shadow">
                  {partnerName}
                </h3>
                <span className="text-xs bg-emerald-500/80 text-white font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Live
                </span>
              </div>
              <p className="text-xs font-mono text-rose-300 font-semibold tracking-wider mt-0.5 drop-shadow">
                {formatDuration(duration)}
              </p>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 active:scale-95 transition"
              title="Minimize into PiP pill"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="relative z-20 px-6 pb-12 pt-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-4 bg-black/40 backdrop-blur-2xl px-6 py-3.5 rounded-full border border-white/20 shadow-2xl">
              
              {/* Mute Mic Toggle */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                  isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Camera Toggle (If Video Call) */}
              {callType === 'video' && (
                <>
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                      isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={flipCamera}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95"
                    title="Switch Front/Rear Camera"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                  !isSpeakerOn ? 'bg-amber-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isSpeakerOn ? 'Speaker On' : 'Earpiece Mode'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 active:scale-95 transition ml-2"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
