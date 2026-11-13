import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sun, Moon, Star, Palette } from 'lucide-react';
import clsx from 'clsx';
import { THEMES, ThemeDef, DARK_MAP, LIGHT_MAP, ThemeGrid, ThemePreviewStage, getContrastInk, computePreviewMetrics } from '../shared/ThemeGrid';
import { runCircularThemeTransition } from '../../utils/designSpells';

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
  const previewMetrics = useMemo(() => computePreviewMetrics(state.tasks), [state.tasks]);

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

  // Handler for explicit Light / Dark segmented toggle (with circular iris reveal)
  const handleToggleColorMode = (targetMode: 'light' | 'dark', event?: React.MouseEvent) => {
    runCircularThemeTransition(() => {
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
    }, event);
  };

  const activeThemeObj = useMemo(() => {
    return THEMES.find(t => t.id === state.theme) || THEMES[0];
  }, [state.theme]);

  // Escape key dismissal for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const displayedTheme = hoveredTheme || activeThemeObj;
  const displayedFooterBg = displayedTheme.surfaceOpaque || displayedTheme.surface;
  const isPreviewingHovered = Boolean(hoveredTheme && hoveredTheme.id !== state.theme);

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
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Slide */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="System Aesthetics & Themes"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 w-full sm:w-[560px] md:w-[620px] h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)] border-l border-[var(--color-divider)] shadow-2xl z-[101] flex flex-col overflow-hidden"
          >
            {/* Animated accent gradient line */}
            <div className="h-[2.5px] w-full shrink-0 bg-gradient-to-r from-transparent via-[var(--color-primary-hex)] to-transparent bg-[length:300%_100%] animate-pulse" />

            {/* Header */}
            <div className="p-4 sm:p-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] border-b border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-between gap-2.5 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Palette size={17} className="text-[var(--color-primary-hex)] shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] tracking-tight leading-tight">
                    System Aesthetics & Themes
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)] shrink-0">
                    {THEMES.length}<span className="hidden sm:inline"> Themes</span>
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
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
              {/* ── 1. "Now Playing" Live Cockpit Stage Preview ── */}
              <div
                className="rounded-2xl border-2 transition-all duration-200 overflow-hidden"
                style={{
                  backgroundColor: displayedTheme.bg,
                  borderColor: displayedTheme.primary,
                  boxShadow: `0 8px 28px ${displayedTheme.primary}28`
                }}
              >
                {/* Live interactive scaled viewport */}
                <ThemePreviewStage
                  theme={displayedTheme}
                  variant="hero"
                  metrics={previewMetrics}
                  projectTitle={state.projectName}
                />

                {/* Theme Specification Footer */}
                <div
                  className="p-3.5 sm:p-4 space-y-3"
                  style={{
                    backgroundColor: displayedFooterBg,
                    color: displayedTheme.text,
                    borderTop: `1px solid ${displayedTheme.border}`
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-base font-bold tracking-tight truncate"
                          style={{ color: displayedTheme.text, fontFamily: displayedTheme.font }}
                        >
                          {displayedTheme.name}
                        </span>
                        {displayedTheme.featured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0 flex items-center gap-1">
                            <Star size={10} className="fill-amber-500" />
                            Featured
                          </span>
                        )}
                        {displayedTheme.id === state.theme ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                            style={{
                              backgroundColor: displayedTheme.primary,
                              color: getContrastInk(displayedTheme.primary)
                            }}
                          >
                            <Check size={10} strokeWidth={3} />
                            Active
                          </span>
                        ) : isPreviewingHovered && (
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
                            style={{
                              backgroundColor: displayedTheme.surface2,
                              color: displayedTheme.textMuted,
                              border: `1px solid ${displayedTheme.border}`
                            }}
                          >
                            Live Preview
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs leading-relaxed mt-1"
                        style={{ color: displayedTheme.textMuted }}
                      >
                        {displayedTheme.desc}
                      </p>
                    </div>

                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: displayedTheme.surface2,
                        color: displayedTheme.textMuted,
                        border: `1px solid ${displayedTheme.border}`
                      }}
                    >
                      {displayedTheme.isDark ? 'Dark' : 'Light'}
                    </span>
                  </div>

                  {/* Architecture Token Breakdown Bar */}
                  <div
                    className="pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                    style={{ borderTop: `1px solid ${displayedTheme.border}` }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { label: 'Canvas', color: displayedTheme.bg },
                        { label: 'Surface', color: displayedFooterBg },
                        { label: 'Accent', color: displayedTheme.primary },
                        { label: 'Ink', color: displayedTheme.text }
                      ].map(tok => (
                        <div key={tok.label} className="flex items-center gap-1.5 font-mono text-[10.5px]" style={{ color: displayedTheme.textMuted }}>
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{
                              backgroundColor: tok.color,
                              border: `1px solid ${displayedTheme.isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.2)'}`
                            }}
                          />
                          <span>{tok.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10.5px]" style={{ color: displayedTheme.textMuted }}>
                      <span>{displayedTheme.font.split(',')[0].replace(/'/g, '')}</span>
                      <span>·</span>
                      <span>{displayedTheme.radiusPx}px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Segmented Color Mode Toggle ── */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl">
                <button
                  type="button"
                  onClick={(e) => handleToggleColorMode('light', e)}
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
                  onClick={(e) => handleToggleColorMode('dark', e)}
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
