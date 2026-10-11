import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  Share2,
  CheckCircle2,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  PackageCheck,
  ArrowRight
} from 'lucide-react';
import { playSound } from '../../lib/sound';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'builder' | 'qr'>('apk');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://love-link.app';

  const handleInstallClick = async () => {
    playSound('pop');
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        playSound('success');
      }
    } else {
      // Guide the user for browser menu install
      alert(
        isIOS
          ? 'On iPhone: Tap the Share button in Safari, then tap "Add to Home Screen".'
          : 'Tap your browser menu (⋮) at top-right and select "Install app" or "Add to Home screen" to install the APK!'
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
      generator: 'Love Link APK Builder for Android'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-rose-400 p-6 text-white text-center">
          <button
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md p-2 flex items-center justify-center shadow-lg border border-white/30">
            <Smartphone className="w-9 h-9 text-white" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">Love Link for Mobile & APK</h2>
          <p className="text-xs text-rose-100 mt-1 max-w-xs mx-auto">
            Install directly on your Android phone as a native APK app with offline encrypted storage & zero lag!
          </p>

          {isInstalled && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/80 text-white text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Already Running as Installed APK / App</span>
            </div>
          )}
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-rose-100 bg-rose-50/40 p-1.5">
          <button
            onClick={() => {
              playSound('pop');
              setActiveTab('apk');
            }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition ${
              activeTab === 'apk'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📱 1-Tap APK Install
          </button>
          <button
            onClick={() => {
              playSound('pop');
              setActiveTab('qr');
            }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition ${
              activeTab === 'qr'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📲 Phone QR Link
          </button>
          <button
            onClick={() => {
              playSound('pop');
              setActiveTab('builder');
            }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition ${
              activeTab === 'builder'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ APK / TWA Tools
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Android WebAPK Native Engine</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Android builds and signs a native <strong>.apk</strong> package right on your mobile phone through Chrome/Samsung Internet!
                    No sideloading or Google Play account required.
                  </p>
                </div>
              </div>

              {/* Install Button */}
              <button
                onClick={handleInstallClick}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-rose-300/60 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>{isInstallable ? 'Install Love Link APK Now' : 'Install / Add to Home Screen'}</span>
              </button>

              {/* Instructions steps */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  How to install on Android & iOS:
                </h5>
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Tap <strong>"Install Love Link APK Now"</strong> above or tap the browser menu (<strong>⋮</strong>).</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>The Love Link APK icon appears instantly on your home screen and launcher drawer with native full-screen mode!</span>
                </div>
              </div>

              {/* Security & Offline highlights */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-medium text-emerald-800">Encrypted On-Device Vault</span>
                </div>
                <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-[11px] font-medium text-sky-800">Offline Chat & Photos</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-gray-600">
                Scan this link using your Android or iOS camera to launch Love Link and install it in one tap:
              </p>

              {/* QR display card */}
              <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-rose-200 inline-block mx-auto shadow-inner">
                {/* Visual QR representation */}
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-rose-50 to-pink-50 p-3 rounded-xl border border-rose-200 flex flex-col items-center justify-center relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}&color=e8547a&bgcolor=fff8fa`}
                    alt="Love Link QR Code"
                    className="w-40 h-40 rounded-lg"
                    onError={(e) => {
                      // Fallback if network blocked
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
                    <Smartphone className="w-8 h-8 text-rose-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-transparent border-none flex-1 text-gray-700 outline-none text-xs select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold flex items-center gap-1 transition active:scale-95"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <PackageCheck className="w-4 h-4 text-purple-600" />
                  <span>Build Standalone APK via PWABuilder / TWA</span>
                </div>
                <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                  Generate an official Android <strong>.APK</strong> or <strong>.AAB</strong> file signed for Google Play or direct side-loading onto any Android phone.
                </p>
              </div>

              {/* PWABuilder 1-click */}
              <a
                href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('pop')}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-between transition shadow-md"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Generate APK on PWABuilder (Cloud Builder)</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Download TWA Manifest */}
              <button
                onClick={downloadTWAManifest}
                className="w-full py-3.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-between transition shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-rose-500" />
                  <span>Download `twa-manifest.json` (Bubblewrap CLI)</span>
                </div>
                <span className="text-[10px] text-gray-400">JSON</span>
              </button>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-[11px] text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">Quick CLI APK Build command:</p>
                <code className="block bg-gray-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                  npx @bubblewrap/cli build
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
