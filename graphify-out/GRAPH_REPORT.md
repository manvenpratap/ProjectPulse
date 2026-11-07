# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 58 files · ~66,180 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 229 nodes · 614 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27735cdc`
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

## God Nodes (most connected - your core abstractions)
1. `useProject()` - 78 edges
2. `TaskStatus` - 27 edges
3. `daysDiff()` - 16 edges
4. `TaskPriority` - 14 edges
5. `todayStr()` - 14 edges
6. `fmtDate()` - 14 edges
7. `Task` - 11 edges
8. `getHealthScore()` - 9 edges
9. `isBlocked()` - 7 edges
10. `DefectStatus` - 6 edges

## Surprising Connections (you probably didn't know these)
- `BoardView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/BoardView.tsx → src/store/ProjectContext.tsx
- `TaskGrid()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskGrid.tsx → src/store/ProjectContext.tsx
- `TaskView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskView.tsx → src/store/ProjectContext.tsx
- `ThemeFlyout()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/ThemeFlyout.tsx → src/store/ProjectContext.tsx
- `AIPulseAnalysis()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/AIPulseAnalysis.tsx → src/store/ProjectContext.tsx

## Communities (17 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (17): RegistryView(), DefectView(), MobileBottomNav(), MobileBottomNavProps, NotificationFlyout(), NotificationFlyoutProps, SetupView(), Sidebar() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (18): FieldArchitect(), FunctionalMatrix(), ScaffolderView(), ScaffoldModule, StepTemplates(), LogView(), CATEGORIES, SprintRetroView() (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (16): ModuleDeliveryMatrix(), getWebSample(), getDefaultState(), ProjectContext, ProjectContextType, ProjectProvider(), BoardView(), BoardViewProps (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): AIPulseAnalysis(), DefectModal(), DefectModalProps, RAIDView(), analyzeProject(), Button(), ButtonProps, cn() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (14): ReleaseRoadmap(), AutofitStrategy, DeliveriesView(), DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode, BaselineManager() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (13): OverviewView(), ThemeFlyout(), ThemeFlyoutProps, THEMES, Topbar(), TopbarProps, COLORS, ReportType (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (13): DensityMode, TaskGrid(), TaskGridProps, TaskModal(), TaskModalProps, HitArea, MonteCarloTaskResult, SortMode (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (10): BurndownChart(), DashboardView(), SEVERITY_COLORS, STATUS_COLORS, PredictiveIntelligence(), Decision, RaidItem, TaskPriority (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **65 isolated node(s):** `env`, `Leave`, `WidgetLayout`, `ProjectSettings`, `BoardViewProps` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `env`, `Leave`, `WidgetLayout` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._