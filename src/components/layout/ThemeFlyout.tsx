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
  { id: 'nexus', name: 'Nexus', desc: 'Warm, refined SaaS aesthetic with serif accents.' },
  { id: 'obsidian', name: 'Obsidian', desc: 'Deep industrial mode with neon industrial highlights.' },
  { id: 'paper', name: 'Paper', desc: 'Editorial layout with academic sophistication.' },
  { id: 'aurora', name: 'Aurora', desc: 'Vibrant, energetic with soft curves and playful colors.' },
  { id: 'chrome', name: 'Chrome', desc: 'Futuristic sci-fi interface with sharp glowing accents.' },
  { id: 'titan', name: 'Titan', desc: 'Corporate minimalist design focused on precision.' },
  { id: 'midnight', name: 'Midnight', desc: 'Deep ocean dark mode with high contrast blue.' },
  { id: 'carbon', name: 'Carbon', desc: 'High-performance dark mode with bold red accents.' },
  { id: 'emerald', name: 'Emerald', desc: 'Lush refreshing light mode with deep green tones.' },
  { id: 'champagne', name: 'Champagne', desc: 'Elite aesthetic with gold accents and ivory tones.' },
  { id: 'lumina', name: 'Lumina', desc: 'Premium modern light experience with airy whitespace.' },
  { id: 'prism', name: 'Prism', desc: 'Multi-color iconography and vibrant playful vibes.' },
  { id: 'play', name: 'Play', desc: 'Themed for fun with casual playful UI elements.' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'High-contrast neon glitch aesthetic with sharp edges.' }
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
            className="fixed top-0 right-0 w-[440px] max-w-full h-screen bg-[var(--color-surface)] border-l border-[var(--color-divider)] shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">Appearance & Design</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Select a visual personality for your workspace.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[var(--color-surface-offset)] rounded-full transition-colors text-[var(--color-text-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
              {THEMES.map((t) => {
                const isActive = state.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={clsx(
                      "w-full text-left p-5 rounded-2xl border-2 transition-all group relative overflow-hidden",
                      isActive 
                        ? "border-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)]" 
                        : "border-[var(--color-divider)] hover:border-[var(--color-text-faint)] bg-[var(--color-surface)]"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{t.name}</span>
                      <div className="flex gap-2 bg-black/5 p-1 rounded-full">
                        <div 
                          className="w-4 h-4 rounded-full border border-black/10" 
                          style={{ backgroundColor: `var(--theme-${t.id}-color)` }} 
                        />
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed relative z-10">{t.desc}</p>
                    
                    {isActive && (
                      <div className="absolute top-4 right-4 z-20">
                        <div className="bg-[var(--color-primary-hex)] text-white p-1 rounded-full">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-6 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--color-primary-highlight)] hover:opacity-90 transition-all active:scale-[0.98]"
              >
                Apply Personality
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ThemeFlyout;
