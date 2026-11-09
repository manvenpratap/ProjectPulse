import ExcelJS from 'exceljs';
import { ProjectState, Task, Defect, Delivery, RaidItem, Decision, Member, LogEntry } from '../types';
import { 
  exportProjectExcel,
  getThemePalette,
  drawTopKpiCard,
  styleZebraRow,
  formatStatusCell,
  formatPriorityCell,
  parseExcelDate,
  styleHeaderCell,
  buildUnifiedTasksSheet,
  buildFeatureRolloutsSheet,
  buildFeatureMatrixWorkbook,
  buildDeliveriesSheet,
  buildFeatureScreenTraceabilitySheet,
  buildDeliveriesWorkbook,
  exportDeliveriesExcel
} from './excelService';
import { getHealthScore } from '../utils/projectUtils';

// Helper to trigger browser file download from Blob
export const saveBlob = (blob: Blob, filename: string) => {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Returns total records for a view
export const getViewItemCount = (state: ProjectState, viewId: string): number => {
  switch (viewId) {
    case 'tasks':
      return state.tasks?.length || 0;
    case 'deliveries':
      return state.deliveries?.length || 0;
    case 'defects':
      return state.defects?.length || 0;
    case 'features':
      return state.features?.length || 0;
    case 'risks':
      return (state.raids?.length || 0) + (state.decisions?.length || 0);
    case 'team':
      return state.members?.length || 0;
    case 'log':
      return state.log?.length || 0;
    case 'releases':
      return state.releases?.length || 0;
    default:
      return state.tasks?.length || 0;
  }
};

// Date formatter for file stamps
const getFileStamp = () => {
  return new Date().toISOString().split('T')[0];
};

// Clean CSV value escaper (RFC 4180)
const escapeCSV = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Apply styling to Excel worksheet header
const styleHeaderRow = (row: ExcelJS.Row, bgHex = 'FF1E293B', textHex = 'FFFFFFFF') => {
  row.height = 26;
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgHex }
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: textHex }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });
};

