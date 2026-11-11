import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sun, Moon, Star, Palette } from 'lucide-react';
import clsx from 'clsx';
import { THEMES, ThemeDef, DARK_MAP, LIGHT_MAP, ThemeGrid } from '../shared/ThemeGrid';

// Re-export ThemeDef for backward compatibility with existing callers
export type { ThemeDef };
export { THEMES };

interface ThemeFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeFlyout: React.FC<ThemeFlyoutProps> = ({ isOpen, onClose }) => {
  const { state, setTheme } = useProject();
  const [hoveredTheme, setHoveredTheme] = useState<ThemeDef | null>(null);

  // Read initial color-mode
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    const attr = document.documentElement.getAttribute('data-color-mode');
    if (attr === 'dark' || attr === 'light') return attr;
    const current = THEMES.find(t => t.id === state.theme);
    return current?.isDark ? 'dark' : 'light';
  });

  // Keep colorMode in sync if state.theme changes externally
  useEffect(() => {
    const cur = THEMES.find(t => t.id === state.theme);
    if (cur) {
      const mode = cur.isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-color-mode', mode);
      setColorMode(mode);
    }
  }, [state.theme]);

  // Handler for explicit Light / Dark segmented toggle
  const handleToggleColorMode = (targetMode: 'light' | 'dark') => {
    setColorMode(targetMode);
    document.documentElement.setAttribute('data-color-mode', targetMode);
    localStorage.setItem('pp-color-mode', targetMode);

    if (targetMode === 'dark') {
      const counterpart = DARK_MAP[state.theme];
      if (counterpart) {
        setTheme(counterpart);
      }
    } else {
      const counterpart = LIGHT_MAP[state.theme];
      if (counterpart) {
        setTheme(counterpart);
      }
    }
  };

  const activeThemeObj = useMemo(() => {
    return THEMES.find(t => t.id === state.theme) || THEMES[0];
  }, [state.theme]);

  const displayedTheme = hoveredTheme || activeThemeObj;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Slide */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 w-full sm:w-[540px] md:w-[600px] h-[100dvh] bg-[var(--color-surface)] border-l border-[var(--color-divider)] shadow-2xl z-[101] flex flex-col overflow-hidden"
          >
            {/* Animated accent gradient line */}
            <div className="h-[2.5px] w-full shrink-0 bg-gradient-to-r from-transparent via-[var(--color-primary-hex)] to-transparent bg-[length:300%_100%] animate-pulse" />

            {/* Header */}
            <div className="p-4 sm:p-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] border-b border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Palette size={18} className="text-[var(--color-primary-hex)] shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight truncate">
                    System Aesthetics & Themes
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)] shrink-0">
                    {THEMES.length} Themes
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate italic">
                  Now active: <span className="font-semibold text-[var(--color-text)]">{activeThemeObj.name}</span> · {activeThemeObj.isDark ? 'Dark' : 'Light'} Mode
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close theme studio"
                className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary-hex)] flex items-center justify-center transition-all duration-150 text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scroll">
              {/* ── 1. "Now Playing" Active Theme Hero Card ── */}
              <div
                className="p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden"
                style={{
                  backgroundColor: displayedTheme.bg,
                  borderColor: displayedTheme.primary,
                  boxShadow: `0 4px 20px ${displayedTheme.primary}25`
                }}
              >
                <div className="flex items-start gap-3.5">
                  {/* Accent swatch preview */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md border-2"
                    style={{
                      backgroundColor: displayedTheme.bg,
                      borderColor: displayedTheme.primary,
                      boxShadow: `0 2px 10px ${displayedTheme.primary}40`
                    }}
                  >
                    <Palette size={22} style={{ color: displayedTheme.primary }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-base font-bold tracking-tight truncate"
                        style={{ color: displayedTheme.isDark ? '#f8fafc' : '#0f172a' }}
                      >
                        {displayedTheme.name}
                      </span>
                      {displayedTheme.featured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 flex items-center gap-1">
                          <Star size={10} className="fill-amber-500" />
                          Featured
                        </span>
                      )}
                      {displayedTheme.id === state.theme && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                          <Check size={10} strokeWidth={3} />
                          Active
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs leading-relaxed mt-1"
                      style={{ color: displayedTheme.isDark ? '#94a3b8' : '#64748b' }}
                    >
                      {displayedTheme.desc}
                    </p>
                  </div>
                </div>

                {/* Swatches breakdown bar */}
                <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: displayedTheme.isDark ? '#cbd5e1' : '#475569' }}>
                      <span className="w-3 h-3 rounded-md shadow-2xs border border-black/10" style={{ backgroundColor: displayedTheme.primary }} />
                      <span>{displayedTheme.primary}</span>
                    </div>
                    <span className="text-[var(--color-divider)]">•</span>
                    <span className="font-mono text-[11px]" style={{ color: displayedTheme.isDark ? '#cbd5e1' : '#475569' }}>
                      {displayedTheme.font.split(',')[0].replace(/'/g, '')}
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: displayedTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      color: displayedTheme.isDark ? '#94a3b8' : '#64748b'
                    }}
                  >
                    {displayedTheme.isDark ? 'Dark Theme' : 'Light Theme'}
                  </span>
                </div>
              </div>

              {/* ── 2. Segmented Color Mode Toggle ── */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl">
                <button
                  type="button"
                  onClick={() => handleToggleColorMode('light')}
                  className={clsx(
                    "min-h-[44px] py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer",
                    colorMode === 'light'
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  <Sun size={15} className="text-amber-500" />
                  <span>Light Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleColorMode('dark')}
                  className={clsx(
                    "min-h-[44px] py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer",
                    colorMode === 'dark'
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  <Moon size={15} className="text-indigo-400" />
                  <span>Dark Mode</span>
                </button>
              </div>

              {/* ── 3. Consolidated ThemeGrid Component ── */}
              <ThemeGrid
                compact={true}
                selectedTheme={state.theme}
                onHoverTheme={setHoveredTheme}
                showSearch={true}
                showCategories={true}
              />
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-[var(--color-text-muted)] min-w-0">
                Current: <span className="font-bold text-[var(--color-text)] truncate">{activeThemeObj.name}</span>
              </div>
              <button
                onClick={onClose}
                className="py-2.5 px-6 min-h-[44px] bg-[var(--color-primary)] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
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
