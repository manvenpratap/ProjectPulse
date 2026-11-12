import React, { useEffect, useMemo, useState } from 'react';
import { encode } from 'uqr';
import { Check, Copy, Compass, ExternalLink, QrCode, Smartphone, Wifi, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface MobileLaunchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const isLoopbackHost = (hostname: string): boolean => {
  const h = hostname.trim().toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
};

export const isDesktopWebShell = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !cap?.isNativePlatform?.();
};

export function resolveMobileLaunchUrl(
  baseOrigin: string,
  targetMode: 'home' | 'current',
  currentHash = ''
): string {
  const cleanOrigin = baseOrigin.trim().replace(/\/+$/, '');
  if (!cleanOrigin) return '';
  if (targetMode === 'current' && currentHash && currentHash !== '#' && currentHash !== '#/') {
    const normalizedHash = currentHash.startsWith('#') ? currentHash : `#${currentHash}`;
    return `${cleanOrigin}/${normalizedHash}`;
  }
  return cleanOrigin;
}

const MobileLaunchQrModal: React.FC<MobileLaunchQrModalProps> = ({ isOpen, onClose }) => {
  const [lanUrls, setLanUrls] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [targetMode, setTargetMode] = useState<'home' | 'current'>('home');
  const [copied, setCopied] = useState(false);

  const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  const hasSubRoute = Boolean(currentHash && currentHash !== '#' && currentHash !== '#/');

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    let active = true;
    const origin = window.location.origin;
    const host = window.location.hostname;
    setBaseUrl(origin);

    if (!isLoopbackHost(host)) {
      setLanUrls([origin]);
      return;
    }

    fetch('/api/network-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { lanUrls?: string[] } | null) => {
        if (!active || !data?.lanUrls?.length) return;
        setLanUrls(data.lanUrls);
        setBaseUrl(data.lanUrls[0]);
      })
      .catch(() => {
        if (active) setLanUrls([]);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const finalUrl = useMemo(
    () => resolveMobileLaunchUrl(baseUrl, hasSubRoute ? targetMode : 'home', currentHash),
    [baseUrl, hasSubRoute, targetMode, currentHash]
  );

  const urlValidation = useMemo(() => {
    if (!finalUrl) return { valid: false, loopback: false, host: '' };
    try {
      const parsed = new URL(finalUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, loopback: false, host: '' };
      }
      return {
        valid: true,
        loopback: isLoopbackHost(parsed.hostname),
        host: parsed.host,
      };
    } catch {
      return { valid: false, loopback: false, host: '' };
    }
  }, [finalUrl]);

  const qrSvgData = useMemo(() => {
    if (!urlValidation.valid) return null;
    const result = encode(finalUrl, { ecc: 'M', border: 2 });
    const parts: string[] = [];
    for (let y = 0; y < result.size; y++) {
      const row = result.data[y];
      for (let x = 0; x < result.size; x++) {
        if (row[x]) parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return {
      size: result.size,
      path: parts.join(''),
    };
  }, [finalUrl, urlValidation.valid]);

  const handleCopy = async () => {
    if (!finalUrl) return;
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable on non-HTTPS origins; input remains selectable
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Launch on Safari" size="md">
      <div className="py-1 space-y-4">
        {/* Route Scope Switcher (only shown when desktop is on a deep screen/sub-tab) */}
        {hasSubRoute && (
          <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <button
              type="button"
              onClick={() => setTargetMode('home')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                targetMode === 'home'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs border border-[var(--color-divider)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Workspace Home
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('current')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                targetMode === 'current'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs border border-[var(--color-divider)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Compass size={12} />
              Current View
            </button>
          </div>
        )}

        {/* High-Contrast Quiet-Zone QR Stage */}
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
            {qrSvgData ? (
              <svg
                viewBox={`0 0 ${qrSvgData.size} ${qrSvgData.size}`}
                className="w-[208px] h-[208px] block"
                shapeRendering="crispEdges"
                role="img"
                aria-label={`QR code to open ProjectPulse in Mobile Safari at ${finalUrl}`}
              >
                <rect width={qrSvgData.size} height={qrSvgData.size} fill="#ffffff" />
                <path d={qrSvgData.path} fill="#0f172a" />
              </svg>
            ) : (
              <div className="w-[208px] h-[208px] flex flex-col items-center justify-center text-center text-xs text-slate-500 gap-2 px-4">
                <AlertTriangle size={20} className="text-amber-500" />
                <span>Enter a valid http:// or https:// URL below</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[var(--color-text-muted)]">
            <Smartphone size={13} className="text-[var(--color-primary-hex)] shrink-0" />
            <span>Scan with iPhone Camera to launch in Safari</span>
          </div>
        </div>

        {/* LAN Interface Selector (if multiple Wi-Fi/Ethernet IPs discovered) */}
        {lanUrls.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {lanUrls.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setBaseUrl(candidate)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                  baseUrl === candidate
                    ? 'bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/40 text-[var(--color-primary-hex)] font-semibold'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {candidate.replace(/^https?:\/\//, '')}
              </button>
            ))}
          </div>
        )}

        {/* Loopback Warning when offline / static preview */}
        {urlValidation.loopback && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
            <span>
              <strong>localhost</strong> is not reachable from another phone. Connect to Wi-Fi and enter your computer&apos;s LAN IP (e.g. <code>http://192.168.1.10:3000</code>).
            </span>
          </div>
        )}

        {/* URL Field + Copy Action */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Wifi
                size={13}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none"
              />
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                aria-label="Mobile Safari target URL"
                placeholder="http://192.168.x.x:3000"
                className="w-full h-9 pl-8 pr-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              disabled={!urlValidation.valid}
              className="h-9 px-3 rounded-xl shrink-0"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>

            {urlValidation.valid && (
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open URL in new tab"
                aria-label="Open URL in new tab"
                className="h-9 w-9 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const MobileLaunchQrButton: React.FC<{ iconSize?: number; className?: string }> = ({
  iconSize = 18,
  className = 'hidden lg:flex rounded-xl min-h-[36px] min-w-[36px]',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!isDesktopWebShell()) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Open in Mobile Safari (QR Code)"
        aria-label="Open in Mobile Safari QR Code"
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <QrCode size={iconSize} />
      </Button>
      <MobileLaunchQrModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default MobileLaunchQrModal;
