# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 59 files · ~67,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 235 nodes · 632 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a97fa8fa`
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
1. `useProject()` - 80 edges
2. `TaskStatus` - 27 edges
3. `daysDiff()` - 16 edges
4. `TaskPriority` - 14 edges
5. `todayStr()` - 14 edges
6. `fmtDate()` - 14 edges
7. `Task` - 11 edges
8. `getHealthScore()` - 9 edges
9. `getHubForView()` - 7 edges
10. `isBlocked()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `BoardView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/BoardView.tsx → src/store/ProjectContext.tsx
- `TaskGrid()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskGrid.tsx → src/store/ProjectContext.tsx
- `TaskView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskView.tsx → src/store/ProjectContext.tsx
- `ThemeFlyout()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/ThemeFlyout.tsx → src/store/ProjectContext.tsx
- `NotificationFlyout()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/NotificationFlyout.tsx → src/store/ProjectContext.tsx

## Communities (17 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (30): FieldArchitect(), FunctionalMatrix(), RegistryView(), ScaffolderView(), ScaffoldModule, StepTemplates(), getHubForView(), NAV_HUBS (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (21): ReleaseRoadmap(), BurndownChart(), NotificationFlyout(), NotificationFlyoutProps, BaselineManager(), CapacityView(), HitArea, MonteCarloTaskResult (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (20): CATEGORIES, SprintRetroView(), BoardView(), BoardViewProps, DensityMode, TaskGrid(), TaskGridProps, TaskModal() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.2
Nodes (15): DefectModal(), DefectModalProps, RAIDView(), getWebSample(), getDefaultState(), ProjectContext, ProjectContextType, ProjectProvider() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (13): OverviewView(), ThemeFlyout(), ThemeFlyoutProps, THEMES, Topbar(), TopbarProps, COLORS, ReportType (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (7): Button(), ButtonProps, cn(), HelpModalProps, ModalProps, MemberHierarchy(), Node

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (7): AutofitStrategy, DeliveriesView(), DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode, Delivery

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (5): AIPulseAnalysis(), DashboardView(), SEVERITY_COLORS, STATUS_COLORS, analyzeProject()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **67 isolated node(s):** `env`, `Leave`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `env`, `Leave`, `WidgetLayout` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._