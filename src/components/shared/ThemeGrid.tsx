import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Check, Search, Sun, Moon, Sparkles, Palette } from 'lucide-react';
import clsx from 'clsx';

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

export const THEMES: ThemeDef[] = [
  // ── ✦ FEATURED THEMES — 7 Distinct Design Systems ──
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

  // ── LEGACY & EXTENDED THEMES — Preserved & fully functional ──
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

export const DARK_MAP: Record<string, string> = {
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

export const LIGHT_MAP: Record<string, string> = {
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

export type ThemeFilterCategory = 'all' | 'featured' | 'light' | 'dark' | 'classic';

export interface ThemeGridProps {
  selectedTheme?: string;
  onSelectTheme?: (themeId: string) => void;
  onHoverTheme?: (theme: ThemeDef | null) => void;
  compact?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
  className?: string;
}

export const ThemeGrid: React.FC<ThemeGridProps> = ({
  selectedTheme,
  onSelectTheme,
  onHoverTheme,
  compact = false,
  showSearch = true,
  showCategories = true,
  className = ''
}) => {
  const { state, setTheme } = useProject();
  const currentThemeId = selectedTheme || state.theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ThemeFilterCategory>('all');

  const filteredThemes = useMemo(() => {
    return THEMES.filter(t => {
      if (activeFilter === 'featured' && !t.featured) return false;
      if (activeFilter === 'light' && t.isDark) return false;
      if (activeFilter === 'dark' && !t.isDark) return false;
      if (activeFilter === 'classic' && !t.legacy) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.font.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeFilter, searchQuery]);

  const featuredThemes = useMemo(() => filteredThemes.filter(t => t.featured), [filteredThemes]);
  const legacyThemes = useMemo(() => filteredThemes.filter(t => !t.featured), [filteredThemes]);

  const handleThemeClick = (themeId: string) => {
    setTheme(themeId);
    if (onSelectTheme) onSelectTheme(themeId);
  };

  const renderThemeCard = (t: ThemeDef) => {
    const isActive = currentThemeId === t.id;
    const fontFam = t.font.split(',')[0].replace(/'/g, '').trim();

    return (
      <div
        key={t.id}
        role="button"
        tabIndex={0}
        onClick={() => handleThemeClick(t.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleThemeClick(t.id);
          }
        }}
        onMouseEnter={() => onHoverTheme?.(t)}
        onMouseLeave={() => onHoverTheme?.(null)}
        className={clsx(
          "rounded-xl overflow-hidden border-2 text-left transition-all duration-150 cursor-pointer relative group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] active:scale-[0.98]",
          isActive
            ? "ring-2 ring-[var(--color-primary-hex)] shadow-md"
            : "border-[var(--color-divider)] hover:border-[var(--color-text-muted)] hover:shadow-md"
        )}
        style={{
          borderColor: isActive ? t.primary : undefined,
          backgroundColor: t.bg
        }}
      >
        {/* Preview Banner */}
        <div
          className={clsx(
            "w-full flex items-center justify-center relative overflow-hidden select-none",
            compact ? "h-16" : "h-20"
          )}
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

          {/* Typography Sample */}
          <span
            className={clsx("font-medium tracking-tight", compact ? "text-2xl" : "text-3xl")}
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
              title={`Background: ${t.bg}`}
            />
            <div
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: t.primary }}
              title={`Primary: ${t.primary}`}
            />
            <div
              className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-2xs"
              style={{ backgroundColor: t.surface }}
              title={`Surface: ${t.surface}`}
            />
          </div>
        </div>

        {/* Details Footer Bar */}
        <div
          className="p-2.5 border-t border-black/5 dark:border-white/5 flex-1 flex flex-col justify-between"
          style={{
            backgroundColor: t.isDark ? '#0a0a0f' : '#ffffff'
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-1">
              <span
                className="text-xs font-bold tracking-tight truncate flex items-center gap-1"
                style={{ color: t.isDark ? '#f8fafc' : '#0f172a' }}
              >
                <span>{t.emoji}</span>
                <span>{t.name}</span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: t.isDark ? '#94a3b8' : '#64748b'
                  }}
                >
                  {t.isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>

            <p
              className="text-[11px] leading-snug line-clamp-2 mt-1"
              style={{ color: t.isDark ? '#94a3b8' : '#64748b' }}
            >
              {t.desc}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 mt-1 border-t border-black/5 dark:border-white/5 text-[10px]">
            <span
              className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5"
              style={{ color: t.isDark ? '#cbd5e1' : '#475569' }}
            >
              {fontFam}
            </span>
            <span
              className="font-mono font-bold"
              style={{ color: t.primary }}
            >
              {t.primary}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Search and Filters */}
      {(showSearch || showCategories) && (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {showSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input
                type="text"
                placeholder="Search 26 themes by name, font, style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-colors"
              />
            </div>
          )}

          {showCategories && (
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)] overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All', count: THEMES.length },
                { id: 'featured', label: 'Featured', count: THEMES.filter(t => t.featured).length },
                { id: 'light', label: 'Light', count: THEMES.filter(t => !t.isDark).length },
                { id: 'dark', label: 'Dark', count: THEMES.filter(t => t.isDark).length },
                { id: 'classic', label: 'Classic', count: THEMES.filter(t => t.legacy).length }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id as ThemeFilterCategory)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-semibold transition-colors duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap",
                    activeFilter === cat.id
                      ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid Content */}
      <div className="space-y-6">
        {featuredThemes.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={14} className="text-amber-500" />
                Featured Design Systems ({featuredThemes.length})
              </span>
            </div>
            <div className={clsx(
              "grid gap-3",
              compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {featuredThemes.map(renderThemeCard)}
            </div>
          </div>
        )}

        {legacyThemes.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] flex items-center gap-1.5 uppercase tracking-wider">
                <Palette size={14} className="text-[var(--color-primary-hex)]" />
                Curated Swiss Palettes ({legacyThemes.length})
              </span>
            </div>
            <div className={clsx(
              "grid gap-3",
              compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {legacyThemes.map(renderThemeCard)}
            </div>
          </div>
        )}

        {filteredThemes.length === 0 && (
          <div className="p-8 text-center text-xs text-[var(--color-text-faint)] border border-dashed border-[var(--color-divider)] rounded-2xl">
            No themes found matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeGrid;
