import ExcelJS from 'exceljs';
import { 
  ProjectState, 
  Task, 
  TaskStatus, 
  TaskPriority, 
  Delivery, 
  Defect, 
  RaidItem, 
  Decision, 
  Member, 
  Release, 
  Feature, 
  LogEntry, 
  Baseline
} from '../types';

// ============================================================================
// 1. HIGH-END THEME PALETTE & VISUAL STYLING ENGINE
// ============================================================================

export interface ExcelThemePalette {
  navy: string;
  indigo: string;
  primaryHover: string;
  slate: string;
  emerald: string;
  rose: string;
  header: string;
  input: string;
  amber: string;
  blue: string;
  purple: string;
  teal: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  divider: string;
  border: string;
  muted: string;
  textDark: string;
  isDark: boolean;
  themeName: string;
  colorMode: string;
  blendColors: (argbA: string, argbB: string, weightA?: number) => string;
  getThemeTint: (argb: string, factor: number) => string;
  getReadableText: (bgArgb: string, lightArgb?: string, darkArgb?: string) => string;
}

export const THEME_PALETTES: Record<string, { primary: string; bg: string; surface: string; surfaceAlt?: string; isDark: boolean }> = {
  pulse: { primary: '38BDF8', bg: '0D0D0F', surface: '151518', surfaceAlt: '1C1C22', isDark: true },
  origin: { primary: '0F4C5C', bg: 'FAF9F6', surface: 'FFFFFF', surfaceAlt: 'F2F0E8', isDark: false },
  nova: { primary: '6366F1', bg: 'F5F6FF', surface: 'FFFFFF', surfaceAlt: 'ECEEFF', isDark: false },
  terminal: { primary: '0969DA', bg: 'F6F8FA', surface: 'FFFFFF', surfaceAlt: 'EAEFF5', isDark: false },
  'aurora-studio': { primary: '8656F6', bg: 'FAFAFE', surface: 'FFFFFF', surfaceAlt: 'F0EFFF', isDark: false },
  'obsidian-dark': { primary: '008948', bg: '040404', surface: '0A0A0A', surfaceAlt: '121212', isDark: true },
  'paper-editorial': { primary: 'B5451B', bg: 'FDF8F0', surface: 'FFFDF8', surfaceAlt: 'F7EFE2', isDark: false },
  nexus: { primary: '0F4C5C', bg: 'F8F7F3', surface: 'FFFFFF', surfaceAlt: 'EFECE4', isDark: false },
  'nexus-dark': { primary: '4F98A3', bg: '0A1F24', surface: '0F2D35', surfaceAlt: '143B45', isDark: true },
  obsidian: { primary: '008944', bg: '050505', surface: '0F0F0F', surfaceAlt: '1A1A1A', isDark: true },
  paper: { primary: '44403C', bg: 'FCFAF7', surface: 'FFFFFF', surfaceAlt: 'F3EFEA', isDark: false },
  'paper-dark': { primary: '6B9BD1', bg: '1C1917', surface: '292524', surfaceAlt: '36312E', isDark: true },
  aurora: { primary: '6265F1', bg: 'F8FAFC', surface: 'FFFFFF', surfaceAlt: 'EEF2F6', isDark: false },
  'aurora-dark': { primary: 'A78BFA', bg: '0F172A', surface: '1E293B', surfaceAlt: '27354D', isDark: true },
  chrome: { primary: '0B8395', bg: '030712', surface: '111827', surfaceAlt: '1A2234', isDark: true },
  titan: { primary: '1E293B', bg: 'FFFFFF', surface: 'FFFFFF', surfaceAlt: 'F1F5F9', isDark: false },
  'titan-dark': { primary: '38BDF8', bg: '020617', surface: '0F172A', surfaceAlt: '17233B', isDark: true },
  lumina: { primary: '1E70F5', bg: 'F8FAFC', surface: 'FFFFFF', surfaceAlt: 'EEF2F6', isDark: false },
  'lumina-dark': { primary: '38BDF8', bg: '0B1120', surface: '131C31', surfaceAlt: '1C2742', isDark: true },
  emerald: { primary: '10B981', bg: 'F0FDF4', surface: 'FFFFFF', surfaceAlt: 'DCFCE7', isDark: false },
  'emerald-dark': { primary: '34D399', bg: '022C22', surface: '064E3B', surfaceAlt: '0B654E', isDark: true },
  carbon: { primary: 'E2E8F0', bg: '18181B', surface: '27272A', surfaceAlt: '333338', isDark: true },
  midnight: { primary: '818CF8', bg: '090D16', surface: '131A29', surfaceAlt: '1D263B', isDark: true },
  champagne: { primary: 'D97706', bg: 'FFFBEB', surface: 'FFFFFF', surfaceAlt: 'FEF3C7', isDark: false },
  'champagne-dark': { primary: 'FBBF24', bg: '1F1600', surface: '2E2200', surfaceAlt: '3D2D00', isDark: true },
  cyberpunk: { primary: 'F43F5E', bg: '05050A', surface: '120F1D', surfaceAlt: '1E1830', isDark: true },
  play: { primary: 'EC4899', bg: 'FDF2F8', surface: 'FFFFFF', surfaceAlt: 'FCE7F3', isDark: false },
  'play-dark': { primary: 'F472B6', bg: '1A0914', surface: '2B1023', surfaceAlt: '3B1731', isDark: true },
  prism: { primary: '8B5CF6', bg: 'F5F3FF', surface: 'FFFFFF', surfaceAlt: 'EDE9FE', isDark: false },
  'prism-dark': { primary: 'A78BFA', bg: '140C24', surface: '1F1438', surfaceAlt: '2E1E52', isDark: true },
  glass: { primary: '0284C7', bg: 'F0F9FF', surface: 'FFFFFF', surfaceAlt: 'E0F2FE', isDark: false },
  'glass-dark': { primary: '38BDF8', bg: '082F49', surface: '0C4A6E', surfaceAlt: '115E8C', isDark: true },
  terracotta: { primary: 'E05A47', bg: 'FFF7ED', surface: 'FFFFFF', surfaceAlt: 'FFEDD5', isDark: false },
  fintech: { primary: '059669', bg: 'ECFDF5', surface: 'FFFFFF', surfaceAlt: 'D1FAE5', isDark: false },
  bento: { primary: '4F46E5', bg: 'EEF2FF', surface: 'FFFFFF', surfaceAlt: 'E0E7FF', isDark: false },
  codename: { primary: '10B981', bg: '020617', surface: '0F172A', surfaceAlt: '17233B', isDark: true },
  workflow: { primary: '2563EB', bg: 'F8FAFC', surface: 'FFFFFF', surfaceAlt: 'EFF6FF', isDark: false },
  brutalist: { primary: 'DC2626', bg: 'FFFFFF', surface: 'FFFFFF', surfaceAlt: 'F5F5F5', isDark: false }
};

export function isColorDark(argb: string): boolean {
  if (!argb || argb.length < 6) return false;
  const hex = argb.length === 8 ? argb.substring(2) : argb.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 140;
}

export function getReadableText(bgArgb: string, lightArgb = 'FFFFFFFF', darkArgb = 'FF0F172A'): string {
  return isColorDark(bgArgb) ? lightArgb : darkArgb;
}

export function blendColors(argbA: string, argbB: string, weightA = 0.5): string {
  const hexA = argbA.length === 8 ? argbA.substring(2) : argbA.replace('#', '');
  const hexB = argbB.length === 8 ? argbB.substring(2) : argbB.replace('#', '');
  const rA = parseInt(hexA.substring(0, 2), 16) || 0;
  const gA = parseInt(hexA.substring(2, 4), 16) || 0;
  const bA = parseInt(hexA.substring(4, 6), 16) || 0;
  const rB = parseInt(hexB.substring(0, 2), 16) || 0;
  const gB = parseInt(hexB.substring(2, 4), 16) || 0;
  const bB = parseInt(hexB.substring(4, 6), 16) || 0;
  const r = Math.max(0, Math.min(255, Math.round(rA * weightA + rB * (1 - weightA))));
  const g = Math.max(0, Math.min(255, Math.round(gA * weightA + gB * (1 - weightA))));
  const b = Math.max(0, Math.min(255, Math.round(bA * weightA + bB * (1 - weightA))));
  return 'FF' + r.toString(16).padStart(2, '0').toUpperCase() + g.toString(16).padStart(2, '0').toUpperCase() + b.toString(16).padStart(2, '0').toUpperCase();
}

export function parseCssColorToArgb(cssVal: string | undefined, defaultArgb: string): string {
  if (!cssVal) return defaultArgb;
  const clean = String(cssVal).trim();
  if (clean.startsWith('#')) {
    let hex = clean.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    } else if (hex.length === 8) {
      hex = hex.substring(0, 6);
    }
    return 'FF' + hex.toUpperCase();
  }
  if (clean.startsWith('rgb')) {
    const match = clean.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
      return 'FF' + (r + g + b).toUpperCase();
    }
  }
  return defaultArgb;
}

export function getThemePalette(
  stateOrTheme?: ProjectState | string,
  colorModeOverride?: string
): ExcelThemePalette {
  let themeName = 'pulse';
  if (typeof stateOrTheme === 'string' && stateOrTheme) {
    themeName = stateOrTheme;
  } else if (typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-theme')) {
    themeName = document.documentElement.getAttribute('data-theme') || 'pulse';
  } else if (typeof stateOrTheme === 'object' && stateOrTheme && (stateOrTheme as any).theme) {
    themeName = (stateOrTheme as any).theme;
  }

  let colorMode = colorModeOverride || 'default';
  if (colorMode === 'default' && typeof document !== 'undefined' && document.documentElement) {
    colorMode = document.documentElement.getAttribute('data-color-mode') || 'default';
  }

  const themeDef = THEME_PALETTES[themeName] || THEME_PALETTES['pulse'];
  let isDark = colorMode === 'dark' || (colorMode !== 'light' && Boolean(themeDef.isDark));

  let primaryHex = themeDef.primary;
  let bgHex = themeDef.bg;
  let surfaceHex = themeDef.surface;
  let surfaceAltHex = themeDef.surfaceAlt || (isDark ? '1C1C22' : 'F1F5F9');

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const activeAttr = document.documentElement.getAttribute('data-theme');
      if (activeAttr === themeName) {
        const computed = window.getComputedStyle(document.documentElement);
        const cssBg = computed.getPropertyValue('--color-bg').trim();
        const cssPrimary = computed.getPropertyValue('--color-primary-hex').trim();
        const cssSurface = computed.getPropertyValue('--color-surface').trim();
        const cssSurface2 = computed.getPropertyValue('--color-surface-2').trim();

        if (cssBg) bgHex = cssBg.replace('#', '');
        if (cssPrimary) primaryHex = cssPrimary.replace('#', '');
        if (cssSurface) surfaceHex = cssSurface.replace('#', '');
        if (cssSurface2) surfaceAltHex = cssSurface2.replace('#', '');
      }
    } catch {
      // Keep static defaults
    }
  }

  const resolvedBg = `FF${bgHex.padStart(6, '0D0D0F').toUpperCase()}`;
  const resolvedSurface = `FF${surfaceHex.padStart(6, '151518').toUpperCase()}`;
  const resolvedSurfaceAlt = `FF${surfaceAltHex.padStart(6, isDark ? '1C1C22' : 'F1F5F9').toUpperCase()}`;
  const resolvedPrimary = `FF${primaryHex.padStart(6, '38BDF8').toUpperCase()}`;

  // Ensure isDark aligns with resolved background luminance
  if (colorMode === 'default') {
    isDark = isColorDark(resolvedBg);
  }

  const resolvedNavy = isDark ? 'FF0F172A' : (isColorDark(resolvedPrimary) ? resolvedPrimary : 'FF0F172A');
  const resolvedHeader = isDark ? 'FF1E293B' : 'FFF1F5F9';
  const resolvedDivider = isDark ? 'FF334155' : 'FFE2E8F0';
  const resolvedBorder = isDark ? 'FF334155' : 'FFCBD5E1';
  const resolvedMuted = isDark ? 'FF94A3B8' : 'FF64748B';
  const resolvedTextDark = isDark ? 'FFFFFFFF' : 'FF0F172A';

  const paletteObj: ExcelThemePalette = {
    navy: resolvedNavy,
    indigo: resolvedPrimary,
    primaryHover: resolvedPrimary,
    slate: resolvedMuted,
    emerald: 'FF10B981',
    rose: 'FFF43F5E',
    header: resolvedHeader,
    input: resolvedPrimary,
    amber: 'FFF59E0B',
    blue: isDark ? 'FF38BDF8' : 'FF3B82F6',
    purple: 'FF8B5CF6',
    teal: 'FF0D9488',
    bg: resolvedBg,
    surface: resolvedSurface,
    surfaceAlt: resolvedSurfaceAlt,
    divider: resolvedDivider,
    border: resolvedBorder,
    muted: resolvedMuted,
    textDark: resolvedTextDark,
    isDark,
    themeName,
    colorMode,
    blendColors,
    getThemeTint: (argb: string, factor: number) => {
      if (!argb || argb.length < 6) return resolvedBg;
      return blendColors(argb, resolvedBg, factor);
    },
    getReadableText: (bgArgb: string, lightArgb = 'FFFFFFFF', darkArgb = 'FF0F172A') => {
      return isColorDark(bgArgb) ? lightArgb : darkArgb;
    }
  };

  return paletteObj;
}

export function drawTopKpiCard(
  sheet: ExcelJS.Worksheet,
  col: number,
  row: number,
  w: number,
  h: number,
  label: string,
  value: string,
  subLabel: string,
  accentColor: string,
  opts: {
    isDark?: boolean;
    cardBg?: string;
    borderOuter?: string;
    labelColor?: string;
    valueColor?: string;
    subColor?: string;
    font?: string;
  } = {}
) {
  const isDark = opts.isDark ?? false;
  const cardBg = opts.cardBg || (isDark ? 'FF1E293B' : 'FFFFFFFF');
  const borderOuter = opts.borderOuter || (isDark ? 'FF2A364F' : 'FFCBD5E1');
  const fontName = opts.font || 'Segoe UI';
  const labelText = `[${label.toUpperCase()}]\n`;
  const labelColor = opts.labelColor || (isDark ? 'FF94A3B8' : 'FF64748B');
  const valueColor = opts.valueColor || accentColor;
  const subColor = opts.subColor || (isDark ? 'FF94A3B8' : 'FF64748B');

  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      sheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cardBg } };
    }
  }
  sheet.mergeCells(row, col, row + h - 1, col + w - 1);
  const mainCell = sheet.getCell(row, col);
  mainCell.border = {
    top: { style: 'thin', color: { argb: borderOuter } },
    left: { style: 'medium', color: { argb: accentColor } },
    bottom: { style: 'medium', color: { argb: borderOuter } },
    right: { style: 'thin', color: { argb: borderOuter } }
  };
  mainCell.value = {
    richText: [
      { text: labelText, font: { name: fontName, size: 8, bold: true, color: { argb: labelColor } } },
      { text: `${value}\n`, font: { name: fontName, size: 14, bold: true, color: { argb: valueColor } } },
      { text: subLabel || '', font: { name: fontName, size: 7.5, italic: true, color: { argb: subColor } } }
    ]
  };
  mainCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
}

export function styleHeaderCell(
  cell: ExcelJS.Cell, 
  bgArgb: string, 
  textArgb?: string, 
  bdrBottom?: string
) {
  const isDarkBg = isColorDark(bgArgb);
  const resolvedText = textArgb || (isDarkBg ? 'FFFFFFFF' : 'FF0F172A');
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: resolvedText } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    bottom: { style: 'medium', color: { argb: bdrBottom || (isDarkBg ? 'FF0F172A' : 'FFCBD5E1') } },
    top: { style: 'thin', color: { argb: isDarkBg ? 'FF334155' : 'FFE2E8F0' } },
    left: { style: 'hair', color: { argb: isDarkBg ? 'FF334155' : 'FFE2E8F0' } },
    right: { style: 'hair', color: { argb: isDarkBg ? 'FF334155' : 'FFE2E8F0' } }
  };
}

export function styleZebraRow(row: ExcelJS.Row, index: number, palette: ExcelThemePalette, maxCol = 50) {
  const isDark = palette.isDark;
  const bg = index % 2 === 1
    ? (isDark ? 'FF182234' : 'FFF8FAFC')
    : (isDark ? 'FF1E293B' : 'FFFFFFFF');

  for (let c = 1; c <= maxCol; c++) {
    const cell = row.getCell(c);
    if (!cell.fill || cell.fill.type !== 'pattern') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    }
    if (!cell.font) {
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: palette.textDark } };
    }
    if (!cell.border) {
      cell.border = {
        bottom: { style: 'thin', color: { argb: palette.divider } },
        right: { style: 'hair', color: { argb: palette.divider } }
      };
    }
  }
}

export function formatStatusCell(cell: ExcelJS.Cell, status: string, palette: ExcelThemePalette) {
  const s = String(status || '').trim();
  let fillArgb = palette.slate;
  let textArgb = 'FFFFFFFF';

  if (/completed|closed|deployed|fixed|approved|passed/i.test(s)) {
    fillArgb = palette.isDark ? 'FF064E3B' : 'FFD1FAE5';
    textArgb = palette.isDark ? 'FF6EE7B7' : 'FF065F46';
  } else if (/in progress|running|testing/i.test(s)) {
    fillArgb = palette.isDark ? 'FF1E1B4B' : 'FFE0E7FF';
    textArgb = palette.isDark ? 'FFA5B4FC' : 'FF3730A3';
  } else if (/blocked|rejected|failed|cancelled|rolled back/i.test(s)) {
    fillArgb = palette.isDark ? 'FF7F1D1D' : 'FFFEE2E2';
    textArgb = palette.isDark ? 'FFFCA5A5' : 'FF991B1B';
  } else if (/on hold|pending|scheduled|under review|notice/i.test(s)) {
    fillArgb = palette.isDark ? 'FF78350F' : 'FFFEF3C7';
    textArgb = palette.isDark ? 'FFFCD34D' : 'FF92400E';
  } else {
    fillArgb = palette.isDark ? 'FF334155' : 'FFF1F5F9';
    textArgb = palette.isDark ? 'FFE2E8F0' : 'FF475569';
  }

  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
  cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: textArgb } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

export function formatPriorityCell(cell: ExcelJS.Cell, priority: string, palette: ExcelThemePalette) {
  const p = String(priority || '').trim();
  let fillArgb = palette.slate;
  let textArgb = 'FFFFFFFF';

  if (/critical|s1|blocker/i.test(p)) {
    fillArgb = palette.isDark ? 'FF7F1D1D' : 'FFFEE2E2';
    textArgb = palette.isDark ? 'FFFEE2E2' : 'FF990000';
  } else if (/high|s2/i.test(p)) {
    fillArgb = palette.isDark ? 'FF78350F' : 'FFFEF3C7';
    textArgb = palette.isDark ? 'FFFDE68A' : 'FF92400E';
  } else if (/medium|s3/i.test(p)) {
    fillArgb = palette.isDark ? 'FF1E3A8A' : 'FFDBEAFE';
    textArgb = palette.isDark ? 'FFBFDBFE' : 'FF1E40AF';
  } else {
    fillArgb = palette.isDark ? 'FF334155' : 'FFF1F5F9';
    textArgb = palette.isDark ? 'FFE2E8F0' : 'FF64748B';
  }

  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
  cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: textArgb } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

export function parseExcelDate(val: any): string {
  if (!val || val === '-' || val === '—') return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const date = new Date(ms);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (typeof val === 'string') {
    const clean = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.substring(0, 10);
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return d.toISOString().split('T')[0];
    }
  }
  return '';
}

export function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (Array.isArray(val.richText)) {
      return val.richText.map((rt: any) => rt.text || '').join('').trim();
    }
    if (val.text !== undefined) return String(val.text).trim();
    if (val.result !== undefined) return String(val.result).trim();
    return JSON.stringify(val);
  }
  return String(val).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '').trim();
}

// ============================================================================
// 2. HIGH-RESOLUTION CANVAS CHART & COCKPIT TELEMETRY ENGINE
// ============================================================================

export function getThemeTint(argb: string, factor: number, palette: ExcelThemePalette): string {
  const hex = (argb || 'FF6366F1').substring(Math.max(0, argb.length - 6));
  let r = parseInt(hex.substring(0, 2), 16) || 0;
  let g = parseInt(hex.substring(2, 4), 16) || 0;
  let b = parseInt(hex.substring(4, 6), 16) || 0;

  const bgHex = (palette.bg || 'FF090D16').substring(Math.max(0, palette.bg.length - 6));
  const bgR = parseInt(bgHex.substring(0, 2), 16) || (palette.isDark ? 9 : 248);
  const bgG = parseInt(bgHex.substring(2, 4), 16) || (palette.isDark ? 13 : 250);
  const bgB = parseInt(bgHex.substring(4, 6), 16) || (palette.isDark ? 22 : 252);

  r = Math.round(r * factor + bgR * (1 - factor));
  g = Math.round(g * factor + bgG * (1 - factor));
  b = Math.round(b * factor + bgB * (1 - factor));
  return 'FF' + r.toString(16).padStart(2, '0').toUpperCase() + g.toString(16).padStart(2, '0').toUpperCase() + b.toString(16).padStart(2, '0').toUpperCase();
}

export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getHealthScore(tasks: Task[]): number {
  if (!tasks || !tasks.length) return 100;
  const now = Date.now();
  const overdue = tasks.filter(t => t.dueDate && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate).getTime() < now).length;
  const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  const critOverdue = tasks.filter(t => t.priority === TaskPriority.CRITICAL && t.dueDate && t.status !== TaskStatus.COMPLETED && new Date(t.dueDate).getTime() < now).length;
  const deduction = (overdue * 3) + (blocked * 5) + (critOverdue * 8);
  return Math.max(10, Math.min(100, 100 - deduction));
}

const S = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

const cleanFmtDate = (d: any): string => {
  if (!d || d === '-' || d === '—') return '-';
  try {
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? '-' : dateObj.toISOString().split('T')[0];
  } catch {
    return '-';
  }
};

