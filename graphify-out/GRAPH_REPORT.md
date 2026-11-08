# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 64 files · ~72,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 256 nodes · 701 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51206c8b`
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
1. `useProject()` - 82 edges
2. `TaskStatus` - 27 edges
3. `useAuth()` - 17 edges
4. `daysDiff()` - 16 edges
5. `TaskPriority` - 14 edges
6. `todayStr()` - 14 edges
7. `fmtDate()` - 14 edges
8. `Task` - 11 edges
9. `getHealthScore()` - 9 edges
10. `getHubForView()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `TaskGrid()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskGrid.tsx → src/store/ProjectContext.tsx
- `TaskView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskView.tsx → src/store/ProjectContext.tsx
- `BurndownChart()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/BurndownChart.tsx → src/store/ProjectContext.tsx
- `PredictiveIntelligence()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/PredictiveIntelligence.tsx → src/store/ProjectContext.tsx
- `StepTemplates()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/StepTemplates.tsx → src/store/ProjectContext.tsx

## Communities (17 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (27): FunctionalMatrix(), RegistryView(), ScaffolderView(), ScaffoldModule, AIPulseAnalysis(), ModuleDeliveryMatrix(), DefectModal(), DefectModalProps (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (23): BurndownChart(), getWebSample(), getDefaultState(), ProjectContext, ProjectContextType, ProjectProvider(), BoardViewProps, DensityMode (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (18): AccessDenied(), AccessDeniedProps, AccessManagerModal(), AccessManagerModalProps, LoginView(), UserProfileFlyout(), UserProfileFlyoutProps, SettingsView() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (17): AutofitStrategy, DeliveriesView(), DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode, Topbar(), TopbarProps (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (14): FieldArchitect(), StepTemplates(), LogView(), CATEGORIES, SprintRetroView(), CustomField, Defect, Leave (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (13): DashboardView(), SEVERITY_COLORS, STATUS_COLORS, OverviewView(), PredictiveIntelligence(), COLORS, ReportType, ReportView() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.2
Nodes (12): ReleaseRoadmap(), BaselineManager(), HitArea, MonteCarloTaskResult, SortMode, TimelineView(), ViewMode, ZoomMode (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (10): getHubForView(), NAV_HUBS, NavHub, NavItem, MobileBottomNav(), MobileBottomNavProps, Sidebar(), SidebarProps (+2 more)

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
- **74 isolated node(s):** `env`, `Leave`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 2` to `Community 8`, `Community 3`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `env`, `Leave`, `WidgetLayout` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._