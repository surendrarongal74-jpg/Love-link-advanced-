import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HardDrive,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import { playSound } from '../lib/sound';

export const InstallAPKScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://love-link.app';

  const handleInstall = async () => {
    playSound('pop');
    if (isInstallable) {
      const success = await install();
      if (success) playSound('success');
    } else {
      alert(
        isIOS
          ? 'On iOS: Tap Safari Share button -> "Add to Home Screen"'
          : 'Tap your Android browser menu (⋮) -> "Install App" or "Add to Home Screen"'
      );
    }
  };

  const handleCopyLink = () => {
    playSound('pop');
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const downloadTWAManifest = () => {
    playSound('pop');
    const twaConfig = {
      packageId: 'com.lovelink.app',
      host: typeof window !== 'undefined' ? window.location.host : 'lovelink.app',
      name: 'Love Link',
      launcherName: 'Love Link',
      themeColor: '#FFF8FA',
      navigationColor: '#FFF8FA',
      backgroundColor: '#FFF8FA',
      startUrl: '/',
      iconUrl: `${currentUrl}/pwa-512x512.png`,
      maskableIconUrl: `${currentUrl}/pwa-maskable-512x512.png`,
      appVersionName: '1.0.0',
      appVersionCode: 1,
      enableNotifications: true,
      generator: 'Love Link APK Builder'
    };

    const blob = new Blob([JSON.stringify(twaConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twa-manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA] text-[#3A2630] pb-24 safe-top safe-bottom">
      {/* Top App Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100/60 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            playSound('pop');
            navigate(-1);
          }}
          className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-gray-800">App & Device Hub</h1>
          <p className="text-[11px] text-gray-400">Phone, Tablet & Desktop PC</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-400 text-white p-6 md:p-8 shadow-xl shadow-rose-300/50">
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-md p-3.5 flex items-center justify-center shadow-lg border border-white/30 mb-3">
              <Download className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Love Link on Every Device</h2>
            <p className="text-xs md:text-sm text-rose-100 mt-1 max-w-md mx-auto">
              Enjoy Love Link anywhere: on your smartphone, tablet, laptop, or desktop PC. Standalone app experience with instant syncing, local offline vault, and zero lag.
            </p>

            {isInstalled ? (
              <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Installed & Running on This Device</span>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-5 w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-white text-rose-600 font-extrabold text-sm shadow-lg shadow-black/10 hover:bg-rose-50 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5 text-rose-600" />
                <span>{isInstallable ? 'Install App on This Device' : 'Add Love Link to Device'}</span>
              </button>
            )}
          </div>

          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-rose-600/30 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Instant Launch</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Runs in standalone mode on Phone, Tablet & PC</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Private Vault</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Encrypted locally on all your devices</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Offline Games</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Play Loveverse Playhouse anytime, everywhere</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Adaptive Interface</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Designed for phones, tablets & desktop screens</p>
            </div>
          </div>
        </div>

        {/* Scan to Open on Another Device */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Scan & Open on Phone or Tablet</h3>
          </div>
          <p className="text-xs text-gray-500">
            Open your device's camera to scan and open Love Link instantly on your phone or tablet:
          </p>

          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}&color=e8547a&bgcolor=fff8fa`}
              alt="Scan to Install Love Link"
              className="w-44 h-44 rounded-xl shadow-sm border border-rose-200"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="bg-transparent border-none flex-1 text-gray-700 outline-none text-xs select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1 shrink-0 transition active:scale-95"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Standalone APK Builder Tools */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">APK Package & Export Options</h3>
          </div>
          <p className="text-xs text-gray-500">
            Need a raw `.apk` file or Google Play package? Use these official Android TWA tools:
          </p>

          <a
            href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-between transition shadow-md"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>PWABuilder Cloud APK Generator</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">Cloud APK</span>
          </a>

          <button
            onClick={downloadTWAManifest}
            className="w-full py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center justify-between transition hover:bg-rose-100"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Download twa-manifest.json (Bubblewrap CLI)</span>
            </div>
            <span className="text-[10px] text-rose-500 font-mono">JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
