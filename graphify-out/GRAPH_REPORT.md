# Graph Report - ProjectPulse 2.0  (2026-11-10)

## Corpus Check
- 73 files · ~166,136 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 368 nodes · 1060 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `250855d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `useProject()` - 92 edges
2. `TaskStatus` - 32 edges
3. `useAuth()` - 29 edges
4. `daysDiff()` - 19 edges
5. `fmtDate()` - 18 edges
6. `todayStr()` - 17 edges
7. `exportProjectExcel()` - 17 edges
8. `TaskPriority` - 15 edges
9. `Task` - 15 edges
10. `getHealthScore()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ThemeFlyout()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/ThemeFlyout.tsx → src/store/ProjectContext.tsx
- `ViewExportButton()` --calls--> `useProject()`  [EXTRACTED]
  src/components/shared/ViewExportButton.tsx → src/store/ProjectContext.tsx
- `HelpModal()` --calls--> `useProject()`  [EXTRACTED]
  src/components/shared/HelpModal.tsx → src/store/ProjectContext.tsx
- `AIPulseAnalysis()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/AIPulseAnalysis.tsx → src/store/ProjectContext.tsx
- `ScaffolderView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/ScaffolderView.tsx → src/store/ProjectContext.tsx

## Communities (18 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (46): DomainTab, FieldArchitect(), StepTemplates(), SyncStep, SEVERITY_COLORS, STATUS_COLORS, NotificationFlyoutProps, CxoEmailModalProps (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (39): AccessDenied(), AccessDeniedProps, AccessManagerModal(), AccessManagerModalProps, LoginView(), getAllNavItems(), getHubForView(), NAV_HUBS (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (42): LogView(), buildExecutiveDashboardSheet(), buildFeatureMatrixWorkbook(), buildFeatureRolloutsSheet(), buildUnifiedTasksSheet(), downloadDeliveryTemplate(), drawTopKpiCard(), ExcelThemePalette (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (37): ComplexityFilter, FunctionalMatrix(), ViewMode, RegistryView(), BurndownChart(), ModuleDeliveryMatrix(), PredictiveIntelligence(), DEF_ST_MAP (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (21): ScaffolderView(), ScaffoldModule, GLOBAL_SHORTCUTS, ShortcutItem, STANDARD_FIELD_GUIDE, StandardFieldItem, VIEW_HELP_DATA, ViewHelpItem (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (19): ReleaseRoadmap(), ALM_ST_MAP, AutofitStrategy, DEL_ST_MAP, DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): 1.1 Brand Identity & Voice, 1.2 Design Tokens & System Replacements, 1. Executive Summary & Design Direction, 2. Actionable Task Checklist, 3. Verification & Acceptance Criteria, Anti-AI-Slop Implementation Plan: ProjectPulse 2.0, Batch 1: Token Discipline & Background De-Slopping (Priority 1), Batch 2: Icon & Copy De-Slopping (Priority 1) (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (7): DashboardView(), OverviewView(), CxoEmailModal(), COLORS, ReportType, ReportView(), getHealthScore()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (7): DARK_MAP, FilterCategory, LIGHT_MAP, ThemeDef, ThemeFlyout(), ThemeFlyoutProps, THEMES

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **111 isolated node(s):** `env`, `WidgetLayout`, `ProjectSettings`, `NavItem`, `NavHub` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 0`, `Community 10`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 10`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `env`, `WidgetLayout`, `ProjectSettings` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._