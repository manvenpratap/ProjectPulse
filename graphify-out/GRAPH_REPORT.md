# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 66 files · ~91,172 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 277 nodes · 780 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2e574c7`
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
1. `useProject()` - 86 edges
2. `TaskStatus` - 30 edges
3. `useAuth()` - 29 edges
4. `daysDiff()` - 19 edges
5. `fmtDate()` - 18 edges
6. `todayStr()` - 17 edges
7. `TaskPriority` - 14 edges
8. `Task` - 13 edges
9. `getHealthScore()` - 11 edges
10. `DefectStatus` - 8 edges

## Surprising Connections (you probably didn't know these)
- `BoardView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/BoardView.tsx → src/store/ProjectContext.tsx
- `TaskGrid()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskGrid.tsx → src/store/ProjectContext.tsx
- `TaskView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskView.tsx → src/store/ProjectContext.tsx
- `AccessManagerModal()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/auth/AccessManagerModal.tsx → src/store/AuthContext.tsx
- `DefectView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/defects/DefectView.tsx → src/store/ProjectContext.tsx

## Communities (16 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (34): FieldArchitect(), ScaffolderView(), ScaffoldModule, AccessManagerModal(), AccessManagerModalProps, DefectModal(), DefectModalProps, DEF_ST_MAP (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (33): AccessDenied(), AccessDeniedProps, LoginView(), getAllNavItems(), getHubForView(), NAV_HUBS, NavHub, NavItem (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (29): ComplexityFilter, FunctionalMatrix(), ViewMode, ReleaseRoadmap(), BaselineManager(), BoardView(), BoardViewProps, DensityMode (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (22): RegistryView(), StepTemplates(), AIPulseAnalysis(), BurndownChart(), ModuleDeliveryMatrix(), PredictiveIntelligence(), SetupView(), DARK_MAP (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (15): LogView(), getWebSample(), getDefaultState(), ProjectContext, ProjectContextType, ProjectProvider(), DefectStatus, LogEntry (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (11): ALM_ST_MAP, AutofitStrategy, DEL_ST_MAP, DeliveriesView(), DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (10): DashboardView(), SEVERITY_COLORS, STATUS_COLORS, OverviewView(), CxoEmailModal(), CxoEmailModalProps, COLORS, ReportType (+2 more)

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
- **90 isolated node(s):** `env`, `Leave`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 0`, `Community 7`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `env`, `Leave`, `WidgetLayout` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._