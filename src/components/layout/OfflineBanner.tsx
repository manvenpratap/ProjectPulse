import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

type ConnectivityState = 'online' | 'offline' | 'checking';

export const OfflineBanner: React.FC = () => {
  const [connectivity, setConnectivity] = useState<ConnectivityState>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setConnectivity('online');
    const handleOffline = () => setConnectivity('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (connectivity === 'online') return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between sticky top-0 z-50 backdrop-blur-md select-none">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="truncate">
          <strong>Offline Mode Active:</strong> Working against local browser snapshot. Edits are persisted locally and will synchronize when back online.
        </span>
      </div>
      <button 
        type="button"
        disabled={connectivity === 'checking'}
        onClick={() => {
          setConnectivity('checking');
          if (navigator.onLine) {
            setConnectivity('online');
          } else {
            window.location.reload();
          }
        }}
        className="text-[11px] font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer shrink-0 ml-3 disabled:opacity-50"
      >
        <RefreshCw size={11} className={connectivity === 'checking' ? 'animate-spin' : undefined} /> Recheck
      </button>
    </div>
  );
};

export default OfflineBanner;
