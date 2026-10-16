import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Home, MessageCircle, ArrowLeft } from 'lucide-react';
import { sound } from '../lib/sound';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF6F9] via-pink-50/50 to-[#FFF0F5] text-[#2B1A2E] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] p-8 border border-rose-100 shadow-xl shadow-rose-200/50 space-y-4">
        {/* Animated Heart / 404 Badge */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-rose-400 via-pink-400 to-purple-400 flex items-center justify-center text-white shadow-lg shadow-rose-300/40 animate-pulse">
          <Heart className="w-12 h-12 fill-white stroke-none" />
          <span className="absolute -bottom-1 bg-white text-rose-600 font-black text-xs px-2.5 py-0.5 rounded-full border border-rose-200 shadow-xs">
            404
          </span>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 block mb-1">
            Lost In The Loveverse
          </span>
          <h1 className="text-2xl font-serif font-black text-gray-900 leading-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-[#9B7A87] mt-2 leading-relaxed">
            The link you followed wandered away into the stars or has been moved. Let's get you back to your couple space!
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => {
              sound.playPop();
              navigate('/');
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/40 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Couple Space</span>
          </button>

          <button
            onClick={() => {
              sound.tap();
              navigate('/chat');
            }}
            className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/60 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open Private Chat</span>
          </button>

          <button
            onClick={() => {
              sound.tap();
              navigate(-1);
            }}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back to Previous Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
