import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Check, Search, Sparkles, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { runCircularThemeTransition } from '../../utils/designSpells';
import { getHealthScore } from '../../utils/projectUtils';
import { Task, TaskStatus } from '../../types';

export type ThemeBackdropEffect = 'dots' | 'glass' | 'aura' | 'hud' | 'brutal' | 'editorial' | 'bento' | 'clean';

export interface ThemeDef {
  id: string;
  name: string;
  primary: string;
  accent2: string;
  bg: string;
  surface: string;
  surface2: string;
  surfaceOpaque?: string;
  text: string;
  textMuted: string;
  border: string;
  font: string;
  bodyFont?: string;
  desc: string;
  isDark: boolean;
  featured: boolean;
  legacy?: boolean;
  radiusPx: number;
  effect: ThemeBackdropEffect;
  archetype: string;
}

/**
 * Compute readable foreground ink (#09090b or #ffffff) via WCAG relative luminance
 * so primary CTAs, active checkmarks, and accent badges stay legible on bright hues
 * (e.g. Brutalist #f0ff00, Obsidian #00ff7f, Titan Dark #f8fafc, Pulse #38BDF8).
 */
export function getContrastInk(hex: string): '#09090b' | '#ffffff' {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#ffffff';
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return luminance > 0.42 ? '#09090b' : '#ffffff';
}

