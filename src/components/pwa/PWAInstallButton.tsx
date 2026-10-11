import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone, Download } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';
import { playSound } from '../../lib/sound';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'pill';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = ''
}) => {
  const { isInstalled } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running in standalone APK / PWA mode, don't show the prompt
  if (isInstalled) {
    return null;
  }

  const handleOpen = () => {
    playSound('pop');
    setModalOpen(true);
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleOpen}
          aria-label="Install Mobile APK"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold shadow-md shadow-rose-300/40 hover:opacity-95 active:scale-95 transition ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Get APK</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          onClick={handleOpen}
          className={`flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 text-rose-800 text-xs font-semibold hover:bg-rose-100/60 transition active:scale-[0.99] ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800 text-xs">Love Link Mobile APK</p>
              <p className="text-[10px] text-gray-500">Install native app on Android & iOS</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1">
            <Download className="w-3 h-3" />
            Install
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white shadow-lg shadow-rose-300/40 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-100">Android Mobile Version</h4>
              <p className="text-sm font-extrabold leading-tight">Install Love Link APK</p>
            </div>
          </div>
          <button
            onClick={handleOpen}
            className="px-3.5 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-md hover:bg-rose-50 active:scale-95 transition whitespace-nowrap"
          >
            Get APK
          </button>
        </div>
      )}

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