// ─────────────────────────────────────────────────────────────
// 1. VIEW-SPECIFIC EXCEL EXPORTER
// ─────────────────────────────────────────────────────────────
export const exportViewToExcel = async (state: ProjectState, viewId: string): Promise<string> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse 2.0';
  wb.created = new Date();
  const fileDate = getFileStamp();
  let filename = `ProjectPulse_${viewId.toUpperCase()}_${fileDate}.xlsx`;
  const palette = getThemePalette(state);

  switch (viewId) {
    case 'tasks': {
      // 1. Unified Hierarchical Tasks & Subtasks Outline (Collapsible Outlines & Telemetry)
      buildUnifiedTasksSheet(wb, state, palette);

      // 2. Relational Flat Tasks Matrix
      const ws = wb.addWorksheet('Tasks Matrix', {
        views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
      });
      ws.properties.tabColor = { argb: palette.emerald };
      const taskCols = [
        { header: 'Task ID', key: 'id', width: 14, bg: palette.navy },
        { header: 'Module', key: 'module', width: 22, bg: palette.indigo },
        { header: 'Task Name', key: 'name', width: 40, bg: palette.navy },
        { header: 'Status', key: 'status', width: 16, bg: palette.emerald },
        { header: 'Priority', key: 'priority', width: 14, bg: palette.emerald },
        { header: 'Assignee', key: 'assignee', width: 22, bg: palette.emerald },
        { header: 'Due Date', key: 'dueDate', width: 16, bg: palette.amber },
        { header: 'Delay (d)', key: 'delay', width: 12, bg: palette.amber },
        { header: 'Progress', key: 'progress', width: 14, bg: palette.emerald },
        { header: 'Est Days', key: 'estDays', width: 12, bg: palette.rose },
        { header: 'Act Days', key: 'actDays', width: 12, bg: palette.rose },
        { header: 'Variance (d)', key: 'variance', width: 14, bg: palette.rose },
        { header: 'Dependencies', key: 'dependsOn', width: 20, bg: palette.indigo },
        { header: 'Category', key: 'category', width: 18, bg: palette.indigo },
        { header: 'Release', key: 'release', width: 16, bg: palette.indigo },
        { header: 'Start Date', key: 'startDate', width: 16, bg: palette.amber },
        { header: 'GUI Screens', key: 'guiScreens', width: 25, bg: palette.slate },
        { header: 'Notes', key: 'notes', width: 35, bg: palette.slate }
      ];
      ws.columns = taskCols.map(c => ({ key: c.key, width: c.width }));

      const total = state.tasks.length;
      const done = state.tasks.filter(t => t.status === 'Completed').length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const estEff = state.tasks.reduce((s, t) => s + (t.estDays || 0), 0);
      const actEff = state.tasks.reduce((s, t) => s + (t.actDays || 0), 0);
      const overdue = state.tasks.filter(t => t.dueDate && t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now()).length;

      ws.getRow(1).height = 10;
      ws.mergeCells('A2:H2');
      ws.getRow(2).height = 20;
      const tsTitle = ws.getCell('A2');
      tsTitle.value = ' >> COCKPIT.TELEMETRY: TASK REGISTRY VIEW';
      tsTitle.font = { name: 'Courier New', size: 10, bold: true, color: { argb: palette.indigo } };
      tsTitle.alignment = { vertical: 'middle', indent: 1 };

      drawTopKpiCard(ws, 1, 3, 3, 3, 'Delivery Progress', `${done} / ${total}`, `${pct}% complete`, palette.emerald, { isDark: palette.isDark });
      drawTopKpiCard(ws, 5, 3, 3, 3, 'Effort Telemetry', `${estEff.toFixed(1)} / ${actEff.toFixed(1)} d`, 'Est vs Act', palette.blue, { isDark: palette.isDark });
      drawTopKpiCard(ws, 9, 3, 3, 3, 'Health Indices', `${overdue} overdue`, 'Schedule risk', overdue > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });

      ws.getRow(6).height = 10;
      const hdr = ws.getRow(7);
      hdr.height = 30;
      taskCols.forEach((col, idx) => {
        const cell = hdr.getCell(idx + 1);
        cell.value = col.header;
        styleHeaderCell(cell, col.bg);
      });
      ws.autoFilter = { from: 'A7', to: `R${Math.max(8, state.tasks.length + 7)}` };

      state.tasks.forEach((t, i) => {
        const rowIdx = i + 8;
        const row = ws.addRow({
          id: t.id,
          module: t.module,
          name: t.name,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee || 'Unassigned',
          dueDate: parseExcelDate(t.dueDate),
          delay: { formula: `IF(AND(D${rowIdx}<>"Completed", G${rowIdx}<TODAY(), G${rowIdx}<>""), TODAY()-G${rowIdx}, 0)` },
          progress: (t.progress || 0) / 100,
          estDays: t.estDays || 0,
          actDays: t.actDays || 0,
          variance: { formula: `K${rowIdx}-J${rowIdx}` },
          dependsOn: t.dependsOn?.join(', ') || '',
          category: t.category || 'Feature',
          release: t.release || 'v1.0.0',
          startDate: parseExcelDate(t.startDate),
          guiScreens: t.guiScreens?.join(', ') || '',
          notes: t.notes || ''
        });
        row.height = 20;
        styleZebraRow(row, i, palette, taskCols.length);
        row.getCell('progress').numFmt = '0%';
        formatStatusCell(row.getCell('status'), t.status, palette);
        formatPriorityCell(row.getCell('priority'), t.priority, palette);
      });

      // 3. Flat Subtasks Matrix
      const subs = wb.addWorksheet('Subtasks', { views: [{ state: 'frozen', ySplit: 1 }] });
      subs.properties.tabColor = { argb: palette.blue };
      const subCols = [
        { header: 'Subtask ID', key: 'id', width: 15 },
        { header: 'Parent Task ID', key: 'parentId', width: 16 },
        { header: 'Subtask Name', key: 'name', width: 38 },
        { header: 'Type', key: 'type', width: 14 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Progress', key: 'progress', width: 12 },
        { header: 'Effort (Days)', key: 'effort', width: 14 }
      ];
      subs.columns = subCols;
      for (let c = 1; c <= subCols.length; c++) styleHeaderCell(subs.getRow(1).getCell(c), palette.blue);
      let subRowIdx = 0;
      state.tasks.forEach(t => {
        (t.subtasks || []).forEach(s => {
          const row = subs.addRow({
            id: s.id,
            parentId: t.id,
            name: s.name,
            type: s.type || 'Subtask',
            status: s.status || (s.done ? 'Completed' : 'Not Started'),
            progress: (s.progress !== undefined ? s.progress : (s.done ? 100 : 0)) / 100,
            effort: s.effort || 0
          });
          row.height = 20;
          styleZebraRow(row, subRowIdx++, palette, subCols.length);
          formatStatusCell(row.getCell('status'), s.status || (s.done ? 'Completed' : 'Not Started'), palette);
        });
      });
      break;
    }

    case 'deliveries': {
      // Build Deliveries Sheet 1 (Hierarchical Delivery & Delivered Components)
      const delBuild = buildDeliveriesSheet(wb, state, palette);
      // Build Sheet 2: Feature & Screen Traceability (3-Tier Deduplicated Outline)
      buildFeatureScreenTraceabilitySheet(wb, state, palette, delBuild.deliveryRowMap, {
        pendingFeatureLinks: delBuild.pendingFeatureLinks,
        pendingScreenLinks: delBuild.pendingScreenLinks,
        taskRowMap: (wb as any)._taskRowMap
      });
      break;
    }

    case 'defects': {
      const ws = wb.addWorksheet('Defect Workshop', {
        views: [{ state: 'frozen', ySplit: 7, xSplit: 3 }]
      });
      ws.properties.tabColor = { argb: palette.rose };
      const defCols = [
        { header: 'Defect ID', key: 'id', width: 14, bg: palette.navy },
        { header: 'Summary / Title', key: 'title', width: 42, bg: palette.navy },
        { header: 'Severity', key: 'severity', width: 14, bg: palette.rose },
        { header: 'Priority', key: 'priority', width: 14, bg: palette.rose },
        { header: 'Status', key: 'status', width: 16, bg: palette.emerald },
        { header: 'Assignee', key: 'assignee', width: 22, bg: palette.indigo },
        { header: 'Reported By', key: 'reporter', width: 20, bg: palette.indigo },
        { header: 'Linked Task', key: 'linkedId', width: 16, bg: palette.indigo },
        { header: 'Logged Date', key: 'createdAt', width: 16, bg: palette.amber },
        { header: 'Updated Date', key: 'updatedAt', width: 16, bg: palette.amber },
        { header: 'Description', key: 'desc', width: 40, bg: palette.slate },
        { header: 'Steps to Reproduce', key: 'steps', width: 40, bg: palette.slate }
      ];
      ws.columns = defCols.map(c => ({ key: c.key, width: c.width }));

      const totalDef = (state.defects || []).length;
      const activeDef = (state.defects || []).filter(d => d.status !== 'Closed' && d.status !== 'Fixed').length;
      const critDef = (state.defects || []).filter(d => d.severity?.includes('Blocker') || d.severity?.includes('S1')).length;

      ws.getRow(1).height = 10;
      ws.mergeCells('A2:H2');
      ws.getRow(2).height = 20;
      const dfsTitle = ws.getCell('A2');
      dfsTitle.value = ' >> COCKPIT.TELEMETRY: QUALITY ASSURANCE & DEFECT WORKSHOP';
      dfsTitle.font = { name: 'Courier New', size: 10, bold: true, color: { argb: palette.rose } };
      dfsTitle.alignment = { vertical: 'middle', indent: 1 };

      drawTopKpiCard(ws, 1, 3, 3, 3, 'Defect Load', `${activeDef} active`, `${totalDef} total logged`, palette.rose, { isDark: palette.isDark });
      drawTopKpiCard(ws, 5, 3, 3, 3, 'Resolution Rate', `${totalDef - activeDef} fixed`, 'Verified closures', palette.emerald, { isDark: palette.isDark });
      drawTopKpiCard(ws, 9, 3, 3, 3, 'Blockers', `${critDef} S1 Critical`, 'Production gating', critDef > 0 ? palette.rose : palette.emerald, { isDark: palette.isDark });

      ws.getRow(6).height = 10;
      const hdr = ws.getRow(7);
      hdr.height = 30;
      defCols.forEach((col, idx) => {
        const cell = hdr.getCell(idx + 1);
        cell.value = col.header;
        styleHeaderCell(cell, col.bg);
      });
      ws.autoFilter = { from: 'A7', to: `L${Math.max(8, (state.defects || []).length + 7)}` };

      (state.defects || []).forEach((d, i) => {
        const row = ws.addRow({
          id: d.id,
          title: d.title,
          severity: d.severity,
          priority: d.priority,
          status: d.status,
          assignee: d.assignee || 'Unassigned',
          reporter: d.reporter || 'QA Team',
          linkedId: d.linkedId || '',
          createdAt: parseExcelDate(d.createdAt),
          updatedAt: parseExcelDate(d.updatedAt),
          desc: d.desc || '',
          steps: d.steps || ''
        });
        row.height = 20;
        styleZebraRow(row, i, palette, defCols.length);
        formatPriorityCell(row.getCell('severity'), d.severity, palette);
        formatPriorityCell(row.getCell('priority'), d.priority, palette);
        formatStatusCell(row.getCell('status'), d.status, palette);
      });
      break;
    }

    case 'features': {
      const featWb = buildFeatureMatrixWorkbook(state, palette);
      const buf = await featWb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveBlob(blob, filename);
      return filename;
    }

    case 'risks': {
      const ws = wb.addWorksheet('RAID Register', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });
      ws.properties.tabColor = { argb: palette.amber };
      const raidCols = [
        { header: 'RAID ID', key: 'id', width: 14 },
        { header: 'Type', key: 'type', width: 16 },
        { header: 'Title & Context', key: 'title', width: 40 },
        { header: 'Impact', key: 'impact', width: 14 },
        { header: 'Probability', key: 'probability', width: 14 },
        { header: 'Severity Score', key: 'severity', width: 16 },
        { header: 'Owner', key: 'owner', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Target Date', key: 'targetDate', width: 16 },
        { header: 'Mitigation Plan', key: 'mitigation', width: 44 }
      ];
      ws.columns = raidCols.map(c => ({ key: c.key, width: c.width }));
      for (let c = 1; c <= raidCols.length; c++) styleHeaderCell(ws.getRow(1).getCell(c), palette.amber);

      (state.raids || []).forEach((r, i) => {
        const row = ws.addRow({
          id: r.id,
          type: r.type,
          title: r.title,
          impact: r.impact,
          probability: r.probability,
          severity: r.severity || `${r.impact} (${r.probability}/5)`,
          owner: r.owner,
          status: r.status,
          targetDate: parseExcelDate(r.dueDate || (r as any).targetDate),
          mitigation: r.mitigation
        });
        row.height = 20;
        styleZebraRow(row, i, palette, raidCols.length);
        formatPriorityCell(row.getCell('impact'), r.impact, palette);
        formatStatusCell(row.getCell('status'), r.status, palette);
      });

      // Add Decisions Sheet
      const ds = wb.addWorksheet('Decisions Log', { views: [{ state: 'frozen', ySplit: 1 }] });
      ds.properties.tabColor = { argb: palette.purple };
      const decCols = [
        { header: 'Decision ID', key: 'id', width: 16 },
        { header: 'Decision Title', key: 'title', width: 40 },
        { header: 'Owner / Approver', key: 'owner', width: 22 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Target Date', key: 'targetDate', width: 16 },
        { header: 'Context & Impact', key: 'desc', width: 44 }
      ];
      ds.columns = decCols.map(c => ({ key: c.key, width: c.width }));
      for (let c = 1; c <= decCols.length; c++) styleHeaderCell(ds.getRow(1).getCell(c), palette.purple);

      (state.decisions || []).forEach((d, i) => {
        const row = ds.addRow({
          id: d.id,
          title: d.title,
          owner: d.approver || (d as any).owner,
          status: d.status,
          targetDate: parseExcelDate(d.dueDate || (d as any).targetDate),
          desc: d.desc || d.rationale || ''
        });
        row.height = 20;
        styleZebraRow(row, i, palette, decCols.length);
        formatStatusCell(row.getCell('status'), d.status, palette);
      });
      break;
    }

    case 'team': {
      const ws = wb.addWorksheet('Team Directory', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });
      ws.properties.tabColor = { argb: palette.blue };
      const teamCols = [
        { header: 'Member ID', key: 'id', width: 14 },
        { header: 'Full Name', key: 'name', width: 26 },
        { header: 'Role / Designation', key: 'role', width: 26 },
        { header: 'Emp ID', key: 'empId', width: 16 },
        { header: 'Email Address', key: 'email', width: 30 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Skills / Competencies', key: 'skills', width: 36 }
      ];
      ws.columns = teamCols.map(c => ({ key: c.key, width: c.width }));
      for (let c = 1; c <= teamCols.length; c++) styleHeaderCell(ws.getRow(1).getCell(c), palette.blue);

      (state.members || []).forEach((m, i) => {
        const skillsStr = Array.isArray(m.skills) ? m.skills.join(', ') : (m.skills || '');
        const row = ws.addRow({
          id: m.id,
          name: m.name,
          role: m.role || 'Member',
          empId: m.empId || '',
          email: m.email || '',
          status: m.status || 'Active',
          location: m.location || '',
          skills: skillsStr
        });
        row.height = 20;
        styleZebraRow(row, i, palette, teamCols.length);
        formatStatusCell(row.getCell('status'), m.status, palette);
      });
      break;
    }

    case 'releases': {
      const ws = wb.addWorksheet('Release Roadmap', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });
      ws.properties.tabColor = { argb: palette.indigo };
      const relCols = [
        { header: 'Release Version', key: 'version', width: 18 },
        { header: 'Release Title', key: 'title', width: 36 },
        { header: 'Target Date', key: 'targetDate', width: 16 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Total Tasks', key: 'taskCount', width: 14 },
        { header: 'Completed Tasks', key: 'doneCount', width: 16 },
        { header: 'Progress', key: 'progress', width: 14 }
      ];
      ws.columns = relCols.map(c => ({ key: c.key, width: c.width }));
      for (let c = 1; c <= relCols.length; c++) styleHeaderCell(ws.getRow(1).getCell(c), palette.indigo);

      (state.releases || []).forEach((r, i) => {
        const rTasks = state.tasks.filter(t => t.release === r.version);
        const rDone = rTasks.filter(t => t.status === 'Completed').length;
        const pct = rTasks.length > 0 ? Math.round((rDone / rTasks.length) * 100) : 0;
        const row = ws.addRow({
          version: r.version,
          title: r.title,
          targetDate: parseExcelDate(r.targetDate),
          status: r.status,
          taskCount: rTasks.length,
          doneCount: rDone,
          progress: `${pct}%`
        });
        row.height = 20;
        styleZebraRow(row, i, palette, relCols.length);
        formatStatusCell(row.getCell('status'), r.status, palette);
      });
      break;
    }

    default: {
      // Fallback: Full Master Excel
      await exportProjectExcel(state);
      return filename;
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveBlob(blob, filename);
  return filename;
};

// ─────────────────────────────────────────────────────────────
// 2. VIEW-SPECIFIC CSV EXPORTER
// ─────────────────────────────────────────────────────────────
export const exportViewToCSV = (state: ProjectState, viewId: string): string => {
  const fileDate = getFileStamp();
  const filename = `ProjectPulse_${viewId.toLowerCase()}_${fileDate}.csv`;
  let csvContent = '';

  switch (viewId) {
    case 'tasks': {
      const headers = ['ID', 'Module', 'Task Name', 'Status', 'Priority', 'Assignee', 'Due Date', 'Progress %', 'Est Days', 'Act Days', 'Category', 'Release', 'Dependencies'];
      const rows = state.tasks.map(t => [
        t.id, t.module, t.name, t.status, t.priority, t.assignee || 'Unassigned',
        t.dueDate, t.progress || 0, t.estDays || 0, t.actDays || 0, t.category || 'Feature',
        t.release || 'v1.0.0', (t.dependsOn || []).join(';')
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    case 'deliveries': {
      const headers = ['Delivery ID', 'ALM ID', 'Scope Name', 'PDN', 'Environment', 'ALM Status', 'Deploy Status', 'Sign-Off', 'Approver', 'Smoke Test', 'Module', 'Release', 'Target Date', 'Variance (d)'];
      const rows = (state.deliveries || []).map(d => [
        d.id, d.almId, d.name, d.pdn, d.environment, d.almStatus, d.status,
        d.signOffStatus, d.approver || '', d.smokeTestStatus, d.module, d.releaseVersion,
        d.targetDeliveryDate, d.variance || 0
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    case 'defects': {
      const headers = ['Defect ID', 'Title', 'Severity', 'Priority', 'Status', 'Assignee', 'Reporter', 'Linked Task', 'Logged Date', 'Description'];
      const rows = (state.defects || []).map(d => [
        d.id, d.title, d.severity, d.priority, d.status, d.assignee || 'Unassigned',
        d.reporter || '', d.linkedId || '', d.createdAt ? d.createdAt.split('T')[0] : '', d.desc || ''
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    case 'features': {
      const headers = ['Feature ID', 'Name', 'Description', 'Category', 'Release', 'Priority', 'Linked Screens', 'Linked Tasks'];
      const rows = (state.features || []).map(f => [
        f.id, f.name, f.desc || '', f.category || '', f.release || '', f.priority || '',
        (f.screens || []).join(';'), (f.tasks || []).join(';')
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    case 'risks': {
      const headers = ['RAID ID', 'Type', 'Title', 'Impact', 'Probability', 'Severity', 'Owner', 'Status', 'Target Date', 'Mitigation'];
      const rows = (state.raids || []).map(r => [
        r.id, r.type, r.title, r.impact, r.probability, r.severity || '',
        r.owner, r.status, r.targetDate || '', r.mitigation
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    case 'team': {
      const headers = ['Member ID', 'Name', 'Role', 'Email', 'Status', 'Reports To', 'Skills'];
      const rows = (state.members || []).map(m => [
        m.id, m.name, m.role, m.email || '', m.status || 'Active', m.reportsTo || '',
        (m.skills || []).join(';')
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    case 'log': {
      const headers = ['Timestamp', 'Actor', 'Action', 'Entity ID', 'Entity Name', 'Field', 'Old Value', 'New Value', 'Comment'];
      const rows = (state.log || []).map(l => [
        l.timestamp, l.user, l.action, l.taskId, l.taskName, l.field || '',
        l.oldVal || '', l.newVal || '', l.comment || ''
      ]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }

    default: {
      // General tasks fallback
      const headers = ['ID', 'Name', 'Status', 'Assignee', 'DueDate'];
      const rows = state.tasks.map(t => [t.id, t.name, t.status, t.assignee, t.dueDate]);
      csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
      break;
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveBlob(blob, filename);
  return filename;
};

// ─────────────────────────────────────────────────────────────
// 3. VIEW-SPECIFIC JSON EXPORTER
// ─────────────────────────────────────────────────────────────
export const exportViewToJSON = (state: ProjectState, viewId: string): string => {
  const fileDate = getFileStamp();
  const filename = `ProjectPulse_${viewId.toLowerCase()}_${fileDate}.json`;
  
  let dataset: any;
  switch (viewId) {
    case 'tasks': dataset = state.tasks; break;
    case 'deliveries': dataset = state.deliveries || []; break;
    case 'defects': dataset = state.defects || []; break;
    case 'features': dataset = state.features || []; break;
    case 'risks': dataset = { raids: state.raids || [], decisions: state.decisions || [] }; break;
    case 'team': dataset = state.members || []; break;
    case 'log': dataset = state.log || []; break;
    case 'releases': dataset = state.releases || []; break;
    default: dataset = state; break;
  }

  const payload = {
    project: state.name,
    view: viewId,
    exportedAt: new Date().toISOString(),
    recordCount: Array.isArray(dataset) ? dataset.length : undefined,
    data: dataset
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  saveBlob(blob, filename);
  return filename;
};

// ─────────────────────────────────────────────────────────────
// 4. STANDALONE INTERACTIVE HTML EXPORTER
// ─────────────────────────────────────────────────────────────
export const exportViewToHTML = (state: ProjectState, viewId: string): string => {
  const fileDate = getFileStamp();
  const filename = `ProjectPulse_${viewId}_Report_${fileDate}.html`;
  const healthScore = getHealthScore(state.tasks);

  // Generate table rows based on view
  let tableHeaderHtml = '';
  let tableBodyHtml = '';

  if (viewId === 'deliveries') {
    tableHeaderHtml = '<tr><th>ALM ID</th><th>Package Scope</th><th>Environment</th><th>ALM Status</th><th>Sign-off</th><th>Target Date</th></tr>';
    tableBodyHtml = (state.deliveries || []).map(d => `
      <tr>
        <td><strong>${d.almId}</strong></td>
        <td>${d.name}</td>
        <td><span class="badge env">${d.environment}</span></td>
        <td>${d.almStatus}</td>
        <td>${d.signOffStatus}</td>
        <td>${d.targetDeliveryDate}</td>
      </tr>
    `).join('');
  } else if (viewId === 'defects') {
    tableHeaderHtml = '<tr><th>Defect ID</th><th>Summary</th><th>Severity</th><th>Priority</th><th>Status</th><th>Assignee</th></tr>';
    tableBodyHtml = (state.defects || []).map(d => `
      <tr>
        <td><strong>${d.id}</strong></td>
        <td>${d.title}</td>
        <td><span class="badge ${d.severity.toLowerCase().includes('s1') ? 'critical' : 'warning'}">${d.severity}</span></td>
        <td>${d.priority}</td>
        <td>${d.status}</td>
        <td>${d.assignee || 'Unassigned'}</td>
      </tr>
    `).join('');
  } else {
    tableHeaderHtml = '<tr><th>ID</th><th>Module</th><th>Task Name</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th>Progress</th></tr>';
    tableBodyHtml = state.tasks.slice(0, 100).map(t => `
      <tr>
        <td><strong>${t.id}</strong></td>
        <td>${t.module}</td>
        <td>${t.name}</td>
        <td><span class="badge ${t.status === 'Completed' ? 'done' : 'active'}">${t.status}</span></td>
        <td>${t.priority}</td>
        <td>${t.assignee || 'Unassigned'}</td>
        <td>${t.dueDate}</td>
        <td>${t.progress || 0}%</td>
      </tr>
    `).join('');
  }

  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${state.name} — ${viewId.toUpperCase()} Report</title>
  <style>
    :root { --primary: #4f46e5; --bg: #f8fafc; --surface: #ffffff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; }
    @media (prefers-color-scheme: dark) {
      :root { --primary: #6366f1; --bg: #090d16; --surface: #111827; --text: #f8fafc; --muted: #94a3b8; --border: #1f2937; }
    }
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: 800; margin: 0; }
    .meta { font-size: 13px; color: var(--muted); margin-top: 4px; }
    .stats { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; flex: 1; min-width: 140px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card-val { font-size: 20px; font-weight: 800; color: var(--primary); }
    .card-lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--muted); margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-size: 13px; }
    th { background: rgba(0,0,0,0.03); padding: 12px 14px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--muted); border-bottom: 1px solid var(--border); }
    td { padding: 10px 14px; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
    .badge.done { background: #dcfce7; color: #166534; }
    .badge.active { background: #e0e7ff; color: #3730a3; }
    .badge.critical { background: #ffe4e6; color: #9f1239; }
    .badge.warning { background: #fef3c7; color: #92400e; }
    .badge.env { background: #f1f5f9; color: #475569; }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: var(--muted); }
    @media print { body { padding: 0; background: #fff; } .card, table { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">${state.name}</h1>
        <div class="meta">${viewId.toUpperCase()} Report • Generated on ${new Date().toLocaleDateString()}</div>
      </div>
      <div>
        <button onclick="window.print()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-weight: 600;">Print / Save PDF</button>
      </div>
    </div>

    <div class="stats">
      <div class="card"><div class="card-val">${healthScore}%</div><div class="card-lbl">Health Index</div></div>
      <div class="card"><div class="card-val">${state.tasks.length}</div><div class="card-lbl">Total Tasks</div></div>
      <div class="card"><div class="card-val">${state.tasks.filter(t => t.status === 'Completed').length}</div><div class="card-lbl">Completed</div></div>
      <div class="card"><div class="card-val">${(state.defects || []).length}</div><div class="card-lbl">Defects</div></div>
      <div class="card"><div class="card-val">${(state.deliveries || []).length}</div><div class="card-lbl">ALM Packages</div></div>
    </div>

    <table>
      <thead>
        ${tableHeaderHtml}
      </thead>
      <tbody>
        ${tableBodyHtml}
      </tbody>
    </table>

    <div class="footer">
      Generated by ProjectPulse 2.0 ALM Platform • ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
  saveBlob(blob, filename);
  return filename;
};

// ─────────────────────────────────────────────────────────────
// 5. COPY VIEW SUMMARY TO CLIPBOARD (MARKDOWN / TEXT)
// ─────────────────────────────────────────────────────────────
export const copyViewSummaryToClipboard = async (state: ProjectState, viewId: string): Promise<boolean> => {
  const healthScore = getHealthScore(state.tasks);
  let summaryText = '';

  switch (viewId) {
    case 'tasks': {
      const done = state.tasks.filter(t => t.status === 'Completed').length;
      summaryText = `📊 **${state.name} — Tasks Matrix Summary**\n` +
        `• **Total Tasks**: ${state.tasks.length} | **Completed**: ${done} (${Math.round((done / (state.tasks.length || 1)) * 100)}%)\n` +
        `• **Health Score**: ${healthScore}%\n\n` +
        `| ID | Task Name | Status | Priority | Assignee | Due Date |\n` +
        `| --- | --- | --- | --- | --- | --- |\n` +
        state.tasks.slice(0, 15).map(t => `| ${t.id} | ${t.name} | ${t.status} | ${t.priority} | ${t.assignee || 'Unassigned'} | ${t.dueDate} |`).join('\n') +
        (state.tasks.length > 15 ? `\n\n*... and ${state.tasks.length - 15} more tasks.*` : '');
      break;
    }

    case 'deliveries': {
      const dels = state.deliveries || [];
      const approved = dels.filter(d => d.signOffStatus === 'Approved').length;
      summaryText = `🚀 **${state.name} — ALM Deliveries Summary**\n` +
        `• **Total Packages**: ${dels.length} | **Approved Sign-offs**: ${approved}\n\n` +
        `| ALM ID | Scope / PDN | Environment | Status | Sign-off | Target Date |\n` +
        `| --- | --- | --- | --- | --- | --- |\n` +
        dels.slice(0, 15).map(d => `| ${d.almId} | ${d.name} | ${d.environment} | ${d.status} | ${d.signOffStatus} | ${d.targetDeliveryDate} |`).join('\n');
      break;
    }

    case 'defects': {
      const defs = state.defects || [];
      const s1 = defs.filter(d => d.severity.toLowerCase().includes('s1')).length;
      summaryText = `🐛 **${state.name} — Defect Workshop Summary**\n` +
        `• **Total Defects**: ${defs.length} | **S1 Blockers**: ${s1}\n\n` +
        `| Defect ID | Summary | Severity | Status | Assignee |\n` +
        `| --- | --- | --- | --- | --- |\n` +
        defs.slice(0, 15).map(d => `| ${d.id} | ${d.title} | ${d.severity} | ${d.status} | ${d.assignee || 'Unassigned'} |`).join('\n');
      break;
    }

    default: {
      summaryText = `📋 **${state.name} — Status Summary**\n` +
        `• **Health Score**: ${healthScore}%\n` +
        `• **Tasks**: ${state.tasks.length} (${state.tasks.filter(t => t.status === 'Completed').length} Done)\n` +
        `• **Deliveries**: ${(state.deliveries || []).length} Packages\n` +
        `• **Defects**: ${(state.defects || []).length} Registered\n` +
        `• **RAID Items**: ${(state.raids || []).length} Active\n` +
        `• **Reporting Date**: ${new Date().toLocaleDateString()}`;
      break;
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(summaryText);
      return true;
    }
  } catch (e) {
    console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', e);
  }

  // Fallback for environments / headless contexts where navigator.clipboard requires explicit user activation or permission
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = summaryText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) return true;
    }
  } catch (err) {
    console.error('execCommand copy fallback failed:', err);
  }
  return false;
};

// ─────────────────────────────────────────────────────────────
// 6. SHARE VIEW VIA EMAIL DRAFT (MAILTO)
// ─────────────────────────────────────────────────────────────
export const shareViewViaEmail = (state: ProjectState, viewId: string) => {
  const healthScore = getHealthScore(state.tasks);
  const subject = encodeURIComponent(`ProjectPulse Status: ${state.name} — ${viewId.toUpperCase()} (${healthScore}% Health)`);
  const body = encodeURIComponent(
    `Hello Team,\n\nHere is the latest ${viewId.toUpperCase()} status update for ${state.name}:\n\n` +
    `• Health Score: ${healthScore}%\n` +
    `• Total Tasks: ${state.tasks.length} (${state.tasks.filter(t => t.status === 'Completed').length} Completed)\n` +
    `• Active Deliveries: ${(state.deliveries || []).length} Packages\n` +
    `• Open Defects: ${(state.defects || []).length}\n` +
    `• Active RAID Items: ${(state.raids || []).length}\n\n` +
    `Generated on ${new Date().toLocaleString()} via ProjectPulse 2.0.`
  );
  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
};