export const THEMES: ThemeDef[] = [
  // ── FEATURED THEMES — 7 Distinct Design Systems ──
  {
    id: 'origin',
    name: 'Origin',
    primary: '#0f4c5c',
    accent2: '#4fb8a8',
    bg: '#faf9f6',
    surface: '#ffffff',
    surface2: '#f4f2ed',
    text: '#1c1917',
    textMuted: '#57534e',
    border: '#e2ddd6',
    font: "'Fraunces', serif",
    desc: 'Classic enterprise. Editorial serif headings, warm stone surfaces, quiet restraint.',
    isDark: false,
    featured: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Editorial Serif'
  },
  {
    id: 'nova',
    name: 'Nova',
    primary: '#6366f1',
    accent2: '#a78bfa',
    bg: '#f5f6ff',
    surface: '#ffffff',
    surface2: '#eef0fd',
    text: '#0f0f2d',
    textMuted: '#5b5c8a',
    border: '#d9dbf5',
    font: "'Outfit', sans-serif",
    desc: 'Modern SaaS. Rounded containers, luminous lavender canvas, vibrant indigo energy.',
    isDark: false,
    featured: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Modern SaaS'
  },
  {
    id: 'terminal',
    name: 'Terminal',
    primary: '#58a6ff',
    accent2: '#3fb950',
    bg: '#0d1117',
    surface: '#161b22',
    surface2: '#21262d',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    border: '#30363d',
    font: "'JetBrains Mono', monospace",
    desc: 'Developer-first dark cockpit. Monospace precision, carbon borders, cobalt links.',
    isDark: true,
    featured: true,
    radiusPx: 4,
    effect: 'hud',
    archetype: 'Dev Terminal'
  },
  {
    id: 'aurora-studio',
    name: 'Aurora',
    primary: '#7c3aed',
    accent2: '#c084fc',
    bg: '#fafafe',
    surface: '#ffffff',
    surface2: '#f0f0ff',
    text: '#1a162b',
    textMuted: '#5e5873',
    border: '#e6e4f5',
    font: "'Satoshi', sans-serif",
    desc: 'Creative studio. Violet glow accents, airy light canvas, expressive display clarity.',
    isDark: false,
    featured: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Studio Glow'
  },
  {
    id: 'obsidian-dark',
    name: 'Obsidian',
    primary: '#00ff7f',
    accent2: '#10b981',
    bg: '#000000',
    surface: '#0a0a0a',
    surface2: '#141414',
    text: '#ededed',
    textMuted: '#888888',
    border: '#222222',
    font: "'JetBrains Mono', monospace",
    desc: 'Night operator. Pitch OLED black surfaces, phosphor emerald signals, mono telemetry.',
    isDark: true,
    featured: true,
    radiusPx: 4,
    effect: 'hud',
    archetype: 'Pitch OLED'
  },
  {
    id: 'paper-editorial',
    name: 'Paper',
    primary: '#8c4a2f',
    accent2: '#d97706',
    bg: '#fdf8f0',
    surface: '#fffdf8',
    surface2: '#f8f1e4',
    text: '#2c2523',
    textMuted: '#6e645e',
    border: '#e8ded2',
    font: "'Fraunces', serif",
    desc: 'Editorial warmth. Serif headlines, archival cream cards, terracotta ink accents.',
    isDark: false,
    featured: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Warm Archival'
  },
  {
    id: 'pulse',
    name: 'Pulse (Technical)',
    primary: '#38BDF8',
    accent2: '#0ea5e9',
    bg: '#0D0D0F',
    surface: '#121214',
    surface2: '#1c1c1f',
    text: '#E4E4E7',
    textMuted: '#71717A',
    border: 'rgba(228, 228, 231, 0.14)',
    font: "'Syne', sans-serif",
    bodyFont: "'Inter', sans-serif",
    desc: 'Technical edition with dotted matrix canvas, 4px razor corners, Syne & cyan signals.',
    isDark: true,
    featured: true,
    radiusPx: 3,
    effect: 'dots',
    archetype: 'Technical Grid'
  },

  // ── LEGACY & EXTENDED THEMES — Synchronized 1:1 with index.css ──
  {
    id: 'nexus',
    name: 'Nexus',
    primary: '#0f4c5c',
    accent2: '#166b81',
    bg: '#f8f7f3',
    surface: '#ffffff',
    surface2: '#faf9f6',
    text: '#1a1a1a',
    textMuted: '#525252',
    border: '#e5e5e0',
    font: "'Satoshi', sans-serif",
    desc: 'Default Swiss cockpit with warm paper base, crisp white cards, and deep teal ink.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Swiss Classic'
  },
  {
    id: 'nexus-dark',
    name: 'Nexus Night',
    primary: '#0f4c5c',
    accent2: '#4f98a3',
    bg: '#0a1f24',
    surface: '#0f2d35',
    surface2: '#143a44',
    text: '#e0e7e9',
    textMuted: '#94aab0',
    border: '#1a4955',
    font: "'Fraunces', serif",
    desc: 'Deep lagoon nocturnal mode pairing serif headers with abyssal teal elevation.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Deep Lagoon'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Classic',
    primary: '#00ff7f',
    accent2: '#059669',
    bg: '#050505',
    surface: '#0f0f0f',
    surface2: '#1a1a1a',
    text: '#ffffff',
    textMuted: '#a1a1aa',
    border: '#27272a',
    font: "'JetBrains Mono', monospace",
    desc: 'Deep neon tactical workspace with charcoal panels and spring-green highlights.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 4,
    effect: 'hud',
    archetype: 'Tactical Mono'
  },
  {
    id: 'paper',
    name: 'Paper Classic',
    primary: '#44403c',
    accent2: '#78716c',
    bg: '#fcfaf7',
    surface: '#ffffff',
    surface2: '#f9f7f2',
    text: '#1c1917',
    textMuted: '#57534e',
    border: '#e7e5e4',
    font: "'Fraunces', serif",
    desc: 'Clean academic publication aesthetic with warm alabaster and espresso stone.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Ivory Journal'
  },
  {
    id: 'paper-dark',
    name: 'Paper Night',
    primary: '#d6d3d1',
    accent2: '#a8a29e',
    bg: '#1c1917',
    surface: '#292524',
    surface2: '#34302d',
    text: '#e7e5e4',
    textMuted: '#a8a29e',
    border: '#44403c',
    font: "'Fraunces', serif",
    desc: 'Dark espresso reading studio with chalkstone ink and matte charcoal panels.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Espresso Ink'
  },
  {
    id: 'aurora',
    name: 'Aurora Classic',
    primary: '#6366f1',
    accent2: '#38bdf8',
    bg: '#f8fafc',
    surface: '#ffffff',
    surface2: '#f1f5f9',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    font: "'Outfit', sans-serif",
    desc: 'Crisp cool-slate daylight workspace energized with soft curves and indigo focus.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Soft Indigo'
  },
  {
    id: 'aurora-dark',
    name: 'Aurora Dark',
    primary: '#6366f1',
    accent2: '#818cf8',
    bg: '#0f172a',
    surface: '#1e293b',
    surface2: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    font: "'Outfit', sans-serif",
    desc: 'Deep navy-slate canvas with floating card contrast and electric indigo triggers.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Nocturnal Sky'
  },
  {
    id: 'chrome',
    name: 'Chrome',
    primary: '#22d3ee',
    accent2: '#06b6d4',
    bg: '#030712',
    surface: 'rgba(17, 24, 39, 0.78)',
    surface2: 'rgba(31, 41, 55, 0.78)',
    surfaceOpaque: '#0e1525',
    text: '#f9fafb',
    textMuted: '#9ca3af',
    border: 'rgba(34, 211, 238, 0.25)',
    font: "'Orbitron', sans-serif",
    desc: 'Sci-fi telemetry HUD with translucent midnight steel panels and cyan borders.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 4,
    effect: 'hud',
    archetype: 'Sci-Fi HUD'
  },
  {
    id: 'titan',
    name: 'Titan',
    primary: '#1e293b',
    accent2: '#64748b',
    bg: '#ffffff',
    surface: '#ffffff',
    surface2: '#f8fafc',
    text: '#020617',
    textMuted: '#475569',
    border: '#e2e8f0',
    font: "'Outfit', sans-serif",
    desc: 'High-clarity stark white executive workspace anchored by deep slate contrasts.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'clean',
    archetype: 'Monochrome'
  },
  {
    id: 'titan-dark',
    name: 'Titan Dark',
    primary: '#f8fafc',
    accent2: '#94a3b8',
    bg: '#020617',
    surface: '#0f172a',
    surface2: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#1e293b',
    font: "'Outfit', sans-serif",
    desc: 'High-contrast executive night mode with midnight surfaces and pure ice-white CTAs.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'clean',
    archetype: 'Stealth Slate'
  },
  {
    id: 'lumina',
    name: 'Lumina',
    primary: '#3b82f6',
    accent2: '#60a5fa',
    bg: '#f8fafc',
    surface: 'rgba(255, 255, 255, 0.85)',
    surface2: '#f1f5f9',
    surfaceOpaque: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    font: "'Satoshi', sans-serif",
    desc: 'Airy sky-blue translucency with frosted white surfaces and cobalt interactive states.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'glass',
    archetype: 'Airy Glass'
  },
  {
    id: 'lumina-dark',
    name: 'Lumina Dark',
    primary: '#3b82f6',
    accent2: '#60a5fa',
    bg: '#050811',
    surface: '#0d1221',
    surface2: '#161d31',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#1e293b',
    font: "'Satoshi', sans-serif",
    desc: 'Deep sapphire void with midnight cobalt cards and razor-clean readability.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Sapphire Night'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    primary: '#00f5d4',
    accent2: '#fee440',
    bg: '#0b051a',
    surface: '#150a2e',
    surface2: '#1f1145',
    text: '#ffffff',
    textMuted: '#00f5d4',
    border: '#540d6e',
    font: "'DM Mono', monospace",
    desc: 'Ultraviolet grid canvas framed in plum neon with electric mint and acid accents.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 4,
    effect: 'hud',
    archetype: 'Neon Synth'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    primary: '#58a6ff',
    accent2: '#79c0ff',
    bg: '#010409',
    surface: '#0d1117',
    surface2: '#161b22',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    border: '#30363d',
    font: "'Inter', sans-serif",
    desc: 'Deep ocean dark mode balancing fatigue-free charcoal Contrast with sapphire links.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'clean',
    archetype: 'Deep Harbor'
  },
  {
    id: 'champagne',
    name: 'Champagne',
    primary: '#c19a6b',
    accent2: '#976f3f',
    bg: '#fcfaf2',
    surface: '#ffffff',
    surface2: '#f5f1e4',
    text: '#2c2923',
    textMuted: '#6e6757',
    border: '#d4cbb3',
    font: "'Fraunces', serif",
    desc: 'Ivory linen surfaces trimmed in burnished champagne gold and classic serif type.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Gilded Ivory'
  },
  {
    id: 'champagne-dark',
    name: 'Champagne Noir',
    primary: '#c19a6b',
    accent2: '#d4b48f',
    bg: '#1a1814',
    surface: '#2c2923',
    surface2: '#3d3a33',
    text: '#f5f1e4',
    textMuted: '#c19a6b',
    border: '#4d4940',
    font: "'Fraunces', serif",
    desc: 'Smoked bronze evening mode pairing warm umber cards with metallic gold chrome.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Reserve Gold'
  },
  {
    id: 'carbon',
    name: 'Carbon',
    primary: '#ff3e3e',
    accent2: '#ff5a5a',
    bg: '#0a0a0c',
    surface: '#121214',
    surface2: '#1a1a1d',
    text: '#e1e1e6',
    textMuted: '#8b8b92',
    border: '#2c2c2e',
    font: "'Satoshi', sans-serif",
    desc: 'Precision obsidian carbon shell contrasted with racing crimson telemetry.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 5,
    effect: 'hud',
    archetype: 'Carbon Apex'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primary: '#10b981',
    accent2: '#059669',
    bg: '#f0fdf4',
    surface: '#ffffff',
    surface2: '#dcfce7',
    text: '#064e3b',
    textMuted: '#065f46',
    border: '#bbf7d0',
    font: "'Fraunces', serif",
    desc: 'Botanical mint daylight theme with serif hierarchy and deep forest ink.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 8,
    effect: 'editorial',
    archetype: 'Botanical Mint'
  },
  {
    id: 'emerald-dark',
    name: 'Emerald Night',
    primary: '#10b981',
    accent2: '#34d399',
    bg: '#022c22',
    surface: '#064e3b',
    surface2: '#065f46',
    text: '#ecfdf5',
    textMuted: '#6ee7b7',
    border: '#065f46',
    font: "'Fraunces', serif",
    desc: 'Deep spruce nocturnal palette with bioluminescent jade accents and serif headers.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 8,
    effect: 'editorial',
    archetype: 'Forest Night'
  },
  {
    id: 'prism',
    name: 'Prism',
    primary: '#ff006e',
    accent2: '#3a86ff',
    bg: '#ffffff',
    surface: '#fdfdfd',
    surface2: '#f8f9fa',
    text: '#1a1a1a',
    textMuted: '#666666',
    border: '#eeeeee',
    font: "'Outfit', sans-serif",
    desc: 'Pure gallery white canvas punched up with electric magenta and azure highlights.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Prismatic Pop'
  },
  {
    id: 'prism-dark',
    name: 'Prism Black',
    primary: '#ff006e',
    accent2: '#3a86ff',
    bg: '#000000',
    surface: '#0a0a0a',
    surface2: '#111111',
    text: '#ffffff',
    textMuted: '#888888',
    border: '#222222',
    font: "'Outfit', sans-serif",
    desc: 'True black canvas electrified by high-chroma magenta and cobalt chart bands.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'OLED Spectrum'
  },
  {
    id: 'play',
    name: 'Play',
    primary: '#ef4444',
    accent2: '#f97316',
    bg: '#fef2f2',
    surface: '#ffffff',
    surface2: '#fff1f2',
    text: '#7f1d1d',
    textMuted: '#991b1b',
    border: '#fecaca',
    font: "'Nunito', sans-serif",
    desc: 'Soft blush workspace with friendly rounded Nunito typography and vivid coral actions.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 12,
    effect: 'clean',
    archetype: 'Friendly Pop'
  },
  {
    id: 'play-dark',
    name: 'Play Dark',
    primary: '#ef4444',
    accent2: '#fca5a5',
    bg: '#2d0505',
    surface: '#450a0a',
    surface2: '#7f1d1d',
    text: '#fef2f2',
    textMuted: '#fca5a5',
    border: '#7f1d1d',
    font: "'Nunito', sans-serif",
    desc: 'Deep burgundy nocturnal mode pairing warm garnet surfaces with rounded red badges.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 12,
    effect: 'clean',
    archetype: 'Crimson Velvet'
  },
  {
    id: 'slate',
    name: 'Slate',
    primary: '#f59e0b',
    accent2: '#d97706',
    bg: '#1a1b2e',
    surface: '#232440',
    surface2: '#2d2e50',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#363758',
    font: "'Outfit', sans-serif",
    desc: 'Nordic indigo twilight canvas illuminated by warm amber status signals.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 8,
    effect: 'clean',
    archetype: 'Amber Twilight'
  },
  {
    id: 'terracotta',
    name: 'Terra Cotta',
    primary: '#e05a47',
    accent2: '#c94b3a',
    bg: '#f3f4f6',
    surface: '#ffffff',
    surface2: '#fef3f2',
    text: '#1c1917',
    textMuted: '#57534e',
    border: '#e5e7eb',
    font: "'Inter', sans-serif",
    desc: 'Mediterranean clay accents set against cool fog gray canvas and crisp white cards.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 8,
    effect: 'clean',
    archetype: 'Clay Executive'
  },
  {
    id: 'fintech',
    name: 'Fintech Gold',
    primary: '#0b192c',
    accent2: '#c19a6b',
    bg: '#f8f9fa',
    surface: '#ffffff',
    surface2: '#f1f3f5',
    text: '#0b192c',
    textMuted: '#4a5568',
    border: '#e2e8f0',
    font: "'Fraunces', serif",
    desc: 'Institutional Wall Street palette combining Fraunces serif headers and deep oxford navy.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'editorial',
    archetype: 'Institutional'
  },
  {
    id: 'bento',
    name: 'Vibrant Bento',
    primary: '#ff5722',
    accent2: '#3b82f6',
    bg: '#e2e8f0',
    surface: '#ffffff',
    surface2: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#cbd5e1',
    font: "'Outfit', sans-serif",
    desc: 'High-relief cool slate grid elevating bright white modular cards and signal orange.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'bento',
    archetype: 'Modular Bento'
  },
  {
    id: 'codename',
    name: 'Codename SaaS',
    primary: '#e11d48',
    accent2: '#18181b',
    bg: '#f4f4f5',
    surface: '#ffffff',
    surface2: '#fafafa',
    text: '#18181b',
    textMuted: '#71717a',
    border: '#e4e4e7',
    font: "'Inter', sans-serif",
    desc: 'Zinc-gray tactical workspace with stark charcoal hierarchy and rose crimson alerts.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 6,
    effect: 'clean',
    archetype: 'Crimson Ops'
  },
  {
    id: 'workflow',
    name: 'Workflow Glass',
    primary: '#6366f1',
    accent2: '#818cf8',
    bg: '#eef2ff',
    surface: '#ffffff',
    surface2: '#e0e7ff',
    text: '#1e1b4b',
    textMuted: '#6366f1',
    border: '#e0e7ff',
    font: "'Satoshi', sans-serif",
    desc: 'Periwinkle engineering cadence with indigo-tinted card elevation and soft geometry.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Indigo Flow'
  },
  {
    id: 'nova-dark',
    name: 'Nova Dark',
    primary: '#a78bfa',
    accent2: '#c4b5fd',
    bg: '#07070f',
    surface: '#0f1020',
    surface2: '#181930',
    text: '#f0f0ff',
    textMuted: '#9b9dc8',
    border: '#252646',
    font: "'Outfit', sans-serif",
    desc: 'Deep obsidian-indigo night canvas paired with luminescent lavender highlights.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 10,
    effect: 'aura',
    archetype: 'Violet Eclipse'
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    primary: '#f0ff00',
    accent2: '#ffffff',
    bg: '#111111',
    surface: '#1a1a1a',
    surface2: '#242424',
    text: '#ffffff',
    textMuted: '#e2e8f0',
    border: '#ffffff',
    font: "'Syne', sans-serif",
    bodyFont: "'JetBrains Mono', monospace",
    desc: 'Zero-radius raw concrete UI: 2px stark white borders, offset block shadows, acid neon.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 0,
    effect: 'brutal',
    archetype: 'Neo-Brutalist'
  },
  {
    id: 'glass',
    name: 'Glass',
    primary: '#3b82f6',
    accent2: '#60a5fa',
    bg: '#e2e8f0',
    surface: 'rgba(255, 255, 255, 0.56)',
    surface2: 'rgba(255, 255, 255, 0.72)',
    surfaceOpaque: '#eef2f6',
    text: '#1e293b',
    textMuted: '#475569',
    border: 'rgba(255, 255, 255, 0.75)',
    font: "'Plus Jakarta Sans', sans-serif",
    desc: 'Translucent frosted glass cards floating over a cool radial-blue atmospheric backdrop.',
    isDark: false,
    featured: false,
    legacy: true,
    radiusPx: 12,
    effect: 'glass',
    archetype: 'Frosted Glass'
  },
  {
    id: 'glass-dark',
    name: 'Glass Dark',
    primary: '#3b82f6',
    accent2: '#60a5fa',
    bg: '#020617',
    surface: 'rgba(15, 23, 42, 0.6)',
    surface2: 'rgba(30, 41, 59, 0.68)',
    surfaceOpaque: '#0b1224',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.16)',
    font: "'Plus Jakarta Sans', sans-serif",
    desc: 'Midnight translucent panels with backdrop blur, specular hairlines, and cobalt glow.',
    isDark: true,
    featured: false,
    legacy: true,
    radiusPx: 12,
    effect: 'glass',
    archetype: 'Midnight Glass'
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

export interface PreviewMetrics {
  health: number;
  healthStatus: string;
  completionPct: number;
  bars: number[];
}

export const computePreviewMetrics = (tasks?: Task[]): PreviewMetrics => {
  if (!tasks || tasks.length === 0) {
    return {
      health: 94,
      healthStatus: 'Ready',
      completionPct: 68,
      bars: [42, 64, 52, 88, 76]
    };
  }
  const health = getHealthScore(tasks);
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const completionPct = Math.round((completedCount / tasks.length) * 100);
  const healthStatus = health > 80 ? 'On Track' : health > 50 ? 'At Risk' : 'Critical';

  // Compute 5 module/status bucket bars normalized between 28% and 92%
  const modCounts = new Map<string, number>();
  tasks.forEach(t => {
    const key = t.module || 'Core';
    modCounts.set(key, (modCounts.get(key) || 0) + 1);
  });
  const topCounts = Array.from(modCounts.values()).slice(0, 5);
  const maxVal = Math.max(1, ...topCounts);
  const bars = [0, 1, 2, 3, 4].map(i => {
    const count = topCounts[i] ?? Math.max(1, Math.round(maxVal * (0.45 + (i % 3) * 0.18)));
    return Math.max(28, Math.min(92, Math.round((count / maxVal) * 86)));
  });

  return { health, healthStatus, completionPct, bars };
};

export interface ThemePreviewStageProps {
  theme: ThemeDef;
  variant?: 'card' | 'hero';
  compact?: boolean;
  metrics?: PreviewMetrics;
  projectTitle?: string;
}

/**
 * Miniature ProjectPulse application viewport accurately depicting the theme's
 * real surfaces, dot-matrix/glass/HUD/brutalist chrome, border radius, shadow physics,
 * display typography, live workspace telemetry, and button contrast.
 */
export const ThemePreviewStage: React.FC<ThemePreviewStageProps> = ({
  theme: t,
  variant = 'card',
  compact = false,
  metrics,
  projectTitle
}) => {
  const m = metrics || computePreviewMetrics();
  const stageTitle = variant === 'hero'
    ? (projectTitle?.trim() || 'Overview')
    : 'Overview';
  const isHero = variant === 'hero';
  const isBrutal = t.effect === 'brutal';
  const isGlass = t.effect === 'glass';
  const isDots = t.effect === 'dots';
  const isHud = t.effect === 'hud';
  const isBento = t.effect === 'bento';
  const isEditorial = t.effect === 'editorial';

  const inkOnPrimary = getContrastInk(t.primary);
  const rCard = isBrutal ? 0 : t.radiusPx;
  const rInner = isBrutal ? 0 : Math.max(t.radiusPx - 2, 2);

  // Faithful surface & shadow tokens matching index.css theme rules
  const panelBorder = isBrutal
    ? '1.5px solid #ffffff'
    : `1px solid ${t.border}`;

  const panelShadow = isBrutal
    ? '2.5px 2.5px 0px #ffffff'
    : isGlass
    ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 12px rgba(15, 23, 42, 0.14)'
    : isBento
    ? '0 4px 10px rgba(15, 23, 42, 0.08)'
    : t.effect === 'aura'
    ? `0 4px 14px ${t.primary}1a`
    : t.isDark
    ? '0 2px 6px rgba(0,0,0,0.35)'
    : '0 1px 3px rgba(0,0,0,0.05)';

  // Backdrop pattern / atmospheric layer
  const stageBackgroundImage = isDots
    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Ccircle cx='2' cy='2' r='0.9' fill='rgba(228,228,231,0.22)'/%3E%3C/svg%3E")`
    : isGlass
    ? `radial-gradient(circle at 78% 18%, ${t.primary}45 0%, transparent 56%), radial-gradient(circle at 22% 88%, ${t.accent2}36 0%, transparent 52%)`
    : t.effect === 'aura'
    ? `radial-gradient(circle at 86% 14%, ${t.primary}26 0%, transparent 58%), radial-gradient(circle at 14% 90%, ${t.accent2}1a 0%, transparent 50%)`
    : isHud
    ? `linear-gradient(to right, ${t.primary}0d 1px, transparent 1px), linear-gradient(to bottom, ${t.primary}0d 1px, transparent 1px)`
    : undefined;

  const stageBackgroundSize = isDots
    ? '12px 12px'
    : isHud
    ? '14px 14px'
    : undefined;

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden flex select-none',
        isHero
          ? 'h-[146px] sm:h-[156px]'
          : compact
          ? 'h-[108px]'
          : 'h-[124px]'
      )}
      style={{
        // Explicit opaque canvas so colorScheme stays isolated cleanly per card
        backgroundColor: t.bg,
        colorScheme: t.isDark ? 'only dark' : 'only light',
        color: t.text,
        backgroundImage: stageBackgroundImage,
        backgroundSize: stageBackgroundSize,
        fontFamily: t.bodyFont || t.font
      }}
      aria-hidden="true"
    >
      {/* Top thematic accent hairline for HUD / Editorial */}
      {(isHud || isEditorial) && (
        <div
          className="absolute top-0 inset-x-0 z-10 pointer-events-none"
          style={{
            height: isHud ? '2px' : '1.5px',
            background: isHud
              ? `linear-gradient(90deg, ${t.primary}, ${t.accent2}, transparent)`
              : t.primary,
            opacity: isEditorial ? 0.65 : 0.9
          }}
        />
      )}

      {/* ── MINI SIDEBAR RAIL ── */}
      <div
        className={clsx(
          'shrink-0 flex flex-col justify-between z-[1]',
          isHero ? 'w-14 p-2' : 'w-8 p-1.5'
        )}
        style={{
          backgroundColor: t.surface,
          backdropFilter: isGlass ? 'blur(10px)' : undefined,
          WebkitBackdropFilter: isGlass ? 'blur(10px)' : undefined,
          borderRight: panelBorder
        }}
      >
        <div className="space-y-1.5">
          {/* App Brand Mark */}
          <div className="flex items-center gap-1.5 px-0.5 pt-0.5">
            <span
              className="shrink-0"
              style={{
                width: isHero ? 12 : 10,
                height: isHero ? 12 : 10,
                borderRadius: isBrutal ? 0 : 4,
                backgroundColor: t.primary,
                border: isBrutal ? '1px solid #ffffff' : undefined
              }}
            />
            {isHero && (
              <span
                className="text-[8px] font-bold tracking-tight truncate"
                style={{ fontFamily: t.font, color: t.text }}
              >
                Pulse
              </span>
            )}
          </div>

          {/* Nav items (1 active + 2 muted) */}
          <div className="space-y-1 pt-1">
            <div
              className="flex items-center gap-1 px-1 py-1 relative"
              style={{
                backgroundColor: `${t.primary}20`,
                borderRadius: Math.min(rInner, 5),
                border: isBrutal ? `1px solid ${t.primary}` : undefined
              }}
            >
              <span
                className="w-1 h-2.5 shrink-0"
                style={{
                  backgroundColor: t.primary,
                  borderRadius: isBrutal ? 0 : 2
                }}
              />
              <span
                className="h-1 flex-1"
                style={{
                  backgroundColor: t.primary,
                  opacity: 0.9,
                  borderRadius: isBrutal ? 0 : 99
                }}
              />
            </div>
            {[0.72, 0.56, 0.65].slice(0, isHero ? 3 : 2).map((w, idx) => (
              <div key={idx} className="flex items-center gap-1 px-1 py-0.5">
                <span
                  className="w-1.5 h-1.5 shrink-0 rounded-full opacity-40"
                  style={{
                    backgroundColor: t.textMuted,
                    borderRadius: isBrutal ? 0 : 99
                  }}
                />
                <span
                  className="h-1 opacity-35"
                  style={{
                    width: `${Math.round(w * 100)}%`,
                    backgroundColor: t.textMuted,
                    borderRadius: isBrutal ? 0 : 99
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom mini user status */}
        <div className="flex items-center gap-1 px-0.5">
          <span
            className="w-2.5 h-2.5 shrink-0"
            style={{
              backgroundColor: t.accent2,
              borderRadius: isBrutal ? 0 : 99,
              opacity: 0.85
            }}
          />
          {isHero && (
            <span
              className="h-1 w-5 opacity-40"
              style={{
                backgroundColor: t.textMuted,
                borderRadius: isBrutal ? 0 : 99
              }}
            />
          )}
        </div>
      </div>

      {/* ── MINI WORKSPACE CANVAS ── */}
      <div className="flex-1 min-w-0 flex flex-col z-[1]">
        {/* Mini Top Chrome Bar */}
        <div
          className={clsx(
            'flex items-center justify-between gap-2 shrink-0',
            isHero ? 'px-3 py-1.5' : 'px-2 py-1'
          )}
          style={{
            backgroundColor: t.surface,
            backdropFilter: isGlass ? 'blur(10px)' : undefined,
            WebkitBackdropFilter: isGlass ? 'blur(10px)' : undefined,
            borderBottom: panelBorder
          }}
        >
          <div className="min-w-0 flex items-center gap-1.5">
            <span
              className={clsx(
                'font-bold tracking-tight truncate',
                isHero ? 'text-[11px]' : 'text-[9.5px]'
              )}
              style={{ fontFamily: t.font, color: t.text }}
            >
              {stageTitle}
            </span>
            {isHero && (
              <span
                className="text-[8px] font-semibold px-1.5 py-0.2 truncate"
                style={{
                  backgroundColor: t.surface2,
                  color: t.textMuted,
                  borderRadius: Math.min(rInner, 4),
                  border: `1px solid ${t.border}`
                }}
              >
                Overview
              </span>
            )}
          </div>

          {/* Primary CTA Pill Preview */}
          <span
            className={clsx(
              'shrink-0 font-bold leading-none flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]',
              isHero ? 'text-[8.5px] px-2 py-1' : 'text-[7.5px] px-1.5 py-0.5'
            )}
            style={{
              backgroundColor: t.primary,
              color: inkOnPrimary,
              borderRadius: isBrutal ? 0 : Math.min(rInner, 6),
              border: isBrutal ? '1px solid #ffffff' : undefined,
              boxShadow: isBrutal ? '1.5px 1.5px 0px #ffffff' : undefined
            }}
          >
            {isHero ? '+ New Task' : '+ New'}
          </span>
        </div>

        {/* Mini Bento Cockpit Body */}
        <div
          className={clsx(
            'flex-1 grid grid-cols-12 min-h-0',
            isHero ? 'gap-2 p-2.5' : 'gap-1.5 p-2'
          )}
        >
          {/* Left Span-7: Telemetry Card + Bar Chart Sparkline */}
          <div
            className={clsx(
              'col-span-7 flex flex-col justify-between min-w-0 overflow-hidden transition-transform duration-200 group-hover:-translate-y-[1px]',
              isHero ? 'p-2' : 'p-1.5'
            )}
            style={{
              backgroundColor: t.surface,
              backdropFilter: isGlass ? 'blur(12px)' : undefined,
              WebkitBackdropFilter: isGlass ? 'blur(12px)' : undefined,
              border: panelBorder,
              borderRadius: rCard,
              boxShadow: panelShadow
            }}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <div
                  className={clsx(
                    'uppercase tracking-wider font-semibold leading-none',
                    isHero ? 'text-[7.5px]' : 'text-[6.5px]'
                  )}
                  style={{ color: t.textMuted }}
                >
                  Health
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={clsx(
                      'font-extrabold tracking-tight tabular-nums leading-none',
                      isHero ? 'text-[15px]' : 'text-[12px]'
                    )}
                    style={{ fontFamily: t.font, color: t.text }}
                  >
                    {m.health}%
                  </span>
                  <span
                    className={clsx(
                      'font-mono font-bold leading-none truncate',
                      isHero ? 'text-[8px]' : 'text-[6.5px]'
                    )}
                    style={{ color: t.accent2 }}
                  >
                    {m.healthStatus}
                  </span>
                </div>
              </div>

              {/* Status chip */}
              <span
                className="shrink-0 w-1.5 h-1.5 mt-0.5"
                style={{
                  backgroundColor: t.primary,
                  borderRadius: isBrutal ? 0 : 99
                }}
              />
            </div>

            {/* 5-bar mini telemetry chart */}
            <div
              className={clsx(
                'flex items-end gap-1 pt-1',
                isHero ? 'h-6' : 'h-4'
              )}
            >
              {[
                { h: `${m.bars[0]}%`, fill: t.surface2, border: true },
                { h: `${m.bars[1]}%`, fill: t.accent2, border: false },
                { h: `${m.bars[2]}%`, fill: t.surface2, border: true },
                { h: `${m.bars[3]}%`, fill: t.primary, border: false },
                { h: `${m.bars[4]}%`, fill: t.primary, border: false, faint: true }
              ].map((bar, i) => (
                <div
                  key={i}
                  className="flex-1 transition-all duration-200"
                  style={{
                    height: bar.h,
                    backgroundColor: bar.fill,
                    opacity: bar.faint ? 0.55 : 1,
                    border: bar.border ? `1px solid ${t.border}` : undefined,
                    borderRadius: isBrutal ? 0 : '2px 2px 1px 1px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Span-5: Completion Meter + Nested Surface2 Task Stack */}
          <div className="col-span-5 flex flex-col gap-1.5 min-w-0 min-h-0">
            {/* Completion Meter Card */}
            <div
              className={clsx(
                'flex-1 flex flex-col justify-between min-w-0',
                isHero ? 'p-2' : 'p-1.5'
              )}
              style={{
                backgroundColor: t.surface,
                backdropFilter: isGlass ? 'blur(12px)' : undefined,
                WebkitBackdropFilter: isGlass ? 'blur(12px)' : undefined,
                border: panelBorder,
                borderRadius: rCard,
                boxShadow: panelShadow
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={clsx(
                    'font-semibold uppercase tracking-wider leading-none truncate',
                    isHero ? 'text-[7.5px]' : 'text-[6.5px]'
                  )}
                  style={{ color: t.textMuted }}
                >
                  Scope
                </span>
                <span
                  className={clsx(
                    'font-mono font-bold tabular-nums leading-none',
                    isHero ? 'text-[8px]' : 'text-[7px]'
                  )}
                  style={{ color: t.text }}
                >
                  {m.completionPct}%
                </span>
              </div>

              <div
                className="w-full h-1.5 overflow-hidden mt-1"
                style={{
                  backgroundColor: t.surface2,
                  borderRadius: isBrutal ? 0 : 99,
                  border: isBrutal ? '1px solid #ffffff' : undefined
                }}
              >
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${Math.max(8, m.completionPct)}%`,
                    backgroundColor: t.primary,
                    borderRadius: isBrutal ? 0 : 99
                  }}
                />
              </div>
            </div>

            {/* Secondary Elevation Strip (`surface2`) */}
            <div
              className={clsx(
                'flex-1 flex flex-col justify-center gap-1 min-w-0',
                isHero ? 'px-2 py-1.5' : 'px-1.5 py-1'
              )}
              style={{
                backgroundColor: t.surface2,
                border: `1px solid ${t.border}`,
                borderRadius: rInner
              }}
            >
              {[t.primary, t.accent2].map((dotColor, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 shrink-0"
                    style={{
                      backgroundColor: dotColor,
                      borderRadius: isBrutal ? 0 : 99
                    }}
                  />
                  <span
                    className="h-1 flex-1"
                    style={{
                      backgroundColor: t.text,
                      opacity: idx === 0 ? 0.55 : 0.3,
                      borderRadius: isBrutal ? 0 : 99
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const previewMetrics = useMemo(() => computePreviewMetrics(state.tasks), [state.tasks]);

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
          t.archetype.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeFilter, searchQuery]);

  const featuredThemes = useMemo(() => filteredThemes.filter(t => t.featured), [filteredThemes]);
  const legacyThemes = useMemo(() => filteredThemes.filter(t => !t.featured), [filteredThemes]);

  const handleThemeClick = (themeId: string, event?: React.SyntheticEvent) => {
    runCircularThemeTransition(() => {
      setTheme(themeId);
      if (onSelectTheme) onSelectTheme(themeId);
    }, event as any);
  };

  const renderThemeCard = (t: ThemeDef) => {
    const isActive = currentThemeId === t.id;
    const fontFam = t.font.split(',')[0].replace(/'/g, '').trim();
    const footerBg = t.surfaceOpaque || t.surface;
    const inkOnPrimary = getContrastInk(t.primary);
    const isBrutal = t.effect === 'brutal';

    return (
      <div
        key={t.id}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        aria-label={`${t.name} theme — ${t.isDark ? 'Dark' : 'Light'}, ${t.archetype}`}
        onClick={(e) => handleThemeClick(t.id, e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleThemeClick(t.id, e);
          }
        }}
        onMouseEnter={() => onHoverTheme?.(t)}
        onMouseLeave={() => onHoverTheme?.(null)}
        onFocus={() => onHoverTheme?.(t)}
        onBlur={() => onHoverTheme?.(null)}
        className={clsx(
          'rounded-xl overflow-hidden border-2 text-left transition-all duration-200 cursor-pointer relative group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] active:scale-[0.985] hover:-translate-y-0.5',
          isActive
            ? 'shadow-lg'
            : 'hover:shadow-md'
        )}
        style={{
          borderColor: isActive ? t.primary : isBrutal ? '#ffffff' : t.border,
          backgroundColor: t.bg,
          boxShadow: isActive
            ? `0 8px 24px ${t.primary}30`
            : isBrutal
            ? '3px 3px 0px #ffffff'
            : undefined
        }}
      >
        {/* Miniature Live UI Preview Stage (unobstructed) */}
        <ThemePreviewStage
          theme={t}
          variant="card"
          compact={compact}
          metrics={previewMetrics}
          projectTitle={state.projectName}
        />

        {/* Theme-Native Details Footer */}
        <div
          className="p-2.5 flex-1 flex flex-col justify-between gap-2"
          style={{
            backgroundColor: footerBg,
            color: t.text,
            borderTop: isBrutal ? '1.5px solid #ffffff' : `1px solid ${t.border}`
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <span
                className="text-xs font-bold tracking-tight truncate flex items-center gap-1.5 min-w-0"
                style={{ color: t.text, fontFamily: t.font }}
              >
                <span
                  className="w-2.5 h-2.5 shrink-0"
                  style={{
                    backgroundColor: t.primary,
                    borderRadius: isBrutal ? 0 : 99,
                    border: `1px solid ${t.border}`
                  }}
                />
                <span className="truncate">{t.name}</span>
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {isActive && (
                  <span
                    className="text-[8.5px] font-bold px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-0.5"
                    style={{
                      backgroundColor: t.primary,
                      color: inkOnPrimary,
                      borderRadius: isBrutal ? 0 : 5,
                      border: isBrutal ? '1px solid #ffffff' : undefined
                    }}
                  >
                    <Check size={9} strokeWidth={3} />
                    <span>Active</span>
                  </span>
                )}
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: t.surface2,
                    color: t.textMuted,
                    borderRadius: isBrutal ? 0 : 5,
                    border: `1px solid ${t.border}`
                  }}
                >
                  {t.isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>

            <p
              className="text-[11px] leading-snug line-clamp-2 mt-1"
              style={{ color: t.textMuted }}
            >
              {t.desc}
            </p>
          </div>

          {/* Architecture Token Strip: Canvas/Surface/Elevated/Accent Swatches + Style Archetype + Font */}
          <div
            className="flex items-center justify-between gap-1.5 pt-2 text-[10px]"
            style={{ borderTop: `1px solid ${t.border}` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {/* 4-token architectural swatch chip stack */}
              <div className="flex items-center -space-x-1 shrink-0" title={`Canvas ${t.bg} · Surface ${footerBg} · Elevated · Primary ${t.primary}`}>
                {[t.bg, footerBg, t.surface2, t.primary].map((hex, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 block shrink-0"
                    style={{
                      backgroundColor: hex,
                      borderRadius: isBrutal ? 0 : 99,
                      border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.2)'}`
                    }}
                  />
                ))}
              </div>
              <span
                className="font-mono text-[9.5px] font-semibold truncate"
                style={{ color: t.textMuted }}
              >
                {fontFam}
              </span>
            </div>

            <span
              className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: `${t.primary}18`,
                color: isBrutal || (t.isDark && getContrastInk(t.primary) === '#ffffff') ? t.text : t.primary,
                borderRadius: isBrutal ? 0 : 4
              }}
            >
              {t.archetype}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Search and Filters */}
      {(showSearch || showCategories) && (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {showSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                aria-label="Search themes by name, font, or style"
                placeholder={`Search ${THEMES.length} themes by name, font, style...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-colors"
              />
            </div>
          )}

          {showCategories && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)] text-[11px] sm:text-xs">
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
                    'relative px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition-colors duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap',
                    activeFilter === cat.id
                      ? 'text-[var(--color-primary-hex)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  )}
                >
                  {activeFilter === cat.id && (
                    <motion.span
                      layoutId="themeFilterPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 bg-[var(--color-surface)] rounded-lg shadow-2xs"
                    />
                  )}
                  <span className="relative z-[1]">{cat.label}</span>
                  <span className="relative z-[1] text-[10px] opacity-70">({cat.count})</span>
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
              'grid gap-3.5',
              compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
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
              'grid gap-3.5',
              compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
            )}>
              {legacyThemes.map(renderThemeCard)}
            </div>
          </div>
        )}

        {filteredThemes.length === 0 && (
          <div className="p-8 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-divider)] rounded-2xl space-y-2">
            <p>No themes found matching "{searchQuery}".</p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-3 py-1 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeGrid;
