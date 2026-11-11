import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../store/ProjectContext';
import { 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  FileText,
  Code,
  Layers,
  Sparkles,
  HelpCircle,
  Calendar,
  Clock,
  TrendingUp,
  Cpu,
  ShieldAlert,
  Send,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';
import { getHealthScore, fmtDate, daysDiff, isOverdue } from '../../utils/projectUtils';
import { TaskStatus, DefectStatus } from '../../types';
import Button from '../shared/Button';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

export interface CxoEmailBriefingProps {
  embedded?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export type AudiencePersona = 'executive' | 'technical' | 'steering';

export const CxoEmailBriefing: React.FC<CxoEmailBriefingProps> = ({ 
  embedded = false, 
  isOpen = true, 
  onClose 
}) => {
  const { state } = useProject();

  // Audience & Mode Presets
  const [persona, setPersona] = useState<AudiencePersona>('executive');
  const [cadence, setCadence] = useState<'weekly' | 'fortnightly'>('weekly');
  const [formatStyle, setFormatStyle] = useState<'full' | 'condensed'>('condensed');

  // Preview Workspace State
  const [previewTab, setPreviewTab] = useState<'html' | 'markdown' | 'plain'>('html');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [copiedType, setCopiedType] = useState<'html' | 'markdown' | 'plain' | 'subject' | null>(null);

  // Leadership Inputs
  const [execNote, setExecNote] = useState('');
  const [execAsk, setExecAsk] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);

  // Section Selectors (8 core sections)
  const [incAsks, setIncAsks] = useState(true);
  const [incSummary, setIncSummary] = useState(true);
  const [incKpi, setIncKpi] = useState(true);
  const [incStatusViz, setIncStatusViz] = useState(false);
  const [incModules, setIncModules] = useState(false);
  const [incWins, setIncWins] = useState(true);
  const [incPlanned, setIncPlanned] = useState(true);
  const [incRisks, setIncRisks] = useState(true);

  // Calculated Dates and Horizons
  const daysBack = cadence === 'fortnightly' ? 14 : 7;
  const cadenceLabel = cadence === 'fortnightly' ? 'Fortnightly Executive Brief' : 'Weekly Executive Brief';

  const now = useMemo(() => new Date(), []);
  const periodStart = useMemo(() => {
    const d = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now, daysBack]);

  const horizonEnd = useMemo(() => {
    const d = new Date(now.getTime() + daysBack * 24 * 60 * 60 * 1000);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [now, daysBack]);

  const periodStr = useMemo(() => {
    return `${fmtDate(periodStart.toISOString())} – ${fmtDate(now.toISOString())}`;
  }, [periodStart, now]);

  // Telemetry Aggregates
  const healthScore = getHealthScore(state.tasks);
  const healthLabel = healthScore > 80 ? 'On Track' : healthScore > 50 ? 'At Risk' : 'Critical';

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const inProgressTasks = state.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const reviewTasks = state.tasks.filter(t => t.status === TaskStatus.UNDER_REVIEW);
  const notStartedTasks = state.tasks.filter(t => t.status === TaskStatus.NOT_STARTED);
  const progressPct = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // GUI Screens Delivered
  const guiTasks = useMemo(() => {
    return state.tasks.filter(t => t.moduleType === 'GUI' || (t.guiScreens && t.guiScreens.length > 0) || t.type === 'screen');
  }, [state.tasks]);
  const completedGui = useMemo(() => {
    return guiTasks.filter(t => t.status === TaskStatus.COMPLETED);
  }, [guiTasks]);

  // Completed in this period (Wins)
  const recentWins = useMemo(() => {
    return state.tasks.filter(t => {
      if (t.status !== TaskStatus.COMPLETED) return false;
      const refDateStr = t.actCompletionDate || t.updatedAt || t.dueDate;
      if (!refDateStr) return true;
      const refDate = new Date(refDateStr);
      return refDate >= periodStart && refDate <= now;
    }).slice(0, formatStyle === 'condensed' ? 5 : 12);
  }, [state.tasks, periodStart, now, formatStyle]);

  // Planned for Next Cycle
  const upcomingDeliverables = useMemo(() => {
    return state.tasks.filter(t => {
      if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      if (!t.dueDate) return false;
      const dd = new Date(t.dueDate);
      return dd >= now && dd <= horizonEnd;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, formatStyle === 'condensed' ? 4 : 10);
  }, [state.tasks, now, horizonEnd, formatStyle]);

  // Slippage & Overdue
  const overdueTasks = useMemo(() => {
    return state.tasks.filter(isOverdue);
  }, [state.tasks]);

  // Critical defects & High RAID
  const criticalDefects = useMemo(() => {
    return (state.defects || []).filter(d => 
      d.status !== DefectStatus.CLOSED && 
      d.status !== DefectStatus.DEFERRED && 
      (d.severity?.startsWith('S1') || d.severity?.startsWith('S2') || d.severity === 'Critical' || d.severity === 'Major')
    );
  }, [state.defects]);

  const criticalRisks = useMemo(() => {
    return (state.raids || []).filter(r => 
      r.status === 'Open' && 
      r.type === 'Risk' && 
      (r.impact === 'High' || r.probability === 'High' || r.severity?.startsWith('S1'))
    );
  }, [state.raids]);

  // Pending Decisions Needing Sign-off
  const pendingDecisions = useMemo(() => {
    return (state.decisions || []).filter(d => 
      d.status === 'Pending Sign-off'
    );
  }, [state.decisions]);

  // Module Breakdown with Planned Release Version/Date
  const moduleBreakdown = useMemo(() => {
    const map = new Map<string, {
      total: number;
      completed: number;
      serverTotal: number;
      serverCompleted: number;
      guiTotal: number;
      guiCompleted: number;
      progressSum: number;
      earliestReleaseName: string;
      earliestReleaseDate: string | null;
    }>();

    state.tasks.forEach(t => {
      const m = (t.module || 'General').trim();
      const cur = map.get(m) || {
        total: 0,
        completed: 0,
        serverTotal: 0,
        serverCompleted: 0,
        guiTotal: 0,
        guiCompleted: 0,
        progressSum: 0,
        earliestReleaseName: '',
        earliestReleaseDate: null
      };

      cur.total++;
      const isGui = t.moduleType === 'GUI' || (t.guiScreens && t.guiScreens.length > 0) || t.type === 'screen';
      if (isGui) {
        cur.guiTotal++;
        if (t.status === TaskStatus.COMPLETED) cur.guiCompleted++;
      } else {
        cur.serverTotal++;
        if (t.status === TaskStatus.COMPLETED) cur.serverCompleted++;
      }

      if (t.status === TaskStatus.COMPLETED) cur.completed++;
      cur.progressSum += (t.progress || (t.status === TaskStatus.COMPLETED ? 100 : 0));

      // Resolve release version
      if (t.releaseVersion || t.release) {
        const relTag = String(t.releaseVersion || t.release);
        if (!cur.earliestReleaseName) cur.earliestReleaseName = relTag;
      }
      if (t.dueDate) {
        if (!cur.earliestReleaseDate || new Date(t.dueDate) < new Date(cur.earliestReleaseDate)) {
          cur.earliestReleaseDate = t.dueDate;
        }
      }

      map.set(m, cur);
    });

    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      total: stat.total,
      completed: stat.completed,
      serverTotal: stat.serverTotal,
      serverCompleted: stat.serverCompleted,
      guiTotal: stat.guiTotal,
      guiCompleted: stat.guiCompleted,
      avgProgress: stat.total > 0 ? Math.round(stat.progressSum / stat.total) : 0,
      releaseTarget: stat.earliestReleaseName || (stat.earliestReleaseDate ? fmtDate(stat.earliestReleaseDate) : 'Q4 Baseline')
    })).sort((a, b) => b.total - a.total).slice(0, formatStyle === 'condensed' ? 4 : 8);
  }, [state.tasks, formatStyle]);

  // Persona Presets Handler
  const handleApplyPersona = (p: AudiencePersona) => {
    setPersona(p);
    if (p === 'executive') {
      setFormatStyle('condensed');
      setIncAsks(true);
      setIncSummary(true);
      setIncKpi(true);
      setIncStatusViz(false);
      setIncModules(false);
      setIncWins(true);
      setIncPlanned(true);
      setIncRisks(true);
    } else if (p === 'technical') {
      setFormatStyle('full');
      setIncAsks(true);
      setIncSummary(true);
      setIncKpi(true);
      setIncStatusViz(true);
      setIncModules(true);
      setIncWins(true);
      setIncPlanned(true);
      setIncRisks(true);
    } else {
      // Steering Committee: Enable all
      setFormatStyle('full');
      setIncAsks(true);
      setIncSummary(true);
      setIncKpi(true);
      setIncStatusViz(true);
      setIncModules(true);
      setIncWins(true);
      setIncPlanned(true);
      setIncRisks(true);
    }
  };

  const handleSelectAllSections = (enableAll: boolean) => {
    setIncAsks(enableAll);
    setIncSummary(enableAll);
    setIncKpi(enableAll);
    setIncStatusViz(enableAll);
    setIncModules(enableAll);
    setIncWins(enableAll);
    setIncPlanned(enableAll);
    setIncRisks(enableAll);
  };

  // Dynamic Executive Subject Line
  const defaultSubjectLine = useMemo(() => {
    const personaTag = persona === 'executive' ? 'BOARD BRIEF' : persona === 'technical' ? 'TECH STEERING' : 'EXEC UPDATE';
    const asksPart = pendingDecisions.length > 0 || execAsk.trim() ? ` • Decisions Needed` : '';
    return `[${personaTag}] ${state.name} • ${healthLabel.toUpperCase()} (${healthScore}%) • ${periodStr}${asksPart}`;
  }, [persona, state.name, healthLabel, healthScore, periodStr, pendingDecisions.length, execAsk]);

  const activeSubjectLine = customSubject.trim() ? customSubject : defaultSubjectLine;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RICH EMAIL (HTML) GENERATOR (Outlook, Apple Mail, Gmail Optimized)
  // ═══════════════════════════════════════════════════════════════════════════
  const emailHtml = useMemo(() => {
    const isDark = previewTheme === 'dark';
    
    // Theme Colors (High contrast, executive enterprise palette)
    const cardBg = isDark ? '#0f172a' : '#ffffff';
    const bodyBg = isDark ? '#090d16' : '#f8fafc';
    const textMain = isDark ? '#f8fafc' : '#0f172a';
    const textSub = isDark ? '#94a3b8' : '#475569';
    const textFaint = isDark ? '#64748b' : '#94a3b8';
    const borderCol = isDark ? '#1e293b' : '#e2e8f0';
    const innerCardBg = isDark ? '#141e33' : '#f1f5f9';
    const tableHeaderBg = isDark ? '#1a243b' : '#f8fafc';

    // Health pill styling
    const healthBadgeBg = healthScore > 80 ? '#059669' : healthScore > 50 ? '#d97706' : '#dc2626';

    let h = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: ${bodyBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textMain}; -webkit-font-smoothing: antialiased; }
  table { border-collapse: collapse; }
  .email-card { width: 100%; max-width: 680px; margin: 0 auto; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
</style>
</head>
<body style="padding: 24px 12px; background: ${bodyBg};">
  <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; width: 100%; margin: 0 auto; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 12px; overflow: hidden; table-layout: fixed;">
    
    <!-- HEADER BANNER -->
    <tr>
      <td style="padding: 18px 20px; background: #0f172a; color: #ffffff; border-bottom: 2px solid #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="middle">
              <span style="display: inline-block; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(56,189,248,0.25);">
                ${cadenceLabel.toUpperCase()} • ${persona === 'executive' ? 'BOARD MEMO' : persona === 'technical' ? 'TECH DOSSIER' : 'STEERING'}
              </span>
            </td>
            <td align="right" valign="middle" style="white-space: nowrap; padding-left: 8px;">
              <span style="display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 800; background: ${healthBadgeBg}; color: #ffffff; border: 1px solid rgba(255,255,255,0.25);">
                ${healthLabel.toUpperCase()} (${healthScore}%)
              </span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 10px;">
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px; line-height: 1.3; word-break: break-word;">
                ${state.name}
              </h1>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 11px; color: #94a3b8; font-family: monospace;">
                    Reporting Period: <strong style="color: #cbd5e1;">${periodStr}</strong>
                  </td>
                  <td align="right" style="font-size: 9.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
                    Privileged
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
`;

    // 1. LEADERSHIP ASKS & PENDING DECISIONS (High-Impact Executive Box)
    if (incAsks && (pendingDecisions.length > 0 || execAsk.trim())) {
      h += `
    <tr>
      <td style="padding: 20px 28px; background: ${isDark ? '#1a1033' : '#faf5ff'}; border-bottom: 1px solid ${borderCol};">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed;">
            Decision Gate &amp; Leadership Input Required
          </span>
        </div>
`;
      if (execAsk.trim()) {
        h += `
        <div style="margin-bottom: 12px; font-size: 13.5px; line-height: 1.55; color: ${textMain}; background: ${cardBg}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
          <strong>Direct Steering Ask:</strong> ${execAsk.replace(/\n/g, '<br>')}
        </div>
`;
      }
      if (pendingDecisions.length > 0) {
        h += `
        <div style="font-size: 12px; font-weight: 700; color: ${textSub}; margin-bottom: 6px; text-transform: uppercase;">
          Pending Formal Governance Sign-Offs (${pendingDecisions.length}):
        </div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: ${textMain};">
`;
        pendingDecisions.forEach(d => {
          h += `
          <li style="margin-bottom: 4px;">
            <strong>${d.title}:</strong> ${d.desc || 'Requires executive approval'} 
            <span style="color: #7c3aed; font-size: 11px; font-weight: 700;">[Due: ${fmtDate(d.dueDate)}]</span>
          </li>
`;
        });
        h += `
        </ul>
`;
      }
      h += `
      </td>
    </tr>
`;
    }

    // EXECUTIVE STEERING NOTE (If user entered one)
    if (execNote.trim()) {
      h += `
    <tr>
      <td style="padding: 16px 28px; background: ${innerCardBg}; border-bottom: 1px solid ${borderCol};">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #2563eb; margin-bottom: 4px;">
          Executive Status Commentary
        </div>
        <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: ${textMain}; font-style: italic;">
          “${execNote}”
        </p>
      </td>
    </tr>
`;
    }

    // 2. EXECUTIVE NARRATIVE SUMMARY
    if (incSummary) {
      h += `
    <tr>
      <td style="padding: 24px 28px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #2563eb; padding-left: 8px;">
          1. Steering Executive Summary
        </h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.65; color: ${textSub};">
          <li style="margin-bottom: 6px;">
            <strong>Delivery Momentum:</strong> Platform health is certified at <strong>${healthScore}% (${healthLabel})</strong> with cumulative scope completion at <strong>${progressPct}%</strong> (${completedTasks.length} of ${totalTasks} total deliverables).
          </li>
          <li style="margin-bottom: 6px;">
            <strong>Screen &amp; GUI Execution:</strong> <strong>${completedGui.length} of ${guiTasks.length}</strong> strategic user interfaces and touchpoints verified.
          </li>
          <li style="margin-bottom: 6px;">
            <strong>Cycle Output:</strong> <strong>${recentWins.length} deliverable(s)</strong> signed off during this ${cadence} cadence.
          </li>
          ${overdueTasks.length > 0 ? `
          <li style="margin-bottom: 6px; color: #dc2626;">
            <strong>Schedule Variance:</strong> <strong>${overdueTasks.length} deliverable(s)</strong> past target deadline requiring sprint timeline leveling.
          </li>` : `
          <li style="margin-bottom: 6px; color: #059669;">
            <strong>Schedule Compliance:</strong> Zero overdue deliverables across all active workstreams.
          </li>`}
          ${criticalDefects.length > 0 ? `
          <li style="margin-bottom: 6px; color: #dc2626;">
            <strong>Quality Gate:</strong> <strong>${criticalDefects.length} S1/S2 defect(s)</strong> active in triage.
          </li>` : `
          <li style="margin-bottom: 6px; color: #059669;">
            <strong>Quality Gate:</strong> Zero open S1/S2 high-severity defects.
          </li>`}
        </ul>
      </td>
    </tr>
`;
    }

    // 3. PORTFOLIO TELEMETRY CARDS (Bento Grid)
    if (incKpi) {
      h += `
    <tr>
      <td style="padding: 24px 28px; border-bottom: 1px solid ${borderCol}; background: ${innerCardBg};">
        <h3 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #0891b2; padding-left: 8px;">
          2. Portfolio Telemetry Scorecard
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="23%" style="padding: 14px; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 10px; font-weight: 700; color: ${textFaint}; text-transform: uppercase;">Completion</div>
              <div style="font-size: 22px; font-weight: 900; color: #2563eb; margin: 4px 0;">${progressPct}%</div>
              <div style="font-size: 11px; color: ${textSub};">${completedTasks.length}/${totalTasks} Tasks</div>
            </td>
            <td width="2%"></td>
            <td width="23%" style="padding: 14px; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 10px; font-weight: 700; color: ${textFaint}; text-transform: uppercase;">Screens Done</div>
              <div style="font-size: 22px; font-weight: 900; color: #059669; margin: 4px 0;">${completedGui.length} <span style="font-size: 13px; font-weight: 600; color: ${textFaint};">/ ${guiTasks.length}</span></div>
              <div style="font-size: 11px; color: ${textSub};">GUI Interfaces</div>
            </td>
            <td width="2%"></td>
            <td width="23%" style="padding: 14px; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 10px; font-weight: 700; color: ${textFaint}; text-transform: uppercase;">Cycle Velocity</div>
              <div style="font-size: 22px; font-weight: 900; color: #7c3aed; margin: 4px 0;">${recentWins.length}</div>
              <div style="font-size: 11px; color: ${textSub};">Closed This ${cadence === 'weekly' ? 'Wk' : 'Cycle'}</div>
            </td>
            <td width="2%"></td>
            <td width="25%" style="padding: 14px; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 8px; vertical-align: top;">
              <div style="font-size: 10px; font-weight: 700; color: ${textFaint}; text-transform: uppercase;">Defects &amp; Risks</div>
              <div style="font-size: 22px; font-weight: 900; color: ${criticalDefects.length + criticalRisks.length > 0 ? '#dc2626' : '#059669'}; margin: 4px 0;">${criticalDefects.length + criticalRisks.length}</div>
              <div style="font-size: 11px; color: ${textSub};">${criticalDefects.length} S1/S2 • ${criticalRisks.length} Risks</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
`;
    }

    // 4. STATUS DISTRIBUTION SNAPSHOT
    if (incStatusViz) {
      h += `
    <tr>
      <td style="padding: 22px 28px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #0891b2; padding-left: 8px;">
          3. Deliverable Status Distribution
        </h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; border: 1px solid ${borderCol}; border-radius: 8px;">
          <tr style="background: ${tableHeaderBg}; border-bottom: 1px solid ${borderCol}; text-align: left; font-weight: 700; color: ${textSub};">
            <th style="padding: 8px 10px;">Status Bucket</th>
            <th style="padding: 8px 10px; text-align: center;">Count</th>
            <th style="padding: 8px 10px; width: 45%;">Distribution</th>
            <th style="padding: 8px 10px; text-align: right;">Share</th>
          </tr>
          <tr>
            <td style="padding: 7px 10px; font-weight: 600; color: #059669;">Completed</td>
            <td style="padding: 7px 10px; text-align: center; font-mono font-bold;">${completedTasks.length}</td>
            <td style="padding: 7px 10px;">
              <div style="background: ${borderCol}; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #059669; height: 100%; width: ${progressPct}%;"></div>
              </div>
            </td>
            <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #059669;">${progressPct}%</td>
          </tr>
          <tr>
            <td style="padding: 7px 10px; font-weight: 600; color: #2563eb;">In Progress</td>
            <td style="padding: 7px 10px; text-align: center; font-mono font-bold;">${inProgressTasks.length}</td>
            <td style="padding: 7px 10px;">
              <div style="background: ${borderCol}; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #2563eb; height: 100%; width: ${totalTasks > 0 ? Math.round((inProgressTasks.length / totalTasks) * 100) : 0}%;"></div>
              </div>
            </td>
            <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #2563eb;">${totalTasks > 0 ? Math.round((inProgressTasks.length / totalTasks) * 100) : 0}%</td>
          </tr>
          <tr>
            <td style="padding: 7px 10px; font-weight: 600; color: #7c3aed;">Review</td>
            <td style="padding: 7px 10px; text-align: center; font-mono font-bold;">${reviewTasks.length}</td>
            <td style="padding: 7px 10px;">
              <div style="background: ${borderCol}; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #7c3aed; height: 100%; width: ${totalTasks > 0 ? Math.round((reviewTasks.length / totalTasks) * 100) : 0}%;"></div>
              </div>
            </td>
            <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #7c3aed;">${totalTasks > 0 ? Math.round((reviewTasks.length / totalTasks) * 100) : 0}%</td>
          </tr>
          <tr>
            <td style="padding: 7px 10px; font-weight: 600; color: ${textFaint};">Not Started</td>
            <td style="padding: 7px 10px; text-align: center; font-mono font-bold;">${notStartedTasks.length}</td>
            <td style="padding: 7px 10px;">
              <div style="background: ${borderCol}; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: ${textFaint}; height: 100%; width: ${totalTasks > 0 ? Math.round((notStartedTasks.length / totalTasks) * 100) : 0}%;"></div>
              </div>
            </td>
            <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: ${textFaint};">${totalTasks > 0 ? Math.round((notStartedTasks.length / totalTasks) * 100) : 0}%</td>
          </tr>
        </table>
      </td>
    </tr>
`;
    }

    // 5. MODULE ARCHITECTURE & RELEASES
    if (incModules && moduleBreakdown.length > 0) {
      h += `
    <tr>
      <td style="padding: 24px 28px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 800; color: ${textMain}; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #6366f1; padding-left: 8px;">
          4. Module Architecture &amp; Delivery Horizon
        </h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; text-align: left; border: 1px solid ${borderCol}; border-radius: 8px;">
          <tr style="background: ${tableHeaderBg}; color: ${textSub}; font-weight: 700; border-bottom: 2px solid ${borderCol};">
            <th style="padding: 8px 10px;">Domain Module</th>
            <th style="padding: 8px 10px;">Target Release</th>
            <th style="padding: 8px 10px; text-align: center;">Deliverables</th>
            <th style="padding: 8px 10px; width: 30%;">Progress</th>
            <th style="padding: 8px 10px; text-align: right;">Status</th>
          </tr>
`;
      moduleBreakdown.forEach((m, idx) => {
        const rowBg = idx % 2 === 0 ? cardBg : innerCardBg;
        h += `
          <tr style="background: ${rowBg}; border-bottom: 1px solid ${borderCol};">
            <td style="padding: 8px 10px; font-weight: 700; color: ${textMain};">${m.name}</td>
            <td style="padding: 8px 10px; color: ${textSub}; font-family: monospace; font-size: 11px;">${m.releaseTarget}</td>
            <td style="padding: 8px 10px; text-align: center; color: ${textSub}; font-family: monospace;">${m.completed}/${m.total}</td>
            <td style="padding: 8px 10px;">
              <div style="background: ${borderCol}; border-radius: 4px; height: 6px; width: 100%; overflow: hidden;">
                <div style="background: #2563eb; height: 100%; width: ${m.avgProgress}%;"></div>
              </div>
            </td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: ${m.avgProgress === 100 ? '#059669' : '#2563eb'};">${m.avgProgress}%</td>
          </tr>
`;
      });
      h += `
        </table>
      </td>
    </tr>
`;
    }

    // 6. DELIVERED WINS (This Cycle)
    if (incWins && recentWins.length > 0) {
      h += `
    <tr>
      <td style="padding: 24px 28px; border-bottom: 1px solid ${borderCol};">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #059669; padding-left: 8px;">
          5. Verified Deliverables &amp; Cycle Wins (${recentWins.length})
        </h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px;">
`;
      recentWins.forEach(w => {
        h += `
          <tr style="border-bottom: 1px solid ${innerCardBg};">
            <td style="padding: 7px 4px; font-weight: 600; color: ${textMain};">
              [x] ${w.name}
            </td>
            <td style="padding: 7px 4px; color: ${textSub}; font-size: 11px; text-align: right; font-family: monospace;">
              ${w.module || 'Core'} • ${w.assignee || 'Team'}
            </td>
          </tr>
`;
      });
      h += `
        </table>
      </td>
    </tr>
`;
    }

    // 7. PLANNED NEXT CYCLE
    if (incPlanned && upcomingDeliverables.length > 0) {
      h += `
    <tr>
      <td style="padding: 24px 28px; border-bottom: 1px solid ${borderCol}; background: ${innerCardBg};">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #0891b2; padding-left: 8px;">
          6. Planned for Next Cycle Horizon (${upcomingDeliverables.length})
        </h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px;">
`;
      upcomingDeliverables.forEach(t => {
        h += `
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 7px 4px; font-weight: 600; color: ${textMain};">
              [ ] ${t.name}
            </td>
            <td style="padding: 7px 4px; color: ${textSub}; font-size: 11px; text-align: right; font-family: monospace;">
              Due: ${fmtDate(t.dueDate)} • ${t.assignee || 'Assigned'}
            </td>
          </tr>
`;
      });
      h += `
        </table>
      </td>
    </tr>
`;
    }

    // 8. SCHEDULE SLIPPAGE & CRITICAL RISKS
    if (incRisks && (overdueTasks.length > 0 || criticalRisks.length > 0)) {
      h += `
    <tr>
      <td style="padding: 24px 28px; border-bottom: 1px solid ${borderCol}; background: ${isDark ? '#261214' : '#fff5f5'};">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #dc2626; padding-left: 8px;">
          7. Schedule Variance &amp; Risk Mitigation
        </h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; line-height: 1.6; color: ${isDark ? '#fca5a5' : '#991b1b'};">
`;
      overdueTasks.slice(0, 5).forEach(ot => {
        const dd = daysDiff(ot.dueDate);
        h += `
          <li style="margin-bottom: 4px;">
            <strong>Overdue (${Math.abs(dd || 0)}d):</strong> ${ot.name} 
            <span style="font-family: monospace; font-size: 11px;">[Assignee: ${ot.assignee || 'Unassigned'}]</span>
          </li>
`;
      });
      criticalRisks.slice(0, 4).forEach(r => {
        h += `
          <li style="margin-bottom: 4px;">
            <strong>High Risk:</strong> ${r.title} 
            <span style="font-family: monospace; font-size: 11px;">[Owner: ${r.owner || 'Lead'} • Impact: High]</span>
          </li>
`;
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
      <td style="padding: 18px 28px; background: #0f172a; text-align: center; font-size: 11px; color: #64748b; font-family: monospace;">
        ProjectPulse 2.0 • Executive Delivery Intelligence • Automated Governance Signature
      </td>
    </tr>
  </table>
</body>
</html>
`;
    return h;
  }, [
    previewTheme, healthScore, healthLabel, cadenceLabel, persona, state.name, periodStr,
    incAsks, pendingDecisions, execAsk, execNote, incSummary, progressPct, completedTasks.length,
    totalTasks, completedGui.length, guiTasks.length, recentWins, cadence, overdueTasks,
    criticalDefects, incKpi, criticalRisks, incStatusViz, inProgressTasks.length, reviewTasks.length,
    notStartedTasks.length, incModules, moduleBreakdown, incWins, incPlanned, upcomingDeliverables,
    incRisks
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MARKDOWN BRIEF GENERATOR (Slack, Teams, Notion Optimized)
  // ═══════════════════════════════════════════════════════════════════════════
  const markdownBrief = useMemo(() => {
    let md = `# ${cadenceLabel.toUpperCase()}: ${state.name}\n`;
    md += `**Window:** ${periodStr} | **Health Index:** ${healthLabel.toUpperCase()} (${healthScore}%)\n`;
    md += `**Classification:** Confidential & Steering Privileged\n\n`;

    if (incAsks && (pendingDecisions.length > 0 || execAsk.trim())) {
      md += `## Leadership Input & Decision Gate\n`;
      if (execAsk.trim()) {
        md += `> **Direct Steering Ask:** ${execAsk}\n\n`;
      }
      if (pendingDecisions.length > 0) {
        md += `**Pending Approvals Required (${pendingDecisions.length}):**\n`;
        pendingDecisions.forEach(d => {
          md += `- **[Sign-off Needed]** ${d.title} (Due: ${fmtDate(d.dueDate)})\n`;
        });
        md += `\n`;
      }
    }

    if (execNote.trim()) {
      md += `> **Executive Note:** ${execNote}\n\n`;
    }

    if (incSummary) {
      md += `## 1. Executive Steering Summary\n`;
      md += `- Delivery Momentum: **${healthScore}% (${healthLabel})** with overall progress at **${progressPct}%** (${completedTasks.length}/${totalTasks} tasks).\n`;
      md += `- Strategy Screens: **${completedGui.length} of ${guiTasks.length}** GUI touchpoints delivered.\n`;
      md += `- Cycle Velocity: **${recentWins.length} deliverable(s)** closed during this cycle.\n`;
      md += overdueTasks.length > 0 ? `- Schedule Variance: **${overdueTasks.length} task(s)** past target deadline.\n` : `- Schedule Compliance: Zero overdue deliverables detected.\n`;
      md += criticalDefects.length > 0 ? `- Quality Gate: **${criticalDefects.length} S1/S2 open defect(s)**.\n\n` : `- Quality Gate: Zero critical defects open.\n\n`;
    }

    if (incKpi) {
      md += `## 2. Telemetry Scorecard\n`;
      md += `| Completion | Screens Delivered | Cycle Velocity | Defects & Risks |\n`;
      md += `| :---: | :---: | :---: | :---: |\n`;
      md += `| **${progressPct}%** (${completedTasks.length}/${totalTasks}) | **${completedGui.length}/${guiTasks.length}** | **${recentWins.length}** closed | **${criticalDefects.length + criticalRisks.length}** active |\n\n`;
    }

    if (incModules && moduleBreakdown.length > 0) {
      md += `## 3. Module Architecture\n`;
      md += `| Module | Target Release | Progress | Completed / Total |\n`;
      md += `| :--- | :--- | :---: | :---: |\n`;
      moduleBreakdown.forEach(m => {
        md += `| ${m.name} | ${m.releaseTarget} | ${m.avgProgress}% | ${m.completed}/${m.total} |\n`;
      });
      md += `\n`;
    }

    if (incWins && recentWins.length > 0) {
      md += `## 4. Completed Wins (This Period)\n`;
      recentWins.forEach(w => {
        md += `- [x] **${w.name}** (${w.module || 'Core'} • ${w.assignee || 'Team'})\n`;
      });
      md += `\n`;
    }

    if (incPlanned && upcomingDeliverables.length > 0) {
      md += `## 5. Planned for Next Cycle\n`;
      upcomingDeliverables.forEach(t => {
        md += `- [ ] **${t.name}** (Due: ${fmtDate(t.dueDate)} • ${t.assignee || 'Assigned'})\n`;
      });
      md += `\n`;
    }

    if (incRisks && (overdueTasks.length > 0 || criticalRisks.length > 0)) {
      md += `## 6. Schedule Slippage & Risk Exposure\n`;
      overdueTasks.slice(0, 5).forEach(ot => {
        const dd = daysDiff(ot.dueDate);
        md += `- **[Overdue (${Math.abs(dd || 0)}d)]** ${ot.name} (${ot.assignee || 'Unassigned'})\n`;
      });
      criticalRisks.slice(0, 4).forEach(r => {
        md += `- **[High Risk]** ${r.title} (Owner: ${r.owner || 'Lead'})\n`;
      });
      md += `\n`;
    }

    md += `---\n*Generated by ProjectPulse 2.0 • Executive Delivery Intelligence*`;
    return md;
  }, [
    cadenceLabel, state.name, periodStr, healthLabel, healthScore, incAsks, pendingDecisions,
    execAsk, execNote, incSummary, progressPct, completedTasks.length, totalTasks, completedGui.length,
    guiTasks.length, recentWins, overdueTasks, criticalDefects, incKpi, criticalRisks, incModules,
    moduleBreakdown, incWins, incPlanned, upcomingDeliverables, incRisks
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PLAIN TEXT BRIEF GENERATOR (ASCII / Raw Memo)
  // ═══════════════════════════════════════════════════════════════════════════
  const plainTextBrief = useMemo(() => {
    let pt = `======================================================================\n`;
    pt += `${cadenceLabel.toUpperCase()}: ${state.name}\n`;
    pt += `Period: ${periodStr}  |  Health: ${healthLabel.toUpperCase()} (${healthScore}%)\n`;
    pt += `Classification: Confidential & Steering Privileged\n`;
    pt += `======================================================================\n\n`;

    if (incAsks && (pendingDecisions.length > 0 || execAsk.trim())) {
      pt += `[DECISION GATE & MANAGEMENT ASKS]\n`;
      if (execAsk.trim()) pt += `Direct Ask: ${execAsk}\n`;
      if (pendingDecisions.length > 0) {
        pendingDecisions.forEach(d => {
          pt += `* Sign-off Needed: ${d.title} (Due: ${fmtDate(d.dueDate)})\n`;
        });
      }
      pt += `\n`;
    }

    if (execNote.trim()) {
      pt += `[EXECUTIVE COMMENTARY]\n"${execNote}"\n\n`;
    }

    if (incSummary) {
      pt += `[EXECUTIVE SUMMARY]\n`;
      pt += `* Progress: ${progressPct}% (${completedTasks.length}/${totalTasks} deliverables done)\n`;
      pt += `* Screens: ${completedGui.length}/${guiTasks.length} GUI interfaces completed\n`;
      pt += `* Velocity: ${recentWins.length} items signed off this cycle\n`;
      pt += `* Schedule: ${overdueTasks.length} overdue task(s)\n`;
      pt += `* Quality: ${criticalDefects.length} S1/S2 critical bug(s)\n\n`;
    }

    if (incWins && recentWins.length > 0) {
      pt += `[COMPLETED THIS PERIOD]\n`;
      recentWins.forEach(w => {
        pt += `[X] ${w.name} (${w.module || 'Core'} - ${w.assignee || 'Team'})\n`;
      });
      pt += `\n`;
    }

    if (incPlanned && upcomingDeliverables.length > 0) {
      pt += `[PLANNED FOR NEXT CYCLE]\n`;
      upcomingDeliverables.forEach(t => {
        pt += `[ ] ${t.name} (Due: ${fmtDate(t.dueDate)} - ${t.assignee || 'Assigned'})\n`;
      });
      pt += `\n`;
    }

    if (incRisks && (overdueTasks.length > 0 || criticalRisks.length > 0)) {
      pt += `[SLIPPAGE & RISKS]\n`;
      overdueTasks.slice(0, 5).forEach(ot => {
        const dd = daysDiff(ot.dueDate);
        pt += `* Overdue (${Math.abs(dd || 0)}d): ${ot.name} (${ot.assignee || 'Unassigned'})\n`;
      });
      criticalRisks.slice(0, 4).forEach(r => {
        pt += `* High Risk: ${r.title} (Owner: ${r.owner || 'Lead'})\n`;
      });
      pt += `\n`;
    }

    pt += `Generated by ProjectPulse 2.0`;
    return pt;
  }, [
    cadenceLabel, state.name, periodStr, healthLabel, healthScore, incAsks, pendingDecisions,
    execAsk, execNote, incSummary, progressPct, completedTasks.length, totalTasks, completedGui.length,
    guiTasks.length, recentWins, overdueTasks, criticalDefects, incWins, incPlanned,
    upcomingDeliverables, incRisks, criticalRisks
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIPBOARD & EXPORT ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCopyHtml = async () => {
    try {
      const blob = new Blob([emailHtml], { type: 'text/html' });
      const plainBlob = new Blob([plainTextBrief], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': plainBlob
      });
      await navigator.clipboard.write([item]);
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
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

  const handleCopyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(plainTextBrief);
    } catch {
      // Fallback
    }
    setCopiedType('plain');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(activeSubjectLine);
    } catch {
      // Fallback
    }
    setCopiedType('subject');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(activeSubjectLine);
    const body = encodeURIComponent(plainTextBrief);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER WORKSPACE (Configurator + Live Preview)
  // ═══════════════════════════════════════════════════════════════════════════
  const content = (
    <div className={clsx(
      "flex flex-col lg:flex-row bg-[var(--color-surface)] border border-[var(--color-divider)] overflow-hidden",
      embedded 
        ? "rounded-2xl shadow-sm min-h-[720px] h-[calc(100vh-210px)] max-h-[960px]" 
        : "w-full max-w-6xl h-[92vh] max-h-[900px] rounded-3xl shadow-2xl"
    )}>
      
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEFT: Configurator Studio Panel (Width: 380px)                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[380px] xl:w-[420px] border-b lg:border-b-0 lg:border-r border-[var(--color-divider)] bg-[var(--color-surface)] p-4 sm:p-5 overflow-y-auto custom-scroll space-y-5 shrink-0 flex flex-col justify-between">
        <div className="space-y-4">
          
          {/* Header in Configurator */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20 shadow-2xs">
                <Mail size={15} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[var(--color-text)]">Report Configurator &amp; Options</h2>
                <p className="text-[10px] text-[var(--color-text-muted)]">Configure and dispatch executive updates</p>
              </div>
            </div>
          </div>

          {/* Persona Presets (1-Click Audience Selection) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider">
                Audience Persona
              </label>
              <span className="text-[10px] text-[var(--color-primary-hex)] font-semibold">Auto-Configures</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <button
                type="button"
                onClick={() => handleApplyPersona('executive')}
                className={clsx(
                  "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center gap-0.5",
                  persona === 'executive'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs border border-[var(--color-divider)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span>Board / CEO</span>
                <span className="text-[9px] font-normal opacity-75">Condensed</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPersona('technical')}
                className={clsx(
                  "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center gap-0.5",
                  persona === 'technical'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs border border-[var(--color-divider)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span>CTO / Eng</span>
                <span className="text-[9px] font-normal opacity-75">Technical</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPersona('steering')}
                className={clsx(
                  "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center gap-0.5",
                  persona === 'steering'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs border border-[var(--color-divider)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span>Steering</span>
                <span className="text-[9px] font-normal opacity-75">Full Dossier</span>
              </button>
            </div>
          </div>

          {/* Cadence & Format Controls */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-1.5 block">
                Cadence
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setCadence('weekly')}
                  className={clsx(
                    "py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                    cadence === 'weekly' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Weekly (7d)
                </button>
                <button
                  type="button"
                  onClick={() => setCadence('fortnightly')}
                  className={clsx(
                    "py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                    cadence === 'fortnightly' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Fortnightly (14d)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-1.5 block">
                Format Style
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setFormatStyle('condensed')}
                  className={clsx(
                    "py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                    formatStyle === 'condensed' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Brief
                </button>
                <button
                  type="button"
                  onClick={() => setFormatStyle('full')}
                  className={clsx(
                    "py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                    formatStyle === 'full' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>

          {/* Section Toggles with Select All */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider block">
                Included Sections (8)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button 
                  type="button"
                  onClick={() => handleSelectAllSections(true)} 
                  className="text-[var(--color-primary-hex)] font-bold hover:underline cursor-pointer"
                >
                  All
                </button>
                <span className="text-[var(--color-divider)]">|</span>
                <button 
                  type="button"
                  onClick={() => handleSelectAllSections(false)} 
                  className="text-[var(--color-text-muted)] font-medium hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Decision Gate & Asks', state: incAsks, set: setIncAsks, badge: pendingDecisions.length > 0 ? `${pendingDecisions.length}` : null },
                { label: 'Executive Summary', state: incSummary, set: setIncSummary },
                { label: 'Telemetry Scorecard', state: incKpi, set: setIncKpi },
                { label: 'Status Snapshot', state: incStatusViz, set: setIncStatusViz },
                { label: 'Module Performance', state: incModules, set: setIncModules },
                { label: 'Cycle Wins', state: incWins, set: setIncWins, badge: `${recentWins.length}` },
                { label: 'Next Cycle Horizon', state: incPlanned, set: setIncPlanned },
                { label: 'Slippage & Risks', state: incRisks, set: setIncRisks, badge: overdueTasks.length > 0 ? `${overdueTasks.length}` : null },
              ].map((sec, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sec.set(!sec.state)}
                  className={clsx(
                    "flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer",
                    sec.state 
                      ? "bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-primary-hex)]/30 shadow-2xs font-semibold"
                      : "bg-[var(--color-surface)] text-[var(--color-text-faint)] border-[var(--color-divider)] opacity-60"
                  )}
                >
                  <span className="truncate pr-1">{sec.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {sec.badge && (
                      <span className="px-1.5 py-0.2 rounded-md bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] text-[9px] font-mono font-bold">
                        {sec.badge}
                      </span>
                    )}
                    {sec.state ? <CheckSquare size={13} className="text-[var(--color-primary-hex)]" /> : <Square size={13} className="text-[var(--color-text-faint)]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Management Ask / Support Required (Critical CXO input) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider block">
                Management Asks / Escalations
              </label>
              {pendingDecisions.length > 0 && (
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={10} /> {pendingDecisions.length} Pending Sign-offs
                </span>
              )}
            </div>
            <textarea
              value={execAsk}
              onChange={(e) => setExecAsk(e.target.value)}
              placeholder="e.g. Budget authorization required for AWS multi-region failover; sign-off requested by Friday EOD."
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-hex)]/20 focus:border-[var(--color-primary-hex)] transition-all resize-none font-sans"
            />
          </div>

          {/* Executive Commentary Note */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-1.5 block">
              Steering Commentary (Optional)
            </label>
            <textarea
              value={execNote}
              onChange={(e) => setExecNote(e.target.value)}
              placeholder="e.g. Core banking microservices passed stress testing with zero latency degradations."
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-hex)]/20 focus:border-[var(--color-primary-hex)] transition-all resize-none font-sans"
            />
          </div>
        </div>

        {/* Live Compatibility Status Pill */}
        <div className="pt-3 border-t border-[var(--color-divider)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text)]">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Format Compatibility:</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--color-text-faint)]">Outlook • Apple Mail • Gmail</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* RIGHT: Live Interactive Preview & Action Studio                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[var(--color-surface-offset)]/40 overflow-hidden min-w-0">
        
        {/* Top Control Bar: Subject line & Format Actions */}
        <div className="p-3 sm:px-5 border-b border-[var(--color-divider)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          
          {/* Format Tabs & Responsive Device Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format Switch */}
            <div className="flex p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <button
                type="button"
                onClick={() => setPreviewTab('html')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  previewTab === 'html' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)]"
                )}
              >
                <Code size={13} />
                <span>Rich Email (HTML)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('markdown')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  previewTab === 'markdown' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)]"
                )}
              >
                <FileText size={13} />
                <span>Markdown</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('plain')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  previewTab === 'plain' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)]"
                )}
              >
                <span>Plain Text</span>
              </button>
            </div>

            {/* Device Switcher (Desktop 680px vs Mobile 375px) */}
            {previewTab === 'html' && (
              <div className="flex p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={clsx(
                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                    previewDevice === 'desktop' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)]"
                  )}
                  title="Desktop Viewport (680px)"
                >
                  <Monitor size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={clsx(
                    "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                    previewDevice === 'mobile' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)]"
                  )}
                  title="Mobile Viewport (375px)"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            )}

            {/* Email Theme Switcher */}
            {previewTab === 'html' && (
              <button
                type="button"
                onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
                className="h-7 px-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
                title="Toggle Email Client Theme (Light/Dark)"
              >
                {previewTheme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
                <span className="capitalize">{previewTheme}</span>
              </button>
            )}
          </div>

          {/* Action Button Suite (Top Right Primary Action Alignment) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenMailto}
              title="Open in your default mail application"
              className="rounded-xl h-8 px-2.5 text-xs font-semibold"
            >
              <Send size={13} className="mr-1.5 text-sky-500" />
              <span>Mail App</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="rounded-xl h-8 px-2.5 text-xs font-semibold"
            >
              {copiedType === 'markdown' ? <Check size={13} className="mr-1.5 text-emerald-500" /> : <Copy size={13} className="mr-1.5" />}
              <span>{copiedType === 'markdown' ? 'Copied MD!' : 'Copy MD'}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyHtml}
              className="rounded-xl h-8 px-3.5 text-xs font-bold shadow-sm"
            >
              {copiedType === 'html' ? <Check size={13} className="mr-1.5 text-white" /> : <Copy size={13} className="mr-1.5" />}
              <span>{copiedType === 'html' ? 'Copied HTML!' : 'Copy Rich Email'}</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Subject Line Strip with 1-Click Copy */}
        <div className="px-4 py-2 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px] shrink-0">
              Subject:
            </span>
            <input
              type="text"
              value={activeSubjectLine}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="font-mono text-xs text-[var(--color-text)] bg-transparent border-none focus:outline-none flex-1 truncate font-semibold"
              title="Click to edit subject line"
            />
          </div>
          <button
            type="button"
            onClick={handleCopySubject}
            className="px-2 py-1 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[11px] font-bold text-[var(--color-text)] transition-colors cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
            title="Copy subject line to clipboard"
          >
            {copiedType === 'subject' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            <span>{copiedType === 'subject' ? 'Copied!' : 'Copy Subject'}</span>
          </button>
        </div>

        {/* Live Interactive Preview Canvas */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto overflow-x-auto custom-scroll flex justify-center items-start">
          <div 
            className="w-full transition-all duration-300 mx-auto"
            style={{ maxWidth: previewTab === 'html' && previewDevice === 'mobile' ? '375px' : '720px' }}
          >
            {previewTab === 'html' ? (
              <div 
                className={clsx(
                  "rounded-2xl shadow-md border overflow-x-auto transition-colors",
                  previewTheme === 'dark' ? "bg-[#090d16] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
              >
                <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
              </div>
            ) : previewTab === 'markdown' ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span className="font-mono">Markdown Brief (Slack / Teams / Notion)</span>
                  <button
                    onClick={handleCopyMarkdown}
                    className="text-[var(--color-primary-hex)] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy Markdown
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {markdownBrief}
                </pre>
              </div>
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span className="font-mono">Plain Text (ASCII Memo)</span>
                  <button
                    onClick={handleCopyPlainText}
                    className="text-[var(--color-primary-hex)] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy Plain Text
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {plainTextBrief}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // If embedded directly inside a page (e.g. ReportView), return directly
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
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-6xl h-[94vh] max-h-[920px] flex flex-col overflow-hidden rounded-3xl border border-[var(--color-divider)] shadow-2xl bg-[var(--color-surface)]"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-3.5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <Mail size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text)]">Executive CXO Steering Email Brief</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Outlook &amp; Gmail Certified
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Automated status reporting and executive intelligence memo
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal content body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {content}
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default CxoEmailBriefing;
