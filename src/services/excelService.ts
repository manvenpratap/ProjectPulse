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
}

export function getThemePalette(): ExcelThemePalette {
  let isDark = true;
  let primaryHex = '4338CA';
  let bgHex = '0F172A';
  let surfaceHex = '1E293B';
  let textHex = 'F8FAFC';

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const computed = window.getComputedStyle(document.documentElement);
      const cssBg = computed.getPropertyValue('--color-bg').trim();
      const cssPrimary = computed.getPropertyValue('--color-primary-hex').trim();
      const cssSurface = computed.getPropertyValue('--color-surface').trim();
      const cssText = computed.getPropertyValue('--color-text').trim();

      if (cssBg) bgHex = cssBg.replace('#', '');
      if (cssPrimary) primaryHex = cssPrimary.replace('#', '');
      if (cssSurface) surfaceHex = cssSurface.replace('#', '');
      if (cssText) textHex = cssText.replace('#', '');

      const colorMode = document.documentElement.getAttribute('data-color-mode');
      if (colorMode === 'light') isDark = false;
      else if (colorMode === 'dark') isDark = true;
      else {
        const r = parseInt(bgHex.slice(0, 2), 16) || 15;
        const g = parseInt(bgHex.slice(2, 4), 16) || 23;
        const b = parseInt(bgHex.slice(4, 6), 16) || 42;
        isDark = (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140;
      }
    } catch {
      // Keep defaults
    }
  }

  return {
    navy: 'FF0F172A',
    indigo: `FF${primaryHex.padStart(6, '4338CA')}`,
    primaryHover: `FF${primaryHex.padStart(6, '4338CA')}`,
    slate: 'FF64748B',
    emerald: 'FF10B981',
    rose: 'FFF43F5E',
    header: isDark ? 'FF1E293B' : 'FFF8FAFC',
    input: `FF${primaryHex.padStart(6, '4338CA')}`,
    amber: 'FFF59E0B',
    blue: 'FF3B82F6',
    purple: 'FF8B5CF6',
    teal: 'FF0D9488',
    bg: `FF${bgHex.padStart(6, '0F172A')}`,
    surface: `FF${surfaceHex.padStart(6, '1E293B')}`,
    surfaceAlt: isDark ? 'FF273245' : 'FFF1F5F9',
    divider: isDark ? 'FF334155' : 'FFE2E8F0',
    border: isDark ? 'FF334155' : 'FFE2E8F0',
    muted: isDark ? 'FF94A3B8' : 'FF64748B',
    textDark: isDark ? 'FFFFFFFF' : 'FF0F172A',
    isDark
  };
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
  const labelColor = opts.labelColor || 'FF64748B';
  const valueColor = opts.valueColor || accentColor;
  const subColor = opts.subColor || 'FF64748B';

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
  textArgb = 'FFFFFFFF', 
  bdrBottom = 'FF0F172A'
) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: textArgb } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    bottom: { style: 'medium', color: { argb: bdrBottom } },
    top: { style: 'thin', color: { argb: 'FF334155' } },
    left: { style: 'hair', color: { argb: 'FF334155' } },
    right: { style: 'hair', color: { argb: 'FF334155' } }
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
// 2. MASTER EXCEL WORKBOOK EXPORTER (High-End HTML Parity)
// ============================================================================