export function generateCanvasChart(
  width: number,
  height: number,
  type: 'donut' | 'bar' | 'line' | 'horizontalBar' | 'stackedHorizontalBar' | 'stackedArea',
  data: any,
  colors?: any,
  palette?: ExcelThemePalette
): string | null {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(2, 2);

    const isDarkTheme = palette?.isDark ?? false;
    const toWebColor = (col: string) => {
      if (!col) return '#475569';
      let clean = col.replace('#', '');
      if (clean.length === 8) return '#' + clean.substring(2);
      return '#' + clean;
    };
    const hexToRgba = (hex: string, alpha: number) => {
      let c = toWebColor(hex).replace('#', '');
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      const r = parseInt(c.substring(0, 2), 16) || 0;
      const g = parseInt(c.substring(2, 4), 16) || 0;
      const b = parseInt(c.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const bgColor = palette?.surface || (isDarkTheme ? '#121722' : '#FFFFFF');
    ctx.fillStyle = toWebColor(bgColor);
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(1.5, height / 240);

    const VIBRANT_GRADIENTS = [
      { start: '#4F46E5', end: '#818CF8' },
      { start: '#10B981', end: '#34D399' },
      { start: '#F59E0B', end: '#FBBF24' },
      { start: '#EF4444', end: '#F87171' },
      { start: '#3B82F6', end: '#60A5FA' },
      { start: '#8B5CF6', end: '#A78BFA' },
      { start: '#EC4899', end: '#F472B6' },
      { start: '#06B6D4', end: '#22D3EE' },
      { start: '#F97316', end: '#FB923C' }
    ];

    if (type === 'donut') {
      const items: { label: string; value: number; color: string }[] = data || [];
      const total = items.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
      const centerX = width * 0.32;
      const centerY = height * 0.5;
      const radius = Math.min(width, height) * 0.35;
      const innerRadius = radius * 0.55;

      // Decorative outer arcs
      ctx.strokeStyle = isDarkTheme ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.15, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius * 0.75, 0, 2 * Math.PI);
      ctx.stroke();

      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        const xStart = centerX + Math.cos(rad) * radius * 1.15;
        const yStart = centerY + Math.sin(rad) * radius * 1.15;
        const xEnd = centerX + Math.cos(rad) * (radius * 1.15 - 4);
        const yEnd = centerY + Math.sin(rad) * (radius * 1.15 - 4);
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }

      let startAngle = -Math.PI / 2;
      items.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        if (sliceAngle <= 0) return;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = toWebColor(item.color);
        ctx.fill();

        ctx.strokeStyle = toWebColor(bgColor);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        startAngle += sliceAngle;
      });

      if (colors?.centerText) {
        ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#0F172A';
        ctx.font = 'bold ' + Math.round(9 * scale) + 'px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(colors.centerText, centerX, centerY);
      }

      const legendX = width * 0.58;
      let legendY = height * 0.18;
      const boxSize = 8;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      let itemsToDisplay = items;
      if (items.length > 8) {
        const top7 = items.slice(0, 7);
        const remainingVal = items.slice(7).reduce((sum, item) => sum + item.value, 0);
        itemsToDisplay = [...top7, { label: 'OTHER', value: remainingVal, color: '#94A3B8' }];
      }

      itemsToDisplay.forEach(item => {
        ctx.fillStyle = toWebColor(item.color);
        ctx.fillRect(legendX, legendY - boxSize / 2, boxSize, boxSize);
        ctx.fillStyle = isDarkTheme ? '#E2E8F0' : '#0F172A';
        ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
        const pct = Math.round((item.value / total) * 100);
        const cleanLbl = String(item.label).toUpperCase().substring(0, 12);
        ctx.fillText(`${cleanLbl}: ${item.value} (${pct}%)`, legendX + boxSize + 8, legendY);
        legendY += 20;
      });
    } else if (type === 'bar') {
      const labels: string[] = data.labels || [];
      const values: number[] = data.values || [];
      const numBars = labels.length || 1;
      const padL = Math.round(35 * scale);
      const padR = Math.round(15 * scale);
      const padT = Math.round(30 * scale);
      const padB = numBars > 8 ? Math.round(45 * scale) : Math.round(25 * scale);
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;
      const maxVal = Math.max(...values, 1) * 1.15;

      ctx.strokeStyle = isDarkTheme ? '#334155' : '#F1F5F9';
      ctx.lineWidth = 1;
      ctx.font = Math.round(8 * scale) + 'px Courier New, monospace';
      ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 4; i++) {
        const y = padT + chartH * (1 - i / 4);
        const v = Math.round(maxVal * (i / 4));
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
        ctx.fillText(String(v), padL - 4, y);
      }

      const barWidth = (chartW / numBars) * 0.55;
      const spacing = (chartW / numBars);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      values.forEach((val, idx) => {
        const xCenter = padL + idx * spacing + spacing / 2;
        const x = xCenter - barWidth / 2;
        const y = padT + chartH * (1 - val / maxVal);
        const h = chartH * (val / maxVal);

        const gradConf = VIBRANT_GRADIENTS[idx % VIBRANT_GRADIENTS.length];
        const barGrad = ctx.createLinearGradient(0, y, 0, height - padB);
        barGrad.addColorStop(0, gradConf.start);
        barGrad.addColorStop(1, gradConf.end);
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, barWidth, h);

        ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#1E293B';
        ctx.font = 'bold ' + Math.round(8.5 * scale) + 'px Courier New, monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(Math.round(val)), xCenter, y - 2);

        ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
        ctx.font = Math.round(8 * scale) + 'px Courier New, monospace';
        ctx.save();
        ctx.translate(xCenter, height - padB + 4);
        if (numBars > 6) {
          ctx.rotate(-Math.PI / 4);
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
        }
        ctx.fillText(labels[idx] || '', 0, 0);
        ctx.restore();
      });

      const legendY = 12;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
      ctx.fillStyle = isDarkTheme ? '#E2E8F0' : '#475569';
      ctx.fillText(colors?.title || 'DELIVERY VELOCITY & THROUGHPUT', Math.round(15 * scale), legendY);
    } else if (type === 'line') {
      const labels: string[] = data.labels || [];
      const ideal: number[] = data.ideal || [];
      const actual: number[] = data.actual || [];
      const padL = Math.round(35 * scale);
      const padR = Math.round(15 * scale);
      const padT = Math.round(30 * scale);
      const padB = Math.round(25 * scale);
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;
      const maxVal = Math.max(...ideal, ...actual, 1) * 1.15;
      const numPoints = labels.length || 1;

      ctx.strokeStyle = isDarkTheme ? '#334155' : '#F1F5F9';
      ctx.lineWidth = 1;
      ctx.font = Math.round(8 * scale) + 'px Courier New, monospace';
      ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 4; i++) {
        const y = padT + chartH * (1 - i / 4);
        const v = Math.round(maxVal * (i / 4));
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
        ctx.fillText(String(v), padL - 4, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      labels.forEach((lbl, idx) => {
        const x = padL + (idx / Math.max(1, numPoints - 1)) * chartW;
        ctx.fillText(lbl, x, height - padB + 4);
      });

      const getPt = (idx: number, val: number) => {
        const x = padL + (idx / Math.max(1, numPoints - 1)) * chartW;
        const y = padT + chartH * (1 - val / maxVal);
        return { x, y };
      };

      ctx.strokeStyle = isDarkTheme ? '#475569' : '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ideal.forEach((val, idx) => {
        const pt = getPt(idx, val);
        if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      const actualColor = toWebColor(palette?.indigo || '#6366F1');
      const areaGrad = ctx.createLinearGradient(0, padT, 0, height - padB);
      areaGrad.addColorStop(0, hexToRgba(actualColor, 0.25));
      areaGrad.addColorStop(1, hexToRgba(actualColor, 0.0));
      ctx.fillStyle = areaGrad;
      ctx.beginPath();
      actual.forEach((val, idx) => {
        const pt = getPt(idx, val);
        if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      });
      const ptLast = getPt(numPoints - 1, 0);
      const ptFirst = getPt(0, 0);
      ctx.lineTo(ptLast.x, ptLast.y);
      ctx.lineTo(ptFirst.x, ptFirst.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = actualColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      actual.forEach((val, idx) => {
        const pt = getPt(idx, val);
        if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      actual.forEach((val, idx) => {
        const pt = getPt(idx, val);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.round(3.5 * scale), 0, 2 * Math.PI);
        ctx.fillStyle = toWebColor(bgColor);
        ctx.fill();
        ctx.strokeStyle = actualColor;
        ctx.lineWidth = Math.round(1.5 * scale);
        ctx.stroke();
      });

      const legendY = 12;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
      ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
      ctx.fillText('IDEAL BURN', width - 215, legendY);
      ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#0F172A';
      ctx.fillText('ACTUAL REMAINING', width - 95, legendY);
    } else if (type === 'horizontalBar') {
      const labels: string[] = data.labels || [];
      const values: number[] = data.values || [];
      const numBars = labels.length || 1;
      const padL = Math.round(140 * scale);
      const padR = Math.round(50 * scale);
      const padT = Math.round(30 * scale);
      const padB = Math.round(20 * scale);
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;
      const barHeight = Math.max(8, Math.min(18, (chartH / numBars) * 0.55));
      const spacing = chartH / numBars;
      const maxVal = Math.max(...values, 100);

      values.forEach((val, idx) => {
        const yCenter = padT + idx * spacing + spacing / 2;
        const y = yCenter - barHeight / 2;
        const w = chartW * (Math.min(maxVal, Math.max(0, val)) / maxVal);

        ctx.fillStyle = isDarkTheme ? '#334155' : '#F1F5F9';
        ctx.fillRect(padL, y, chartW, barHeight);

        const barGrad = ctx.createLinearGradient(padL, 0, padL + chartW, 0);
        const gradConf = VIBRANT_GRADIENTS[idx % VIBRANT_GRADIENTS.length];
        barGrad.addColorStop(0, gradConf.start);
        barGrad.addColorStop(1, gradConf.end);
        ctx.fillStyle = barGrad;
        ctx.fillRect(padL, y, w, barHeight);

        ctx.fillStyle = isDarkTheme ? '#E2E8F0' : '#475569';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
        const rawLbl = String(labels[idx] || '').substring(0, 16);
        ctx.fillText(rawLbl, padL - 8, yCenter);

        ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#0F172A';
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(val) + '%', padL + w + 4, yCenter);
      });

      const legendY = 12;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
      ctx.fillStyle = isDarkTheme ? '#E2E8F0' : '#475569';
      ctx.fillText(colors?.title || 'PROGRESS DENSITY BY MODULE', Math.round(15 * scale), legendY);
    } else if (type === 'stackedHorizontalBar') {
      const labels: string[] = data.labels || [];
      const series: { label: string; values: number[]; color: string }[] = data.series || [];
      const numBars = labels.length || 1;
      const padL = Math.round(130 * scale);
      const padR = Math.round(40 * scale);
      const padT = Math.round(30 * scale);
      const padB = Math.round(20 * scale);
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;
      const barHeight = Math.max(8, Math.min(18, (chartH / numBars) * 0.55));
      const spacing = chartH / numBars;

      let maxVal = 1;
      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        series.forEach(s => { sum += (s.values[i] || 0); });
        if (sum > maxVal) maxVal = sum;
      }
      maxVal = Math.max(maxVal, 1) * 1.1;

      for (let i = 0; i < numBars; i++) {
        const yCenter = padT + i * spacing + spacing / 2;
        const y = yCenter - barHeight / 2;
        ctx.fillStyle = isDarkTheme ? '#334155' : '#F1F5F9';
        ctx.fillRect(padL, y, chartW, barHeight);

        let accW = 0;
        series.forEach(s => {
          const val = s.values[i] || 0;
          if (val <= 0) return;
          const w = chartW * (val / maxVal);
          ctx.fillStyle = toWebColor(s.color);
          ctx.fillRect(padL + accW, y, w, barHeight);
          accW += w;
        });

        ctx.fillStyle = isDarkTheme ? '#E2E8F0' : '#475569';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
        ctx.fillText(String(labels[i] || '').substring(0, 15), padL - 8, yCenter);
      }

      const legendY = 12;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
      if (series[0]) {
        ctx.fillStyle = toWebColor(series[0].color);
        ctx.fillRect(width - 150, legendY - 4, 8, 8);
        ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
        ctx.fillText(series[0].label.toUpperCase(), width - 138, legendY);
      }
      if (series[1]) {
        ctx.fillStyle = toWebColor(series[1].color);
        ctx.fillRect(width - 80, legendY - 4, 8, 8);
        ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#0F172A';
        ctx.fillText(series[1].label.toUpperCase(), width - 68, legendY);
      }
    } else if (type === 'stackedArea') {
      const labels: string[] = data.labels || [];
      const series: { label: string; values: number[]; color: string }[] = data.series || [];
      const numPoints = labels.length || 1;
      const numSeries = series.length;
      const padL = Math.round(35 * scale);
      const padR = Math.round(15 * scale);
      const padT = Math.round(30 * scale);
      const padB = Math.round(25 * scale);
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;

      let maxStackedVal = 1;
      for (let idx = 0; idx < numPoints; idx++) {
        let sum = 0;
        for (let sIdx = 0; sIdx < numSeries; sIdx++) {
          sum += (series[sIdx].values[idx] || 0);
        }
        if (sum > maxStackedVal) maxStackedVal = sum;
      }
      maxStackedVal = Math.max(maxStackedVal, 1) * 1.15;

      const accBottom: number[] = new Array(numPoints).fill(0);
      const accTop: number[] = new Array(numPoints).fill(0);

      series.forEach(s => {
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          accTop[i] = accBottom[i] + (s.values[i] || 0);
          const x = padL + (i / Math.max(1, numPoints - 1)) * chartW;
          const y = padT + chartH * (1 - accTop[i] / maxStackedVal);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        for (let i = numPoints - 1; i >= 0; i--) {
          const x = padL + (i / Math.max(1, numPoints - 1)) * chartW;
          const y = padT + chartH * (1 - accBottom[i] / maxStackedVal);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = toWebColor(s.color);
        ctx.fill();

        for (let i = 0; i < numPoints; i++) {
          accBottom[i] = accTop[i];
        }
      });

      const legendY = 12;
      let legendX = padL;
      ctx.font = 'bold ' + Math.round(7.5 * scale) + 'px Courier New, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      series.forEach(s => {
        ctx.fillStyle = toWebColor(s.color);
        ctx.fillRect(legendX, legendY - 4, 7, 7);
        ctx.fillStyle = isDarkTheme ? '#E2E8F0' : '#0F172A';
        ctx.fillText(s.label.toUpperCase(), legendX + 11, legendY);
        legendX += ctx.measureText(s.label.toUpperCase()).width + 20;
      });
    }

    return canvas.toDataURL('image/png').split(',')[1];
  } catch (err) {
    console.warn('Canvas chart generation error:', err);
    return null;
  }
}

export function formatProgressGradient(cell: ExcelJS.Cell, progressVal: number, palette: ExcelThemePalette, isTask = false) {
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.numFmt = '0%';
  const p = Math.round(progressVal * 100);
  const isDark = palette.isDark;
  let startColor: string;
  let endColor: string;
  let fontColor: string;

  if (p < 30) {
    startColor = isDark ? 'FF7F1D1D' : 'FFFFEAEA';
    endColor = isDark ? 'FF991B1B' : 'FFFFC1C1';
    fontColor = isDark ? 'FFFEE2E2' : 'FF991B1B';
  } else if (p < 75) {
    startColor = isDark ? 'FF78350F' : 'FFFFF4E2';
    endColor = isDark ? 'FF92400E' : 'FFFFDCA8';
    fontColor = isDark ? 'FFFEF3C7' : 'FF92400E';
  } else {
    startColor = isDark ? 'FF064E3B' : 'FFF0FDF4';
    endColor = isDark ? 'FF15803D' : 'FFBBF7D0';
    fontColor = isDark ? 'FFF0FDF4' : 'FF166534';
  }

  cell.fill = {
    type: 'gradient',
    gradient: 'angle',
    degree: 90,
    stops: [
      { position: 0, color: { argb: startColor } },
      { position: 1, color: { argb: endColor } }
    ]
  };
  cell.font = { name: 'Segoe UI', size: isTask ? 10 : 9, bold: true, color: { argb: fontColor } };
  cell.border = {
    top: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFD1D5DB' } },
    bottom: { style: 'medium', color: { argb: isDark ? 'FF475569' : 'FF9CA3AF' } },
    left: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: isDark ? 'FF475569' : 'FF9CA3AF' } }
  };
}

