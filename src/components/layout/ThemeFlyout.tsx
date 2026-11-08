import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Search, Sun, Moon, Sparkles, Palette } from 'lucide-react';
import clsx from 'clsx';

interface ThemeFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ThemeDef {
  id: string;
  name: string;
  primary: string;
  bg: string;
  surface: string;
  font: string;
  desc: string;
  emoji: string;
  isDark: boolean;
  featured: boolean;
  legacy?: boolean;
}

const THEMES: ThemeDef[] = [
  // ── ✦ FEATURED THEMES — 6 Distinct Design Systems from projectpulse.html + Pulse ──
  {
    id: 'origin',
    name: 'Origin',
    primary: '#0f4c5c',
    bg: '#faf9f6',
    surface: '#ffffff',
    font: "'Fraunces', serif",
    desc: 'Classic enterprise. Sharp corners, editorial serif, restraint.',
    emoji: '🏛',
    isDark: false,
    featured: true
  },
  {
    id: 'nova',
    name: 'Nova',
    primary: '#6366f1',
    bg: '#f5f6ff',
    surface: '#ffffff',
    font: "'Outfit', sans-serif",
    desc: 'Modern SaaS. Rounded, glassy, vibrant indigo energy.',
    emoji: '✦',
    isDark: false,
    featured: true
  },
  {
    id: 'terminal',
    name: 'Terminal',
    primary: '#0969da',
    bg: '#f6f8fa',
    surface: '#ffffff',
    font: "'JetBrains Mono', monospace",
    desc: 'Developer-first. Monospace precision, standard daily heatmap layout.',
    emoji: '⌨',
    isDark: false,
    featured: true
  },
  {
    id: 'aurora-studio',
    name: 'Aurora',
    primary: '#8656f6',
    bg: '#fafafe',
    surface: '#ffffff',
    font: "'Satoshi', sans-serif",
    desc: 'Creative studio. Gradient-rich, glassmorphic, expressive.',
    emoji: '🌌',
    isDark: false,
    featured: true
  },
  {
    id: 'obsidian-dark',
    name: 'Obsidian',
    primary: '#008948',
    bg: '#040404',
    surface: '#0a0a0a',
    font: "'JetBrains Mono', monospace",
    desc: 'Night operator. Void black, neon green. Pure dark experience.',
    emoji: '◼',
    isDark: true,
    featured: true
  },
  {
    id: 'paper-editorial',
    name: 'Paper',
    primary: '#b5451b',
    bg: '#fdf8f0',
    surface: '#fffdf8',
    font: "'Fraunces', serif",
    desc: 'Editorial warmth. Double serif, warm cream, quiet elegance.',
    emoji: '📄',
    isDark: false,
    featured: true
  },
  {
    id: 'pulse',
    name: 'Pulse (Technical)',
    primary: '#38BDF8',
    bg: '#0D0D0F',
    surface: 'rgba(13, 13, 15, 0.8)',
    font: "'Inter', sans-serif",
    desc: 'Technical Edition with dotted texture and neon cyan highlights.',
    emoji: '⚡',
    isDark: true,
    featured: true
  },

  // ── LEGACY & EXTENDED THEMES — All 20 preserved & fully functional ──
  {
    id: 'nexus',
    name: 'Nexus',
    primary: '#0f4c5c',
    bg: '#f8f7f3',
    surface: '#ffffff',
    font: "'Fraunces', serif",
    desc: 'Classical elegance with serif titles and soft neutral tones.',
    emoji: '🏛',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'nexus-dark',
    name: 'Nexus Night',
    primary: '#4f98a3',
    bg: '#0a1f24',
    surface: '#0f2d35',
    font: "'Fraunces', serif",
    desc: 'Refined dark mode for quiet productivity.',
    emoji: '🌌',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'obsidian',
    name: 'Obsidian Classic',
    primary: '#008944',
    bg: '#050505',
    surface: '#0f0f0f',
    font: "'JetBrains Mono', monospace",
    desc: 'Deep neon industrial vibe with tactical monospace typography.',
    emoji: '◼',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'paper',
    name: 'Paper Classic',
    primary: '#44403c',
    bg: '#fcfaf7',
    surface: '#ffffff',
    font: "'Fraunces', serif",
    desc: 'Editorial layout with clean lines and academic sophistication.',
    emoji: '📄',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'paper-dark',
    name: 'Paper Night',
    primary: '#6b9bd1',
    bg: '#1c1917',
    surface: '#292524',
    font: "'Fraunces', serif",
    desc: 'Classic editorial aesthetic for late-night reading.',
    emoji: '📜',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'aurora',
    name: 'Aurora Classic',
    primary: '#6265f1',
    bg: '#f8fafc',
    surface: '#ffffff',
    font: "'Outfit', sans-serif",
    desc: 'Vibrant and energetic with soft curves and playful colors.',
    emoji: '🌈',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'aurora-dark',
    name: 'Aurora Dark',
    primary: '#a78bfa',
    bg: '#0f172a',
    surface: '#1e293b',
    font: "'Outfit', sans-serif",
    desc: 'Celestial dark mode with vibrant accents.',
    emoji: '✨',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'chrome',
    name: 'Chrome',
    primary: '#0b8395',
    bg: '#030712',
    surface: '#111827',
    font: "'Orbitron', sans-serif",
    desc: 'Futuristic sci-fi interface with sharp edges and glowing accents.',
    emoji: '💿',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'titan',
    name: 'Titan',
    primary: '#1e293b',
    bg: '#ffffff',
    surface: '#ffffff',
    font: "'Outfit', sans-serif",
    desc: 'Corporate minimalist design focused on clarity and precision.',
    emoji: '🛡️',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'titan-dark',
    name: 'Titan Dark',
    primary: '#f8fafc',
    bg: '#020617',
    surface: '#0f172a',
    font: "'Outfit', sans-serif",
    desc: 'Executive night mode for high-stakes focus.',
    emoji: '🛡️',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'lumina',
    name: 'Lumina',
    primary: '#1e70f5',
    bg: '#f8fafc',
    surface: '#ffffff',
    font: "'Satoshi', sans-serif",
    desc: 'Premium modern light experience with airy whitespace and glassmorphism.',
    emoji: '✨',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'lumina-dark',
    name: 'Lumina Dark',
    primary: '#3b82f6',
    bg: '#050811',
    surface: '#0d1221',
    font: "'Satoshi', sans-serif",
    desc: 'Deep blue digital darkness.',
    emoji: '💡',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    primary: '#008674',
    bg: '#0b051a',
    surface: '#150a2e',
    font: "'DM Mono', monospace",
    desc: 'High-contrast neon glitch aesthetic with monospace precision.',
    emoji: '👾',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'midnight',
    name: 'Midnight',
    primary: '#0071f3',
    bg: '#010409',
    surface: '#0d1117',
    font: "'Inter', sans-serif",
    desc: 'Deep ocean dark mode with high readability and blue accents.',
    emoji: '🌙',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'champagne',
    name: 'Champagne',
    primary: '#976f3f',
    bg: '#fcfaf2',
    surface: '#ffffff',
    font: "'Fraunces', serif",
    desc: 'Royal elite aesthetic with gold accents and ivory tones.',
    emoji: '🥂',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'champagne-dark',
    name: 'Champagne Noir',
    primary: '#c19a6b',
    bg: '#1a1814',
    surface: '#2c2923',
    font: "'Fraunces', serif",
    desc: 'Luxury evening mode with golden highlights.',
    emoji: '🥂',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'carbon',
    name: 'Carbon',
    primary: '#ef0000',
    bg: '#0a0a0c',
    surface: '#121214',
    font: "'Satoshi', sans-serif",
    desc: 'High-performance dark mode with monospace details and bold red accents.',
    emoji: '🏎️',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primary: '#0c875e',
    bg: '#f0fdf4',
    surface: '#ffffff',
    font: "'Fraunces', serif",
    desc: 'Lush and refreshing light mode with deep emerald tones and soft curves.',
    emoji: '💎',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'emerald-dark',
    name: 'Emerald Night',
    primary: '#10b981',
    bg: '#022c22',
    surface: '#064e3b',
    font: "'Fraunces', serif",
    desc: 'Deep forest nocturnal aesthetic.',
    emoji: '🌲',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'prism',
    name: 'Prism',
    primary: '#e90065',
    bg: '#ffffff',
    surface: '#fdfdfd',
    font: "'Outfit', sans-serif",
    desc: 'Multi-color iconography and vibrant accents for a playful, energetic experience.',
    emoji: '🔮',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'prism-dark',
    name: 'Prism Black',
    primary: '#ff006e',
    bg: '#000000',
    surface: '#0a0a0a',
    font: "'Outfit', sans-serif",
    desc: 'Neon pop against pure darkness.',
    emoji: '🔮',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'play',
    name: 'Play',
    primary: '#eb1616',
    bg: '#fef2f2',
    surface: '#ffffff',
    font: "'Nunito', sans-serif",
    desc: 'A fun, casual theme using only emoji icons for a simplified workspace.',
    emoji: '🎈',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'play-dark',
    name: 'Play Dark',
    primary: '#ef4444',
    bg: '#2d0505',
    surface: '#450a0a',
    font: "'Nunito', sans-serif",
    desc: 'Fun turned dark with high-energy reds.',
    emoji: '🎈',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'slate',
    name: 'Slate',
    primary: '#a56a07',
    bg: '#1a1b2e',
    surface: '#232440',
    font: "'Outfit', sans-serif",
    desc: 'A premium warm amber dark theme for sophisticated SaaS workflows.',
    emoji: '🪨',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'terracotta',
    name: 'Terra Cotta',
    primary: '#da3c26',
    bg: '#f3f4f6',
    surface: '#ffffff',
    font: "'Inter', sans-serif",
    desc: 'Executive financial dashboard with warm terracotta accents, crisp white cards, and distinct hierarchy.',
    emoji: '🏺',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'fintech',
    name: 'Fintech Gold',
    primary: '#0b192c',
    bg: '#f8f9fa',
    surface: '#ffffff',
    font: "'Fraunces', serif",
    desc: 'High-end editorial banking experience combining elegant serif headers with deep navy slate and soft gold accents.',
    emoji: '💳',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'bento',
    name: 'Vibrant Bento',
    primary: '#df3600',
    bg: '#e2e8f0',
    surface: '#ffffff',
    font: "'Outfit', sans-serif",
    desc: 'Bold, high-contrast bento grid layout with saturated primary orange/blue cards and playful pill badges.',
    emoji: '🍱',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'codename',
    name: 'Codename SaaS',
    primary: '#e11d48',
    bg: '#f4f4f5',
    surface: '#ffffff',
    font: "'Inter', sans-serif",
    desc: 'Premium dark-accented SaaS dashboard with a crisp light outer shell and rose crimson highlights.',
    emoji: '🏷️',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'workflow',
    name: 'Workflow Glass',
    primary: '#6265f1',
    bg: '#eef2ff',
    surface: '#ffffff',
    font: "'Satoshi', sans-serif",
    desc: 'Smooth glassmorphism SaaS interface with floating violet containers, soft rounded corners, and duotone icon blobs.',
    emoji: '⚡',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'nova-dark',
    name: 'Nova Dark',
    primary: '#a78bfa',
    bg: '#07070f',
    surface: '#0f1020',
    font: "'Outfit', sans-serif",
    desc: 'Nocturnal SaaS with luminescent violet accents and obsidian depth.',
    emoji: '✦',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    primary: '#f0ff00',
    bg: '#111111',
    surface: '#1a1a1a',
    font: "'Syne', sans-serif",
    desc: 'High-contrast Heavy Brutalist with neon accents.',
    emoji: '📐',
    isDark: true,
    featured: false,
    legacy: true
  },
  {
    id: 'glass',
    name: 'Glass',
    primary: '#3b82f6',
    bg: '#cbd5e1',
    surface: 'rgba(255,255,255,0.4)',
    font: "'Plus Jakarta Sans', sans-serif",
    desc: 'Frosted aesthetics with high transparency and blur.',
    emoji: '🪟',
    isDark: false,
    featured: false,
    legacy: true
  },
  {
    id: 'glass-dark',
    name: 'Glass Dark',
    primary: '#3b82f6',
    bg: '#020617',
    surface: 'rgba(15,23,42,0.5)',
    font: "'Plus Jakarta Sans', sans-serif",
    desc: 'Deep frosted glass in a midnight void.',
    emoji: '🪟',
    isDark: true,
    featured: false,
    legacy: true
  }
];