export const exportProjectExcel = async (state: ProjectState): Promise<string> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse 2.0';
  wb.lastModifiedBy = 'ProjectPulse 2.0';
  wb.created = new Date();
  wb.modified = new Date();

  const palette = getThemePalette();

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: EXECUTIVE DASHBOARD (Cockpit Overview & Portfolio KPIs)
  // ─────────────────────────────────────────────────────────────
  const ds = wb.addWorksheet('Executive Dashboard', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 6 }]
  });
  ds.properties.tabColor = { argb: palette.indigo };
  ds.getColumn(1).width = 3.0;
  for (let i = 2; i <= 20; i++) ds.getColumn(i).width = 15.0;

  // Header Banner
  ds.getRow(1).height = 12;
  ds.mergeCells('B2:R2');
  ds.getRow(2).height = 24;
  const dsTitle = ds.getCell('B2');
  dsTitle.value = ' >> PROJECTPULSE 2.0 | EXECUTIVE GOVERNANCE & TELEMETRY COCKPIT';
  dsTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: palette.indigo } };
  dsTitle.alignment = { vertical: 'middle', indent: 1 };

  ds.mergeCells('B3:R3');
  ds.getRow(3).height = 16;
  const dsSub = ds.getCell('B3');
  dsSub.value = `Project Portfolio: ${state.name || 'Untitled Workspace'} • Generated: ${new Date().toLocaleString()}`;
  dsSub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: palette.muted } };
  dsSub.alignment = { vertical: 'top', indent: 1 };

  // KPI Tiles (Row 4-6)
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

  drawTopKpiCard(ds, 2, 4, 3, 3, 'Delivery Progress', `${doneTasks} / ${totalTasks}`, `${taskPct}% complete`, palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ds, 5, 4, 3, 3, 'ALM Deliveries', `${deployedDels} / ${totalDels}`, `${delPct}% deployed`, palette.indigo, { isDark: palette.isDark });
  drawTopKpiCard(ds, 8, 4, 3, 3, 'Quality Defects', `${activeDefects} active`, `${critDefects} blockers`, critDefects > 0 ? palette.rose : palette.blue, { isDark: palette.isDark });
  drawTopKpiCard(ds, 11, 4, 3, 3, 'RAID Exposure', `${critRaids} critical`, `${totalRaids} registered`, critRaids > 0 ? palette.amber : palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(ds, 14, 4, 3, 3, 'Team Workstation', `${totalMembers} engineers`, 'Resource roster', palette.blue, { isDark: palette.isDark });
  drawTopKpiCard(ds, 17, 4, 2, 3, 'Architecture ADRs', `${activeDecisions} approved`, `${state.decisions.length} total`, palette.purple, { isDark: palette.isDark });

  ds.getRow(7).height = 14;

  // Portfolio Metadata Table
  const metaStartRow = 8;
  ds.mergeCells(`B${metaStartRow}:H${metaStartRow}`);
  ds.getCell(`B${metaStartRow}`).value = 'PORTFOLIO METADATA & STRATEGIC ALIGNMENT';
  ds.getCell(`B${metaStartRow}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: palette.textDark } };
  ds.getCell(`B${metaStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.surfaceAlt } };

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

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: TASKS MATRIX (With Cockpit Telemetry Banner & Formulas)
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
  // SHEET 4: DELIVERIES (ALM & PDN Release Workstation)
  // ─────────────────────────────────────────────────────────────
  const dels = wb.addWorksheet('Deliveries', {
    views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
  });
  dels.properties.tabColor = { argb: palette.indigo };

  const delCols = [
    { header: 'Delivery ID', key: 'id', width: 15, bg: palette.navy },
    { header: 'ALM Defect ID', key: 'almId', width: 18, bg: palette.navy },
    { header: 'Scope / PDN Title', key: 'name', width: 45, bg: palette.navy },
    { header: 'PDN Code', key: 'pdn', width: 18, bg: palette.indigo },
    { header: 'PDN Processing Date', key: 'pdnProcessingDate', width: 20, bg: palette.indigo },
    { header: 'Components Delivered', key: 'componentsDelivered', width: 36, bg: palette.indigo },
    { header: 'Category', key: 'category', width: 20, bg: palette.indigo },
    { header: 'Module', key: 'module', width: 20, bg: palette.emerald },
    { header: 'Module Type', key: 'moduleType', width: 15, bg: palette.emerald },
    { header: 'Release Version', key: 'releaseVersion', width: 16, bg: palette.emerald },
    { header: 'Environment', key: 'environment', width: 16, bg: palette.emerald },
    { header: 'ALM Status', key: 'almStatus', width: 16, bg: palette.amber },
    { header: 'Deployment Status', key: 'status', width: 22, bg: palette.amber },
    { header: 'Sign-off Status', key: 'signOffStatus', width: 16, bg: palette.amber },
    { header: 'Approver', key: 'approver', width: 20, bg: palette.amber },
    { header: 'Smoke Test', key: 'smokeTestStatus', width: 16, bg: palette.amber },
    { header: 'Reporter', key: 'reportedBy', width: 20, bg: palette.rose },
    { header: 'Fixed By', key: 'fixedBy', width: 20, bg: palette.rose },
    { header: 'Target Date', key: 'targetDeliveryDate', width: 16, bg: palette.rose },
    { header: 'Actual Date', key: 'actualDeliveryDate', width: 16, bg: palette.rose },
    { header: 'Lead Time (d)', key: 'leadTimeDays', width: 14, bg: palette.slate },
    { header: 'Variance (d)', key: 'variance', width: 14, bg: palette.slate },
    { header: 'Linked Tasks', key: 'linkedTasks', width: 22, bg: palette.slate },
    { header: 'Rollback Plan', key: 'rollbackPlan', width: 35, bg: palette.slate }
  ];
  dels.columns = delCols.map(c => ({ key: c.key, width: c.width }));

  // Telemetry
  dels.getRow(1).height = 10;
  dels.mergeCells('A2:H2');
  dels.getRow(2).height = 20;
  const delsTitle = dels.getCell('A2');
  delsTitle.value = ' >> COCKPIT.TELEMETRY: ALM & PDN DELIVERY SCHEDULE';
  delsTitle.font = { name: 'Courier New', size: 10, bold: true, color: { argb: palette.indigo } };
  delsTitle.alignment = { vertical: 'middle', indent: 1 };

  drawTopKpiCard(dels, 1, 3, 3, 3, 'Deployment Health', `${deployedDels} / ${totalDels}`, `${delPct}% deployed`, palette.indigo, { isDark: palette.isDark });
  drawTopKpiCard(dels, 5, 3, 3, 3, 'Approval Gate', `${(state.deliveries || []).filter(d => d.signOffStatus === 'Approved').length} Approved`, 'Executive sign-offs', palette.emerald, { isDark: palette.isDark });
  drawTopKpiCard(dels, 9, 3, 3, 3, 'Smoke Testing', `${(state.deliveries || []).filter(d => d.smokeTestStatus === 'Passed').length} Passed`, 'Verification gate', palette.blue, { isDark: palette.isDark });

  dels.getRow(6).height = 10;

  const delsHdr = dels.getRow(7);
  delsHdr.height = 30;
  delCols.forEach((col, idx) => {
    const cell = delsHdr.getCell(idx + 1);
    cell.value = col.header;
    styleHeaderCell(cell, col.bg);
  });
  dels.autoFilter = { from: 'A7', to: `X${Math.max(8, (state.deliveries || []).length + 7)}` };

  (state.deliveries || []).forEach((d, i) => {
    const row = dels.addRow({
      id: d.id,
      almId: d.almId,
      name: d.name,
      pdn: d.pdn,
      pdnProcessingDate: parseExcelDate(d.pdnProcessingDate),
      componentsDelivered: d.componentsDelivered,
      category: d.category,
      module: d.module,
      moduleType: d.moduleType,
      releaseVersion: d.releaseVersion,
      environment: d.environment,
      almStatus: d.almStatus,
      status: d.status,
      signOffStatus: d.signOffStatus,
      approver: d.approver,
      smokeTestStatus: d.smokeTestStatus,
      reportedBy: d.reportedBy,
      fixedBy: d.fixedBy,
      targetDeliveryDate: parseExcelDate(d.targetDeliveryDate),
      actualDeliveryDate: parseExcelDate(d.actualDeliveryDate),
      leadTimeDays: d.leadTimeDays || 0,
      variance: d.variance || 0,
      linkedTasks: d.linkedTasks?.join(', ') || '',
      rollbackPlan: d.rollbackPlan || ''
    });

    row.height = 20;
    styleZebraRow(row, i, palette, delCols.length);
    formatStatusCell(row.getCell('status'), d.status, palette);
    formatStatusCell(row.getCell('signOffStatus'), d.signOffStatus, palette);
    formatStatusCell(row.getCell('smokeTestStatus'), d.smokeTestStatus, palette);
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

export const downloadDeliveryTemplate = async (): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Deliveries_Template');
  
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
  ws.getRow(1).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'medium', color: { argb: 'FF3730A3' } } };
  });

  // Add sample demonstration row
  ws.addRow({
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

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ProjectPulse_Deliveries_Template_12Cols.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