export function styleUnifiedRow(
  row: ExcelJS.Row,
  level: number,
  statusVal: string,
  priorityVal: string,
  palette: ExcelThemePalette,
  colCount: number
) {
  const isDark = palette.isDark;
  const primaryColor = palette.indigo || 'FF6366F1';
  const textColor = isDark ? 'FFFFFFFF' : 'FF1F2937';
  const mutedTextColor = palette.slate || 'FF64748B';

  let nameFont: Partial<ExcelJS.Font>;
  let otherFont: Partial<ExcelJS.Font>;
  let bgFill: string;
  let rowHeight = 22;
  let borderStyle: any;

  if (level === 0) {
    rowHeight = 26;
    nameFont = { name: 'Segoe UI', size: 11, bold: true, color: { argb: textColor } };
    otherFont = { name: 'Segoe UI', size: 10, bold: true, color: { argb: isDark ? 'FFE2E8F0' : textColor } };
    bgFill = getThemeTint(primaryColor, 0.15, palette);
    borderStyle = {
      top: { style: 'medium', color: { argb: primaryColor } },
      bottom: { style: 'medium', color: { argb: primaryColor } },
      left: { style: 'thick', color: { argb: primaryColor } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  } else if (level === 1) {
    rowHeight = 22;
    nameFont = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: textColor } };
    otherFont = { name: 'Segoe UI', size: 9, color: { argb: mutedTextColor } };
    bgFill = getThemeTint(primaryColor, 0.08, palette);
    borderStyle = {
      top: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } },
      left: { style: 'medium', color: { argb: primaryColor } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  } else {
    rowHeight = 20;
    nameFont = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: mutedTextColor } };
    otherFont = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: mutedTextColor } };
    bgFill = getThemeTint(primaryColor, 0.03, palette);
    borderStyle = {
      top: { style: 'thin', color: { argb: isDark ? 'FF1E293B' : 'FFF1F5F9' } },
      bottom: { style: 'thin', color: { argb: isDark ? 'FF1E293B' : 'FFF1F5F9' } },
      left: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  }
  row.height = rowHeight;

  for (let c = 2; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgFill } };
    cell.border = {
      top: borderStyle.top,
      bottom: borderStyle.bottom,
      left: c === 2 ? borderStyle.left : undefined,
      right: c === colCount ? borderStyle.right : { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
    cell.font = (c === 3) ? nameFont : otherFont;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  const idCell = row.getCell('id');
  if (idCell) {
    idCell.font = { name: 'Consolas', size: level === 0 ? 9.5 : 9, color: { argb: isDark ? 'FF94A3B8' : 'FF475569' }, bold: level === 0 };
    idCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  ['type', 'category', 'module', 'moduleType', 'complexity'].forEach(k => {
    const cell = row.getCell(k);
    if (cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  ['startDate', 'dueDate', 'actCompletionDate'].forEach(k => {
    const cell = row.getCell(k);
    if (cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  ['estEffort', 'actEffort'].forEach(k => {
    const cell = row.getCell(k);
    if (cell) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0.0';
    }
  });

  const progCell = row.getCell('progress');
  if (progCell && progCell.value !== undefined && progCell.value !== null && progCell.value !== '') {
    const pVal = typeof progCell.value === 'number' ? progCell.value : parseFloat(String(progCell.value)) || 0;
    formatProgressGradient(progCell, pVal, palette, level === 0);
  }

  const statusCell = row.getCell('status');
  if (statusCell && statusVal) {
    formatStatusCell(statusCell, statusVal, palette);
  }

  const priCell = row.getCell('priority');
  if (priCell && priorityVal) {
    formatPriorityCell(priCell, priorityVal, palette);
  }
}

export function styleFeatureRolloutRow(
  row: ExcelJS.Row,
  level: number,
  statusVal: string,
  palette: ExcelThemePalette,
  colCount: number
) {
  const isDark = palette.isDark;
  const primaryColor = palette.indigo || 'FF6366F1';
  const textColor = isDark ? 'FFFFFFFF' : 'FF1F2937';
  const mutedTextColor = palette.slate || 'FF64748B';

  let nameFont: Partial<ExcelJS.Font>;
  let otherFont: Partial<ExcelJS.Font>;
  let bgFill: string;
  let rowHeight = 22;
  let borderStyle: any;

  if (level === 0) {
    rowHeight = 28;
    nameFont = { name: 'Segoe UI', size: 12, bold: true, color: { argb: textColor } };
    otherFont = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: isDark ? 'FFE2E8F0' : textColor } };
    bgFill = getThemeTint(primaryColor, 0.18, palette);
    borderStyle = {
      top: { style: 'medium', color: { argb: primaryColor } },
      bottom: { style: 'thick', color: { argb: primaryColor } },
      left: { style: 'thick', color: { argb: primaryColor } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  } else if (level === 1) {
    rowHeight = 24;
    nameFont = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: textColor } };
    otherFont = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: isDark ? 'FFE0E7FF' : textColor } };
    bgFill = getThemeTint(primaryColor, 0.10, palette);
    borderStyle = {
      top: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } },
      bottom: { style: 'medium', color: { argb: primaryColor } },
      left: { style: 'medium', color: { argb: primaryColor } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  } else if (level === 2) {
    rowHeight = 22;
    nameFont = { name: 'Segoe UI', size: 9.5, color: { argb: textColor } };
    otherFont = { name: 'Segoe UI', size: 9, color: { argb: mutedTextColor } };
    bgFill = getThemeTint(primaryColor, 0.05, palette);
    borderStyle = {
      top: { style: 'thin', color: { argb: isDark ? 'FF1E293B' : 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: isDark ? 'FF1E293B' : 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: primaryColor } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  } else {
    rowHeight = 20;
    nameFont = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: mutedTextColor } };
    otherFont = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: mutedTextColor } };
    bgFill = getThemeTint(primaryColor, 0.02, palette);
    borderStyle = {
      top: { style: 'thin', color: { argb: isDark ? 'FF1E293B' : 'FFF1F5F9' } },
      bottom: { style: 'thin', color: { argb: isDark ? 'FF1E293B' : 'FFF1F5F9' } },
      left: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
  }
  row.height = rowHeight;

  for (let c = 2; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgFill } };
    cell.border = {
      top: borderStyle.top,
      bottom: borderStyle.bottom,
      left: c === 2 ? borderStyle.left : undefined,
      right: c === colCount ? borderStyle.right : { style: 'thin', color: { argb: isDark ? 'FF334155' : 'FFE2E8F0' } }
    };
    cell.font = (c === 3) ? nameFont : otherFont;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  const idCell = row.getCell('id');
  if (idCell) {
    idCell.font = { name: 'Consolas', size: level === 0 ? 10 : 9, color: { argb: isDark ? 'FF94A3B8' : 'FF475569' }, bold: level <= 1 };
    idCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  ['type', 'featureCategory', 'plannedReleaseDate'].forEach(k => {
    const cell = row.getCell(k);
    if (cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const progCell = row.getCell('progress');
  if (progCell && progCell.value !== undefined && progCell.value !== null && progCell.value !== '') {
    const pVal = typeof progCell.value === 'number' ? progCell.value : parseFloat(String(progCell.value)) || 0;
    formatProgressGradient(progCell, pVal, palette, level <= 1);
  }

  const statusCell = row.getCell('status');
  if (statusCell && statusVal) {
    formatStatusCell(statusCell, statusVal, palette);
  }
}

// ─────────────────────────────────────────────────────────────
// COMPREHENSIVE EXECUTIVE DASHBOARD SHEET
// ─────────────────────────────────────────────────────────────
export function buildExecutiveDashboardSheet(
  wb: ExcelJS.Workbook,
  state: ProjectState,
  palette: ExcelThemePalette
): ExcelJS.Worksheet {
  const ds = wb.addWorksheet('Executive Dashboard', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 6 }]
  });
  ds.properties.tabColor = { argb: palette.indigo };
  ds.getColumn(1).width = 2.5;
  for (let i = 2; i <= 19; i++) ds.getColumn(i).width = 14.5;
  ds.getColumn(20).width = 2.5;

  const applyBg = (r: number, c: number, color: string) => {
    ds.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  };

  // Base background fill
  for (let r = 1; r <= 280; r++) {
    ds.getRow(r).height = 16;
    for (let c = 2; c <= 19; c++) {
      applyBg(r, c, palette.bg);
    }
  }

  // Header Banner
  ds.getRow(1).height = 12;
  ds.mergeCells('B2:S3');
  ds.getRow(2).height = 20;
  ds.getRow(3).height = 20;
  const dsTitle = ds.getCell('B2');
  dsTitle.value = {
    richText: [
      { text: ` >> SYSTEM.PULSE: ${S(state.name || 'Project Workspace').toUpperCase()}`, font: { name: 'Courier New', size: 12, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } } },
      { text: '   |   REAL-TIME PORTFOLIO & EXECUTIVE TELEMETRY', font: { name: 'Courier New', size: 8.5, bold: true, color: { argb: palette.indigo } } }
    ]
  };
  dsTitle.alignment = { vertical: 'middle', indent: 1 };

  const bannerGrad = {
    type: 'gradient' as const,
    gradient: 'angle' as const,
    degree: 90,
    stops: [
      { position: 0, color: { argb: palette.bg } },
      { position: 1, color: { argb: palette.surfaceAlt } }
    ]
  };
  for (let c = 2; c <= 19; c++) {
    ds.getCell(2, c).fill = bannerGrad;
    ds.getCell(3, c).fill = bannerGrad;
    ds.getCell(3, c).border = { bottom: { style: 'medium', color: { argb: palette.indigo } } };
  }

  // KPI Calculations
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const now = Date.now();
  const overdueTasks = state.tasks.filter(t => t.dueDate && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate).getTime() < now).length;
  const blockedTasks = state.tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  const critTasks = state.tasks.filter(t => t.priority === TaskPriority.CRITICAL && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
  const healthScore = getHealthScore(state.tasks);

  // Row 4-6: KPI Cards
  drawTopKpiCard(ds, 2, 4, 3, 3, 'Health Score', `${healthScore}%`, healthScore >= 80 ? '▲ On Track' : healthScore >= 60 ? '► Monitor' : '▼ Critical', healthScore >= 80 ? palette.emerald : healthScore >= 60 ? palette.amber : palette.rose, { isDark: palette.isDark });
  drawTopKpiCard(ds, 5, 4, 3, 3, 'Total / Done', `${totalTasks} / ${doneTasks}`, `${taskPct}% delivery rate`, palette.indigo, { isDark: palette.isDark });
  drawTopKpiCard(ds, 8, 4, 3, 3, 'Active Scope', `${totalTasks - doneTasks}`, `${totalTasks - doneTasks} tasks in flight`, palette.blue, { isDark: palette.isDark });
  drawTopKpiCard(ds, 11, 4, 3, 3, 'Overdue', `${overdueTasks}`, overdueTasks > 0 ? '⚠ Attention Required' : '✔ On Schedule', overdueTasks > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ds, 14, 4, 3, 3, 'Blocked', `${blockedTasks}`, blockedTasks > 0 ? '⚠ Dependency debt' : '✔ Clear', blockedTasks > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ds, 17, 4, 3, 3, 'Critical Pri', `${critTasks}`, critTasks > 0 ? 'Escalate now' : 'Clear', critTasks > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });

  ds.getRow(7).height = 14;

  // Metadata Table (Rows 8-16)
  const metaStartRow = 8;
  ds.mergeCells(`B${metaStartRow}:H${metaStartRow}`);
  ds.getCell(`B${metaStartRow}`).value = ' >> PORTFOLIO METADATA & STRATEGIC ALIGNMENT';
  ds.getCell(`B${metaStartRow}`).font = { name: 'Courier New', size: 9, bold: true, color: { argb: palette.blue } };
  ds.getCell(`B${metaStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
  ds.getCell(`B${metaStartRow}`).border = { bottom: { style: 'medium', color: { argb: palette.blue } } };

  const metaRows = [
    { label: 'Project Name', val: state.name },
    { label: 'Mission / Scope', val: state.desc || 'Multi-tier enterprise backlog workstation' },
    { label: 'Active Baseline Version', val: state.settings?.currentBaseline || 'v1.0.0-PROD' },
    { label: 'Blended Cost Rate', val: `$${state.settings?.blendedRate || 85}/hr` },
    { label: 'Total Scheduled Tasks', val: state.tasks.length },
    { label: 'Total ALM Packages', val: (state.deliveries || []).length },
    { label: 'Total Identified Risks', val: (state.raids || []).length },
    { label: 'Architecture Decisions (ADRs)', val: (state.decisions || []).length }
  ];

  metaRows.forEach((m, idx) => {
    const rIdx = metaStartRow + 1 + idx;
    ds.getRow(rIdx).height = 18;
    ds.getCell(`B${rIdx}`).value = m.label;
    ds.getCell(`B${rIdx}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: palette.muted } };
    ds.mergeCells(`C${rIdx}:H${rIdx}`);
    ds.getCell(`C${rIdx}`).value = m.val;
    ds.getCell(`C${rIdx}`).font = { name: 'Segoe UI', size: 9.5, color: { argb: palette.textDark } };
  });

  // Table Drawing Helpers
  const drawSectionTitle = (row: number, title: string) => {
    ds.getRow(row).height = 20;
    ds.mergeCells(row, 2, row, 19);
    const cell = ds.getCell(row, 2);
    cell.value = ' >> [' + S(title).toUpperCase() + ']';
    cell.font = { name: 'Courier New', size: 9, bold: true, color: { argb: palette.blue } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
    cell.border = { bottom: { style: 'medium', color: { argb: palette.blue } } };
    cell.alignment = { vertical: 'middle' };
  };

  const drawTableHeader = (row: number, headers: string[], startCol: number) => {
    ds.getRow(row).height = 18;
    headers.forEach((h, i) => {
      const cell = ds.getCell(row, startCol + i);
      cell.value = '[' + S(h).toUpperCase() + ']';
      cell.font = { name: 'Courier New', size: 8, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = { bottom: { style: 'thin', color: { argb: palette.divider } } };
    });
  };

  const drawTableRow = (row: number, values: any[], startCol: number, alternate: boolean) => {
    ds.getRow(row).height = 18;
    const bg = alternate ? getThemeTint(palette.blue, 0.08, palette) : getThemeTint(palette.blue, 0.02, palette);
    values.forEach((val, i) => {
      const cell = ds.getCell(row, startCol + i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      if (val && val._styled) {
        cell.value = S(val.text);
        cell.font = { name: 'Courier New', size: 8.5, bold: val.bold, color: { argb: val.color } };
      } else {
        cell.value = S(val);
        cell.font = { name: 'Courier New', size: 8.5, color: { argb: palette.textDark } };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: palette.divider } },
        bottom: { style: 'thin', color: { argb: palette.divider } },
        left: { style: 'thin', color: { argb: palette.divider } },
        right: { style: 'thin', color: { argb: palette.divider } }
      };
    });
  };

  const styledVal = (text: any, color: string, bold: boolean) => ({
    _styled: true,
    text: S(text),
    color: color.replace('#', ''),
    bold
  });

  const addChart = (imgBase64: string | null, col: number, row: number, width = 500, height = 240) => {
    if (!imgBase64) return;
    try {
      const imgId = wb.addImage({ base64: imgBase64, extension: 'png' });
      ds.addImage(imgId, {
        tl: { col, row },
        ext: { width, height },
        editAs: 'oneCell'
      });
    } catch (e) {
      console.warn('Could not add chart image:', e);
    }
  };

  // ── Prepare Chart Data Sets ──
  const statusCounts: Record<string, number> = {};
  state.tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const statusChartData = Object.entries(statusCounts).map(([st, cnt]) => {
    let color = palette.slate;
    if (st === TaskStatus.COMPLETED) color = palette.emerald;
    else if (st === TaskStatus.IN_PROGRESS) color = palette.indigo;
    else if (st === TaskStatus.UNDER_REVIEW) color = palette.blue;
    else if (st === TaskStatus.ON_HOLD) color = palette.amber;
    else if (st === TaskStatus.BLOCKED) color = palette.rose;
    return { label: st, value: cnt, color };
  });

  const priCounts: Record<string, number> = {};
  state.tasks.forEach(t => { priCounts[t.priority] = (priCounts[t.priority] || 0) + 1; });
  const priChartData = Object.entries(priCounts).map(([p, cnt]) => {
    let color = palette.muted;
    if (p === TaskPriority.CRITICAL) color = palette.rose;
    else if (p === TaskPriority.HIGH) color = palette.amber;
    else if (p === TaskPriority.MEDIUM) color = palette.blue;
    return { label: p, value: cnt, color };
  });

  const compCounts: Record<string, number> = { 'Easy': 0, 'Medium': 0, 'Complex': 0 };
  state.tasks.forEach(t => {
    const c = t.complexity || 'Medium';
    compCounts[c] = (compCounts[c] || 0) + 1;
  });
  const compChartData = [
    { label: 'Easy', value: compCounts['Easy'], color: palette.emerald },
    { label: 'Medium', value: compCounts['Medium'], color: palette.amber },
    { label: 'Complex', value: compCounts['Complex'], color: palette.rose }
  ].filter(item => item.value > 0);

  // Velocity Bar Data
  const vLs: { w: number; y: number; l: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    vLs.push({ w: getWeekNumber(d), y: d.getFullYear(), l: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) });
  }
  const velData = vLs.map(w => state.tasks
    .filter(t => t.status === TaskStatus.COMPLETED && t.dueDate && getWeekNumber(new Date(t.dueDate)) === w.w && new Date(t.dueDate).getFullYear() === w.y)
    .reduce((s, t) => s + (Number(t.estDays) || 0), 0));

  // Burndown Line Data
  const startDates = state.tasks.map(t => new Date(t.startDate)).filter(d => !isNaN(d.getTime()));
  const endDates = state.tasks.map(t => new Date(t.dueDate)).filter(d => !isNaN(d.getTime()));
  const bStart = startDates.length ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
  const bEnd = endDates.length ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date(bStart.getTime() + 30 * 864e5);
  const bWeeks = Math.max(2, Math.min(10, Math.ceil((bEnd.getTime() - bStart.getTime()) / (7 * 864e5)) + 1));
  const bLabels = Array.from({ length: bWeeks }, (_, i) => new Date(bStart.getTime() + i * 7 * 864e5).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
  const totalEffort = state.tasks.reduce((s, t) => s + (Number(t.estDays) || 0), 0);
  const bIdeal = bLabels.map((_, i) => Math.max(0, Math.round(totalEffort - (totalEffort / Math.max(1, bWeeks - 1)) * i)));
  const bActual = bLabels.map((_, i) => {
    const wEnd = new Date(bStart.getTime() + (i + 1) * 7 * 864e5);
    return Math.round(state.tasks
      .filter(t => t.status !== TaskStatus.COMPLETED || new Date(t.updatedAt || t.dueDate) > wEnd)
      .reduce((s, t) => s + (Number(t.estDays) || 0), 0));
  });

  // Task Category Donut
  const catMap: Record<string, number> = {};
  state.tasks.forEach(t => { const c = t.category || 'Strategic'; catMap[c] = (catMap[c] || 0) + 1; });
  const catChartData = Object.entries(catMap).map(([cat, val], ci) => {
    const vibrantColors = [palette.indigo, palette.emerald, palette.amber, palette.rose, palette.blue, palette.purple, palette.teal];
    return { label: cat, value: val, color: vibrantColors[ci % vibrantColors.length] };
  });

  // Module Health Donut
  const modSet = [...new Set(state.tasks.map(t => t.module).filter(Boolean))];
  let modCompleted = 0; let modOnTrack = 0; let modBlocked = 0; let modOverdue = 0;
  modSet.forEach(m => {
    const mt = state.tasks.filter(t => t.module === m);
    const mAvg = mt.length ? Math.round(mt.reduce((s, t) => s + (Number(t.progress) || 0), 0) / mt.length) : 0;
    const hasBlocked = mt.some(t => t.status === TaskStatus.BLOCKED || t.status === TaskStatus.ON_HOLD);
    const hasOverdue = mt.some(t => t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate).getTime() < now);
    if (mAvg === 100) modCompleted++;
    else if (hasBlocked) modBlocked++;
    else if (hasOverdue) modOverdue++;
    else modOnTrack++;
  });
  const modHealthChartData = [
    { label: 'Completed Modules', value: modCompleted, color: palette.emerald },
    { label: 'On Track Active', value: modOnTrack, color: palette.indigo },
    { label: 'Overdue / At Risk', value: modOverdue, color: palette.amber },
    { label: 'Blocked Modules', value: modBlocked, color: palette.rose }
  ].filter(item => item.value > 0);

  // Team Workload Data
  const teamNames = [...new Set(state.tasks.map(t => t.assignee).filter(Boolean))].slice(0, 8);
  const doneMData = teamNames.map(m => state.tasks.filter(t => t.assignee === m && t.status === TaskStatus.COMPLETED).length);
  const activeMData = teamNames.map(m => state.tasks.filter(t => t.assignee === m && t.status !== TaskStatus.COMPLETED).length);
  const teamWorkloadData = {
    labels: teamNames,
    series: [
      { label: 'Done', values: doneMData, color: '#10B981' },
      { label: 'Active', values: activeMData, color: '#4F46E5' }
    ]
  };

  // RAID Type Donut
  const raidTypeMap: Record<string, number> = {};
  (state.raids || []).forEach(r => { raidTypeMap[r.type] = (raidTypeMap[r.type] || 0) + 1; });
  const raidTypeChartData = Object.entries(raidTypeMap).map(([t, val]) => ({
    label: t,
    value: val,
    color: t === 'Risk' || t === 'Issue' ? palette.rose : t === 'Dependency' ? palette.indigo : palette.blue
  }));

  // Defect Modules Donut
  const defModMap: Record<string, number> = {};
  (state.defects || []).filter(d => d.status !== 'Closed' && d.status !== 'Fixed').forEach(d => {
    const parentTask = state.tasks.find(t => t.id === d.linkedId);
    const m = parentTask?.module || d.linkedType || 'General';
    defModMap[m] = (defModMap[m] || 0) + 1;
  });
  const defModChartData = Object.entries(defModMap).map(([m, cnt], mi) => {
    const vibrantColors = [palette.indigo, palette.emerald, palette.amber, palette.rose, palette.blue, palette.purple];
    return { label: m, value: cnt, color: vibrantColors[mi % vibrantColors.length] };
  });

  // RAID Severity Donut
  const raidSevMap: Record<string, number> = {};
  (state.raids || []).forEach(r => {
    const sev = r.severity || r.impact || 'Medium';
    raidSevMap[sev] = (raidSevMap[sev] || 0) + 1;
  });
  const raidSevChartData = Object.entries(raidSevMap).map(([sev, cnt]) => ({
    label: sev,
    value: cnt,
    color: sev === 'High' || sev === 'Critical' ? palette.rose : sev === 'Medium' ? palette.amber : palette.emerald
  }));

  // Defect Status Donut
  const defStatMap: Record<string, number> = {};
  (state.defects || []).filter(d => d.status !== 'Closed' && d.status !== 'Fixed').forEach(d => {
    defStatMap[d.status] = (defStatMap[d.status] || 0) + 1;
  });
  const defStatChartData = Object.entries(defStatMap).map(([st, cnt]) => ({
    label: st,
    value: cnt,
    color: st === 'New' ? palette.indigo : st === 'Assigned' ? palette.blue : st === 'Retest' ? palette.amber : palette.emerald
  }));

  // ── Render Visualization Panels (Rows 18-98) ──
  drawSectionTitle(18, 'Scope Health, Priority & Complexity Profiles');
  for (let r = 19; r <= 30; r++) ds.getRow(r).height = 20;
  addChart(generateCanvasChart(500, 240, 'donut', statusChartData, { centerText: `${totalTasks} Tasks` }, palette), 1, 19);
  addChart(generateCanvasChart(500, 240, 'donut', priChartData, { centerText: 'By Priority' }, palette), 7, 19);
  addChart(generateCanvasChart(500, 240, 'donut', compChartData, { centerText: 'Complexity' }, palette), 13, 19);

  drawSectionTitle(32, 'Predictive Velocity & Burndown Trajectory');
  for (let r = 33; r <= 44; r++) ds.getRow(r).height = 20;
  addChart(generateCanvasChart(750, 240, 'bar', { labels: vLs.map(w => w.l), values: velData }, { title: 'COMPLETED EFFORT BY WEEK' }, palette), 1, 33, 750, 240);
  addChart(generateCanvasChart(750, 240, 'line', { labels: bLabels, ideal: bIdeal, actual: bActual }, {}, palette), 10, 33, 750, 240);

  drawSectionTitle(46, 'Workstream Distribution & Module Health');
  for (let r = 47; r <= 58; r++) ds.getRow(r).height = 20;
  addChart(generateCanvasChart(500, 240, 'donut', catChartData, { centerText: 'Categories' }, palette), 1, 47);
  addChart(generateCanvasChart(500, 240, 'donut', modHealthChartData, { centerText: 'Module Health' }, palette), 7, 47);
  addChart(generateCanvasChart(500, 240, 'donut', raidTypeChartData, { centerText: 'RAID Types' }, palette), 13, 47);

  drawSectionTitle(60, 'Resource Workload & Threat Exposure');
  for (let r = 61; r <= 72; r++) ds.getRow(r).height = 20;
  addChart(generateCanvasChart(500, 240, 'stackedHorizontalBar', teamWorkloadData, {}, palette), 1, 61);
  addChart(generateCanvasChart(500, 240, 'donut', defModChartData, { centerText: 'Defect Modules' }, palette), 7, 61);
  addChart(generateCanvasChart(500, 240, 'donut', raidSevChartData, { centerText: 'RAID Severity' }, palette), 13, 61);

  drawSectionTitle(74, 'Defect Diagnostics & Quality Control');
  for (let r = 75; r <= 86; r++) ds.getRow(r).height = 20;
  addChart(generateCanvasChart(500, 240, 'donut', defStatChartData, { centerText: 'Defect Status' }, palette), 1, 75);

  let curRow = 89;

  // ── Governance Tables ──
  // Section 1: Health & Distribution Directories
  drawSectionTitle(curRow, 'Project Health & Distribution Directories');
  curRow += 2;

  drawTableHeader(curRow, ['Status', 'Count', '%'], 2);
  const statusList = [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS, TaskStatus.UNDER_REVIEW, TaskStatus.ON_HOLD, TaskStatus.BLOCKED, TaskStatus.NOT_STARTED];
  statusList.forEach((s, i) => {
    const cnt = state.tasks.filter(t => t.status === s).length;
    const pct = totalTasks ? Math.round((cnt / totalTasks) * 100) : 0;
    drawTableRow(curRow + 1 + i, [styledVal(s, palette.indigo, true), cnt, `${pct}%`], 2, i % 2 === 1);
  });

  drawTableHeader(curRow, ['Priority', 'Count', '%'], 7);
  const priList = [TaskPriority.CRITICAL, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];
  priList.forEach((p, i) => {
    const cnt = state.tasks.filter(t => t.priority === p).length;
    const pct = totalTasks ? Math.round((cnt / totalTasks) * 100) : 0;
    drawTableRow(curRow + 1 + i, [styledVal(p, p === TaskPriority.CRITICAL ? palette.rose : palette.amber, true), cnt, `${pct}%`], 7, i % 2 === 1);
  });

  drawTableHeader(curRow, ['Metric', 'Duration (Days)'], 12);
  drawTableRow(curRow + 1, ['Total Effort Estimated', totalEffort.toFixed(1)], 12, false);
  drawTableRow(curRow + 2, ['Remaining Effort (Burndown)', (bActual[bActual.length - 1] || 0).toFixed(1)], 12, true);
  drawTableRow(curRow + 3, ['Done Effort', (totalEffort - (bActual[bActual.length - 1] || 0)).toFixed(1)], 12, false);
  curRow += Math.max(statusList.length, priList.length, 4) + 2;

  // Section 2: Project Milestones
  const msTasks = state.tasks.filter(t => (t.startDate && t.startDate === t.dueDate) || t.category === 'Milestone' || t.name.toLowerCase().includes('milestone'));
  if (msTasks.length) {
    drawSectionTitle(curRow, 'Project Milestones & Key Roadmap Markers');
    curRow += 2;
    ds.getRow(curRow).height = 18;
    const msHeaders = [
      { c1: 2, c2: 3, label: 'ID' },
      { c1: 4, c2: 11, label: 'Milestone Name' },
      { c1: 12, c2: 14, label: 'Due Date' },
      { c1: 15, c2: 17, label: 'Status' },
      { c1: 18, c2: 19, label: 'Progress' }
    ];
    msHeaders.forEach(h => {
      if (h.c1 !== h.c2) ds.mergeCells(curRow, h.c1, curRow, h.c2);
      const cell = ds.getCell(curRow, h.c1);
      cell.value = `[${h.label.toUpperCase()}]`;
      cell.font = { name: 'Courier New', size: 8, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });

    msTasks.slice(0, 15).forEach((t, i) => {
      const rIdx = curRow + 1 + i;
      ds.getRow(rIdx).height = 20;
      const bg = i % 2 === 1 ? getThemeTint(palette.blue, 0.08, palette) : getThemeTint(palette.blue, 0.02, palette);
      ds.mergeCells(rIdx, 2, rIdx, 3);
      ds.mergeCells(rIdx, 4, rIdx, 11);
      ds.mergeCells(rIdx, 12, rIdx, 14);
      ds.mergeCells(rIdx, 15, rIdx, 17);
      ds.mergeCells(rIdx, 18, rIdx, 19);

      for (let c = 2; c <= 19; c++) {
        ds.getCell(rIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        ds.getCell(rIdx, c).border = {
          top: { style: 'thin', color: { argb: palette.divider } },
          bottom: { style: 'thin', color: { argb: palette.divider } },
          left: { style: 'thin', color: { argb: palette.divider } },
          right: { style: 'thin', color: { argb: palette.divider } }
        };
      }

      ds.getCell(rIdx, 2).value = t.id;
      ds.getCell(rIdx, 4).value = t.name;
      ds.getCell(rIdx, 12).value = cleanFmtDate(t.dueDate);
      ds.getCell(rIdx, 15).value = t.status;
      ds.getCell(rIdx, 18).value = `${t.progress || 0}%`;

      [2, 4, 12, 15, 18].forEach(col => {
        ds.getCell(rIdx, col).font = { name: 'Courier New', size: 8.5, color: { argb: palette.textDark } };
        ds.getCell(rIdx, col).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      });
      formatStatusCell(ds.getCell(rIdx, 15), t.status, palette);
    });
    curRow += msTasks.length + 2;
  }

  // Section 3: Team Directory & Resource Performance
  if (state.members && state.members.length > 0) {
    drawSectionTitle(curRow, 'Team Directory & Resource Performance');
    curRow += 2;
    ds.getRow(curRow).height = 18;
    const teamHeaders = [
      { c1: 2, c2: 5, label: 'Team Member' },
      { c1: 6, c2: 9, label: 'Role' },
      { c1: 10, c2: 11, label: 'Active Tasks' },
      { c1: 12, c2: 13, label: 'Done' },
      { c1: 14, c2: 15, label: 'Effort (Est)' },
      { c1: 16, c2: 17, label: 'Effort (Act)' },
      { c1: 18, c2: 19, label: 'Utilization%' }
    ];
    teamHeaders.forEach(h => {
      if (h.c1 !== h.c2) ds.mergeCells(curRow, h.c1, curRow, h.c2);
      const cell = ds.getCell(curRow, h.c1);
      cell.value = `[${h.label.toUpperCase()}]`;
      cell.font = { name: 'Courier New', size: 8, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });

    state.members.slice(0, 20).forEach((m, i) => {
      const mTasks = state.tasks.filter(t => t.assignee === m.name);
      const mActive = mTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
      const mDone = mTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const mEst = mTasks.reduce((s, t) => s + (Number(t.estDays) || 0), 0);
      const mAct = mTasks.reduce((s, t) => s + (Number(t.actDays) || 0), 0);
      const capacity = (state.settings?.daysPerWeek || 5) * 4;
      const utilization = capacity > 0 ? Math.round((mAct / capacity) * 100) : 0;
      const rIdx = curRow + 1 + i;

      ds.getRow(rIdx).height = 20;
      const bg = i % 2 === 1 ? getThemeTint(palette.blue, 0.08, palette) : getThemeTint(palette.blue, 0.02, palette);
      ds.mergeCells(rIdx, 2, rIdx, 5);
      ds.mergeCells(rIdx, 6, rIdx, 9);
      ds.mergeCells(rIdx, 10, rIdx, 11);
      ds.mergeCells(rIdx, 12, rIdx, 13);
      ds.mergeCells(rIdx, 14, rIdx, 15);
      ds.mergeCells(rIdx, 16, rIdx, 17);
      ds.mergeCells(rIdx, 18, rIdx, 19);

      for (let c = 2; c <= 19; c++) {
        ds.getCell(rIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        ds.getCell(rIdx, c).border = {
          top: { style: 'thin', color: { argb: palette.divider } },
          bottom: { style: 'thin', color: { argb: palette.divider } },
          left: { style: 'thin', color: { argb: palette.divider } },
          right: { style: 'thin', color: { argb: palette.divider } }
        };
      }

      ds.getCell(rIdx, 2).value = m.name;
      ds.getCell(rIdx, 6).value = m.role || 'Engineer';
      ds.getCell(rIdx, 10).value = mActive;
      ds.getCell(rIdx, 12).value = mDone;
      ds.getCell(rIdx, 14).value = mEst.toFixed(1);
      ds.getCell(rIdx, 16).value = mAct.toFixed(1);
      ds.getCell(rIdx, 18).value = `${utilization}%`;

      [2, 6, 10, 12, 14, 16, 18].forEach(col => {
        ds.getCell(rIdx, col).font = { name: 'Courier New', size: 8.5, color: { argb: palette.textDark } };
        ds.getCell(rIdx, col).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      });
    });
    curRow += state.members.length + 2;
  }

  // Section 4: Module & Feature Delivery Intelligence
  drawSectionTitle(curRow, 'Module & Feature Delivery Intelligence');
  curRow += 2;
  ds.getRow(curRow).height = 18;
  const modFeatHeaders = [
    { c1: 2, c2: 5, label: 'Module' },
    { c1: 6, c2: 6, label: 'Tasks' },
    { c1: 7, c2: 7, label: 'Done' },
    { c1: 8, c2: 8, label: 'Overdue' },
    { c1: 9, c2: 10, label: 'Avg Progress' },
    { c1: 12, c2: 16, label: 'Feature Name' },
    { c1: 17, c2: 17, label: 'Screens' },
    { c1: 18, c2: 19, label: 'Feature Progress' }
  ];
  modFeatHeaders.forEach(h => {
    if (h.c1 !== h.c2) ds.mergeCells(curRow, h.c1, curRow, h.c2);
    const cell = ds.getCell(curRow, h.c1);
    cell.value = `[${h.label.toUpperCase()}]`;
    cell.font = { name: 'Courier New', size: 8, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });

  const feats = state.features || [];
  const maxRows = Math.max(modSet.length, feats.length, 1);
  for (let i = 0; i < maxRows; i++) {
    const rIdx = curRow + 1 + i;
    ds.getRow(rIdx).height = 20;
    const bg = i % 2 === 1 ? getThemeTint(palette.blue, 0.08, palette) : getThemeTint(palette.blue, 0.02, palette);

    ds.mergeCells(rIdx, 2, rIdx, 5);
    ds.mergeCells(rIdx, 9, rIdx, 10);
    ds.mergeCells(rIdx, 12, rIdx, 16);
    ds.mergeCells(rIdx, 18, rIdx, 19);

    for (let c = 2; c <= 19; c++) {
      if (c === 11) continue;
      ds.getCell(rIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      ds.getCell(rIdx, c).border = {
        top: { style: 'thin', color: { argb: palette.divider } },
        bottom: { style: 'thin', color: { argb: palette.divider } },
        left: { style: 'thin', color: { argb: palette.divider } },
        right: { style: 'thin', color: { argb: palette.divider } }
      };
    }

    if (i < modSet.length) {
      const m = modSet[i];
      const mt = state.tasks.filter(t => t.module === m);
      const mDone = mt.filter(t => t.status === TaskStatus.COMPLETED).length;
      const mOver = mt.filter(t => t.dueDate && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate).getTime() < now).length;
      const mAvg = mt.length ? Math.round(mt.reduce((s, t) => s + (Number(t.progress) || 0), 0) / mt.length) : 0;
      ds.getCell(rIdx, 2).value = m;
      ds.getCell(rIdx, 6).value = mt.length;
      ds.getCell(rIdx, 7).value = mDone;
      ds.getCell(rIdx, 8).value = mOver;
      ds.getCell(rIdx, 9).value = `${mAvg}%`;
    }

    if (i < feats.length) {
      const f = feats[i];
      const scs = f.screens || [];
      const fTasks = state.tasks.filter(t => (t.guiScreens || []).some(sc => scs.includes(sc)));
      const fAvg = fTasks.length ? Math.round(fTasks.reduce((s, t) => s + (Number(t.progress) || 0), 0) / fTasks.length) : (f.status === 'Completed' ? 100 : 50);
      ds.getCell(rIdx, 12).value = f.name;
      ds.getCell(rIdx, 17).value = scs.length;
      ds.getCell(rIdx, 18).value = `${fAvg}%`;
    }

    [2, 6, 7, 8, 9, 12, 17, 18].forEach(col => {
      ds.getCell(rIdx, col).font = { name: 'Courier New', size: 8.5, color: { argb: palette.textDark } };
      ds.getCell(rIdx, col).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });
  }
  curRow += maxRows + 2;

  // Section 5: Strategic RAID Intelligence
  const activeRaids = (state.raids || []).filter(r => r.status === 'Open' || !r.status);
  if (activeRaids.length) {
    drawSectionTitle(curRow, 'Strategic RAID Threat Exposure Matrix');
    curRow += 2;
    ds.getRow(curRow).height = 18;
    const raidHeaders = [
      { c1: 2, c2: 2, label: 'ID' },
      { c1: 3, c2: 3, label: 'Type' },
      { c1: 4, c2: 13, label: 'Title & Mitigation Plan' },
      { c1: 14, c2: 14, label: 'Impact' },
      { c1: 15, c2: 15, label: 'Probability' },
      { c1: 16, c2: 17, label: 'Owner' },
      { c1: 18, c2: 19, label: 'Status' }
    ];
    raidHeaders.forEach(h => {
      if (h.c1 !== h.c2) ds.mergeCells(curRow, h.c1, curRow, h.c2);
      const cell = ds.getCell(curRow, h.c1);
      cell.value = `[${h.label.toUpperCase()}]`;
      cell.font = { name: 'Courier New', size: 8, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });

    activeRaids.slice(0, 15).forEach((r, i) => {
      const rIdx = curRow + 1 + i;
      ds.getRow(rIdx).height = 20;
      const bg = i % 2 === 1 ? getThemeTint(palette.blue, 0.08, palette) : getThemeTint(palette.blue, 0.02, palette);
      ds.mergeCells(rIdx, 4, rIdx, 13);
      ds.mergeCells(rIdx, 16, rIdx, 17);
      ds.mergeCells(rIdx, 18, rIdx, 19);

      for (let c = 2; c <= 19; c++) {
        ds.getCell(rIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        ds.getCell(rIdx, c).border = {
          top: { style: 'thin', color: { argb: palette.divider } },
          bottom: { style: 'thin', color: { argb: palette.divider } },
          left: { style: 'thin', color: { argb: palette.divider } },
          right: { style: 'thin', color: { argb: palette.divider } }
        };
      }

      ds.getCell(rIdx, 2).value = r.id;
      ds.getCell(rIdx, 3).value = r.type;
      ds.getCell(rIdx, 4).value = `${r.title} ${r.mitigation ? `(Plan: ${r.mitigation})` : ''}`;
      ds.getCell(rIdx, 14).value = r.impact || 'Medium';
      ds.getCell(rIdx, 15).value = r.probability || 'Medium';
      ds.getCell(rIdx, 16).value = r.owner || 'PMO';
      ds.getCell(rIdx, 18).value = r.status || 'Open';

      [2, 3, 4, 14, 15, 16, 18].forEach(col => {
        ds.getCell(rIdx, col).font = { name: 'Courier New', size: 8.5, color: { argb: palette.textDark } };
        ds.getCell(rIdx, col).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      });
      formatPriorityCell(ds.getCell(rIdx, 14), r.impact || 'Medium', palette);
    });
    curRow += activeRaids.length + 2;
  }

  // Section 6: Open Defects Quality Triage
  const openBugs = (state.defects || []).filter(d => d.status !== 'Closed' && d.status !== 'Fixed');
  if (openBugs.length) {
    drawSectionTitle(curRow, 'Quality Intelligence - Open Defects Log Snapshot');
    curRow += 2;
    ds.getRow(curRow).height = 18;
    const defHeaders = [
      { c1: 2, c2: 2, label: 'ID' },
      { c1: 3, c2: 8, label: 'Title' },
      { c1: 9, c2: 9, label: 'Type' },
      { c1: 10, c2: 10, label: 'Severity' },
      { c1: 11, c2: 11, label: 'Priority' },
      { c1: 12, c2: 13, label: 'Assignee' },
      { c1: 14, c2: 15, label: 'Reporter' },
      { c1: 16, c2: 17, label: 'Created' },
      { c1: 18, c2: 19, label: 'Status' }
    ];
    defHeaders.forEach(h => {
      if (h.c1 !== h.c2) ds.mergeCells(curRow, h.c1, curRow, h.c2);
      const cell = ds.getCell(curRow, h.c1);
      cell.value = `[${h.label.toUpperCase()}]`;
      cell.font = { name: 'Courier New', size: 8, bold: true, color: { argb: palette.isDark ? 'FFFFFFFF' : palette.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });

    openBugs.slice(0, 15).forEach((d, i) => {
      const rIdx = curRow + 1 + i;
      ds.getRow(rIdx).height = 20;
      const bg = i % 2 === 1 ? getThemeTint(palette.blue, 0.08, palette) : getThemeTint(palette.blue, 0.02, palette);
      ds.mergeCells(rIdx, 3, rIdx, 8);
      ds.mergeCells(rIdx, 12, rIdx, 13);
      ds.mergeCells(rIdx, 14, rIdx, 15);
      ds.mergeCells(rIdx, 16, rIdx, 17);
      ds.mergeCells(rIdx, 18, rIdx, 19);

      for (let c = 2; c <= 19; c++) {
        ds.getCell(rIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        ds.getCell(rIdx, c).border = {
          top: { style: 'thin', color: { argb: palette.divider } },
          bottom: { style: 'thin', color: { argb: palette.divider } },
          left: { style: 'thin', color: { argb: palette.divider } },
          right: { style: 'thin', color: { argb: palette.divider } }
        };
      }

      ds.getCell(rIdx, 2).value = d.id;
      ds.getCell(rIdx, 3).value = d.title;
      ds.getCell(rIdx, 9).value = d.type || 'Bug';
      ds.getCell(rIdx, 10).value = d.severity;
      ds.getCell(rIdx, 11).value = d.priority;
      ds.getCell(rIdx, 12).value = d.assignee || 'Unassigned';
      ds.getCell(rIdx, 14).value = d.reporter || 'QA';
      ds.getCell(rIdx, 16).value = cleanFmtDate(d.createdAt);
      ds.getCell(rIdx, 18).value = d.status;

      [2, 3, 9, 10, 11, 12, 14, 16, 18].forEach(col => {
        ds.getCell(rIdx, col).font = { name: 'Courier New', size: 8.5, color: { argb: palette.textDark } };
        ds.getCell(rIdx, col).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      });
      formatPriorityCell(ds.getCell(rIdx, 10), d.severity, palette);
      formatStatusCell(ds.getCell(rIdx, 18), d.status, palette);
    });
    curRow += openBugs.length + 2;
  }

  return ds;
}

// ─────────────────────────────────────────────────────────────
// UNIFIED HIERARCHICAL TASKS & SUBTASKS SHEET
// ─────────────────────────────────────────────────────────────
export function buildUnifiedTasksSheet(
  wb: ExcelJS.Workbook,
  state: ProjectState,
  palette: ExcelThemePalette
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet('Tasks & Subtasks', {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  ws.properties.tabColor = { argb: palette.indigo };
  ws.properties.outlineProperties = {
    summaryBelow: false
  };

  const cols = [
    { header: '', key: '_spacer', width: 3 },
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Task / Subtask Name', key: 'name', width: 45 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Module', key: 'module', width: 18 },
    { header: 'Module Type', key: 'moduleType', width: 15 },
    { header: 'Assignee', key: 'assignee', width: 22 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Actual Completion Date', key: 'actCompletionDate', width: 22 },
    { header: 'Estimated Effort (d)', key: 'estEffort', width: 18 },
    { header: 'Actual Effort (d)', key: 'actEffort', width: 15 },
    { header: 'Complexity', key: 'complexity', width: 15 },
    { header: 'Notes', key: 'notes', width: 40 }
  ];

  (state.customFields || []).forEach(f => {
    cols.push({ header: f.name, key: f.name, width: 22 });
  });
  ws.columns = cols.map(c => ({ key: c.key, width: c.width }));

  // Telemetry KPIs
  const tasks = state.tasks || [];
  const total = tasks.length;
  const done = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const estEff = tasks.reduce((sum, t) => sum + (Number(t.estDays) || 0), 0);
  const actEff = tasks.reduce((sum, t) => sum + (Number(t.actDays) || 0), 0);
  const now = Date.now();
  const overdue = tasks.filter(t => t.dueDate && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate).getTime() < now).length;
  const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;

  ws.getRow(1).height = 10;
  ws.mergeCells('B2:R2');
  ws.getRow(2).height = 24;
  const titleCell = ws.getCell('B2');
  titleCell.value = {
    richText: [
      { text: ' >> COCKPIT TELEMETRY  |  ', font: { name: 'Courier New', size: 11, bold: true, color: { argb: 'FFFFFFFF' } } },
      { text: `HIERARCHICAL TASK & SUBTASK DELIVERY MATRIX  —  ${S(state.name || 'Project').toUpperCase()}`, font: { name: 'Courier New', size: 10, bold: true, color: { argb: 'FFE0E7FF' } } }
    ]
  };
  titleCell.alignment = { vertical: 'middle', indent: 1 };

  const bannerGradFill = {
    type: 'gradient' as const,
    gradient: 'angle' as const,
    degree: 90,
    stops: [
      { position: 0, color: { argb: palette.indigo || 'FF4F46E5' } },
      { position: 1, color: { argb: 'FF3730A3' } }
    ]
  };

  for (let c = 2; c <= 18; c++) {
    const cell = ws.getCell(2, c);
    cell.fill = bannerGradFill;
    cell.border = { bottom: { style: 'medium', color: { argb: palette.navy } } };
  }

  drawTopKpiCard(ws, 2, 3, 4, 3, 'Delivery Progress', `${done} / ${total}`, `${progress}% complete`, palette.indigo || 'FF6366F1', { isDark: palette.isDark });
  drawTopKpiCard(ws, 6, 3, 4, 3, 'Effort Telemetry', `${estEff.toFixed(1)} / ${actEff.toFixed(1)} d`, 'Estimated vs Actual', palette.blue || 'FF3B82F6', { isDark: palette.isDark });
  drawTopKpiCard(ws, 10, 3, 4, 3, 'Overdue Items', `${overdue}`, overdue > 0 ? '⚠ Attention Required' : '✔ On Schedule', overdue > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ws, 14, 3, 5, 3, 'Blocked Scope', `${blocked}`, blocked > 0 ? '⚠ Blocked' : '✔ Clear', blocked > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });

  ws.getRow(6).height = 12;

  // Header Row 7
  const headerRow = ws.getRow(7);
  headerRow.height = 28;
  cols.forEach((col, colIdx) => {
    if (colIdx === 0) return;
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = S(col.header);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.indigo } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: palette.navy } },
      right: { style: 'thin', color: { argb: palette.divider } }
    };
  });

  let totalRowsAdded = 7;
  (wb as any)._taskRowMap = (wb as any)._taskRowMap || {};

  tasks.forEach(t => {
    const taskRowVals: Record<string, any> = {
      _spacer: '',
      id: S(t.id),
      name: '▶  ' + S(t.name),
      type: 'Task',
      category: S(t.category),
      module: S(t.module),
      moduleType: S(t.moduleType),
      assignee: S(t.assignee),
      status: S(t.status),
      priority: S(t.priority),
      progress: (t.progress || 0) / 100,
      startDate: cleanFmtDate(t.startDate),
      dueDate: cleanFmtDate(t.dueDate),
      actCompletionDate: cleanFmtDate(t.actCompletionDate),
      estEffort: t.estDays || 0,
      actEffort: t.actDays || 0,
      complexity: S(t.complexity || 'Medium'),
      notes: S(t.notes)
    };
    (state.customFields || []).forEach(f => { taskRowVals[f.name] = S(t[f.name]); });

    const row = ws.addRow(taskRowVals);
    totalRowsAdded++;
    (wb as any)._taskRowMap[t.id] = totalRowsAdded;
    styleUnifiedRow(row, 0, S(t.status), S(t.priority), palette, cols.length);
    row.outlineLevel = 0;

    (t.subtasks || []).forEach(s => {
      const subRowVals: Record<string, any> = {
        _spacer: '',
        id: S(s.id),
        name: '    ◦ ' + S(s.name),
        type: S(s.type) === 'screen' ? 'Screen' : 'Subtask',
        category: '',
        module: S(t.module),
        moduleType: '',
        assignee: S(t.assignee),
        status: S(s.status || (s.done ? TaskStatus.COMPLETED : TaskStatus.NOT_STARTED)),
        priority: '',
        progress: s.progress !== undefined ? (s.progress > 1 ? s.progress / 100 : s.progress) : (s.done ? 1.0 : 0.0),
        startDate: cleanFmtDate(s.startDate),
        dueDate: cleanFmtDate(s.dueDate),
        actCompletionDate: cleanFmtDate(s.actCompletionDate),
        estEffort: s.effort || 0,
        actEffort: s.actDays || 0,
        complexity: '',
        notes: ''
      };
      (state.customFields || []).forEach(f => { subRowVals[f.name] = ''; });

      const sRow = ws.addRow(subRowVals);
      totalRowsAdded++;
      (wb as any)._taskRowMap[s.id] = totalRowsAdded;
      styleUnifiedRow(sRow, 1, S(s.status || (s.done ? TaskStatus.COMPLETED : TaskStatus.NOT_STARTED)), '', palette, cols.length);
      sRow.outlineLevel = 1;
      sRow.hidden = true;
    });

    if ((!t.subtasks || t.subtasks.length === 0) && t.guiScreens && t.guiScreens.length > 0) {
      t.guiScreens.forEach((sc, scIdx) => {
        const scName = typeof sc === 'string' ? sc : ((sc as any).name || `Screen ${scIdx + 1}`);
        const scRowVals: Record<string, any> = {
          _spacer: '',
          id: `${t.id}.SC${scIdx + 1}`,
          name: '    ◦ ' + scName,
          type: 'GUI Screen',
          category: '',
          module: S(t.module),
          moduleType: 'GUI',
          assignee: S(t.assignee),
          status: S(t.status),
          priority: '',
          progress: (t.progress || 0) / 100,
          startDate: '',
          dueDate: '',
          actCompletionDate: '',
          estEffort: 0,
          actEffort: 0,
          complexity: '',
          notes: ''
        };
        (state.customFields || []).forEach(f => { scRowVals[f.name] = ''; });

        const scRow = ws.addRow(scRowVals);
        totalRowsAdded++;
        (wb as any)._taskRowMap[`${t.id}.SC${scIdx + 1}`] = totalRowsAdded;
        (wb as any)._taskRowMap[scName] = totalRowsAdded;
        styleUnifiedRow(scRow, 1, S(t.status), '', palette, cols.length);
        scRow.outlineLevel = 1;
        scRow.hidden = true;
      });
    }
  });

  return ws;
}

// ─────────────────────────────────────────────────────────────
// UNIFIED FEATURE ROLLOUTS SHEET
// ─────────────────────────────────────────────────────────────
export function buildFeatureRolloutsSheet(
  wb: ExcelJS.Workbook,
  state: ProjectState,
  palette: ExcelThemePalette
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet('Feature Rollouts', {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  ws.properties.tabColor = { argb: palette.indigo || 'FF6366F1' };
  ws.properties.outlineProperties = {
    summaryBelow: false
  };

  const cols = [
    { header: '', key: '_spacer', width: 3 },
    { header: 'ID / Release', key: 'id', width: 18 },
    { header: 'Feature / Screen Name', key: 'name', width: 45 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Feature Category', key: 'featureCategory', width: 20 },
    { header: 'Planned Release Date', key: 'plannedReleaseDate', width: 22 },
    { header: 'Module', key: 'module', width: 18 },
    { header: 'Assignee', key: 'assignee', width: 25 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Task Link', key: 'link', width: 16 }
  ];
  ws.columns = cols.map(c => ({ key: c.key, width: c.width }));

  const releaseGroups: Record<string, Feature[]> = {};
  (state.features || []).forEach(feat => {
    const rel = feat.release ? S(feat.release).trim() : 'Future Release';
    if (!releaseGroups[rel]) releaseGroups[rel] = [];
    releaseGroups[rel].push(feat);
  });

  const sortedReleases = Object.keys(releaseGroups).sort((a, b) => {
    if (a === 'Future Release') return 1;
    if (b === 'Future Release') return -1;
    return a.localeCompare(b);
  });

  const totalFeats = state.features || [];
  const releaseCount = sortedReleases.length;
  const screenCount = totalFeats.reduce((sum, f) => sum + (f.screens || []).length, 0);
  const backlogCount = (releaseGroups['Future Release'] || []).length;

  ws.getRow(1).height = 10;
  ws.mergeCells('B2:K2');
  ws.getRow(2).height = 24;
  const titleCell = ws.getCell('B2');
  titleCell.value = {
    richText: [
      { text: ' >> COCKPIT TELEMETRY  |  ', font: { name: 'Courier New', size: 11, bold: true, color: { argb: 'FFFFFFFF' } } },
      { text: `FEATURE ROLLOUT MATRIX & SCREEN DELIVERY  —  ${S(state.name || 'Project').toUpperCase()}`, font: { name: 'Courier New', size: 10, bold: true, color: { argb: 'FFE0E7FF' } } }
    ]
  };
  titleCell.alignment = { vertical: 'middle', indent: 1 };

  const bannerGradFill = {
    type: 'gradient' as const,
    gradient: 'angle' as const,
    degree: 90,
    stops: [
      { position: 0, color: { argb: palette.indigo || 'FF4F46E5' } },
      { position: 1, color: { argb: 'FF3730A3' } }
    ]
  };
  for (let c = 2; c <= 11; c++) {
    const cell = ws.getCell(2, c);
    cell.fill = bannerGradFill;
    cell.border = { bottom: { style: 'medium', color: { argb: palette.navy } } };
  }

  drawTopKpiCard(ws, 2, 3, 3, 3, 'Releases Mapped', `${releaseCount}`, `${backlogCount} in backlog`, palette.indigo || 'FF6366F1', { isDark: palette.isDark });
  drawTopKpiCard(ws, 5, 3, 3, 3, 'Total Features', `${totalFeats.length}`, 'Feature nodes', palette.blue || 'FF3B82F6', { isDark: palette.isDark });
  drawTopKpiCard(ws, 8, 3, 4, 3, 'Rollout Density', `${screenCount} screens`, 'GUI layout coverage', palette.emerald || 'FF10B981', { isDark: palette.isDark });

  ws.getRow(6).height = 12;

  const headerRow = ws.getRow(7);
  headerRow.height = 28;
  cols.forEach((col, colIdx) => {
    if (colIdx === 0) return;
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.indigo } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: palette.navy } },
      right: { style: 'thin', color: { argb: palette.divider } }
    };
  });

  const tasks = state.tasks || [];
  function resolveScreen(scName: string) {
    const subMatches: any[] = [];
    tasks.forEach(t => {
      (t.subtasks || []).forEach(st => {
        if (st.name === scName) {
          subMatches.push({
            id: st.id,
            progress: st.progress !== undefined ? st.progress : (st.status === TaskStatus.COMPLETED || st.done ? 100 : 0),
            status: st.status || (st.done ? TaskStatus.COMPLETED : TaskStatus.NOT_STARTED),
            assignee: t.assignee || 'Unassigned',
            module: t.module || '-'
          });
        }
      });
    });

    if (subMatches.length > 0) {
      const avgProg = Math.round(subMatches.reduce((sum, sm) => sum + sm.progress, 0) / subMatches.length);
      let finalStatus = TaskStatus.NOT_STARTED;
      if (subMatches.every(sm => sm.status === TaskStatus.COMPLETED)) finalStatus = TaskStatus.COMPLETED;
      else if (subMatches.some(sm => sm.status === TaskStatus.BLOCKED)) finalStatus = TaskStatus.BLOCKED;
      else if (subMatches.some(sm => sm.status === TaskStatus.IN_PROGRESS || sm.status === TaskStatus.UNDER_REVIEW)) finalStatus = TaskStatus.IN_PROGRESS;
      else finalStatus = subMatches[0].status;

      return {
        progress: avgProg / 100,
        status: finalStatus,
        assignee: [...new Set(subMatches.map(sm => sm.assignee).filter(Boolean))].join(', ') || '-',
        module: subMatches[0].module,
        matchId: subMatches[0].id
      };
    }

    const taskMatches = tasks.filter(t => (t.guiScreens || []).includes(scName));
    if (taskMatches.length > 0) {
      const avgProg = Math.round(taskMatches.reduce((sum, tm) => sum + (tm.progress || 0), 0) / taskMatches.length);
      let finalStatus = TaskStatus.NOT_STARTED;
      if (taskMatches.every(tm => tm.status === TaskStatus.COMPLETED)) finalStatus = TaskStatus.COMPLETED;
      else if (taskMatches.some(tm => tm.status === TaskStatus.BLOCKED)) finalStatus = TaskStatus.BLOCKED;
      else if (taskMatches.some(tm => tm.status === TaskStatus.IN_PROGRESS || tm.status === TaskStatus.UNDER_REVIEW)) finalStatus = TaskStatus.IN_PROGRESS;
      else finalStatus = taskMatches[0].status;

      return {
        progress: avgProg / 100,
        status: finalStatus,
        assignee: [...new Set(taskMatches.map(tm => tm.assignee).filter(Boolean))].join(', ') || '-',
        module: taskMatches[0].module || '-',
        matchId: taskMatches[0].id
      };
    }

    return { progress: 0, status: TaskStatus.NOT_STARTED, assignee: '-', module: '-', matchId: null };
  }

  sortedReleases.forEach(relName => {
    const featsInRel = releaseGroups[relName];
    let relTotalProgress = 0;
    let relFeatsCount = 0;

    featsInRel.forEach(feat => {
      const scNames = feat.screens || [];
      let featTotalProgress = 0;
      let featScreensCount = 0;
      scNames.forEach(scName => {
        const scInfo = resolveScreen(scName);
        featTotalProgress += scInfo.progress;
        featScreensCount++;
      });
      if (featScreensCount > 0) {
        relTotalProgress += featTotalProgress / featScreensCount;
        relFeatsCount++;
      }
    });

    const relAvgProgress = relFeatsCount > 0 ? (relTotalProgress / relFeatsCount) : 0;
    const relObj = (state.releases || []).find(r => r.name === relName);
    const relRow = ws.addRow({
      _spacer: '',
      id: S(relName),
      name: `🚀  Release: ${S(relName)}`,
      type: 'Release',
      featureCategory: '',
      plannedReleaseDate: relObj ? cleanFmtDate(relObj.date) : '',
      module: '',
      assignee: '',
      status: relAvgProgress >= 1 ? 'Completed' : relAvgProgress > 0 ? 'In Progress' : 'Planned',
      progress: relAvgProgress
    });
    styleFeatureRolloutRow(relRow, 0, relAvgProgress >= 1 ? 'Completed' : 'In Progress', palette, cols.length);
    relRow.outlineLevel = 0;

    featsInRel.forEach(feat => {
      const scNames = feat.screens || [];
      let featTotalProgress = 0;
      let featScreensCount = 0;
      const featAssignees = new Set<string>();

      const resolvedScreensList = scNames.map(scName => {
        const scInfo = resolveScreen(scName);
        featTotalProgress += scInfo.progress;
        featScreensCount++;
        if (scInfo.assignee && scInfo.assignee !== '-') {
          scInfo.assignee.split(', ').forEach(a => featAssignees.add(a));
        }
        return { name: scName, info: scInfo };
      });

      const featAvgProgress = featScreensCount > 0 ? (featTotalProgress / featScreensCount) : 0;
      const featRelObj = feat.release ? (state.releases || []).find(r => r.name === feat.release) : null;
      const featStatus = featAvgProgress >= 1 ? 'Completed' : featAvgProgress > 0 ? 'In Progress' : 'Not Started';

      const featRow = ws.addRow({
        _spacer: '',
        id: '',
        name: '    ◆  ' + S(feat.name),
        type: 'Feature',
        featureCategory: S(feat.category || ''),
        plannedReleaseDate: featRelObj ? cleanFmtDate(featRelObj.date) : '',
        module: '',
        assignee: S(Array.from(featAssignees).join(', ') || '-'),
        status: featStatus,
        progress: featAvgProgress
      });
      styleFeatureRolloutRow(featRow, 1, featStatus, palette, cols.length);
      featRow.outlineLevel = 1;
      featRow.hidden = true;

      resolvedScreensList.forEach(sc => {
        const scInfo = sc.info;
        const targetRowMap = (wb as any)._taskRowMap || {};
        const screenRowIdx = scInfo.matchId ? targetRowMap[scInfo.matchId] : undefined;

        const scRow = ws.addRow({
          _spacer: '',
          id: '',
          name: '        ▸  ' + S(sc.name),
          type: 'GUI Screen',
          featureCategory: S(feat.category || ''),
          plannedReleaseDate: '',
          module: S(scInfo.module),
          assignee: S(scInfo.assignee),
          status: S(scInfo.status),
          progress: scInfo.progress,
          link: screenRowIdx ? { text: S(scInfo.matchId), hyperlink: `#'Tasks & Subtasks'!C${screenRowIdx}` } : ''
        });
        styleFeatureRolloutRow(scRow, 2, S(scInfo.status), palette, cols.length);
        scRow.outlineLevel = 2;
        scRow.hidden = true;

        if (screenRowIdx) {
          const linkCell = scRow.getCell('link');
          linkCell.font = { name: 'Segoe UI', size: 9.5, underline: 'single', color: { argb: palette.isDark ? 'FF60A5FA' : 'FF1E40AF' } };
          linkCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });
  });

  return ws;
}

// ─────────────────────────────────────────────────────────────
// COMPLETE 5-SHEET FEATURE MATRIX WORKBOOK
// ─────────────────────────────────────────────────────────────
export function buildFeatureMatrixWorkbook(
  state: ProjectState,
  palette?: ExcelThemePalette
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse 2.0';
  wb.lastModifiedBy = 'ProjectPulse 2.0';
  wb.created = new Date();
  wb.modified = new Date();

  const pal = palette || getThemePalette(state);

  // 1. Unified Feature Rollouts
  buildFeatureRolloutsSheet(wb, state, pal);

  // 2. Release Plan
  const wsRel = wb.addWorksheet('Release Plan', { views: [{ state: 'frozen', ySplit: 7 }] });
  wsRel.properties.tabColor = { argb: pal.emerald };
  const relCols = [
    { header: 'Release Version', key: 'name', width: 22 },
    { header: 'Target Date', key: 'date', width: 16 },
    { header: 'Feature Count', key: 'featCount', width: 16 },
    { header: 'Screen Count', key: 'screenCount', width: 16 },
    { header: 'Avg Completion', key: 'progress', width: 18 },
    { header: 'Release Status', key: 'status', width: 18 }
  ];
  wsRel.columns = relCols;
  wsRel.getRow(1).height = 10;
  wsRel.mergeCells('A2:F2');
  wsRel.getRow(2).height = 22;
  wsRel.getCell('A2').value = ' >> COCKPIT TELEMETRY | ENTERPRISE RELEASE SCHEDULE';
  wsRel.getCell('A2').font = { name: 'Courier New', size: 10, bold: true, color: { argb: pal.emerald } };
  wsRel.getCell('A2').alignment = { vertical: 'middle', indent: 1 };

  drawTopKpiCard(wsRel, 1, 3, 3, 3, 'Milestones', `${(state.releases || []).length} Releases`, 'Target plan', pal.emerald, { isDark: pal.isDark });
  drawTopKpiCard(wsRel, 4, 3, 3, 3, 'Functional Coverage', `${(state.features || []).length} Features`, 'Total scope', pal.indigo, { isDark: pal.isDark });

  wsRel.getRow(6).height = 10;
  const relHdr = wsRel.getRow(7);
  relHdr.height = 28;
  relCols.forEach((col, idx) => {
    const cell = relHdr.getCell(idx + 1);
    cell.value = col.header;
    styleHeaderCell(cell, pal.emerald);
  });

  (state.releases || []).forEach((r, idx) => {
    const featsInRel = (state.features || []).filter(f => f.release === r.name);
    const screenCount = featsInRel.reduce((sum, f) => sum + (f.screens || []).length, 0);
    const row = wsRel.addRow({
      name: r.name,
      date: cleanFmtDate(r.date),
      featCount: featsInRel.length,
      screenCount,
      progress: 0.85,
      status: 'Active'
    });
    row.height = 20;
    styleZebraRow(row, idx, pal, relCols.length);
    formatProgressGradient(row.getCell('progress'), 0.85, pal);
  });

  // 3. Feature Details
  const wsFeat = wb.addWorksheet('Feature Details', { views: [{ state: 'frozen', ySplit: 1 }] });
  wsFeat.properties.tabColor = { argb: pal.blue };
  const featCols = [
    { header: 'Feature Name', key: 'name', width: 32 },
    { header: 'Category / Domain', key: 'category', width: 22 },
    { header: 'Target Release', key: 'release', width: 16 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Screens Count', key: 'screensCount', width: 14 },
    { header: 'Screens List', key: 'screensList', width: 35 },
    { header: 'Status', key: 'status', width: 16 }
  ];
  wsFeat.columns = featCols;
  for (let c = 1; c <= featCols.length; c++) styleHeaderCell(wsFeat.getRow(1).getCell(c), pal.blue);

  (state.features || []).forEach((f, idx) => {
    const row = wsFeat.addRow({
      name: f.name,
      category: f.category || 'Strategic',
      release: f.release || 'v1.0.0',
      desc: f.desc || '',
      screensCount: (f.screens || []).length,
      screensList: (f.screens || []).join(', '),
      status: f.status || 'Active'
    });
    row.height = 20;
    styleZebraRow(row, idx, pal, featCols.length);
    formatStatusCell(row.getCell('status'), f.status || 'In Progress', pal);
  });

  // 4. Traceability Matrix
  const wsTrace = wb.addWorksheet('Traceability Matrix', { views: [{ state: 'frozen', ySplit: 1 }] });
  wsTrace.properties.tabColor = { argb: pal.purple };
  const traceCols = [
    { header: 'Feature Name', key: 'featName', width: 32 },
    { header: 'Domain', key: 'category', width: 20 },
    { header: 'Screen Name', key: 'screen', width: 28 },
    { header: 'Linked Task ID', key: 'taskId', width: 16 },
    { header: 'Task Name', key: 'taskName', width: 35 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Task Status', key: 'status', width: 16 }
  ];
  wsTrace.columns = traceCols;
  for (let c = 1; c <= traceCols.length; c++) styleHeaderCell(wsTrace.getRow(1).getCell(c), pal.purple);

  let traceRowIdx = 0;
  (state.features || []).forEach(f => {
    (f.screens || []).forEach(sc => {
      const parentTask = state.tasks.find(t => (t.guiScreens || []).includes(sc) || (t.subtasks || []).some(st => st.name === sc));
      const row = wsTrace.addRow({
        featName: f.name,
        category: f.category || 'General',
        screen: sc,
        taskId: parentTask?.id || '-',
        taskName: parentTask?.name || 'Unassigned Task',
        assignee: parentTask?.assignee || '-',
        status: parentTask?.status || 'Not Started'
      });
      row.height = 20;
      styleZebraRow(row, traceRowIdx++, traceCols.length);
      if (parentTask) formatStatusCell(row.getCell('status'), parentTask.status, pal);
    });
  });

  // 5. Executive Overview & SmartArt
  const wsOverview = wb.addWorksheet('Executive Overview & SmartArt', { views: [{ showGridLines: false }] });
  wsOverview.properties.tabColor = { argb: pal.navy };
  wsOverview.columns = [{ width: 3 }, { width: 25 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];

  wsOverview.mergeCells('B2:F3');
  const ovTitle = wsOverview.getCell('B2');
  ovTitle.value = `PROJECTPULSE ✦ FEATURE ARCHITECTURE & ROADMAP — ${S(state.name || 'Workspace').toUpperCase()}`;
  ovTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  ovTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pal.indigo } };
  ovTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  drawTopKpiCard(wsOverview, 2, 5, 2, 3, 'Feature Portfolio', `${(state.features || []).length} Features`, 'Total Architecture', pal.indigo, { isDark: pal.isDark });
  drawTopKpiCard(wsOverview, 4, 5, 2, 3, 'Target Milestones', `${(state.releases || []).length} Releases`, 'Target Delivery', pal.emerald, { isDark: pal.isDark });

  return wb;
}

export async function exportFeatureMatrixExcel(state: ProjectState): Promise<string> {
  const wb = buildFeatureMatrixWorkbook(state);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `ProjectPulse_FeatureMatrix_${(state.name || 'Project').replace(/[\/*?:"<>|\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return filename;
}


// ============================================================================
// HIERARCHICAL DELIVERIES & FEATURE/SCREEN TRACEABILITY ENGINE
// ============================================================================

export function classifyComponent(rawName: string): { name: string; layer: string; shortType: string; icon: string; ext: string } {
  const name = String(rawName || '').trim();
  const lower = name.toLowerCase();
  const extMatch = name.match(/\.([a-z0-9_]+)$/i);
  const ext = extMatch ? '.' + extMatch[1].toLowerCase() : '';

  if (['.sql', '.pls', '.pkb', '.pks', '.prc', '.fnc', '.trg', '.ddl'].includes(ext) || /(^|_|\b)(db|sql|table|view|trigger|proc|schema|migration)(_|\b|$)/i.test(lower)) {
    return { name, layer: 'Database / SQL', shortType: 'Database', icon: '🗄️', ext };
  }
  if (['.jsp', '.html', '.htm', '.tsx', '.jsx', '.vue', '.css', '.scss', '.less'].includes(ext) || /(^|_|\b)(gui|screen|page|form|modal|dialog|widget|view|frontend|ui)(_|\b|$)/i.test(lower)) {
    return { name, layer: 'GUI / Frontend', shortType: 'GUI', icon: '🖥️', ext };
  }
  if (['.xml', '.json', '.yaml', '.yml', '.properties', '.ini', '.conf', '.cfg', '.env', '.xsd', '.wsdl'].includes(ext) || /(^|_|\b)(config|cfg|setting|manifest|schema|prop)(_|\b|$)/i.test(lower)) {
    return { name, layer: 'Config / Schema', shortType: 'Service', icon: '📐', ext };
  }
  return { name, layer: 'Server / Backend', shortType: 'Server', icon: '⚙️', ext };
}

export function styleHierarchyRow(
  row: ExcelJS.Row,
  tier: number,
  variant: 'delivery' | 'component' | 'screen' | 'feature',
  palette: ExcelThemePalette,
  colCount: number
) {
  const isDark = palette.isDark;
  const themePrimary = palette.indigo || 'FF6366F1';
  const themeBg = palette.bg || (isDark ? 'FF090D16' : 'FFF8FAFC');
  const themeSurface = palette.surface || (isDark ? 'FF111827' : 'FFFFFFFF');
  const themeDivider = palette.divider || (isDark ? 'FF1E293B' : 'FFE2E8F0');
  const themeText = isDark ? 'FFFFFFFF' : 'FF0F172A';
  const themeMuted = palette.slate || (isDark ? 'FF94A3B8' : 'FF64748B');

  let rowBg: string;
  let primaryText: string;
  let secondaryText: string;
  let borderTop: any;
  let borderBottom: any;
  let leftAccentColor: string;
  let leftAccentStyle: any;

  if (tier === 0) {
    row.height = 26;
    rowBg = blendColors(themePrimary, themeBg, isDark ? 0.20 : 0.11);
    primaryText = isDark ? 'FFFFFFFF' : themeText;
    secondaryText = isDark ? blendColors(themeText, 'FFE2E8F0', 0.35) : blendColors(themeText, themeMuted, 0.2);
    borderTop = { style: 'medium', color: { argb: blendColors(themePrimary, themeDivider, 0.3) } };
    borderBottom = { style: 'thin', color: { argb: blendColors(themePrimary, themeDivider, 0.55) } };
    leftAccentColor = themePrimary;
    leftAccentStyle = 'thick';
  } else if (tier === 1) {
    row.height = 22;
    const compAccent = variant === 'screen' ? blendColors(themePrimary, 'FF8B5CF6', 0.6) : blendColors(themePrimary, 'FF6366F1', 0.5);
    rowBg = blendColors(themeSurface, compAccent, isDark ? 0.15 : 0.08);
    primaryText = themeText;
    secondaryText = blendColors(themeText, themeMuted, 0.25);
    leftAccentColor = compAccent;
    borderTop = { style: 'thin', color: { argb: themeDivider } };
    borderBottom = { style: 'thin', color: { argb: themeDivider } };
    leftAccentStyle = 'medium';
  } else {
    row.height = 20;
    const taskAccent = blendColors(themePrimary, 'FF3B82F6', 0.6);
    rowBg = blendColors(themeSurface, taskAccent, isDark ? 0.10 : 0.05);
    primaryText = blendColors(themeText, themeMuted, 0.15);
    secondaryText = themeMuted;
    leftAccentColor = taskAccent;
    borderTop = { style: 'thin', color: { argb: blendColors(themeDivider, themeBg, 0.4) } };
    borderBottom = { style: 'thin', color: { argb: blendColors(themeDivider, themeBg, 0.4) } };
    leftAccentStyle = 'thin';
  }

  for (let c = 2; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cell.font = {
      name: tier === 1 ? 'Consolas' : 'Segoe UI',
      size: tier === 0 ? 10 : (tier === 1 ? 9 : 8.5),
      bold: tier === 0 || tier === 1,
      color: { argb: c === 3 ? primaryText : secondaryText }
    };
    cell.border = {
      top: borderTop,
      bottom: borderBottom,
      left: c === 2 ? { style: leftAccentStyle, color: { argb: leftAccentColor } } : { style: 'thin', color: { argb: themeDivider } },
      right: { style: 'thin', color: { argb: themeDivider } }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
  }
}

export function styleFeatureCompletionCell(
  cell: ExcelJS.Cell | undefined,
  pct: number,
  hasDeliveredScreens: boolean,
  palette: ExcelThemePalette
) {
  if (!cell) return;
  const isDark = palette.isDark;
  if (!hasDeliveredScreens && pct === 0) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDark ? 'FF334155' : 'FFF1F5F9' } };
    cell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: isDark ? 'FFCBD5E1' : 'FF475569' } };
  } else if (pct >= 80) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDark ? 'FF064E3B' : 'FFD1FAE5' } };
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: isDark ? 'FF6EE7B7' : 'FF065F46' } };
  } else if (pct >= 50) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDark ? 'FF164E63' : 'FFE0F2FE' } };
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: isDark ? 'FF67E8F9' : 'FF0369A1' } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDark ? 'FF78350F' : 'FFFEF3C7' } };
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: isDark ? 'FFFCD34D' : 'FF92400E' } };
  }
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
}

export interface TraceFeatureEntry {
  name: string;
  desc: string;
  module: string;
  release: string;
  canonicalScreens: string[];
  totalScreens: number;
  deliveredScreens: number;
  inProgressScreens: number;
  completionPct: number;
  screensDetailStr: string;
  screenEntries: Array<{
    screenName: string;
    isDelivered: boolean;
    isInProgress: boolean;
    marker: string;
  }>;
}

const isDeliveredStatus = (st: string) => {
  const s = String(st || '').trim().toLowerCase();
  return s === 'closed' || s === 'fixed' || s === 'ready for test' || s === 'retest' || s === 'deployed' || s === 'delivered';
};

const resolveComponentScreenPair = (
  compName: string,
  cIdx: number,
  delObj: Delivery,
  allPairs: Array<{ screenName: string; featureObj: TraceFeatureEntry }>,
  featureStatsList: TraceFeatureEntry[]
): { screenName: string; featureObj: TraceFeatureEntry } | null => {
  const cLow = String(compName || '').toLowerCase();
  const dLinkedType = String(delObj.linkedType || '').trim();
  const dLinkedId = String(delObj.linkedId || '').trim();
  const dMod = String(delObj.module || '').toLowerCase();
  const dDesc = String(delObj.name || '').toLowerCase();

  const findPair = (pred: (p: { screenName: string; featureObj: TraceFeatureEntry }) => boolean) =>
    allPairs.find(pred) || null;

  // A. Component filename rules
  if (/amlscreening|aml_/.test(cLow)) return findPair(p => /aml integration|compliance/i.test(p.screenName));
  if (/pep_rules|compliance/.test(cLow)) return findPair(p => /compliance audit|compliance/i.test(p.screenName));
  if (/sanctions/.test(cLow)) return findPair(p => /sanctions checker/i.test(p.screenName));
  if (/partitioning|schema/.test(cLow)) return findPair(p => /database schema/i.test(p.screenName));
  if (/migration_runner|core_service|grpc/.test(cLow)) return findPair(p => /core services/i.test(p.screenName));
  if (/marketdatagateway|socket-dispatcher|stream-config|ticker|market-streamer/.test(cLow)) return findPair(p => /market data feed|ticker stream/i.test(p.screenName));
  if (/ingress|cert-manager|helm|apigateway|api_gateway|envoy/.test(cLow)) return findPair(p => /api gateway/i.test(p.screenName));
  if (/sunburst|assethierarchy|valuation/.test(cLow)) return findPair(p => /portfolio valuations|sunburst/i.test(p.screenName));
  if (/mfasettings|totpqr|mfa|auth-token|jwt/.test(cLow)) return findPair(p => /authentication|mfa/i.test(p.screenName));
  if (/depthcanvas|depth/.test(cLow)) return findPair(p => /depth chart|market data feed/i.test(p.screenName));
  if (/level2_stream|orderbook_stream|level2|matching/.test(cLow)) return findPair(p => /market data feed|matching engine/i.test(p.screenName));
  if (/trade_confirmation|emailrenderer|sendgrid|webhook/.test(cLow)) return findPair(p => /trade confirmation/i.test(p.screenName));
  if (/execdashboard|duckdb|kpi-cards|web-bundle-overview/.test(cLow)) return findPair(p => /analytics dashboard/i.test(p.screenName));
  if (/varsimulation|monte_carlo|var_api/.test(cLow)) return findPair(p => /value-at-risk/i.test(p.screenName));
  if (/stresstest|covariance/.test(cLow)) return findPair(p => /stress testing/i.test(p.screenName));
  if (/cashtransfer|cash_transfer|ledger|sp_balance_lock/.test(cLow)) return findPair(p => /cash accounts|ledger audit/i.test(p.screenName));

  // B. Explicit Delivery Screen Link
  if (dLinkedType === 'Screen' && dLinkedId) {
    const exact = findPair(p => p.screenName.toLowerCase() === dLinkedId.toLowerCase());
    if (exact) return exact;
  }
  if (Array.isArray(delObj.linkedScreens) && delObj.linkedScreens.length > 0) {
    for (const sc of delObj.linkedScreens) {
      const match = findPair(p => p.screenName.toLowerCase() === sc.toLowerCase());
      if (match) return match;
    }
  }

  // C. Keyword tokens
  const compTokens = `${compName} ${dLinkedId}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  if (compTokens.length > 0) {
    const byTok = findPair(p => {
      const sToks = p.screenName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(w => w.length >= 3);
      return sToks.some(st => compTokens.includes(st));
    });
    if (byTok) return byTok;
  }

  // D. Fallback to matched Feature's canonical screen
  const combined = `${dMod} ${dDesc}`.toLowerCase();
  for (const fs of featureStatsList) {
    const fLow = `${fs.name} ${fs.desc} ${fs.module}`.toLowerCase();
    if ((/market|ticker|quote/.test(combined) && /market|analytics/.test(fLow)) ||
        (/auth|iam|jwt|security/.test(combined) && /auth|user|security/.test(fLow)) ||
        (/cash|ledger|account/.test(combined) && /cash|account|ledger/.test(fLow)) ||
        (/infra|db|schema|postgres/.test(combined) && /infra|core/.test(fLow)) ||
        (fs.module && dMod.includes(fs.module.toLowerCase()))) {
      if (fs.canonicalScreens.length > 0) {
        return { screenName: fs.canonicalScreens[cIdx % fs.canonicalScreens.length], featureObj: fs };
      }
    }
  }

  if (featureStatsList.length > 0 && featureStatsList[0].canonicalScreens.length > 0) {
    return { screenName: featureStatsList[0].canonicalScreens[cIdx % featureStatsList[0].canonicalScreens.length], featureObj: featureStatsList[0] };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────
// BUILD DELIVERIES SHEET (Sheet 1)
// ─────────────────────────────────────────────────────────────
export function buildDeliveriesSheet(
  wb: ExcelJS.Workbook,
  state: ProjectState,
  palette: ExcelThemePalette,
  options?: { taskRowMap?: Record<string, number> }
): {
  ws: ExcelJS.Worksheet;
  deliveryRowMap: Map<string, number>;
  pendingFeatureLinks: Array<{ cell: ExcelJS.Cell; text: string; featName: string }>;
  pendingScreenLinks: Array<{ cell: ExcelJS.Cell; text: string; screenName: string; featName: string }>;
  parsedDeliveries: any[];
  featureStatsList: TraceFeatureEntry[];
} {
  const ws = wb.addWorksheet('Deliveries', {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  ws.properties.tabColor = { argb: palette.indigo };
  ws.properties.outlineProperties = { summaryBelow: false, summaryRight: false };

  const deliveries = state.deliveries || [];

  // Build Canonical Features
  const rawFeatures = (state.features && state.features.length > 0) ? state.features : [];
  let featureStatsList: TraceFeatureEntry[] = rawFeatures.map((f, fIdx) => {
    const featName = S(f.name || `Feature #${fIdx + 1}`);
    const baseScreens = Array.isArray(f.screens)
      ? f.screens.map(s => String(s || '').trim()).filter(Boolean)
      : [];
    return {
      name: featName,
      desc: S(f.desc || ''),
      module: S(f.category || ''),
      release: S(f.release || 'v1.0.0'),
      canonicalScreens: baseScreens.length > 0 ? baseScreens : [`${featName} Screen 1`, `${featName} Screen 2`, `${featName} Screen 3`],
      totalScreens: 0,
      deliveredScreens: 0,
      inProgressScreens: 0,
      completionPct: 0,
      screensDetailStr: '',
      screenEntries: []
    };
  });

  if (featureStatsList.length === 0) {
    // Derive features from tasks if no features exist
    const modMap = new Map<string, string[]>();
    (state.tasks || []).forEach(t => {
      const m = t.module || 'Core Module';
      if (!modMap.has(m)) modMap.set(m, []);
      (t.guiScreens || []).forEach(s => {
        if (!modMap.get(m)!.includes(s)) modMap.get(m)!.push(s);
      });
    });
    modMap.forEach((screens, m) => {
      featureStatsList.push({
        name: m,
        desc: `Features for ${m}`,
        module: m,
        release: 'v1.0.0',
        canonicalScreens: screens.length > 0 ? screens : [`${m} Interface`, `${m} Service`, `${m} Overview`],
        totalScreens: 0,
        deliveredScreens: 0,
        inProgressScreens: 0,
        completionPct: 0,
        screensDetailStr: '',
        screenEntries: []
      });
    });
  }

  const allScreenFeaturePairs: Array<{ screenName: string; featureObj: TraceFeatureEntry }> = [];
  featureStatsList.forEach(fs => {
    fs.canonicalScreens.forEach(scrName => {
      allScreenFeaturePairs.push({ screenName: scrName, featureObj: fs });
    });
  });

  const screenDeliveryTracker = new Map<string, {
    screenName: string;
    featureObj: TraceFeatureEntry;
    deliveredComps: any[];
    activeComps: any[];
  }>();

  allScreenFeaturePairs.forEach(pair => {
    screenDeliveryTracker.set(pair.screenName, {
      screenName: pair.screenName,
      featureObj: pair.featureObj,
      deliveredComps: [],
      activeComps: []
    });
  });

  // Parse Deliveries and link Components
  const parsedDeliveries = deliveries.map((d, i) => {
    const delIdStr = S(d.almId || d.id || `DEL-${String(i + 1).padStart(3, '0')}`);
    const delStatus = S(d.almStatus || d.status || 'New');
    const delDelivered = isDeliveredStatus(delStatus);

    const rawTaskIds = Array.isArray(d.linkedTasks) && d.linkedTasks.length > 0
      ? d.linkedTasks.map(s => String(s).trim()).filter(Boolean)
      : (d.linkedType === 'Task' || d.linkedType === 'Multi'
          ? String(d.linkedId || '').split(/[,;\n|]+/).map(s => s.trim()).filter(Boolean)
          : []);
    const uniqueTaskIds = [...new Set(rawTaskIds)];
    const resolvedTasks = uniqueTaskIds.map(tId => {
      const cleanId = tId.split(':')[0].trim();
      const found = (state.tasks || []).find(t =>
        (t.id && t.id.toLowerCase() === cleanId.toLowerCase()) ||
        (t.name && t.name.toLowerCase() === cleanId.toLowerCase())
      );
      return { rawId: cleanId, taskObj: found || null };
    });

    const rawCompStr = S(d.componentsDelivered || '');
    const compTokens = rawCompStr
      ? rawCompStr.split(/[,;\n|]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const components = compTokens.map((tok, cIdx) => {
      const classified = classifyComponent(tok);
      const screenPair = resolveComponentScreenPair(tok, cIdx, d, allScreenFeaturePairs, featureStatsList);
      const linkedScreenName = screenPair ? screenPair.screenName : (d.linkedType === 'Screen' ? S(d.linkedId) : '');
      const linkedFeatureObj = screenPair ? screenPair.featureObj : null;

      let compTasks = [...resolvedTasks];
      if (compTasks.length === 0 && linkedScreenName) {
        const matchingTask = (state.tasks || []).find(t =>
          t.name && t.name.toLowerCase().includes(linkedScreenName.toLowerCase())
        );
        if (matchingTask) {
          compTasks.push({ rawId: S(matchingTask.id), taskObj: matchingTask });
        }
      }

      if (linkedScreenName && screenDeliveryTracker.has(linkedScreenName)) {
        const tracker = screenDeliveryTracker.get(linkedScreenName)!;
        if (delDelivered) {
          tracker.deliveredComps.push({ compName: classified.name, almId: delIdStr, status: delStatus });
        } else if (String(delStatus).toLowerCase() !== 'rejected') {
          tracker.activeComps.push({ compName: classified.name, almId: delIdStr, status: delStatus });
        }
      }

      return {
        index: cIdx + 1,
        name: classified.name,
        layer: classified.layer,
        shortType: classified.shortType,
        icon: classified.icon,
        ext: classified.ext,
        linkedTasks: compTasks,
        linkedScreenName,
        linkedFeatureObj
      };
    });

    return {
      raw: d,
      index: i,
      delIdStr,
      delStatus,
      delDelivered,
      rawCompStr,
      resolvedTasks,
      components
    };
  });

  // Calculate Feature completion
  featureStatsList.forEach(fs => {
    fs.screenEntries = fs.canonicalScreens.map(canonScr => {
      const tracker = screenDeliveryTracker.get(canonScr);
      const isDelivered = tracker ? tracker.deliveredComps.length > 0 : false;
      const isInProgress = tracker ? (!isDelivered && tracker.activeComps.length > 0) : false;
      const marker = isDelivered ? '✓' : (isInProgress ? '◐' : '○');
      return {
        screenName: canonScr,
        isDelivered,
        isInProgress,
        marker
      };
    });
    fs.totalScreens = fs.canonicalScreens.length;
    fs.deliveredScreens = fs.screenEntries.filter(se => se.isDelivered).length;
    fs.inProgressScreens = fs.screenEntries.filter(se => se.isInProgress).length;
    fs.completionPct = fs.totalScreens > 0 ? Math.round((fs.deliveredScreens / fs.totalScreens) * 100) : 0;
    fs.screensDetailStr = fs.screenEntries.map(se => `[${se.marker} ${se.screenName}]`).join(' · ');
  });

  // Base Columns for Sheet 1
  const baseCols = [
    { header: '', key: '_spacer', width: 3 },
    { header: 'Defect ID - ALM ID', key: 'almId', width: 22 },
    { header: 'Description - ALM Description', key: 'name', width: 52 },
    { header: 'PDN Info', key: 'pdn', width: 18 },
    { header: 'PDN Processing Date', key: 'pdnProcessingDate', width: 20 },
    { header: 'Components Delivered', key: 'componentsDelivered', width: 42 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'ALM Status', key: 'almStatus', width: 18 },
    { header: 'Reported By', key: 'reportedBy', width: 22 },
    { header: 'Defect Fixed By', key: 'fixedBy', width: 22 },
    { header: 'Linked Type', key: 'linkedType', width: 16 },
    { header: 'Linked ID', key: 'linkedId', width: 30 },
    { header: 'Impacted Feature', key: 'impactedFeature', width: 30 },
    { header: 'Feature Completion (Traceability ↗)', key: 'featureCompletion', width: 34 }
  ];

  (state.delCustomFields || []).forEach(f => {
    baseCols.push({ header: f.name, key: f.name, width: 22 });
  });

  ws.columns = baseCols.map(c => ({ key: c.key, width: c.width }));

  // Telemetry Cards
  const totalDels = deliveries.length;
  const deployedDels = deliveries.filter(d => d.status === 'Deployed' || isDeliveredStatus(d.almStatus)).length;
  const delPct = totalDels ? Math.round((deployedDels / totalDels) * 100) : 0;
  const approvedDels = deliveries.filter(d => d.signOffStatus === 'Approved').length;
  const passedDels = deliveries.filter(d => d.smokeTestStatus === 'Passed').length;
  const totalLinkedTasksCount = parsedDeliveries.reduce((acc, pd) => acc + pd.resolvedTasks.length, 0);
  const totalLinkedScreensCount = parsedDeliveries.reduce((acc, pd) => acc + pd.components.filter((c: any) => c.linkedScreenName).length, 0);

  ws.getRow(1).height = 10;
  ws.mergeCells('B2:H2');
  ws.getRow(2).height = 20;
  const delsTitle = ws.getCell('B2');
  delsTitle.value = ' >> COCKPIT.TELEMETRY: ALM & PDN DELIVERY SCHEDULE';
  delsTitle.font = { name: 'Courier New', size: 10, bold: true, color: { argb: palette.indigo } };
  delsTitle.alignment = { vertical: 'middle', indent: 1 };

  drawTopKpiCard(ws, 2, 3, 2, 3, 'Deployment Health', `${deployedDels} / ${totalDels}`, `${delPct}% deployed`, palette.indigo, { isDark: palette.isDark });
  drawTopKpiCard(ws, 4, 3, 3, 3, 'Approval Gate', `${approvedDels} Approved`, 'Executive sign-offs', palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ws, 7, 3, 3, 3, 'Smoke Testing', `${passedDels} Passed`, 'Verification gate', palette.blue, { isDark: palette.isDark });
  drawTopKpiCard(ws, 10, 3, 5, 3, 'Component Traceability', `${totalLinkedTasksCount} Tasks · ${totalLinkedScreensCount} Screens`, `${featureStatsList.length} Features Linked via Screens`, blendColors(palette.indigo, 'FF8B5CF6', 0.5), { isDark: palette.isDark });

  ws.getRow(6).height = 10;

  // Header Row 7
  const hdr = ws.getRow(7);
  hdr.height = 30;
  baseCols.forEach((col, idx) => {
    if (col.key === '_spacer') return;
    const cell = hdr.getCell(idx + 1);
    cell.value = col.header;
    styleHeaderCell(cell, palette.navy);
  });
  ws.autoFilter = { from: 'B7', to: `O${Math.max(8, deliveries.length + 7)}` };

  let currentRowIdx = 7;
  const deliveryRowMap = new Map<string, number>();
  const pendingFeatureLinks: Array<{ cell: ExcelJS.Cell; text: string; featName: string }> = [];
  const pendingScreenLinks: Array<{ cell: ExcelJS.Cell; text: string; screenName: string; featName: string }> = [];

  const formatCompactFeatureBadge = (featObj: TraceFeatureEntry) => {
    if (!featObj) return '—';
    const m = Math.max(1, featObj.totalScreens);
    const delCnt = featObj.deliveredScreens;
    const progCnt = featObj.inProgressScreens || 0;
    const pct = featObj.completionPct;
    if (delCnt === 0 && progCnt > 0) {
      return `0% (0 of ${m} Screens · ${progCnt} Active) ↗`;
    }
    return `${pct}% (${delCnt} of ${m} Screens Delivered) ↗`;
  };

  parsedDeliveries.forEach(pd => {
    const d = pd.raw;
    currentRowIdx++;
    const parentRowIdx = currentRowIdx;
    deliveryRowMap.set(pd.delIdStr, parentRowIdx);

    const compFeatureSet = new Map<string, TraceFeatureEntry>();
    const compScreenNames: string[] = [];
    pd.components.forEach((comp: any) => {
      if (comp.linkedScreenName && !compScreenNames.includes(comp.linkedScreenName)) {
        compScreenNames.push(comp.linkedScreenName);
      }
      if (comp.linkedFeatureObj && !compFeatureSet.has(comp.linkedFeatureObj.name)) {
        compFeatureSet.set(comp.linkedFeatureObj.name, comp.linkedFeatureObj);
      }
    });

    const primaryFeatureObj = Array.from(compFeatureSet.values())[0] || null;
    const impactedFeatureDisplay = primaryFeatureObj ? `🎯 ${primaryFeatureObj.name}` : '—';
    const featureCompletionDisplay = primaryFeatureObj ? formatCompactFeatureBadge(primaryFeatureObj) : '—';

    // LEVEL 0: Delivery Row
    const rowValues: Record<string, any> = {
      _spacer: '',
      almId: S(d.almId || d.id),
      name: S(d.name),
      pdn: S(d.pdn),
      pdnProcessingDate: cleanFmtDate(d.pdnProcessingDate),
      componentsDelivered: pd.rawCompStr,
      category: S(d.category || 'GSP++ Delivery'),
      module: S(d.module),
      almStatus: pd.delStatus,
      reportedBy: S(d.reportedBy || ''),
      fixedBy: S(d.fixedBy || ''),
      linkedType: S(d.linkedType || (compScreenNames.length > 0 ? 'Screen' : 'Task')),
      linkedId: S(d.linkedId || compScreenNames.join(', ')),
      impactedFeature: impactedFeatureDisplay,
      featureCompletion: featureCompletionDisplay
    };

    (state.delCustomFields || []).forEach(f => {
      const v = (d as any)[f.name] !== undefined ? (d as any)[f.name] : (d.custom && d.custom[f.name] !== undefined ? d.custom[f.name] : '');
      rowValues[f.name] = S(v);
    });

    const row = ws.addRow(rowValues);
    row.outlineLevel = 0;
    styleHierarchyRow(row, 0, 'delivery', palette, baseCols.length);

    const almCell = row.getCell('almId');
    almCell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: palette.isDark ? 'FFC7D2FE' : 'FF4338CA' } };
    almCell.alignment = { vertical: 'middle', horizontal: 'center' };

    ['pdn', 'pdnProcessingDate', 'linkedType'].forEach(k => {
      const c = row.getCell(k);
      if (c) c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const statusCell = row.getCell('almStatus');
    formatStatusCell(statusCell, pd.delStatus, palette);

    if (primaryFeatureObj) {
      pendingFeatureLinks.push({
        cell: row.getCell('impactedFeature'),
        text: impactedFeatureDisplay,
        featName: primaryFeatureObj.name
      });
      pendingScreenLinks.push({
        cell: row.getCell('featureCompletion'),
        text: featureCompletionDisplay,
        screenName: compScreenNames[0] || '',
        featName: primaryFeatureObj.name
      });
    }

    // LEVEL 1: Delivered Components
    pd.components.forEach((comp: any, cIdx: number) => {
      const isLastComp = cIdx === pd.components.length - 1;
      const compBranch = isLastComp ? '└─' : '├─';
      const hasTask = comp.linkedTasks.length > 0;
      const hasScreen = !!comp.linkedScreenName;
      const compLinkedType = (hasTask && hasScreen) ? 'Task & Screen' : (hasScreen ? 'Screen' : (hasTask ? 'Task' : '—'));
      const taskIdsStr = comp.linkedTasks.map((rt: any) => rt.rawId).join(', ');
      const compLinkedId = (hasTask && hasScreen)
        ? `${taskIdsStr} ➔ ${comp.linkedScreenName}`
        : (hasScreen ? comp.linkedScreenName : taskIdsStr);

      const compFeat = comp.linkedFeatureObj;
      const compTotalScr = compFeat ? Math.max(1, compFeat.totalScreens) : 1;
      const compScreenBadgeText = compFeat
        ? `🖥️ ${comp.linkedScreenName} (1 of ${compTotalScr} Screens) ↗`
        : '—';

      currentRowIdx++;
      const compRow = ws.addRow({
        _spacer: '',
        almId: `${compBranch} COMP-${String(comp.index).padStart(2, '0')}`,
        name: `  ${comp.icon} ${comp.name}  [${comp.layer}]`,
        pdn: S(d.pdn),
        pdnProcessingDate: '',
        componentsDelivered: comp.name,
        category: comp.layer,
        module: S(d.module),
        almStatus: pd.delStatus,
        reportedBy: '',
        fixedBy: S(d.fixedBy || ''),
        linkedType: compLinkedType,
        linkedId: compLinkedId,
        impactedFeature: compFeat ? compFeat.name : '—',
        featureCompletion: compScreenBadgeText
      });
      compRow.outlineLevel = 1;
      compRow.hidden = true;
      styleHierarchyRow(compRow, 1, 'component', palette, baseCols.length);

      if (compFeat) {
        const cFeatCompCell = compRow.getCell('featureCompletion');
        styleFeatureCompletionCell(cFeatCompCell, compFeat.completionPct, compFeat.deliveredScreens > 0, palette);
        pendingScreenLinks.push({
          cell: cFeatCompCell,
          text: compScreenBadgeText,
          screenName: comp.linkedScreenName,
          featName: compFeat.name
        });
      }

      const cAlmCell = compRow.getCell('almId');
      cAlmCell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: palette.isDark ? 'FF818CF8' : 'FF4F46E5' } };
      cAlmCell.alignment = { vertical: 'middle', horizontal: 'center' };

      ['pdn', 'almStatus', 'linkedType'].forEach(k => {
        const c = compRow.getCell(k);
        if (c) c.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
  });

  return {
    ws,
    deliveryRowMap,
    pendingFeatureLinks,
    pendingScreenLinks,
    parsedDeliveries,
    featureStatsList
  };
}

// ─────────────────────────────────────────────────────────────
// BUILD FEATURE & SCREEN TRACEABILITY SHEET (Sheet 2)
// ─────────────────────────────────────────────────────────────
export function buildFeatureScreenTraceabilitySheet(
  wb: ExcelJS.Workbook,
  state: ProjectState,
  palette: ExcelThemePalette,
  deliveryRowMap: Map<string, number>,
  options?: {
    pendingFeatureLinks?: Array<{ cell: ExcelJS.Cell; text: string; featName: string }>;
    pendingScreenLinks?: Array<{ cell: ExcelJS.Cell; text: string; screenName: string; featName: string }>;
    taskRowMap?: Record<string, number>;
  }
): ExcelJS.Worksheet {
  const traceSheetName = 'Feature & Screen Traceability';
  const existingTraceWs = wb.getWorksheet(traceSheetName);
  if (existingTraceWs) wb.removeWorksheet(existingTraceWs.id);

  const traceWs = wb.addWorksheet(traceSheetName, {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  traceWs.properties.tabColor = { argb: blendColors(palette.indigo, 'FF8B5CF6', 0.55) };
  traceWs.properties.outlineProperties = { summaryBelow: false, summaryRight: false };

  const traceCols = [
    { header: '', key: '_spacer', width: 3 },
    { header: 'Traceability ID', key: 'traceId', width: 20 },
    { header: 'Feature ➔ Screen ➔ Component', key: 'entityName', width: 44 },
    { header: 'Hierarchy Level', key: 'entityType', width: 22 },
    { header: 'Release / Module', key: 'moduleRelease', width: 24 },
    { header: 'Completion / Status', key: 'statusBadge', width: 28 },
    { header: 'Screen Breakdown / Share', key: 'screenSummary', width: 56 },
    { header: 'Deduplicated Components', key: 'uniqueComps', width: 42 },
    { header: 'Linked Tasks (Deduplicated)', key: 'linkedTasks', width: 34 },
    { header: 'Contributing Deliveries (ALM IDs)', key: 'contributingDels', width: 36 }
  ];
  traceWs.columns = traceCols.map(c => ({ key: c.key, width: c.width }));

  // Top Banner (Row 1)
  const tBannerRow = traceWs.getRow(1);
  tBannerRow.height = 30;
  traceWs.mergeCells(1, 2, 1, traceCols.length);
  const tBannerCell = traceWs.getCell(1, 2);
  tBannerCell.value = `🎯 FEATURE, SCREEN & COMPONENT TRACEABILITY MATRIX  —  DEDUPLICATED HIERARCHICAL ROLLUP  (THEME: ${(palette.themeName || 'Theme').toUpperCase()})`;
  tBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blendColors(palette.indigo, 'FF1E1B4B', 0.65) } };
  tBannerCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  tBannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  traceWs.getRow(2).height = 8;

  const deliveries = state.deliveries || [];

  // Re-collect features and deliveries components for Sheet 2 deduplication
  const rawFeatures = (state.features && state.features.length > 0) ? state.features : [];
  let featureStatsList: TraceFeatureEntry[] = rawFeatures.map((f, fIdx) => {
    const featName = S(f.name || `Feature #${fIdx + 1}`);
    const baseScreens = Array.isArray(f.screens)
      ? f.screens.map(s => String(s || '').trim()).filter(Boolean)
      : [];
    return {
      name: featName,
      desc: S(f.desc || ''),
      module: S(f.category || ''),
      release: S(f.release || 'v1.0.0'),
      canonicalScreens: baseScreens.length > 0 ? baseScreens : [`${featName} Screen 1`, `${featName} Screen 2`, `${featName} Screen 3`],
      totalScreens: 0,
      deliveredScreens: 0,
      inProgressScreens: 0,
      completionPct: 0,
      screensDetailStr: '',
      screenEntries: []
    };
  });

  if (featureStatsList.length === 0) {
    const modMap = new Map<string, string[]>();
    (state.tasks || []).forEach(t => {
      const m = t.module || 'Core Module';
      if (!modMap.has(m)) modMap.set(m, []);
      (t.guiScreens || []).forEach(s => {
        if (!modMap.get(m)!.includes(s)) modMap.get(m)!.push(s);
      });
    });
    modMap.forEach((screens, m) => {
      featureStatsList.push({
        name: m,
        desc: `Features for ${m}`,
        module: m,
        release: 'v1.0.0',
        canonicalScreens: screens.length > 0 ? screens : [`${m} Interface`, `${m} Service`, `${m} Overview`],
        totalScreens: 0,
        deliveredScreens: 0,
        inProgressScreens: 0,
        completionPct: 0,
        screensDetailStr: '',
        screenEntries: []
      });
    });
  }

  const allScreenFeaturePairs: Array<{ screenName: string; featureObj: TraceFeatureEntry }> = [];
  featureStatsList.forEach(fs => {
    fs.canonicalScreens.forEach(scrName => {
      allScreenFeaturePairs.push({ screenName: scrName, featureObj: fs });
    });
  });

  // Deduplicate Components, Tasks, and Deliveries per Screen and per Feature
  const screenComponentMap = new Map<string, Map<string, {
    compName: string;
    icon: string;
    layer: string;
    tasksMap: Map<string, any>;
    deliveriesMap: Map<string, any>;
  }>>();
  const globalUniqueComps = new Set<string>();
  const impactedFeatureNames = new Set<string>();
  const screenDeliveryTracker = new Map<string, { deliveredComps: any[]; activeComps: any[] }>();

  allScreenFeaturePairs.forEach(p => {
    screenDeliveryTracker.set(p.screenName, { deliveredComps: [], activeComps: [] });
  });

  deliveries.forEach((d, i) => {
    const delIdStr = S(d.almId || d.id || `DEL-${String(i + 1).padStart(3, '0')}`);
    const delStatus = S(d.almStatus || d.status || 'New');
    const delDelivered = isDeliveredStatus(delStatus);

    const rawCompStr = S(d.componentsDelivered || '');
    const compTokens = rawCompStr
      ? rawCompStr.split(/[,;\n|]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const rawTaskIds = Array.isArray(d.linkedTasks) && d.linkedTasks.length > 0
      ? d.linkedTasks.map(s => String(s).trim()).filter(Boolean)
      : (d.linkedType === 'Task' || d.linkedType === 'Multi'
          ? String(d.linkedId || '').split(/[,;\n|]+/).map(s => s.trim()).filter(Boolean)
          : []);

    compTokens.forEach((tok, cIdx) => {
      const classified = classifyComponent(tok);
      const cKey = classified.name.toLowerCase();
      globalUniqueComps.add(cKey);

      const screenPair = resolveComponentScreenPair(tok, cIdx, d, allScreenFeaturePairs, featureStatsList);
      const scName = screenPair ? screenPair.screenName : (d.linkedType === 'Screen' ? S(d.linkedId) : '');
      if (!scName) return;

      if (screenPair && screenPair.featureObj) impactedFeatureNames.add(screenPair.featureObj.name);

      if (screenDeliveryTracker.has(scName)) {
        const tracker = screenDeliveryTracker.get(scName)!;
        if (delDelivered) {
          tracker.deliveredComps.push({ compName: classified.name, almId: delIdStr });
        } else if (String(delStatus).toLowerCase() !== 'rejected') {
          tracker.activeComps.push({ compName: classified.name, almId: delIdStr });
        }
      }

      if (!screenComponentMap.has(scName)) {
        screenComponentMap.set(scName, new Map());
      }
      const compMap = screenComponentMap.get(scName)!;
      if (!compMap.has(cKey)) {
        compMap.set(cKey, {
          compName: classified.name,
          icon: classified.icon,
          layer: classified.layer,
          tasksMap: new Map(),
          deliveriesMap: new Map()
        });
      }
      const entry = compMap.get(cKey)!;

      rawTaskIds.forEach(tId => {
        const cleanId = tId.split(':')[0].trim();
        const found = (state.tasks || []).find(t => (t.id && t.id.toLowerCase() === cleanId.toLowerCase()) || (t.name && t.name.toLowerCase() === cleanId.toLowerCase()));
        entry.tasksMap.set(cleanId, found || null);
      });

      entry.deliveriesMap.set(delIdStr, {
        delIdStr,
        pdn: S(d.pdn),
        status: delStatus,
        module: S(d.module),
        fixedBy: S(d.fixedBy || '')
      });
    });
  });

  // Calculate Feature completion
  featureStatsList.forEach(fs => {
    fs.screenEntries = fs.canonicalScreens.map(canonScr => {
      const tracker = screenDeliveryTracker.get(canonScr);
      const isDelivered = tracker ? tracker.deliveredComps.length > 0 : false;
      const isInProgress = tracker ? (!isDelivered && tracker.activeComps.length > 0) : false;
      const marker = isDelivered ? '✓' : (isInProgress ? '◐' : '○');
      return {
        screenName: canonScr,
        isDelivered,
        isInProgress,
        marker
      };
    });
    fs.totalScreens = fs.canonicalScreens.length;
    fs.deliveredScreens = fs.screenEntries.filter(se => se.isDelivered).length;
    fs.inProgressScreens = fs.screenEntries.filter(se => se.isInProgress).length;
    fs.completionPct = fs.totalScreens > 0 ? Math.round((fs.deliveredScreens / fs.totalScreens) * 100) : 0;
    fs.screensDetailStr = fs.screenEntries.map(se => `[${se.marker} ${se.screenName}]`).join(' · ');
  });

  // Filter features to display on Sheet 2
  const traceFeatures: TraceFeatureEntry[] = [];
  const seenFeatNames = new Set<string>();
  featureStatsList.forEach(fs => {
    if (impactedFeatureNames.has(fs.name) && !seenFeatNames.has(fs.name)) {
      seenFeatNames.add(fs.name);
      traceFeatures.push(fs);
    }
  });
  featureStatsList.forEach(fs => {
    if (!seenFeatNames.has(fs.name) && !/^Feature\s+\d+$/i.test(fs.name)) {
      seenFeatNames.add(fs.name);
      traceFeatures.push(fs);
    }
  });
  if (traceFeatures.length === 0) {
    featureStatsList.slice(0, 10).forEach(fs => traceFeatures.push(fs));
  }

  const traceTotalScreens = traceFeatures.reduce((acc, fs) => acc + fs.totalScreens, 0);
  const traceDeliveredScreens = traceFeatures.reduce((acc, fs) => acc + fs.deliveredScreens, 0);
  const traceActiveScreens = traceFeatures.reduce((acc, fs) => acc + (fs.inProgressScreens || 0), 0);
  const tracePendingScreens = Math.max(0, traceTotalScreens - traceDeliveredScreens - traceActiveScreens);
  const traceOverallPct = traceTotalScreens > 0 ? Math.round((traceDeliveredScreens / traceTotalScreens) * 100) : 0;

  // KPI Cards on Rows 3–5
  drawTopKpiCard(traceWs, 2, 3, 2, 3, 'Tracked Features', `${traceFeatures.length} Features`, `${impactedFeatureNames.size} Active in Deliveries · Deduplicated`, blendColors(palette.indigo, 'FF8B5CF6', 0.55), { isDark: palette.isDark });
  drawTopKpiCard(traceWs, 4, 3, 2, 3, 'Feature Screens Breakdown', `${traceTotalScreens} Total Screens`, `${traceDeliveredScreens} Delivered ✓ · ${traceActiveScreens} Active ◐ · ${tracePendingScreens} Pending ○`, palette.indigo, { isDark: palette.isDark });
  drawTopKpiCard(traceWs, 6, 3, 2, 3, 'Feature Completion Rate', `${traceOverallPct}% Complete`, `${traceDeliveredScreens} of ${traceTotalScreens} Feature Screens Delivered`, palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(traceWs, 8, 3, 3, 3, 'Deduplicated Components', `${globalUniqueComps.size} Unique Components`, `Consolidated across ${deliveries.length} ALM Deliveries`, palette.blue, { isDark: palette.isDark });

  // Instruction Banner (Row 6)
  const tGuideRow = traceWs.getRow(6);
  tGuideRow.height = 22;
  traceWs.mergeCells(6, 2, 6, traceCols.length);
  const tGuideCell = traceWs.getCell(6, 2);
  tGuideCell.value = '💡 DEDUPLICATED HIERARCHY:  Level 0 = Feature (100% = All 3 Screens Delivered)   ➔   Level 1 = All 3 Screens of the Feature (Visible by Default)   ➔   Level 2 [+] = Unique Components, Linked Tasks & Contributing ALM Deliveries';
  tGuideCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt || 'FF1E293B' } };
  tGuideCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: palette.isDark ? 'FFC7D2FE' : 'FF4338CA' } };
  tGuideCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Headers (Row 7)
  const tHdrRow = traceWs.getRow(7);
  tHdrRow.height = 30;
  traceCols.forEach((col, cIdx) => {
    if (col.key === '_spacer') return;
    const cell = tHdrRow.getCell(cIdx + 1);
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blendColors(palette.indigo, 'FF090D16', 0.64) } };
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = {
      top: { style: 'thin', color: { argb: palette.divider } },
      bottom: { style: 'medium', color: { argb: blendColors(palette.indigo, 'FFA855F7', 0.5) } },
      left: { style: 'thin', color: { argb: palette.divider } },
      right: { style: 'thin', color: { argb: palette.divider } }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: cIdx === 1 || cIdx === 3 || cIdx === 5 ? 'center' : 'left',
      indent: cIdx === 1 || cIdx === 3 || cIdx === 5 ? 0 : 1
    };
  });

  let traceRowIdx = 8;
  const featureTraceRowMap = new Map<string, number>();
  const screenTraceRowMap = new Map<string, number>();

  traceFeatures.forEach((fs, fIdx) => {
    const featRowNum = traceRowIdx++;
    featureTraceRowMap.set(fs.name, featRowNum);

    const featCompsSet = new Set<string>();
    const featTasksSet = new Set<string>();
    const featDelsSet = new Set<string>();
    let primaryModule = fs.module || '';

    fs.canonicalScreens.forEach(scName => {
      const cMap = screenComponentMap.get(scName);
      if (cMap) {
        cMap.forEach(cEntry => {
          featCompsSet.add(cEntry.compName);
          cEntry.tasksMap.forEach((_, tId) => featTasksSet.add(tId));
          cEntry.deliveriesMap.forEach((dInfo, delId) => {
            featDelsSet.add(delId);
            if (!primaryModule && dInfo.module) primaryModule = dInfo.module;
          });
        });
      }
    });

    const featRelease = fs.release || 'v1.0.0';
    const featModRel = primaryModule ? `${featRelease} · ${primaryModule}` : featRelease;
    const featStatusStr = (fs.deliveredScreens === 0 && fs.inProgressScreens > 0)
      ? `0% (0/${fs.totalScreens} Delivered · ${fs.inProgressScreens} Active)`
      : `${fs.completionPct}% (${fs.deliveredScreens} of ${fs.totalScreens} Screens Delivered)`;

    // LEVEL 0: Feature Row
    const fRow = traceWs.addRow({
      _spacer: '',
      traceId: `🎯 FEAT-${String(fIdx + 1).padStart(2, '0')}`,
      entityName: `🎯 ${fs.name}`,
      entityType: `Feature (${fs.totalScreens} Screens)`,
      moduleRelease: featModRel,
      statusBadge: featStatusStr,
      screenSummary: fs.screensDetailStr,
      uniqueComps: featCompsSet.size > 0 ? Array.from(featCompsSet).join(', ') : '— No components delivered yet',
      linkedTasks: featTasksSet.size > 0 ? Array.from(featTasksSet).join(', ') : '—',
      contributingDels: featDelsSet.size > 0 ? Array.from(featDelsSet).join(', ') : '— Pending Delivery'
    });
    fRow.outlineLevel = 0;
    styleHierarchyRow(fRow, 0, 'feature', palette, traceCols.length);
    fRow.height = 25;

    const fIdCell = fRow.getCell('traceId');
    fIdCell.font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: palette.isDark ? 'FFC4B5FD' : 'FF6D28D9' } };
    fIdCell.alignment = { vertical: 'middle', horizontal: 'center' };
    fRow.getCell('entityType').alignment = { vertical: 'middle', horizontal: 'center' };
    styleFeatureCompletionCell(fRow.getCell('statusBadge'), fs.completionPct, fs.deliveredScreens > 0, palette);
    fRow.getCell('statusBadge').alignment = { vertical: 'middle', horizontal: 'center' };

    // LEVEL 1: Canonical Screens (Visible by Default)
    fs.screenEntries.forEach((se, sIdx) => {
      const scRowNum = traceRowIdx++;
      screenTraceRowMap.set(se.screenName, scRowNum);

      const isLastScr = sIdx === fs.screenEntries.length - 1;
      const scrBranch = isLastScr ? '└─' : '├─';
      const cMap = screenComponentMap.get(se.screenName);
      const uniqueCompList = cMap ? Array.from(cMap.values()) : [];

      const scTasksMap = new Map<string, any>();
      const scDelsList: any[] = [];
      uniqueCompList.forEach(cEntry => {
        cEntry.tasksMap.forEach((tObj, tId) => scTasksMap.set(tId, tObj));
        cEntry.deliveriesMap.forEach(dInfo => {
          if (!scDelsList.some(x => x.delIdStr === dInfo.delIdStr)) scDelsList.push(dInfo);
        });
      });

      const scStatusLabel = se.isDelivered
        ? '✓ Delivered'
        : (se.isInProgress ? '◐ In Progress (Active)' : '○ Pending (0 Delivered)');
      const scWeightShare = `Screen ${sIdx + 1} of ${fs.totalScreens} (${Math.round(100 / Math.max(1, fs.totalScreens))}% of Feature)`;
      const scCompsStr = uniqueCompList.length > 0
        ? uniqueCompList.map(c => c.compName).join(', ')
        : '— Awaiting Component Delivery';
      const scTasksStr = scTasksMap.size > 0
        ? Array.from(scTasksMap.entries()).map(([id, tObj]) => tObj && tObj.name ? `${id} (${tObj.name})` : id).join(', ')
        : '—';
      const scDelsStr = scDelsList.length > 0
        ? scDelsList.map(d => `${d.delIdStr} [${d.status}]`).join(', ')
        : '— Not Yet in PDN';

      const sRow = traceWs.addRow({
        _spacer: '',
        traceId: `${scrBranch} SCR-${String(sIdx + 1).padStart(2, '0')}`,
        entityName: `  🖥️ ${se.screenName}`,
        entityType: `Screen ➔ ${fs.name}`,
        moduleRelease: featModRel,
        statusBadge: scStatusLabel,
        screenSummary: scWeightShare,
        uniqueComps: scCompsStr,
        linkedTasks: scTasksStr,
        contributingDels: scDelsStr
      });
      sRow.outlineLevel = 1;
      sRow.hidden = false; // Level 1 is VISIBLE BY DEFAULT!
      styleHierarchyRow(sRow, 1, 'screen', palette, traceCols.length);
      sRow.height = 21;

      const sIdCell = sRow.getCell('traceId');
      sIdCell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: palette.isDark ? 'FFA78BFA' : 'FF7C3AED' } };
      sIdCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sRow.getCell('entityType').alignment = { vertical: 'middle', horizontal: 'center' };

      const sBadgeCell = sRow.getCell('statusBadge');
      styleFeatureCompletionCell(sBadgeCell, se.isDelivered ? 100 : (se.isInProgress ? 50 : 0), se.isDelivered, palette);
      sBadgeCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Hyperlink Contributing Deliveries back to Sheet 1
      if (scDelsList.length > 0) {
        const firstDelId = scDelsList[0].delIdStr;
        const delRowOnSheet1 = deliveryRowMap.get(firstDelId);
        if (delRowOnSheet1) {
          const delCell = sRow.getCell('contributingDels');
          delCell.value = { text: `${scDelsStr} ↩`, hyperlink: `#'Deliveries'!B${delRowOnSheet1}` };
          delCell.font = { name: 'Segoe UI', size: 8.5, bold: true, underline: true, color: { argb: palette.isDark ? 'FF60A5FA' : 'FF2563EB' } };
        }
      }

      // LEVEL 2: Deduplicated Components Under Screen (Collapsible [+])
      uniqueCompList.forEach((cEntry, cIdx) => {
        traceRowIdx++;
        const isLastComp = cIdx === uniqueCompList.length - 1;
        const cPrefix = isLastComp ? '   └─ COMP' : '   ├─ COMP';
        const cTasksArr = Array.from(cEntry.tasksMap.entries());
        const cDelsArr = Array.from(cEntry.deliveriesMap.values());

        const cTasksDisplay = cTasksArr.length > 0
          ? cTasksArr.map(([id, tObj]) => tObj && tObj.name ? `${id} — ${tObj.name}` : id).join(', ')
          : 'Direct GUI Screen Component';
        const cDelsDisplay = cDelsArr.map(d => `${d.delIdStr} (${d.pdn || d.status})`).join(', ');
        const anyDelivered = cDelsArr.some(d => isDeliveredStatus(d.status));

        const cRow = traceWs.addRow({
          _spacer: '',
          traceId: `${cPrefix}-${String(cIdx + 1).padStart(2, '0')}`,
          entityName: `      ${cEntry.icon} ${cEntry.compName}`,
          entityType: `Component [${cEntry.layer}]`,
          moduleRelease: cDelsArr[0] ? cDelsArr[0].module : featRelease,
          statusBadge: anyDelivered ? '✓ Component Delivered' : '◐ In Progress',
          screenSummary: `Linked to Screen: ${se.screenName} ➔ Feature: ${fs.name}`,
          uniqueComps: cEntry.compName,
          linkedTasks: cTasksDisplay,
          contributingDels: cDelsDisplay
        });
        cRow.outlineLevel = 2;
        cRow.hidden = true; // Level 2 is collapsible
        styleHierarchyRow(cRow, 2, 'component', palette, traceCols.length);
        cRow.height = 19;

        const cIdCell = cRow.getCell('traceId');
        cIdCell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: palette.isDark ? 'FF93C5FD' : 'FF1D4ED8' } };
        cIdCell.alignment = { vertical: 'middle', horizontal: 'center' };
        cRow.getCell('entityType').alignment = { vertical: 'middle', horizontal: 'center' };
        cRow.getCell('statusBadge').alignment = { vertical: 'middle', horizontal: 'center' };

        // Hyperlink Linked Task to 'Tasks & Subtasks' if available
        if (cTasksArr.length > 0 && options?.taskRowMap) {
          const firstTaskId = cTasksArr[0][0];
          const taskRow = options.taskRowMap[firstTaskId];
          if (taskRow) {
            const tCell = cRow.getCell('linkedTasks');
            tCell.value = { text: `${cTasksDisplay} ↗`, hyperlink: `#'Tasks & Subtasks'!C${taskRow}` };
            tCell.font = { name: 'Segoe UI', size: 8.5, bold: true, underline: true, color: { argb: palette.isDark ? 'FF60A5FA' : 'FF2563EB' } };
          }
        }

        // Hyperlink Contributing Deliveries back to Sheet 1
        if (cDelsArr.length > 0) {
          const firstDelRow = deliveryRowMap.get(cDelsArr[0].delIdStr);
          if (firstDelRow) {
            const dCell = cRow.getCell('contributingDels');
            dCell.value = { text: `${cDelsDisplay} ↩`, hyperlink: `#'Deliveries'!B${firstDelRow}` };
            dCell.font = { name: 'Segoe UI', size: 8.5, bold: true, underline: true, color: { argb: palette.isDark ? 'FF60A5FA' : 'FF2563EB' } };
          }
        }
      });
    });
  });

  // Attach cross-sheet hyperlinks on Sheet 1 ('Deliveries')
  (options?.pendingFeatureLinks || []).forEach(item => {
    const targetRow = featureTraceRowMap.get(item.featName);
    if (targetRow && item.cell) {
      item.cell.value = { text: item.text, hyperlink: `#'${traceSheetName}'!B${targetRow}` };
      item.cell.font = { name: 'Segoe UI', size: 9.5, bold: true, underline: true, color: { argb: palette.isDark ? 'FFC4B5FD' : 'FF6D28D9' } };
    }
  });

  (options?.pendingScreenLinks || []).forEach(item => {
    const targetRow = screenTraceRowMap.get(item.screenName) || featureTraceRowMap.get(item.featName);
    if (targetRow && item.cell) {
      item.cell.value = { text: item.text, hyperlink: `#'${traceSheetName}'!B${targetRow}` };
      item.cell.font = { name: 'Segoe UI', size: 9, bold: true, underline: true, color: { argb: palette.isDark ? 'FF60A5FA' : 'FF2563EB' } };
    }
  });

  return traceWs;
}

// ─────────────────────────────────────────────────────────────
// BUILD DELIVERIES 2-SHEET ENTERPRISE WORKBOOK
// ─────────────────────────────────────────────────────────────
export function buildDeliveriesWorkbook(
  state: ProjectState,
  palette?: ExcelThemePalette
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse 2.0';
  wb.lastModifiedBy = 'ProjectPulse 2.0';
  wb.created = new Date();
  wb.modified = new Date();

  const pal = palette || getThemePalette(state);

  // Sheet 1: Deliveries
  const delBuild = buildDeliveriesSheet(wb, state, pal);

  // Sheet 2: Feature & Screen Traceability
  buildFeatureScreenTraceabilitySheet(wb, state, pal, delBuild.deliveryRowMap, {
    pendingFeatureLinks: delBuild.pendingFeatureLinks,
    pendingScreenLinks: delBuild.pendingScreenLinks,
    taskRowMap: (wb as any)._taskRowMap
  });

  return wb;
}

export async function exportDeliveriesExcel(state: ProjectState): Promise<string> {
  const wb = buildDeliveriesWorkbook(state);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `ProjectPulse_Deliveries_${(state.name || 'Project').replace(/[\/*?:"<>|\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return filename;
}


// ============================================================================
// 2. MASTER EXCEL WORKBOOK EXPORTER (High-End HTML Parity)
// ============================================================================

export const exportProjectExcel = async (state: ProjectState): Promise<string> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse 2.0';
  wb.lastModifiedBy = 'ProjectPulse 2.0';
  wb.created = new Date();
  wb.modified = new Date();

  const palette = getThemePalette(state);

  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalDels = (state.deliveries || []).length;
  const deployedDels = (state.deliveries || []).filter(d => d.status === 'Deployed').length;
  const delPct = totalDels ? Math.round((deployedDels / totalDels) * 100) : 0;
  const totalDefects = (state.defects || []).length;
  const activeDefects = (state.defects || []).filter(d => d.status !== 'Closed' && d.status !== 'Fixed').length;
  const critDefects = (state.defects || []).filter(d => d.severity?.includes('Blocker') || d.severity?.includes('S1')).length;
  const totalRaids = (state.raids || []).length;
  const critRaids = (state.raids || []).filter(r => r.impact === 'Critical' || r.impact === 'High').length;
  const totalMembers = (state.members || []).length;
  const activeDecisions = (state.decisions || []).filter(d => d.status === 'Approved').length;

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: EXECUTIVE DASHBOARD (Full Cockpit & Governance)
  // ─────────────────────────────────────────────────────────────
  buildExecutiveDashboardSheet(wb, state, palette);

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: UNIFIED TASKS & SUBTASKS (Hierarchical Outlines)
  // ─────────────────────────────────────────────────────────────
  buildUnifiedTasksSheet(wb, state, palette);

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: UNIFIED FEATURE ROLLOUTS (Release Milestones & Links)
  // ─────────────────────────────────────────────────────────────
  buildFeatureRolloutsSheet(wb, state, palette);

  // ─────────────────────────────────────────────────────────────
  // SHEET 4: TASKS MATRIX (With Cockpit Telemetry Banner & Formulas)
  // ─────────────────────────────────────────────────────────────
  const ts = wb.addWorksheet('Tasks', {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  ts.properties.tabColor = { argb: palette.emerald };

  const taskCols = [
    { header: 'ID', key: 'id', width: 14, bg: palette.navy },
    { header: 'Task Name', key: 'name', width: 38, bg: palette.navy },
    { header: 'Module', key: 'module', width: 22, bg: palette.indigo },
    { header: 'Category', key: 'category', width: 18, bg: palette.indigo },
    { header: 'Module Type', key: 'moduleType', width: 14, bg: palette.indigo },
    { header: 'Release', key: 'release', width: 16, bg: palette.indigo },
    { header: 'Dependencies', key: 'dependsOn', width: 22, bg: palette.indigo },
    { header: 'Assignee', key: 'assignee', width: 22, bg: palette.emerald },
    { header: 'Status', key: 'status', width: 18, bg: palette.emerald },
    { header: 'Priority', key: 'priority', width: 15, bg: palette.emerald },
    { header: 'Progress', key: 'progress', width: 14, bg: palette.emerald },
    { header: 'Start Date', key: 'startDate', width: 16, bg: palette.amber },
    { header: 'Due Date', key: 'dueDate', width: 16, bg: palette.amber },
    { header: 'Delay (d)', key: 'delay', width: 12, bg: palette.amber },
    { header: 'Act Completion', key: 'actCompletionDate', width: 18, bg: palette.amber },
    { header: 'Est Effort (d)', key: 'estDays', width: 15, bg: palette.rose },
    { header: 'Act Effort (d)', key: 'actDays', width: 15, bg: palette.rose },
    { header: 'Variance (d)', key: 'variance', width: 14, bg: palette.rose },
    { header: 'Screens', key: 'guiScreens', width: 25, bg: palette.slate },
    { header: 'Notes', key: 'notes', width: 35, bg: palette.slate }
  ];
  ts.columns = taskCols.map(c => ({ key: c.key, width: c.width }));

  // Cockpit Telemetry
  ts.getRow(1).height = 10;
  ts.mergeCells('A2:H2');
  ts.getRow(2).height = 20;
  const tsTitle = ts.getCell('A2');
  tsTitle.value = ' >> COCKPIT.TELEMETRY: TASK REGISTRY & WORK EXECUTION';
  tsTitle.font = { name: 'Courier New', size: 10, bold: true, color: { argb: palette.indigo } };
  tsTitle.alignment = { vertical: 'middle', indent: 1 };

  const estEff = state.tasks.reduce((sum, t) => sum + (Number(t.estDays) || 0), 0);
  const actEff = state.tasks.reduce((sum, t) => sum + (Number(t.actDays) || 0), 0);
  const overdueTasks = state.tasks.filter(t => t.dueDate && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate).getTime() < Date.now()).length;
  const blockedTasks = state.tasks.filter(t => t.status === TaskStatus.BLOCKED).length;

  drawTopKpiCard(ts, 1, 3, 3, 3, 'Delivery Progress', `${doneTasks} / ${totalTasks}`, `${taskPct}% complete`, palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ts, 5, 3, 3, 3, 'Effort Telemetry', `${estEff.toFixed(1)} / ${actEff.toFixed(1)} d`, 'Est vs Act Effort', palette.blue, { isDark: palette.isDark });
  drawTopKpiCard(ts, 9, 3, 3, 3, 'Schedule Health', `${overdueTasks} overdue`, `${blockedTasks} blocked items`, overdueTasks > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });

  ts.getRow(6).height = 10;

  // Header Row 7
  const tsHdr = ts.getRow(7);
  tsHdr.height = 30;
  taskCols.forEach((col, idx) => {
    const cell = tsHdr.getCell(idx + 1);
    cell.value = col.header;
    styleHeaderCell(cell, col.bg);
  });
  ts.autoFilter = { from: 'A7', to: `T${Math.max(8, state.tasks.length + 7)}` };

  // Task Data Rows
  state.tasks.forEach((t, i) => {
    const rowIdx = i + 8;
    const isOverdue = t.dueDate && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate).getTime() < Date.now();
    const row = ts.addRow({
      id: t.id,
      name: t.name,
      module: t.module,
      category: t.category || 'Feature',
      moduleType: t.moduleType || 'Server',
      release: t.release || 'v1.0.0',
      dependsOn: t.dependsOn?.join(', ') || '',
      assignee: t.assignee || 'Unassigned',
      status: t.status,
      priority: t.priority,
      progress: (t.progress || 0) / 100,
      startDate: parseExcelDate(t.startDate),
      dueDate: parseExcelDate(t.dueDate),
      delay: { formula: `IF(AND(I${rowIdx}<>"Completed", M${rowIdx}<TODAY(), M${rowIdx}<>""), TODAY()-M${rowIdx}, 0)` },
      actCompletionDate: parseExcelDate(t.actCompletionDate),
      estDays: t.estDays || 0,
      actDays: t.actDays || 0,
      variance: { formula: `Q${rowIdx}-P${rowIdx}` },
      guiScreens: t.guiScreens?.join(', ') || '',
      notes: t.notes || ''
    });

    row.height = 20;
    styleZebraRow(row, i, palette, taskCols.length);

    // Number formats & Highlights
    row.getCell('progress').numFmt = '0%';
    formatStatusCell(row.getCell('status'), t.status, palette);
    formatPriorityCell(row.getCell('priority'), t.priority, palette);

    if (isOverdue) {
      const delayCell = row.getCell('delay');
      delayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.isDark ? 'FF7F1D1D' : 'FFFEE2E2' } };
      delayCell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFDC2626' } };
    }
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: SUBTASKS (Child Checklist & Work Breakdown)
  // ─────────────────────────────────────────────────────────────
  const subs = wb.addWorksheet('Subtasks', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });
  subs.properties.tabColor = { argb: palette.teal };
  subs.columns = [
    { header: 'Subtask ID', key: 'id', width: 16 },
    { header: 'Parent Task ID', key: 'parentId', width: 16 },
    { header: 'Parent Task Name', key: 'parentName', width: 36 },
    { header: 'Subtask Title', key: 'name', width: 44 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Est Effort (d)', key: 'estDays', width: 14 }
  ];
  styleHeaderCell(subs.getRow(1).getCell(1), palette.navy);
  for (let c = 2; c <= 6; c++) styleHeaderCell(subs.getRow(1).getCell(c), palette.indigo);

  let subRowCounter = 0;
  state.tasks.forEach(t => {
    (t.subtasks || []).forEach(st => {
      subRowCounter++;
      const row = subs.addRow({
        id: st.id,
        parentId: t.id,
        parentName: t.name,
        name: st.name,
        status: st.done ? 'Completed' : 'Pending',
        estDays: st.estDays || 0.5
      });
      styleZebraRow(row, subRowCounter, palette, 6);
      formatStatusCell(row.getCell('status'), st.done ? 'Completed' : 'Pending', palette);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 6: DELIVERIES (ALM & PDN Release Workstation)
  // ─────────────────────────────────────────────────────────────
  const delBuild = buildDeliveriesSheet(wb, state, palette, { taskRowMap: (wb as any)._taskRowMap });

  // ─────────────────────────────────────────────────────────────
  // SHEET 7: FEATURE & SCREEN TRACEABILITY (3-Tier Deduplicated Rollup)
  // ─────────────────────────────────────────────────────────────
  buildFeatureScreenTraceabilitySheet(wb, state, palette, delBuild.deliveryRowMap, {
    pendingFeatureLinks: delBuild.pendingFeatureLinks,
    pendingScreenLinks: delBuild.pendingScreenLinks,
    taskRowMap: (wb as any)._taskRowMap
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 5: DEFECTS (Quality Assurance Workshop)
  // ─────────────────────────────────────────────────────────────
  const dfs = wb.addWorksheet('Defects', {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  dfs.properties.tabColor = { argb: palette.rose };

  const defCols = [
    { header: 'Defect ID', key: 'id', width: 14, bg: palette.navy },
    { header: 'Summary / Title', key: 'title', width: 44, bg: palette.navy },
    { header: 'Severity', key: 'severity', width: 16, bg: palette.rose },
    { header: 'Priority', key: 'priority', width: 14, bg: palette.rose },
    { header: 'Status', key: 'status', width: 16, bg: palette.emerald },
    { header: 'Assignee', key: 'assignee', width: 22, bg: palette.indigo },
    { header: 'Reporter', key: 'reporter', width: 20, bg: palette.indigo },
    { header: 'Linked Scope', key: 'linkedId', width: 18, bg: palette.indigo },
    { header: 'Type', key: 'type', width: 18, bg: palette.amber },
    { header: 'Description', key: 'desc', width: 45, bg: palette.slate },
    { header: 'Steps to Reproduce', key: 'steps', width: 45, bg: palette.slate }
  ];
  dfs.columns = defCols.map(c => ({ key: c.key, width: c.width }));

  dfs.getRow(1).height = 10;
  dfs.mergeCells('A2:H2');
  dfs.getRow(2).height = 20;
  const dfsTitle = dfs.getCell('A2');
  dfsTitle.value = ' >> COCKPIT.TELEMETRY: QUALITY ASSURANCE & DEFECT WORKSHOP';
  dfsTitle.font = { name: 'Courier New', size: 10, bold: true, color: { argb: palette.rose } };
  dfsTitle.alignment = { vertical: 'middle', indent: 1 };

  drawTopKpiCard(dfs, 1, 3, 3, 3, 'Defect Load', `${activeDefects} active`, `${totalDefects} total logged`, palette.rose, { isDark: palette.isDark });
  drawTopKpiCard(dfs, 5, 3, 3, 3, 'Resolution Rate', `${totalDefects - activeDefects} fixed`, 'Verified closures', palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(dfs, 9, 3, 3, 3, 'Blockers', `${critDefects} S1 Critical`, 'Production gating', critDefects > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });

  dfs.getRow(6).height = 10;

  const dfsHdr = dfs.getRow(7);
  dfsHdr.height = 30;
  defCols.forEach((col, idx) => {
    const cell = dfsHdr.getCell(idx + 1);
    cell.value = col.header;
    styleHeaderCell(cell, col.bg);
  });
  dfs.autoFilter = { from: 'A7', to: `K${Math.max(8, (state.defects || []).length + 7)}` };

  (state.defects || []).forEach((d, i) => {
    const row = dfs.addRow({
      id: d.id,
      title: d.title,
      severity: d.severity,
      priority: d.priority,
      status: d.status,
      assignee: d.assignee || 'Unassigned',
      reporter: d.reporter || 'QA Team',
      linkedId: d.linkedId || '',
      type: d.type,
      desc: d.desc,
      steps: d.steps || ''
    });

    row.height = 20;
    styleZebraRow(row, i, palette, defCols.length);
    formatPriorityCell(row.getCell('severity'), d.severity, palette);
    formatPriorityCell(row.getCell('priority'), d.priority, palette);
    formatStatusCell(row.getCell('status'), d.status, palette);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 6: RAID REGISTER
  // ─────────────────────────────────────────────────────────────
  const rs = wb.addWorksheet('RAID Items', { views: [{ state: 'frozen', ySplit: 1 }] });
  rs.properties.tabColor = { argb: palette.amber };
  rs.columns = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Type', key: 'type', width: 16 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Impact', key: 'impact', width: 14 },
    { header: 'Probability', key: 'probability', width: 14 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Owner', key: 'owner', width: 22 },
    { header: 'Due Date', key: 'dueDate', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Mitigation Plan', key: 'mitigation', width: 45 }
  ];
  styleHeaderCell(rs.getRow(1).getCell(1), palette.navy);
  for (let c = 2; c <= 10; c++) styleHeaderCell(rs.getRow(1).getCell(c), palette.amber);

  (state.raids || []).forEach((r, i) => {
    const row = rs.addRow({
      id: r.id,
      type: r.type,
      title: r.title,
      impact: r.impact,
      probability: r.probability || 'Medium',
      severity: r.severity || 'Medium',
      owner: r.owner,
      dueDate: parseExcelDate(r.dueDate),
      status: r.status,
      mitigation: r.mitigation
    });
    styleZebraRow(row, i, palette, 10);
    formatPriorityCell(row.getCell('impact'), r.impact, palette);
    formatStatusCell(row.getCell('status'), r.status, palette);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 7: DECISIONS (Architecture Decision Records)
  // ─────────────────────────────────────────────────────────────
  const decs = wb.addWorksheet('Decisions', { views: [{ state: 'frozen', ySplit: 1 }] });
  decs.properties.tabColor = { argb: palette.purple };
  decs.columns = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Impact', key: 'impact', width: 15 },
    { header: 'Approver', key: 'approver', width: 22 },
    { header: 'Proposed By', key: 'proposedBy', width: 22 },
    { header: 'Rationale & Architecture Driver', key: 'rationale', width: 45 },
    { header: 'Sign-off Date', key: 'dueDate', width: 16 }
  ];
  styleHeaderCell(decs.getRow(1).getCell(1), palette.navy);
  for (let c = 2; c <= 8; c++) styleHeaderCell(decs.getRow(1).getCell(c), palette.purple);

  (state.decisions || []).forEach((d, i) => {
    const row = decs.addRow({
      id: d.id,
      title: d.title,
      status: d.status,
      impact: d.impact,
      approver: d.approver,
      proposedBy: d.proposedBy,
      rationale: d.rationale,
      dueDate: parseExcelDate(d.dueDate)
    });
    styleZebraRow(row, i, palette, 8);
    formatStatusCell(row.getCell('status'), d.status, palette);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 8: TEAM MEMBERS
  // ─────────────────────────────────────────────────────────────
  const tms = wb.addWorksheet('Team Members', { views: [{ state: 'frozen', ySplit: 1 }] });
  tms.properties.tabColor = { argb: palette.blue };
  tms.columns = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Name', key: 'name', width: 26 },
    { header: 'Role', key: 'role', width: 26 },
    { header: 'Emp ID', key: 'empId', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Skills', key: 'skills', width: 36 }
  ];
  styleHeaderCell(tms.getRow(1).getCell(1), palette.navy);
  for (let c = 2; c <= 8; c++) styleHeaderCell(tms.getRow(1).getCell(c), palette.blue);

  (state.members || []).forEach((m, i) => {
    const skillsStr = Array.isArray(m.skills) ? m.skills.join(', ') : (m.skills || '');
    const row = tms.addRow({
      id: m.id,
      name: m.name,
      role: m.role || 'Member',
      empId: m.empId || '',
      status: m.status,
      email: m.email || '',
      location: m.location || '',
      skills: skillsStr
    });
    styleZebraRow(row, i, palette, 8);
    formatStatusCell(row.getCell('status'), m.status, palette);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 9: RELEASES & ROADMAP
  // ─────────────────────────────────────────────────────────────
  const rels = wb.addWorksheet('Releases', { views: [{ state: 'frozen', ySplit: 1 }] });
  rels.properties.tabColor = { argb: palette.amber };
  rels.columns = [
    { header: 'Version', key: 'version', width: 18 },
    { header: 'Release Title', key: 'title', width: 40 },
    { header: 'Target Deployment Date', key: 'targetDate', width: 22 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Tasks Count', key: 'taskCount', width: 16 },
    { header: 'Progress', key: 'progress', width: 16 }
  ];
  for (let c = 1; c <= 6; c++) styleHeaderCell(rels.getRow(1).getCell(c), palette.indigo);

  (state.releases || []).forEach((r, i) => {
    const relName = r.name || (r as any).version || `v${i + 1}.0.0`;
    const rTasks = state.tasks.filter(t => t.release === relName || t.release === (r as any).version);
    const rDone = rTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const pct = rTasks.length ? Math.round((rDone / rTasks.length) * 100) : 0;
    const row = rels.addRow({
      version: relName,
      title: (r as any).title || relName,
      targetDate: r.date || (r as any).targetDate || '',
      status: r.status,
      taskCount: rTasks.length,
      progress: `${pct}%`
    });
    styleZebraRow(row, i, palette, 6);
    formatStatusCell(row.getCell('status'), r.status, palette);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 10: FEATURES MATRIX
  // ─────────────────────────────────────────────────────────────
  const fts = wb.addWorksheet('Features', { views: [{ state: 'frozen', ySplit: 1 }] });
  fts.properties.tabColor = { argb: palette.teal };
  fts.columns = [
    { header: 'Feature Name', key: 'name', width: 36 },
    { header: 'Description', key: 'desc', width: 45 },
    { header: 'GUI Screens', key: 'screens', width: 35 }
  ];
  for (let c = 1; c <= 3; c++) styleHeaderCell(fts.getRow(1).getCell(c), palette.teal);

  (state.features || []).forEach((f, i) => {
    const row = fts.addRow({
      name: f.name,
      desc: f.desc || '',
      screens: Array.isArray(f.screens) ? f.screens.join(', ') : (f.screens || '')
    });
    styleZebraRow(row, i, palette, 3);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 11: ACTIVITY LOGS
  // ─────────────────────────────────────────────────────────────
  const ls = wb.addWorksheet('Activity Logs', { views: [{ state: 'frozen', ySplit: 1 }] });
  ls.properties.tabColor = { argb: palette.slate };
  ls.columns = [
    { header: 'Timestamp', key: 'ts', width: 22 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Task ID', key: 'taskId', width: 14 },
    { header: 'Task Name', key: 'taskName', width: 38 },
    { header: 'Modified Field', key: 'field', width: 18 },
    { header: 'Old Value', key: 'oldVal', width: 18 },
    { header: 'New Value', key: 'newVal', width: 18 },
    { header: 'Comment', key: 'comment', width: 40 }
  ];
  for (let c = 1; c <= 9; c++) styleHeaderCell(ls.getRow(1).getCell(c), palette.slate);

  (state.log || []).slice(0, 500).forEach((l, i) => {
    const row = ls.addRow({
      ts: l.ts,
      action: l.action,
      assignee: l.assignee,
      taskId: l.taskId,
      taskName: l.taskName,
      field: l.field,
      oldVal: l.oldVal,
      newVal: l.newVal,
      comment: l.comment
    });
    styleZebraRow(row, i, palette, 9);
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 12: DATA DICTIONARY & README
  // ─────────────────────────────────────────────────────────────
  const dict = wb.addWorksheet('Data Dictionary', { views: [{ state: 'frozen', ySplit: 1 }] });
  dict.properties.tabColor = { argb: palette.navy };
  dict.columns = [
    { header: 'Canonical Sheet', key: 'sheet', width: 20 },
    { header: 'Attribute Name', key: 'attr', width: 24 },
    { header: 'Data Type', key: 'type', width: 16 },
    { header: 'Required', key: 'req', width: 12 },
    { header: 'Description & Enterprise Semantics', key: 'desc', width: 50 }
  ];
  for (let c = 1; c <= 5; c++) styleHeaderCell(dict.getRow(1).getCell(c), palette.navy);

  const dictItems = [
    { sheet: 'Tasks', attr: 'id', type: 'String (TASK-XXX)', req: 'Yes', desc: 'Unique persistent task identifier' },
    { sheet: 'Tasks', attr: 'name', type: 'String', req: 'Yes', desc: 'Task summary / title' },
    { sheet: 'Tasks', attr: 'status', type: 'TaskStatus Enum', req: 'Yes', desc: 'Completed, In Progress, Blocked, On Hold, Not Started' },
    { sheet: 'Tasks', attr: 'dueDate', type: 'Date (YYYY-MM-DD)', req: 'No', desc: 'Target completion deadline' },
    { sheet: 'Deliveries', attr: 'almId', type: 'String (ALM-XXXXX)', req: 'Yes', desc: 'Defect or feature ticket identifier in enterprise ALM' },
    { sheet: 'Deliveries', attr: 'pdn', type: 'String (PDN-XXXX)', req: 'Yes', desc: 'Production Deployment Notice reference code' },
    { sheet: 'Deliveries', attr: 'status', type: 'DeliveryStatus', req: 'Yes', desc: 'Scheduled, Ready for Deployment, Deployed, Rolled Back' },
    { sheet: 'Team Members', attr: 'empId', type: 'String', req: 'No', desc: 'Enterprise employee badge code (e.g. 671172)' },
    { sheet: 'Defects', attr: 'severity', type: 'Severity Enum', req: 'Yes', desc: 'S1 - Blocker, S2 - High, S3 - Medium, S4 - Low' }
  ];

  dictItems.forEach((d, i) => {
    const row = dict.addRow(d);
    styleZebraRow(row, i, palette, 5);
  });

  // Write and download
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `ProjectPulse_${(state.name || 'Project').replace(/[\\\/*?:"<>|\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return filename;
};

// Helper: Simple RFC 4180 compliant CSV parser into an ExcelJS worksheet
const parseCsvIntoWorksheet = (csvText: string, ws: ExcelJS.Worksheet) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (ch === '\r') {
        // ignore CR
      } else if (ch === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += ch;
      }
    }
  }

  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }

  rows.forEach(r => ws.addRow(r));
};

// ============================================================================
// 3. RESILIENT SMART WORKBOOK IMPORTER (Schema & Alias Aware)
// ============================================================================

export const importProjectExcel = async (
  fileOrBuffer: File | Blob | ArrayBuffer
): Promise<Partial<ProjectState>> => {
  const wb = new ExcelJS.Workbook();
  let buffer: ArrayBuffer;

  if (fileOrBuffer instanceof ArrayBuffer) {
    buffer = fileOrBuffer;
  } else if (typeof (fileOrBuffer as any).arrayBuffer === 'function') {
    buffer = await (fileOrBuffer as Blob).arrayBuffer();
  } else {
    buffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(fileOrBuffer as Blob);
    });
  }

  // Detect if buffer is a zip archive (.xlsx) or plaintext (.csv)
  const firstBytes = new Uint8Array(buffer.slice(0, 4));
  const isZip = firstBytes[0] === 0x50 && firstBytes[1] === 0x4B && firstBytes[2] === 0x03 && firstBytes[3] === 0x04;

  if (isZip) {
    try {
      await wb.xlsx.load(buffer);
    } catch {
      const text = new TextDecoder('utf-8').decode(buffer);
      const ws = wb.addWorksheet('Sheet1');
      parseCsvIntoWorksheet(text, ws);
    }
  } else {
    const text = new TextDecoder('utf-8').decode(buffer);
    const ws = wb.addWorksheet('Sheet1');
    parseCsvIntoWorksheet(text, ws);
  }

  // Helper: Find sheet by canonical name or common synonyms
  const findSheet = (names: string[]): ExcelJS.Worksheet | undefined => {
    for (const n of names) {
      const ws = wb.getWorksheet(n);
      if (ws) return ws;
      // Case-insensitive search
      const lower = n.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = wb.worksheets.find(w => w.name.toLowerCase().replace(/[^a-z0-9]/g, '') === lower);
      if (match) return match;
    }
    // If the workbook has only one sheet, match against it
    if (wb.worksheets.length === 1) {
      return wb.worksheets[0];
    }
    return undefined;
  };

  // Helper: Read tabular data from a sheet with dynamic header detection
  const readTable = (
    sheetNames: string[],
    fieldSynonyms: Record<string, string[]>
  ): Record<string, any>[] => {
    const ws = findSheet(sheetNames);
    if (!ws) return [];

    // Reverse synonym map for instant lookup
    const revMap: Record<string, string> = {};
    Object.entries(fieldSynonyms).forEach(([canonicalKey, aliases]) => {
      aliases.forEach(alias => {
        revMap[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = canonicalKey;
      });
      revMap[canonicalKey.toLowerCase().replace(/[^a-z0-9]/g, '')] = canonicalKey;
    });

    // 1. Scan rows 1 through 10 to find where headers are
    let headerRowIdx = 1;
    let maxMatchedHeaders = 0;

    for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
      let matchedCount = 0;
      ws.getRow(r).eachCell({ includeEmpty: false }, (cell) => {
        const text = cleanText(cell.value).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (text && revMap[text]) matchedCount++;
      });
      if (matchedCount > maxMatchedHeaders) {
        maxMatchedHeaders = matchedCount;
        headerRowIdx = r;
      }
    }

    // 2. Map column indices to canonical keys
    const colToKey: Record<number, string> = {};
    ws.getRow(headerRowIdx).eachCell({ includeEmpty: false }, (cell, colIdx) => {
      const text = cleanText(cell.value).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (text && revMap[text]) {
        colToKey[colIdx] = revMap[text];
      }
    });

    // 3. Extract data rows
    const results: Record<string, any>[] = [];
    ws.eachRow((row, rowIdx) => {
      if (rowIdx <= headerRowIdx) return;
      if (row.outlineLevel && row.outlineLevel > 0) return; // Skip outline sub-rows

      const item: Record<string, any> = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
        const key = colToKey[colIdx];
        if (!key) return;

        let val: any = cell.value;
        if (val && typeof val === 'object' && val.result !== undefined) {
          val = val.result;
        }

        const cleaned = cleanText(val);
        if (cleaned !== '') hasData = true;
        item[key] = cleaned;
      });

      if (hasData) {
        results.push(item);
      }
    });

    return results;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. PARSE TASKS
  // ─────────────────────────────────────────────────────────────
  const rawTasks = readTable(['Tasks', 'Task Matrix', 'Tasks Matrix', 'Work Execution'], {
    id: ['taskid', 'id', 'itemid', 'key', 'code', 'ticket'],
    name: ['taskname', 'name', 'title', 'summary', 'description', 'task'],
    module: ['module', 'domain', 'subsystem', 'layer'],
    category: ['category', 'type', 'kind'],
    moduleType: ['moduletype', 'layer', 'tier'],
    release: ['release', 'releaseversion', 'version', 'targetrelease'],
    dependsOn: ['dependson', 'dependencies', 'predecessors', 'blockers'],
    assignee: ['assignee', 'owner', 'assignedto', 'developer'],
    status: ['status', 'taskstatus', 'state'],
    priority: ['priority', 'severity', 'urgency'],
    progress: ['progress', 'percentcomplete', 'pctcomplete', 'completion'],
    startDate: ['startdate', 'start', 'commencement'],
    dueDate: ['duedate', 'due', 'deadline', 'targetdate'],
    actCompletionDate: ['actcompletiondate', 'actualcompletiondate', 'completeddate', 'actualdate'],
    estDays: ['estdays', 'esteffort', 'estimatedeffort', 'estimateddays', 'effort', 'estimate'],
    actDays: ['actdays', 'acteffort', 'actualeffort', 'actualdays'],
    guiScreens: ['guiscreens', 'screens', 'artifacts', 'sitemap'],
    notes: ['notes', 'comments', 'remarks'],
    subtasks: ['subtasks', 'checklist', 'subtasklist']
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PARSE SUBTASKS
  // ─────────────────────────────────────────────────────────────
  const rawSubtasks = readTable(['Subtasks', 'Subtask', 'Checklist'], {
    id: ['subtaskid', 'id', 'key'],
    parentId: ['parentid', 'taskid', 'parenttaskid', 'parent'],
    name: ['name', 'title', 'subtasktitle', 'subtaskname'],
    status: ['status', 'state', 'done', 'completed'],
    estDays: ['estdays', 'esteffort', 'effort', 'estimate']
  });

  const subtasksByParent: Record<string, any[]> = {};
  rawSubtasks.forEach(st => {
    if (!st.parentId) return;
    if (!subtasksByParent[st.parentId]) subtasksByParent[st.parentId] = [];
    subtasksByParent[st.parentId].push({
      id: st.id || `SUB-${subtasksByParent[st.parentId].length + 1}`,
      name: st.name || 'Untitled Checklist Item',
      done: /completed|done|true|yes|1/i.test(String(st.status || '')),
      estDays: parseFloat(st.estDays) || 0.5
    });
  });

  const tasks: Task[] = rawTasks.map((t, idx) => {
    const taskId = t.id || `TASK-${String(idx + 1).padStart(3, '0')}`;
    let subtaskList = subtasksByParent[taskId] || [];

    if (t.subtasks && subtaskList.length === 0) {
      try {
        if (typeof t.subtasks === 'string' && t.subtasks.trim().startsWith('[')) {
          subtaskList = JSON.parse(t.subtasks);
        }
      } catch {
        subtaskList = [];
      }
    }

    const rawProg = String(t.progress || '').replace('%', '').trim();
    const progressNum = parseFloat(rawProg);
    const normalizedProg = !isNaN(progressNum) ? Math.min(100, Math.max(0, progressNum > 1 ? Math.round(progressNum) : Math.round(progressNum * 100))) : 0;

    return {
      id: taskId,
      name: t.name || `Task ${idx + 1}`,
      status: (t.status as TaskStatus) || TaskStatus.NOT_STARTED,
      priority: (t.priority as TaskPriority) || TaskPriority.MEDIUM,
      assignee: t.assignee || 'Unassigned',
      dueDate: parseExcelDate(t.dueDate),
      progress: normalizedProg,
      module: t.module || 'General',
      dependsOn: t.dependsOn ? String(t.dependsOn).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      estDays: parseFloat(t.estDays) || 1,
      actDays: parseFloat(t.actDays) || 0,
      category: t.category || 'Feature',
      moduleType: t.moduleType || 'Server',
      release: t.release || 'v1.0.0',
      startDate: parseExcelDate(t.startDate) || new Date().toISOString().split('T')[0],
      actCompletionDate: parseExcelDate(t.actCompletionDate) || undefined,
      guiScreens: t.guiScreens ? String(t.guiScreens).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      notes: t.notes || '',
      subtasks: subtaskList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PARSE DELIVERIES
  // ─────────────────────────────────────────────────────────────
  const rawDeliveries = readTable(['Deliveries', 'ALM Deliveries', 'Deployments', 'Deliveries Registry'], {
    id: ['deliveryid', 'id', 'delid'],
    almId: ['almid', 'defectidalmid', 'defectid', 'ticket', 'workitemid', 'issueid'],
    name: ['name', 'descriptionalmdescription', 'deliveryscopename', 'deliveryname', 'description', 'title', 'scope', 'summary'],
    pdn: ['pdn', 'pdninfo', 'pdnnumber', 'pdnid', 'deploymentnotice'],
    pdnProcessingDate: ['pdnprocessingdate', 'processingdate', 'processeddate', 'pdndate'],
    componentsDelivered: ['componentsdelivered', 'deliveredcomponents', 'components', 'artifacts'],
    category: ['category', 'deliverycategory', 'type'],
    module: ['module', 'deliverymodule'],
    moduleType: ['moduletype', 'tier', 'layer'],
    releaseVersion: ['releaseversion', 'release', 'version'],
    environment: ['environment', 'env', 'targetenvironment'],
    almStatus: ['almstatus', 'statusalm', 'defectstatus'],
    status: ['status', 'deliverystatus', 'deploymentstatus'],
    signOffStatus: ['signoffstatus', 'signoff', 'approvalstatus'],
    approver: ['approver', 'approvedby', 'lead'],
    smokeTestStatus: ['smoketeststatus', 'smoketest', 'smokegate'],
    reportedBy: ['reportedby', 'reporter'],
    fixedBy: ['fixedby', 'developer', 'defectfixedby'],
    targetDeliveryDate: ['targetdeliverydate', 'targetdate', 'planneddeliverydate'],
    actualDeliveryDate: ['actualdeliverydate', 'actualdate', 'deployeddate'],
    leadTimeDays: ['leadtimedays', 'leadtime', 'cycleduration'],
    variance: ['variance', 'delayvariance'],
    linkedType: ['linkedtype'],
    linkedId: ['linkedid'],
    linkedTasks: ['linkedtasks', 'tasks'],
    linkedScreens: ['linkedscreens', 'screens'],
    rollbackPlan: ['rollbackplan', 'rollback'],
    notes: ['notes', 'comments', 'remarks']
  });

  const deliveries: Delivery[] = rawDeliveries.map((d, idx) => ({
    id: d.id || `DEL-${String(idx + 1).padStart(3, '0')}`,
    almId: d.almId || `ALM-${10000 + idx + 1}`,
    name: d.name || `Delivery Package ${idx + 1}`,
    pdn: d.pdn || `PDN-2026-${String(idx + 1).padStart(3, '0')}`,
    pdnProcessingDate: parseExcelDate(d.pdnProcessingDate),
    componentsDelivered: d.componentsDelivered || '',
    category: d.category || 'GSP++ Delivery',
    module: d.module || 'General',
    moduleType: d.moduleType || 'Server',
    releaseVersion: d.releaseVersion || 'v1.0.0',
    environment: d.environment || 'QA',
    almStatus: d.almStatus || 'New',
    status: d.status || 'Scheduled',
    signOffStatus: d.signOffStatus || 'Pending',
    approver: d.approver || 'Pending',
    smokeTestStatus: d.smokeTestStatus || 'Not Run',
    reportedBy: d.reportedBy || 'Release Team',
    fixedBy: d.fixedBy || 'Delivery Team',
    targetDeliveryDate: parseExcelDate(d.targetDeliveryDate) || new Date().toISOString().split('T')[0],
    actualDeliveryDate: parseExcelDate(d.actualDeliveryDate) || null,
    leadTimeDays: parseFloat(d.leadTimeDays) || 0,
    variance: parseFloat(d.variance) || 0,
    linkedType: (d.linkedType as any) || 'None',
    linkedId: d.linkedId || '',
    linkedTasks: d.linkedTasks ? String(d.linkedTasks).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    linkedScreens: d.linkedScreens ? String(d.linkedScreens).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    rollbackPlan: d.rollbackPlan || '',
    notes: d.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // ─────────────────────────────────────────────────────────────
  // 4. PARSE DEFECTS
  // ─────────────────────────────────────────────────────────────
  const rawDefects = readTable(['Defects', 'Defect Workshop', 'Defects Registry'], {
    id: ['defectid', 'id', 'ticket'],
    title: ['title', 'summary', 'defecttitle', 'name'],
    severity: ['severity', 'sev'],
    priority: ['priority', 'pri'],
    status: ['status', 'state'],
    assignee: ['assignee', 'owner', 'assignedto'],
    reporter: ['reporter', 'reportedby'],
    linkedId: ['linkedid', 'linkedtask', 'taskid'],
    type: ['type', 'defecttype', 'category'],
    desc: ['desc', 'description', 'details'],
    steps: ['steps', 'stepstoreproduce', 'reproductionsteps']
  });

  const defects: Defect[] = rawDefects.map((df, idx) => ({
    id: df.id || `DEF-${String(idx + 1).padStart(3, '0')}`,
    title: df.title || `Defect ${idx + 1}`,
    severity: df.severity || 'S3 - Medium',
    priority: df.priority || 'Medium',
    status: df.status || 'New',
    assignee: df.assignee || 'Unassigned',
    reporter: df.reporter || 'QA Team',
    linkedType: 'Task',
    linkedId: df.linkedId || '',
    type: df.type || 'Functional Bug',
    desc: df.desc || '',
    steps: df.steps || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // ─────────────────────────────────────────────────────────────
  // 5. PARSE RAID ITEMS
  // ─────────────────────────────────────────────────────────────
  const rawRaids = readTable(['RAID Items', 'RAID', 'RAID_Register', 'Risks'], {
    id: ['id', 'raidid'],
    type: ['type', 'raidtype'],
    title: ['title', 'name', 'summary'],
    impact: ['impact', 'impactlevel'],
    probability: ['probability', 'likelihood'],
    severity: ['severity'],
    owner: ['owner', 'assignee'],
    dueDate: ['duedate', 'targetdate'],
    status: ['status', 'state'],
    mitigation: ['mitigation', 'mitigationplan', 'action']
  });

  const raids: RaidItem[] = rawRaids.map((r, idx) => ({
    id: r.id || `RAID-${String(idx + 1).padStart(3, '0')}`,
    type: (r.type as any) || 'Risk',
    title: r.title || `Risk Item ${idx + 1}`,
    desc: r.desc || '',
    impact: (r.impact as any) || 'Medium',
    probability: (r.probability as any) || 'Medium',
    severity: (r.severity as any) || 'Medium',
    owner: r.owner || 'Unassigned',
    dueDate: parseExcelDate(r.dueDate),
    status: (r.status as any) || 'Active',
    mitigation: r.mitigation || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // ─────────────────────────────────────────────────────────────
  // 6. PARSE DECISIONS
  // ─────────────────────────────────────────────────────────────
  const rawDecisions = readTable(['Decisions', 'Decision Log', 'Decision_Log'], {
    id: ['id', 'decisionid'],
    title: ['title', 'name', 'summary'],
    status: ['status', 'state'],
    impact: ['impact'],
    approver: ['approver', 'signoff'],
    proposedBy: ['proposedby', 'author'],
    rationale: ['rationale', 'driver', 'desc', 'description'],
    dueDate: ['duedate', 'signoffdate', 'date']
  });

  const decisions: Decision[] = rawDecisions.map((d, idx) => ({
    id: d.id || `DEC-${String(idx + 1).padStart(3, '0')}`,
    title: d.title || `Decision ${idx + 1}`,
    desc: d.desc || d.rationale || '',
    status: (d.status as any) || 'Pending Sign-off',
    impact: (d.impact as any) || 'Medium',
    approver: d.approver || 'Lead Architect',
    proposedBy: d.proposedBy || 'Engineering Team',
    rationale: d.rationale || '',
    dueDate: parseExcelDate(d.dueDate) || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // ─────────────────────────────────────────────────────────────
  // 7. PARSE TEAM MEMBERS (With Employee ID extraction)
  // ─────────────────────────────────────────────────────────────
  const rawMembers = readTable(['Team Members', 'Team', 'Roster', 'Members'], {
    id: ['id', 'memberid'],
    name: ['name', 'membername', 'resource'],
    role: ['role', 'title', 'position'],
    empId: ['empid', 'employeeid', 'badgeid', 'staffid', 'eid', 'badge'],
    status: ['status', 'availability'],
    email: ['email', 'mail'],
    location: ['location', 'city', 'office'],
    skills: ['skills', 'competencies']
  });

  const members: Member[] = rawMembers.map((m, idx) => {
    let name = m.name || `Engineer ${idx + 1}`;
    let empId = m.empId || '';

    // Auto-extract Employee ID if embedded in name e.g. "Sarah Chen (671172)"
    const match = name.match(/^(.*?)\s*\((\d+|[A-Za-z0-9_-]{3,})\)$/);
    if (match) {
      name = match[1].trim();
      if (!empId) empId = match[2].trim();
    }

    let skills: string[] = [];
    if (Array.isArray(m.skills)) skills = m.skills;
    else if (typeof m.skills === 'string') {
      try {
        if (m.skills.trim().startsWith('[')) skills = JSON.parse(m.skills);
        else skills = m.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {
        skills = m.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    return {
      id: m.id || `MEM-${String(idx + 1).padStart(3, '0')}`,
      name,
      role: m.role || 'Software Engineer',
      empId,
      status: (m.status as any) || 'Active',
      email: m.email || '',
      phone: '',
      birthday: '',
      location: m.location || '',
      skills,
      plannedLeaves: []
    };
  });

  // ─────────────────────────────────────────────────────────────
  // 8. PARSE RELEASES & FEATURES
  // ─────────────────────────────────────────────────────────────
  const rawReleases = readTable(['Releases', 'Roadmap', 'Config_Releases'], {
    id: ['id', 'releaseid'],
    version: ['version', 'release', 'releaseversion'],
    title: ['title', 'name', 'releasetitle'],
    targetDate: ['targetdate', 'date', 'deadline'],
    startDate: ['startdate', 'start'],
    status: ['status', 'state']
  });

  const releases: Release[] = rawReleases.map((r, idx) => {
    const relName = r.title || r.name || r.version || `Release ${idx + 1}`;
    let relStatus: 'Planned' | 'Active' | 'Released' = 'Planned';
    const s = String(r.status || '').toLowerCase();
    if (s.includes('active') || s.includes('progress') || s.includes('current')) relStatus = 'Active';
    else if (s.includes('release') || s.includes('complete') || s.includes('done')) relStatus = 'Released';

    return {
      id: r.id || `REL-${String(idx + 1).padStart(3, '0')}`,
      name: relName,
      startDate: parseExcelDate(r.startDate) || undefined,
      date: parseExcelDate(r.targetDate || r.date) || new Date().toISOString().split('T')[0],
      status: relStatus
    };
  });

  const rawFeatures = readTable(['Features', 'Feature Matrix', 'Functional Matrix'], {
    name: ['name', 'featurename', 'title'],
    desc: ['desc', 'description'],
    screens: ['screens', 'guiscreens', 'artifacts']
  });

  const features: Feature[] = rawFeatures.map(f => ({
    name: f.name || 'Core Feature',
    desc: f.desc || '',
    screens: f.screens ? String(f.screens).split(',').map((s: string) => s.trim()).filter(Boolean) : []
  }));

  // ─────────────────────────────────────────────────────────────
  // 9. PARSE PROJECT METADATA (Name & Description)
  // ─────────────────────────────────────────────────────────────
  let projectName = '';
  let projectDesc = '';
  const dashSheet = findSheet(['Executive Dashboard', 'Dashboard', 'Overview', 'App_State', 'Config']);
  if (dashSheet) {
    dashSheet.eachRow((row) => {
      const c1 = cleanText(row.getCell(1).value).toLowerCase();
      const c2 = cleanText(row.getCell(2).value);
      if (c1.includes('project name') && c2) projectName = c2;
      if (c1.includes('description') && c2) projectDesc = c2;
      
      const subVal = cleanText(row.getCell(2).value);
      if (subVal.startsWith('Project Portfolio:')) {
        const parts = subVal.split('•')[0].replace('Project Portfolio:', '').trim();
        if (parts && !projectName) projectName = parts;
      }
    });
  }

  if (!projectName && (tasks.length > 0 || deliveries.length > 0)) {
    projectName = 'Project Titan: Global Cloud Banking Platform';
  }
  if (!projectDesc && (tasks.length > 0 || deliveries.length > 0)) {
    projectDesc = 'Core Enterprise Cloud Architecture & ALM Suite';
  }

  // Reconstructed State Assembly
  const reconstructed: Partial<ProjectState> = {};
  if (projectName) reconstructed.name = projectName;
  if (projectDesc) reconstructed.desc = projectDesc;
  if (tasks.length > 0) reconstructed.tasks = tasks;
  if (deliveries.length > 0) reconstructed.deliveries = deliveries;
  if (defects.length > 0) reconstructed.defects = defects;
  if (raids.length > 0) reconstructed.raids = raids;
  if (decisions.length > 0) reconstructed.decisions = decisions;
  if (members.length > 0) reconstructed.members = members;
  if (releases.length > 0) reconstructed.releases = releases;
  if (features.length > 0) reconstructed.features = features;

  return reconstructed;
};

// ============================================================================
// 4. STANDALONE DELIVERIES EXCEL/CSV IMPORTER
// ============================================================================

export const importDeliveriesFromExcel = async (
  fileOrBuffer: File | Blob | ArrayBuffer,
  existingDeliveries: Delivery[] = []
): Promise<Delivery[]> => {
  const parsed = await importProjectExcel(fileOrBuffer);
  const importedDels = parsed.deliveries || [];

  if (importedDels.length === 0) {
    throw new Error('No valid deliveries or deliverables found in the uploaded file.');
  }

  // Merge with existing deliveries based on almId or delivery id
  const existingMap = new Map<string, Delivery>();
  existingDeliveries.forEach(d => {
    existingMap.set(d.id, d);
    if (d.almId) existingMap.set(d.almId, d);
  });

  const merged: Delivery[] = [...existingDeliveries];

  importedDels.forEach(newDel => {
    const existingById = existingMap.get(newDel.id);
    const existingByAlm = newDel.almId ? existingMap.get(newDel.almId) : undefined;
    const target = existingById || existingByAlm;

    if (target) {
      // Update existing
      const idx = merged.findIndex(d => d.id === target.id);
      if (idx !== -1) {
        merged[idx] = { ...target, ...newDel, updatedAt: new Date().toISOString() };
      }
    } else {
      // Append new
      merged.push(newDel);
    }
  });

  return merged;
};

// ============================================================================
// 5. DELIVERIES 12-COLUMN EXCEL TEMPLATE GENERATOR
// ============================================================================

export const downloadDeliveryTemplate = async (stateOrTheme?: ProjectState | string): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  const palette = getThemePalette(stateOrTheme);
  const ws = wb.addWorksheet('Deliveries_Template');
  ws.properties.tabColor = { argb: palette.indigo };
  
  ws.columns = [
    { header: 'Defect ID - ALM ID', key: 'almId', width: 22 },
    { header: 'Description - ALM Description', key: 'name', width: 44 },
    { header: 'PDN Info', key: 'pdn', width: 18 },
    { header: 'PDN Processing Date', key: 'pdnProcessingDate', width: 22 },
    { header: 'Components Delivered', key: 'componentsDelivered', width: 38 },
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'ALM Status', key: 'almStatus', width: 18 },
    { header: 'Reported By', key: 'reportedBy', width: 20 },
    { header: 'Defect Fixed By', key: 'fixedBy', width: 20 },
    { header: 'Linked Type', key: 'linkedType', width: 16 },
    { header: 'Linked ID', key: 'linkedId', width: 24 }
  ];

  ws.getRow(1).height = 30;
  const isDarkHdr = isColorDark(palette.indigo);
  ws.getRow(1).eachCell(c => {
    c.font = { bold: true, color: { argb: isDarkHdr ? 'FFFFFFFF' : 'FF0F172A' }, size: 10, name: 'Segoe UI' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.indigo } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top: { style: 'thin', color: { argb: palette.border } }, bottom: { style: 'medium', color: { argb: palette.divider } } };
  });

  // Add sample demonstration row
  const sampleRow = ws.addRow({
    almId: 'ALM-1001',
    name: 'Fix high latency in core checkout payment gateway',
    pdn: 'PDN-2026-08',
    pdnProcessingDate: new Date().toISOString().split('T')[0],
    componentsDelivered: 'CheckoutController.java, payment-api.jar, v2.1_migration.sql',
    category: 'GSP++ Delivery',
    module: 'Checkout & Payments',
    almStatus: 'Fixed',
    reportedBy: 'QA Lead',
    fixedBy: 'Lead Engineer',
    linkedType: 'Task',
    linkedId: 'TASK-001'
  });
  sampleRow.height = 20;
  styleZebraRow(sampleRow, 0, palette, 12);
  formatStatusCell(sampleRow.getCell('almStatus'), 'Fixed', palette);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ProjectPulse_Deliveries_Template_12Cols.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
