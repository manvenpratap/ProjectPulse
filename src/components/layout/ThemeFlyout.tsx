import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import clsx from 'clsx';

interface ThemeFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES = [
  { id: 'pulse', name: 'Pulse (Technical)', primary: '#38BDF8', bg: '#0D0D0F', surface: 'rgba(13, 13, 15, 0.8)', font: "'Inter', sans-serif", desc: 'Technical Edition with dotted texture and neon cyan highlights.' },
  { id: 'brutalist', name: 'Brutalist', primary: '#f0ff00', bg: '#111111', surface: '#1a1a1a', font: "'Syne', sans-serif", desc: 'High-contrast Heavy Brutalist with neon accents.' },
  { id: 'nexus', name: 'Nexus', primary: '#0f4c5c', bg: '#f8f7f3', surface: '#ffffff', font: "'Fraunces', serif", desc: 'Warm SaaS aesthetic with serif accents.' },
  { id: 'nexus-dark', name: 'Nexus Night', primary: '#0f4c5c', bg: '#0a1f24', surface: '#0f2d35', font: "'Fraunces', serif", desc: 'Refined dark mode for quiet productivity.' },
  { id: 'obsidian', name: 'Obsidian', primary: '#00ff7f', bg: '#050505', surface: '#0f0f0f', font: "'JetBrains Mono', monospace", desc: 'Deep industrial mode with neon highlights.' },
  { id: 'paper', name: 'Paper', primary: '#44403c', bg: '#fcfaf7', surface: '#ffffff', font: "'Fraunces', serif", desc: 'Editorial layout with academic sophistication.' },
  { id: 'paper-dark', name: 'Paper Night', primary: '#d6d3d1', bg: '#1c1917', surface: '#292524', font: "'Fraunces', serif", desc: 'Classic editorial aesthetic for late-night reading.' },
  { id: 'aurora', name: 'Aurora', primary: '#6366f1', bg: '#f8fafc', surface: '#ffffff', font: "'Outfit', sans-serif", desc: 'Vibrant, energetic with soft curves.' },
  { id: 'aurora-dark', name: 'Aurora Dark', primary: '#6366f1', bg: '#0f172a', surface: '#1e293b', font: "'Outfit', sans-serif", desc: 'Celestial dark mode with vibrant accents.' },
  { id: 'chrome', name: 'Chrome', primary: '#22d3ee', bg: '#030712', surface: '#111827', font: "'Orbitron', sans-serif", desc: 'Futuristic sci-fi with sharp glowing accents.' },
  { id: 'titan', name: 'Titan', primary: '#1e293b', bg: '#ffffff', surface: '#ffffff', font: "'Outfit', sans-serif", desc: 'Corporate minimalist focused on precision.' },
  { id: 'titan-dark', name: 'Titan Dark', primary: '#f8fafc', bg: '#020617', surface: '#0f172a', font: "'Outfit', sans-serif", desc: 'Executive night mode for high-stakes focus.' },
  { id: 'midnight', name: 'Midnight', primary: '#58a6ff', bg: '#010409', surface: '#0d1117', font: "'Inter', sans-serif", desc: 'Deep ocean dark mode with high contrast.' },
  { id: 'carbon', name: 'Carbon', primary: '#ff3e3e', bg: '#0a0a0c', surface: '#121214', font: "'Satoshi', sans-serif", desc: 'High-performance with bold red accents.' },
  { id: 'emerald', name: 'Emerald', primary: '#10b981', bg: '#f0fdf4', surface: '#ffffff', font: "'Fraunces', serif", desc: 'Lush refreshing mode with deep green tones.' },
  { id: 'emerald-dark', name: 'Emerald Night', primary: '#10b981', bg: '#022c22', surface: '#064e3b', font: "'Fraunces', serif", desc: 'Deep forest nocturnal aesthetic.' },
  { id: 'champagne', name: 'Champagne', primary: '#c19a6b', bg: '#fcfaf2', surface: '#ffffff', font: "'Fraunces', serif", desc: 'Elite aesthetic with ivory tones.' },
  { id: 'champagne-dark', name: 'Champagne Noir', primary: '#c19a6b', bg: '#1a1814', surface: '#2c2923', font: "'Fraunces', serif", desc: 'Luxury evening mode with golden highlights.' },
  { id: 'lumina', name: 'Lumina', primary: '#3b82f6', bg: '#f8fafc', surface: '#ffffff', font: "'Satoshi', sans-serif", desc: 'Premium modern experience with airy whitespace.' },
  { id: 'lumina-dark', name: 'Lumina Dark', primary: '#3b82f6', bg: '#050811', surface: '#0d1221', font: "'Satoshi', sans-serif", desc: 'Deep blue digital darkness.' },
  { id: 'prism', name: 'Prism', primary: '#ff006e', bg: '#ffffff', surface: '#fdfdfd', font: "'Outfit', sans-serif", desc: 'Vibrant playful multi-color vibes.' },
  { id: 'prism-dark', name: 'Prism Black', primary: '#ff006e', bg: '#000000', surface: '#0a0a0a', font: "'Outfit', sans-serif", desc: 'Neon pop against pure darkness.' },
  { id: 'play', name: 'Play', primary: '#ef4444', bg: '#fef2f2', surface: '#ffffff', font: "'Nunito', sans-serif", desc: 'casual playful UI with soft rounding.' },
  { id: 'play-dark', name: 'Play Dark', primary: '#ef4444', bg: '#2d0505', surface: '#450a0a', font: "'Nunito', sans-serif", desc: 'Fun turned dark with high-energy reds.' },
  { id: 'cyberpunk', name: 'Cyberpunk', primary: '#00f5d4', bg: '#0b051a', surface: '#150a2e', font: "'DM Mono', monospace", desc: 'Neon glitch aesthetic with high contrast.' },
  { id: 'glass', name: 'Glass', primary: '#3b82f6', bg: '#cbd5e1', surface: 'rgba(255,255,255,0.4)', font: "'Plus Jakarta Sans', sans-serif", desc: 'Frosted aesthetics with high transparency and blur.' },
  { id: 'glass-dark', name: 'Glass Dark', primary: '#3b82f6', bg: '#020617', surface: 'rgba(15,23,42,0.5)', font: "'Plus Jakarta Sans', sans-serif", desc: 'Deep frosted glass in a midnight void.' },
  { id: 'terracotta', name: 'Terracotta', primary: '#e05a47', bg: '#f3f4f6', surface: '#ffffff', font: "'Inter', sans-serif", desc: 'Mediterranean warmth with terracotta red tones.' },
  { id: 'fintech', name: 'Fintech', primary: '#0b192c', bg: '#f8f9fa', surface: '#ffffff', font: "'Fraunces', serif", desc: 'Precision Wall Street corporate dark navy and gold.' },
  { id: 'bento', name: 'Bento', primary: '#ff5722', bg: '#e2e8f0', surface: '#ffffff', font: "'Outfit', sans-serif", desc: 'High-density structured bento grid interface with neon orange accents.' },
  { id: 'codename', name: 'Codename', primary: '#e11d48', bg: '#f4f4f5', surface: '#ffffff', font: "'Inter', sans-serif", desc: 'Crimson operational dashboard with high contrast.' },
  { id: 'workflow', name: 'Workflow', primary: '#6366f1', bg: '#eef2ff', surface: '#ffffff', font: "'Satoshi', sans-serif", desc: 'Deep indigo engineering cadence and flow state.' },
  { id: 'terminal', name: 'Terminal', primary: '#58a6ff', bg: '#0d1117', surface: '#161b22', font: "'JetBrains Mono', monospace", desc: 'Hacker developer terminal in GitHub midnight dark.' },
  { id: 'paper-editorial', name: 'Editorial', primary: '#8c4a2f', bg: '#fdf8f0', surface: '#fffdf8', font: "'Fraunces', serif", desc: 'Academic publication grade serif and ivory parchment.' },
  { id: 'aurora-studio', name: 'Studio', primary: '#7c3aed', bg: '#fafafe', surface: '#ffffff', font: "'Satoshi', sans-serif", desc: 'Vibrant creative agency design studio aesthetic.' },
  { id: 'obsidian-dark', name: 'Obsidian OLED', primary: '#00ff7f', bg: '#000000', surface: '#0a0a0a', font: "'JetBrains Mono', monospace", desc: 'Pure pitch-black OLED mode with radioactive emerald highlights.' },
  { id: 'origin', name: 'Origin', primary: '#0f4c5c', bg: '#faf9f6', surface: '#ffffff', font: "'Fraunces', serif", desc: 'Minimalist clean foundational canvas.' },
  { id: 'slate', name: 'Slate Amber', primary: '#f59e0b', bg: '#1a1b2e', surface: '#232440', font: "'Outfit', sans-serif", desc: 'Nordic dusk with amber glow highlights.' }
];

