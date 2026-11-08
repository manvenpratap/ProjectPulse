# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 64 files · ~84,145 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 269 nodes · 725 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e187bdf2`
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

## God Nodes (most connected - your core abstractions)
1. `useProject()` - 82 edges
2. `TaskStatus` - 28 edges
3. `todayStr()` - 17 edges
4. `daysDiff()` - 17 edges
5. `useAuth()` - 17 edges
6. `fmtDate()` - 16 edges
7. `TaskPriority` - 14 edges
8. `Task` - 12 edges
9. `getHealthScore()` - 9 edges
10. `getHubForView()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `BoardView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/BoardView.tsx → src/store/ProjectContext.tsx
- `TaskGrid()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskGrid.tsx → src/store/ProjectContext.tsx
- `TaskView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskView.tsx → src/store/ProjectContext.tsx
- `DefectView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/defects/DefectView.tsx → src/store/ProjectContext.tsx
- `ScaffolderView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/ScaffolderView.tsx → src/store/ProjectContext.tsx

## Communities (16 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (37): StepTemplates(), SEVERITY_COLORS, STATUS_COLORS, LogView(), getWebSample(), getDefaultState(), ProjectContext, ProjectContextType (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (23): AccessDenied(), AccessDeniedProps, AccessManagerModal(), AccessManagerModalProps, LoginView(), NAV_HUBS, Sidebar(), SidebarProps (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (25): ComplexityFilter, FunctionalMatrix(), ViewMode, ReleaseRoadmap(), ALM_ST_MAP, AutofitStrategy, DEL_ST_MAP, DeliveriesView() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (21): FieldArchitect(), ScaffolderView(), ScaffoldModule, DefectModal(), DefectModalProps, DEF_ST_MAP, DefectView(), DensityMode (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (22): RegistryView(), AIPulseAnalysis(), BurndownChart(), ModuleDeliveryMatrix(), PredictiveIntelligence(), NotificationFlyout(), NotificationFlyoutProps, SetupView() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (10): getHubForView(), NavHub, NavItem, MobileBottomNav(), MobileBottomNavProps, CATEGORIES, SprintRetroView(), PageHeader() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.23
Nodes (9): DashboardView(), OverviewView(), COLORS, ReportType, ReportView(), exportProjectExcel(), importProjectExcel(), TaskView() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **87 isolated node(s):** `env`, `Leave`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 0` to `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `env`, `Leave`, `WidgetLayout` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._