const DARK_MAP: Record<string, string> = {
  nexus: 'nexus-dark',
  paper: 'paper-dark',
  aurora: 'aurora-dark',
  titan: 'titan-dark',
  emerald: 'emerald-dark',
  champagne: 'champagne-dark',
  lumina: 'lumina-dark',
  prism: 'prism-dark',
  play: 'play-dark',
  glass: 'glass-dark',
  origin: 'obsidian-dark',
  nova: 'nova-dark'
};

const LIGHT_MAP: Record<string, string> = {
  'nexus-dark': 'nexus',
  'paper-dark': 'paper',
  'aurora-dark': 'aurora',
  'titan-dark': 'titan',
  'emerald-dark': 'emerald',
  'champagne-dark': 'champagne',
  'lumina-dark': 'lumina',
  'prism-dark': 'prism',
  'play-dark': 'play',
  'glass-dark': 'glass',
  'obsidian-dark': 'origin',
  'nova-dark': 'nova'
};

type FilterCategory = 'all' | 'featured' | 'light' | 'dark' | 'classic';

const ThemeFlyout: React.FC<ThemeFlyoutProps> = ({ isOpen, onClose }) => {
  const { state, setTheme } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
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

  // Filtered themes
  const filteredThemes = useMemo(() => {
    return THEMES.filter(t => {
      // Category filter
      if (activeFilter === 'featured' && !t.featured) return false;
      if (activeFilter === 'light' && t.isDark) return false;
      if (activeFilter === 'dark' && !t.isDark) return false;
      if (activeFilter === 'classic' && !t.legacy) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesDesc = t.desc.toLowerCase().includes(query);
        const matchesFont = t.font.toLowerCase().includes(query);
        const matchesId = t.id.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesFont || matchesId;
      }
      return true;
    });
  }, [activeFilter, searchQuery]);

  const featuredThemes = useMemo(() => {
    return filteredThemes.filter(t => t.featured);
  }, [filteredThemes]);

  const allOtherThemes = useMemo(() => {
    return filteredThemes.filter(t => !t.featured);
  }, [filteredThemes]);

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
                className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary-hex)] flex items-center justify-center transition-all duration-150 text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0"
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
                  {/* Big emoji & accent swatch preview */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-md border-2"
                    style={{
                      backgroundColor: displayedTheme.bg,
                      borderColor: displayedTheme.primary,
                      boxShadow: `0 2px 10px ${displayedTheme.primary}40`
                    }}
                  >
                    {displayedTheme.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-bold text-base tracking-tight"
                        style={{
                          fontFamily: displayedTheme.font,
                          color: displayedTheme.isDark ? '#f8fafc' : '#0f172a'
                        }}
                      >
                        {displayedTheme.name}
                      </span>
                      {displayedTheme.id === state.theme && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-[var(--color-primary-hex)] text-white shadow-xs">
                          ACTIVE
                        </span>
                      )}
                      <span className="text-xs ml-auto">
                        {displayedTheme.isDark ? '🌙 Dark' : '☀️ Light'}
                      </span>
                    </div>

                    <p
                      className="text-xs mt-1 italic line-clamp-2"
                      style={{
                        color: displayedTheme.isDark ? '#94a3b8' : '#64748b',
                        fontFamily: displayedTheme.font
                      }}
                    >
                      "{displayedTheme.desc}"
                    </p>

                    {/* Dual Swatch & Font Stack Info */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-md border border-black/20"
                          style={{ backgroundColor: displayedTheme.bg }}
                          title="Background Canvas"
                        />
                        <div
                          className="w-4 h-4 rounded-md shadow-xs border border-white/20"
                          style={{ backgroundColor: displayedTheme.primary }}
                          title="Primary Accent"
                        />
                      </div>
                      <span
                        className="text-[11px] font-mono opacity-70"
                        style={{ color: displayedTheme.isDark ? '#cbd5e1' : '#475569' }}
                      >
                        Font: {displayedTheme.font.split(',')[0].replace(/'/g, '')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Mode Preferences (Segmented Light / Dark) ── */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)]">
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
                  <span>☀️ Light Mode</span>
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
                  <span>🌙 Dark Mode</span>
                </button>
              </div>

              {/* ── 3. Search & Filter Bar ── */}
              <div className="space-y-2.5">
                {/* Search Box */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search themes, fonts, aesthetics..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-hex)] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(['all', 'featured', 'light', 'dark', 'classic'] as FilterCategory[]).map((cat) => {
                    const isSelected = activeFilter === cat;
                    const count = THEMES.filter(t => {
                      if (cat === 'featured') return t.featured;
                      if (cat === 'light') return !t.isDark;
                      if (cat === 'dark') return t.isDark;
                      if (cat === 'classic') return t.legacy;
                      return true;
                    }).length;

                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5",
                          isSelected
                            ? "bg-[var(--color-primary-hex)] text-white shadow-xs"
                            : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-border)]"
                        )}
                      >
                        {cat === 'featured' && <Sparkles size={12} />}
                        <span className="capitalize">{cat}</span>
                        <span className={clsx(
                          "text-[10px] px-1 rounded-sm",
                          isSelected ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 opacity-70"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 4. Featured Themes Grid ── */}
              {featuredThemes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pl-2 border-l-2 border-[var(--color-primary-hex)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                      ✨ Featured Design Systems
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      ({featuredThemes.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {featuredThemes.map((t) => {
                      const isActive = state.theme === t.id;
                      const fontFam = t.font.split(',')[0].replace(/'/g, '').trim();

                      return (
                        <div
                          key={t.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setTheme(t.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTheme(t.id); } }}
                          onMouseEnter={() => setHoveredTheme(t)}
                          onMouseLeave={() => setHoveredTheme(null)}
                          className={clsx(
                            "rounded-xl overflow-hidden border-2 text-left transition-all duration-200 cursor-pointer relative group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]",
                            isActive
                              ? "ring-2 ring-[var(--color-primary-hex)] shadow-md"
                              : "border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:shadow-lg hover:-translate-y-0.5"
                          )}
                          style={{
                            borderColor: isActive ? t.primary : undefined,
                            backgroundColor: t.bg
                          }}
                        >
                          {/* Preview Banner */}
                          <div
                            className="h-20 w-full flex items-center justify-center relative overflow-hidden select-none"
                            style={{ backgroundColor: t.bg }}
                          >
                            {/* Active checkmark */}
                            {isActive && (
                              <div
                                className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center text-white shadow-xs z-10"
                                style={{ backgroundColor: t.primary }}
                              >
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}

                            {/* Large typography sample */}
                            <span
                              className="text-3xl font-medium tracking-tight"
                              style={{
                                fontFamily: t.font,
                                color: t.isDark ? '#f1f5f9' : '#0f172a'
                              }}
                            >
                              Aa
                            </span>

                            {/* Color indicator dots */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: t.bg }}
                              />
                              <div
                                className="w-2.5 h-2.5 rounded-full shadow-xs"
                                style={{ backgroundColor: t.primary }}
                              />
                            </div>
                          </div>

                          {/* Details Bar */}
                          <div
                            className="p-2.5 border-t border-black/5 dark:border-white/5"
                            style={{
                              backgroundColor: t.isDark ? '#0a0a0f' : '#ffffff'
                            }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="text-xs font-bold tracking-tight truncate"
                                style={{
                                  fontFamily: t.font,
                                  color: t.isDark ? '#f8fafc' : '#1e293b'
                                }}
                              >
                                {t.emoji} {t.name}
                              </span>
                              <span className="text-[10px] opacity-70 shrink-0">
                                {t.isDark ? '🌙' : '☀️'}
                              </span>
                            </div>
                            <p
                              className="text-[10px] mt-0.5 truncate font-mono opacity-60"
                              style={{ color: t.isDark ? '#94a3b8' : '#64748b' }}
                            >
                              {fontFam}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── 5. All Themes Section ── */}
              {allOtherThemes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pl-2 border-l-2 border-[var(--color-primary-hex)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                      🎨 All Themes
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      ({allOtherThemes.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allOtherThemes.map((t) => {
                      const isActive = state.theme === t.id;
                      const fontFam = t.font.split(',')[0].replace(/'/g, '').trim();

                      return (
                        <div
                          key={t.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setTheme(t.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTheme(t.id); } }}
                          onMouseEnter={() => setHoveredTheme(t)}
                          onMouseLeave={() => setHoveredTheme(null)}
                          className={clsx(
                            "p-2.5 rounded-xl border-2 transition-all duration-150 cursor-pointer flex items-center gap-3 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]",
                            isActive
                              ? "ring-1 ring-[var(--color-primary-hex)] shadow-sm"
                              : "border-[var(--color-border)] hover:border-[var(--color-text-faint)] hover:shadow-xs"
                          )}
                          style={{
                            backgroundColor: t.bg,
                            borderColor: isActive ? t.primary : undefined
                          }}
                        >
                          {/* Font Avatar */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-black/10 dark:border-white/10"
                            style={{
                              backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                            }}
                          >
                            <span
                              className="text-xs font-semibold"
                              style={{
                                fontFamily: t.font,
                                color: t.isDark ? '#e2e8f0' : '#1e293b'
                              }}
                            >
                              Aa
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="text-xs font-bold truncate"
                                style={{
                                  fontFamily: t.font,
                                  color: isActive ? t.primary : (t.isDark ? '#f8fafc' : '#1e293b')
                                }}
                              >
                                {t.name}
                              </span>
                              <span className="text-[10px] opacity-60 shrink-0">
                                {t.isDark ? '🌙' : '☀️'}
                              </span>
                            </div>
                            <span
                              className="text-[10px] italic truncate block opacity-60"
                              style={{ color: t.isDark ? '#94a3b8' : '#64748b' }}
                            >
                              {fontFam}
                            </span>
                          </div>

                          {/* Right vertical accent bar */}
                          <div
                            className="w-1.5 h-7 rounded-full shrink-0"
                            style={{ backgroundColor: t.primary }}
                          />

                          {/* Active check pill */}
                          {isActive && (
                            <div
                              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-xs"
                              style={{ backgroundColor: t.primary }}
                            >
                              <Check size={9} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredThemes.length === 0 && (
                <div className="py-12 text-center text-[var(--color-text-muted)]">
                  <p className="text-sm font-medium">No themes match "{searchQuery}"</p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                    className="mt-2 text-xs text-[var(--color-primary-hex)] underline font-semibold"
                  >
                    Reset filters
                  </button>
                </div>
              )}
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