const ThemeFlyout: React.FC<ThemeFlyoutProps> = ({ isOpen, onClose }) => {
  const { state, setTheme } = useProject();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[480px] max-w-full h-[100dvh] bg-[var(--color-surface)] border-l border-[var(--color-divider)] shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-4 sm:p-6 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))] border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div>
                <h3 className="text-lg sm:text-xl font-display font-black text-[var(--color-text)] tracking-tight">System Aesthetics</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium">Reconfigure the project visual intelligence layer</p>
              </div>
              <button 
                onClick={onClose}
                aria-label="Close aesthetics flyout"
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--color-surface-offset)] rounded-xl transition-colors text-[var(--color-text-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
              {THEMES.map((t) => {
                const isActive = state.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={clsx(
                      "w-full text-left p-4 rounded-3xl border-2 transition-colors duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] group relative overflow-hidden flex items-center gap-5",
                      isActive 
                        ? "border-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] shadow-sm" 
                        : "border-[var(--color-divider)] hover:border-[var(--color-text-faint)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"
                    )}
                  >
                    {/* Theme Preview Card */}
                    <div 
                      className="w-32 h-24 rounded-2xl border border-black/5 overflow-hidden shrink-0 shadow-inner flex relative"
                      style={{ backgroundColor: t.bg }}
                    >
                       <div className="w-6 h-full shrink-0" style={{ backgroundColor: t.primary }} />
                       <div className="flex-1 p-2 space-y-1.5 opacity-60">
                          <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: t.primary, opacity: 0.3 }} />
                          <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: t.primary, opacity: 0.15 }} />
                          <div className="mt-2 grid grid-cols-2 gap-1">
                             <div className="h-6 rounded-lg" style={{ backgroundColor: t.surface, border: `1px solid ${t.primary}15` }} />
                             <div className="h-6 rounded-lg" style={{ backgroundColor: t.surface, border: `1px solid ${t.primary}15` }} />
                          </div>
                       </div>
                       {/* Font Preview Overlay */}
                       <div className="absolute inset-x-0 bottom-0 p-2 flex justify-end">
                          <div 
                            className="bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm border border-black/5"
                            style={{ fontFamily: t.font, fontSize: '14px', color: t.primary }}
                          >
                             Aa
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-bold text-sm text-[var(--color-text)]"
                          style={{ fontFamily: t.font }}
                        >
                          {t.name}
                        </span>
                        {isActive && (
                           <div className="bg-[var(--color-primary-hex)] text-white p-0.5 rounded-full">
                              <Check size={8} strokeWidth={4} />
                           </div>
                        )}
                      </div>
                      <p 
                        className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-medium line-clamp-2"
                        style={{ fontFamily: t.font }}
                      >
                        {t.desc}
                      </p>
                      <div className="mt-2 flex items-center gap-2 opacity-40">
                         <span className="text-xs font-mono font-medium" style={{ fontFamily: t.font }}>{t.font.split(',')[0].replace(/'/g, '')}</span>
                      </div>
                    </div>

                    {!isActive && (
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.primary }} />
                       </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]">
              <button 
                onClick={onClose}
                className="w-full py-3.5 bg-[var(--color-primary)] text-white font-bold text-xs rounded-2xl shadow-md active:scale-[0.98] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              >
                Seal Configuration
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ThemeFlyout;
