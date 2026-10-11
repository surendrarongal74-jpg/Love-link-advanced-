import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WifiOff, CloudAlert } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, reachabilityStatus } = useAuth();

  if (isOnline && reachabilityStatus === 'online') return null;

  if (!isOnline) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-rose-600/90 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white shadow-xl animate-fade-in border border-rose-400/30">
        <WifiOff className="w-3.5 h-3.5 animate-pulse" />
        <span>Offline Mode • Vault synced on your device</span>
      </div>
    );
  }

  // Degraded reachability / weak signal
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600/90 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white shadow-xl animate-fade-in border border-amber-400/30">
      <CloudAlert className="w-3.5 h-3.5 animate-pulse" />
      <span>Low Connectivity • Serving from local persistence</span>
    </div>
  );
};

