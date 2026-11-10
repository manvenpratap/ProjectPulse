import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../store/ProjectContext';
import { 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  CheckCircle2
} from 'lucide-react';
import { getHealthScore, fmtDate, daysDiff, isOverdue } from '../../utils/projectUtils';
import { TaskStatus, DefectStatus } from '../../types';
import Button from '../shared/Button';
import clsx from 'clsx';
import { motion } from 'motion/react';

export interface CxoEmailBriefingProps {
  embedded?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CxoEmailBriefing: React.FC<CxoEmailBriefingProps> = ({ 
  embedded = false, 
  isOpen = true, 
  onClose 
}) => {
  const { state } = useProject();

  // Configurator state
  const [cadence, setCadence] = useState<'weekly' | 'fortnightly'>('weekly');
  const [execNote, setExecNote] = useState('');
  const [previewTab, setPreviewTab] = useState<'html' | 'markdown'>('html');
  const [copiedType, setCopiedType] = useState<'html' | 'markdown' | null>(null);

  // Section selectors
  const [incNarrative, setIncNarrative] = useState(true);
  const [incKpi, setIncKpi] = useState(true);
  const [incModules, setIncModules] = useState(true);
  const [incWins, setIncWins] = useState(true);
  const [incRisks, setIncRisks] = useState(true);

  // Calculated metrics
  const daysBack = cadence === 'fortnightly' ? 14 : 7;
  const cadenceLabel = cadence === 'fortnightly' ? 'Fortnightly Executive Brief' : 'Weekly Executive Brief';

  const now = new Date();
  const periodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const periodStr = `${fmtDate(periodStart.toISOString())} – ${fmtDate(now.toISOString())}`;

  const healthScore = getHealthScore(state.tasks);
  const healthLabel = healthScore > 80 ? 'On Track' : healthScore > 50 ? 'At Risk' : 'Critical';

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const progressPct = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Screens delivered
  const guiTasks = state.tasks.filter(t => t.moduleType === 'GUI' || (t.guiScreens && t.guiScreens.length > 0));
  const completedGui = guiTasks.filter(t => t.status === TaskStatus.COMPLETED);

  // Completed in this period (Wins)
  const recentWins = useMemo(() => {
    return state.tasks.filter(t => {
      if (t.status !== TaskStatus.COMPLETED) return false;
      if (!t.updatedAt && !t.dueDate) return true;
      const refDate = new Date(t.updatedAt || t.dueDate);
      return refDate >= periodStart && refDate <= now;
    }).slice(0, 10);
  }, [state.tasks, periodStart, now]);

  // Slippage & Overdue
  const overdueTasks = useMemo(() => {
    return state.tasks.filter(isOverdue);
  }, [state.tasks]);

  // Critical defects
  const criticalDefects = useMemo(() => {
    return (state.defects || []).filter(d => 
      d.status !== DefectStatus.CLOSED && 
      d.status !== DefectStatus.DEFERRED && 
      (d.severity?.startsWith('S1') || d.severity?.startsWith('S2'))
    );
  }, [state.defects]);

  // Critical RAID
  const criticalRisks = useMemo(() => {
    return (state.raids || []).filter(r => 
      r.status === 'Open' && 
      r.type === 'Risk' && 
      r.probability === 'High' && 
      r.impact === 'High'
    );
  }, [state.raids]);

  // Module breakdown
  const moduleBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; progressSum: number }>();
    state.tasks.forEach(t => {
      const m = t.module || 'General';
      const cur = map.get(m) || { total: 0, completed: 0, progressSum: 0 };
      cur.total++;
      if (t.status === TaskStatus.COMPLETED) cur.completed++;
      cur.progressSum += (t.progress || 0);
      map.set(m, cur);
    });

    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      total: stat.total,
      completed: stat.completed,
      avgProgress: stat.total > 0 ? Math.round(stat.progressSum / stat.total) : 0
    })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [state.tasks]);

  // Rich HTML Email Generator
  const emailHtml = useMemo(() => {
    const cardBg = '#ffffff';
    const bodyBg = '#f8fafc';
    const textMain = '#0f172a';
    const textSub = '#475569';
    const borderCol = '#e2e8f0';
    const primaryCol = '#4f46e5';

    let h = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 0; background: ${bodyBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textMain}; }
  table { border-collapse: collapse; }
  .wrapper { width: 100%; max-width: 680px; margin: 0 auto; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
</style>
</head>
<body style="padding: 24px 12px; background: ${bodyBg};">
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 0 auto; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 12px;">
    <!-- HEADER -->
    <tr>
      <td style="padding: 24px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
        <table width="100%">
          <tr>
            <td>
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #a5b4fc; margin-bottom: 4px;">${cadenceLabel}</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${state.name}</h1>
              <div style="font-size: 13px; color: #cbd5e1; margin-top: 6px;">Reporting Window: <strong>${periodStr}</strong></div>
            </td>
            <td align="right" valign="top">
              <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; background: ${healthScore > 80 ? '#065f46' : healthScore > 50 ? '#854d0e' : '#991b1b'}; color: #ffffff; border: 1px solid rgba(255,255,255,0.2);">
                ${healthLabel.toUpperCase()} (${healthScore}%)
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
`;

    // EXECUTIVE NOTE
    if (execNote.trim()) {
      h += `
    <tr>
      <td style="padding: 16px 24px; background: #f1f5f9; border-bottom: 1px solid ${borderCol};">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: ${primaryCol}; margin-bottom: 4px;">Executive Steering Note</div>
        <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: ${textMain}; font-style: italic;">“${execNote}”</p>
      </td>
    </tr>
`;
    }

    // NARRATIVE SUMMARY
    if (incNarrative) {
      h += `
    <tr>
      <td style="padding: 24px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px;">1. Steering Executive Summary</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.6; color: ${textSub};">
          <li style="margin-bottom: 6px;"><strong>Delivery Health:</strong> Project is operating at <strong>${healthScore}% health</strong> (${healthLabel}) with overall backlog progress standing at <strong>${progressPct}%</strong>.</li>
          <li style="margin-bottom: 6px;"><strong>Screen Execution:</strong> <strong>${completedGui.length} of ${guiTasks.length}</strong> strategic GUI interfaces and user journeys delivered.</li>
          <li style="margin-bottom: 6px;"><strong>Velocity & Output:</strong> <strong>${recentWins.length} deliverable(s)</strong> verified and signed-off during this ${cadence} cycle.</li>
          ${overdueTasks.length > 0 ? `<li style="margin-bottom: 6px; color: #dc2626;"><strong>Schedule Variance:</strong> <strong>${overdueTasks.length} task(s)</strong> are currently past deadline requiring timeline recalibration.</li>` : `<li style="margin-bottom: 6px; color: #16a34a;"><strong>Schedule Compliance:</strong> Zero overdue tasks detected across active sprints.</li>`}
          ${criticalDefects.length > 0 ? `<li style="margin-bottom: 6px; color: #b91c1c;"><strong>Critical Defects:</strong> <strong>${criticalDefects.length} S1/S2 bug(s)</strong> active in QA backlog.</li>` : `<li style="margin-bottom: 6px; color: #16a34a;"><strong>Quality Gate:</strong> Zero open S1/S2 critical severity defects.</li>`}
        </ul>
      </td>
    </tr>
`;
    }

    // KPI METRIC CARDS
    if (incKpi) {
      h += `
    <tr>
      <td style="padding: 24px; border-bottom: 1px solid ${borderCol}; background: #fafafa;">
        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px;">2. Portfolio Telemetry</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="32%" style="padding: 16px; background: #ffffff; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Completion</div>
              <div style="font-size: 26px; font-weight: 900; color: #3b82f6; margin: 4px 0;">${progressPct}%</div>
              <div style="font-size: 11px; color: #64748b;">${completedTasks.length} / ${totalTasks} Tasks Done</div>
            </td>
            <td width="2%"></td>
            <td width="32%" style="padding: 16px; background: #ffffff; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Screens Done</div>
              <div style="font-size: 26px; font-weight: 900; color: #10b981; margin: 4px 0;">${completedGui.length} <span style="font-size: 15px; font-weight: 600; color: #94a3b8;">/ ${guiTasks.length}</span></div>
              <div style="font-size: 11px; color: #64748b;">GUI Interfaces</div>
            </td>
            <td width="2%"></td>
            <td width="32%" style="padding: 16px; background: #ffffff; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Defects & Risks</div>
              <div style="font-size: 26px; font-weight: 900; color: ${criticalDefects.length + criticalRisks.length > 0 ? '#ef4444' : '#10b981'}; margin: 4px 0;">${criticalDefects.length + criticalRisks.length}</div>
              <div style="font-size: 11px; color: #64748b;">${criticalDefects.length} S1 Bugs • ${criticalRisks.length} High Risks</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
`;
    }

    // MODULE BREAKDOWN
    if (incModules && moduleBreakdown.length > 0) {
      h += `
    <tr>
      <td style="padding: 24px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px;">3. Module Progress Breakdown</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12.5px; text-align: left;">
          <tr style="background: #f1f5f9; color: #475569; font-weight: 700; border-bottom: 2px solid ${borderCol};">
            <th style="padding: 8px;">Domain Module</th>
            <th style="padding: 8px; text-align: center;">Deliverables</th>
            <th style="padding: 8px; width: 35%;">Progress</th>
            <th style="padding: 8px; text-align: right;">Status</th>
          </tr>
`;
      moduleBreakdown.forEach(m => {
        h += `
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 8px; font-weight: 700; color: ${textMain};">${m.name}</td>
            <td style="padding: 10px 8px; text-align: center; color: ${textSub};">${m.completed}/${m.total}</td>
            <td style="padding: 10px 8px;">
              <div style="background: #e2e8f0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                <div style="background: #4f46e5; height: 100%; width: ${m.avgProgress}%;"></div>
              </div>
            </td>
            <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: ${m.avgProgress === 100 ? '#10b981' : '#4f46e5'};">${m.avgProgress}%</td>
          </tr>
`;
      });
      h += `
        </table>
      </td>
    </tr>
`;
    }

    // COMPLETED WINS
    if (incWins && recentWins.length > 0) {
      h += `
    <tr>
      <td style="padding: 24px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">4. Delivered Wins (${periodStr})</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12.5px;">
`;
      recentWins.forEach(w => {
        h += `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 4px; font-weight: 600; color: ${textMain};">✅ ${w.name}</td>
            <td style="padding: 8px 4px; color: ${textSub}; font-size: 11.5px; text-align: right;">${w.module || 'General'} • ${w.assignee || 'Unassigned'}</td>
          </tr>
`;
      });
      h += `
        </table>
      </td>
    </tr>
`;
    }

    // SLIPPAGE & RISKS
    if (incRisks && (overdueTasks.length > 0 || criticalRisks.length > 0)) {
      h += `
    <tr>
      <td style="padding: 24px; border-bottom: 1px solid ${borderCol}; background: #fff5f5;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">5. Schedule Slippage & Risk Exposure</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; line-height: 1.6; color: #991b1b;">
`;
      overdueTasks.slice(0, 5).forEach(ot => {
        const dd = daysDiff(ot.dueDate);
        h += `<li><strong>Overdue:</strong> ${ot.name} (${Math.abs(dd || 0)}d past due • ${ot.assignee || 'Unassigned'})</li>`;
      });
      criticalRisks.slice(0, 4).forEach(r => {
        h += `<li><strong>High Risk:</strong> ${r.title} (Severity: High Probability / High Impact)</li>`;
      });
      h += `
        </ul>
      </td>
    </tr>
`;
    }

    // FOOTER
    h += `
    <tr>
      <td style="padding: 18px 24px; background: #f8fafc; text-align: center; font-size: 11.5px; color: #94a3b8;">
        Generated automatically by <strong>ProjectPulse 2.0</strong> • Enterprise Delivery Architecture Platform
      </td>
    </tr>
  </table>
</body>
</html>
`;
    return h;
  }, [
    state.name, cadenceLabel, periodStr, healthScore, healthLabel, execNote, 
    incNarrative, progressPct, completedTasks.length, totalTasks, completedGui.length, 
    guiTasks.length, recentWins, cadence, overdueTasks, criticalDefects, incKpi, 
    criticalRisks, incModules, moduleBreakdown, incWins, incRisks
  ]);

  // Markdown Brief Generator
  const markdownBrief = useMemo(() => {
    let md = `# ${cadenceLabel}: ${state.name}\n`;
    md += `**Window:** ${periodStr} | **Health:** ${healthLabel} (${healthScore}%)\n\n`;

    if (execNote.trim()) {
      md += `> **Executive Note:** ${execNote}\n\n`;
    }

    if (incNarrative) {
      md += `## 1. Executive Summary\n`;
      md += `- Project Health: **${healthScore}% (${healthLabel})** with overall progress at **${progressPct}%**.\n`;
      md += `- Strategy Screens: **${completedGui.length} of ${guiTasks.length}** delivered.\n`;
      md += `- Cycle Velocity: **${recentWins.length} items** closed in this ${cadence} cycle.\n`;
      md += `- Schedule Slippage: **${overdueTasks.length} overdue task(s)**.\n`;
      md += `- Critical Defects: **${criticalDefects.length} S1/S2 open bug(s)**.\n\n`;
    }

    if (incWins && recentWins.length > 0) {
      md += `## 2. Key Wins & Completed Deliverables\n`;
      recentWins.forEach(w => {
        md += `- [x] **${w.name}** (${w.module || 'General'} • ${w.assignee || 'Unassigned'})\n`;
      });
      md += `\n`;
    }

    if (incRisks && (overdueTasks.length > 0 || criticalRisks.length > 0)) {
      md += `## 3. Risks & Slippage\n`;
      overdueTasks.slice(0, 5).forEach(ot => {
        const dd = daysDiff(ot.dueDate);
        md += `- ⚠️ **Overdue (${Math.abs(dd || 0)}d):** ${ot.name} (${ot.assignee || 'Unassigned'})\n`;
      });
      criticalRisks.slice(0, 4).forEach(r => {
        md += `- 🚨 **Risk:** ${r.title} (High Impact / High Probability)\n`;
      });
      md += `\n`;
    }

    md += `---\n*Generated by ProjectPulse 2.0*`;
    return md;
  }, [
    cadenceLabel, state.name, periodStr, healthLabel, healthScore, execNote, 
    incNarrative, progressPct, completedGui.length, guiTasks.length, recentWins, 
    cadence, overdueTasks, criticalDefects, incWins, incRisks, criticalRisks
  ]);

  const handleCopyHtml = async () => {
    try {
      const blob = new Blob([emailHtml], { type: 'text/html' });
      const plainBlob = new Blob([markdownBrief], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': plainBlob
      });
      await navigator.clipboard.write([item]);
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      await navigator.clipboard.writeText(emailHtml);
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdownBrief);
    setCopiedType('markdown');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(`${cadenceLabel}: ${state.name} (${healthLabel})`);
    const body = encodeURIComponent(markdownBrief);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  useEffect(() => {
    if (embedded || !isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [embedded, isOpen, onClose]);

  if (!isOpen && !embedded) return null;

  // The core Configurator + Preview UI content
  const content = (
    <div className={clsx(
      "flex flex-col lg:flex-row overflow-hidden bg-[var(--color-surface)] border border-[var(--color-divider)]",
      embedded 
        ? "rounded-2xl shadow-xs min-h-[640px]" 
        : "w-full max-w-5xl h-[92vh] max-h-[880px] rounded-3xl shadow-2xl ring-1 ring-black/5"
    )}>
      {/* LEFT: Configurator Controls */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--color-divider)] bg-[var(--color-surface)] p-5 overflow-y-auto custom-scroll space-y-5 shrink-0">
        <div>
          <label className="text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-2 block">
            Reporting Cadence
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCadence('weekly')}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                cadence === 'weekly' 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:bg-[var(--color-surface-offset)]"
              )}
            >
              Weekly (7d)
            </button>
            <button
              onClick={() => setCadence('fortnightly')}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                cadence === 'fortnightly' 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:bg-[var(--color-surface-offset)]"
              )}
            >
              Fortnightly (14d)
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-2 block">
            Executive Steering Note
          </label>
          <textarea
            value={execNote}
            onChange={(e) => setExecNote(e.target.value)}
            placeholder="Optional executive comment, leadership acknowledgment, or high-level risk focus..."
            rows={3}
            className="w-full text-xs p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-2.5 block">
            Include Brief Sections
          </label>
          <div className="space-y-2">
            {[
              { label: 'Executive Summary', state: incNarrative, set: setIncNarrative },
              { label: 'KPI Telemetry Cards', state: incKpi, set: setIncKpi },
              { label: 'Module Breakdown', state: incModules, set: setIncModules },
              { label: 'Cycle Delivered Wins', state: incWins, set: setIncWins },
              { label: 'Slippage & Risks', state: incRisks, set: setIncRisks },
            ].map((sec, idx) => (
              <label key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)] cursor-pointer hover:bg-[var(--color-surface-offset)] transition-colors">
                <span className="text-xs font-medium text-[var(--color-text)]">{sec.label}</span>
                <input 
                  type="checkbox"
                  checked={sec.state}
                  onChange={(e) => sec.set(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[11px] text-[var(--color-text-muted)] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 size={13} />
            <span>Format Compatibility</span>
          </div>
          <p>Rich HTML incorporates inline CSS compatible with Outlook 2016+, Apple Mail, Gmail web & mobile.</p>
        </div>
      </div>

      {/* RIGHT: Live Preview & Actions */}
      <div className="flex-1 flex flex-col bg-[var(--color-surface-offset)]/40 overflow-hidden">
        {/* Preview Toolbar */}
        <div className="p-3.5 border-b border-[var(--color-divider)] bg-[var(--color-surface)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text)]">Preview Mode:</span>
            <div className="flex p-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <button
                onClick={() => setPreviewTab('html')}
                className={clsx(
                  "px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  previewTab === 'html' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs" : "text-[var(--color-text-muted)]"
                )}
              >
                Rich Email (HTML)
              </button>
              <button
                onClick={() => setPreviewTab('markdown')}
                className={clsx(
                  "px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  previewTab === 'markdown' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs" : "text-[var(--color-text-muted)]"
                )}
              >
                Markdown
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenMailto}
              title="Open in your default mail app"
              className="rounded-xl h-8 px-3 text-xs font-semibold"
            >
              <ExternalLink size={13} className="mr-1.5" /> Open in Mail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="rounded-xl h-8 px-3 text-xs font-semibold"
            >
              {copiedType === 'markdown' ? <Check size={13} className="mr-1.5 text-emerald-500" /> : <Copy size={13} className="mr-1.5" />}
              {copiedType === 'markdown' ? 'Copied MD!' : 'Copy Markdown'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyHtml}
              className="rounded-xl h-8 px-3.5 text-xs font-bold shadow-sm"
            >
              {copiedType === 'html' ? <Check size={13} className="mr-1.5 text-white" /> : <Copy size={13} className="mr-1.5" />}
              {copiedType === 'html' ? 'Copied Rich HTML!' : 'Copy Rich Email'}
            </Button>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scroll">
          {previewTab === 'html' ? (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-slate-900">
              <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
            </div>
          ) : (
            <pre className="max-w-2xl mx-auto p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap leading-relaxed shadow-sm">
              {markdownBrief}
            </pre>
          )}
        </div>
      </div>
    </div>
  );

  // If embedded directly inside a page, render cleanly in-place
  if (embedded) {
    return content;
  }

  // Otherwise render inside the modal wrapper
  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in duration-200"
      onClick={onClose}
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between shrink-0 rounded-t-3xl border-t border-x border-[var(--color-divider)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text)]">Executive CXO Steering Email Brief</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Outlook & Gmail Ready
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Generate and distribute rich-text executive steering updates to leadership
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal content body */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-b-3xl border-b border-x border-[var(--color-divider)]">
          {content}
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default CxoEmailBriefing;
