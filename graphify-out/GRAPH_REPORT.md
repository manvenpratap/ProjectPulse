# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 66 files · ~97,811 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 282 nodes · 793 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0686bc04`
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
2. `TaskStatus` - 31 edges
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
- `AccessManagerModal()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/auth/AccessManagerModal.tsx → src/store/AuthContext.tsx
- `DefectView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/defects/DefectView.tsx → src/store/ProjectContext.tsx
- `AIPulseAnalysis()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/AIPulseAnalysis.tsx → src/store/ProjectContext.tsx

## Communities (16 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (34): FieldArchitect(), ScaffolderView(), ScaffoldModule, StepTemplates(), AccessManagerModal(), AccessManagerModalProps, DefectModal(), DefectModalProps (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (26): AccessDenied(), AccessDeniedProps, LoginView(), getAllNavItems(), getHubForView(), NAV_HUBS, NavHub, NavItem (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (23): BurndownChart(), DashboardView(), SEVERITY_COLORS, STATUS_COLORS, OverviewView(), computeAlerts(), SmartAlert, SmartAlertsCenter() (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (19): AIPulseAnalysis(), analyzeProject(), getWebSample(), getDefaultState(), ProjectContext, ProjectContextType, ProjectProvider(), VALID_VIEWS (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (19): ComplexityFilter, FunctionalMatrix(), ViewMode, ReleaseRoadmap(), ALM_ST_MAP, AutofitStrategy, DEL_ST_MAP, DeliveriesView() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (18): RegistryView(), PredictiveIntelligence(), SetupView(), DARK_MAP, FilterCategory, LIGHT_MAP, ThemeDef, ThemeFlyout() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (19): ModuleDeliveryMatrix(), BoardView(), BoardViewProps, DensityMode, PRI_MAP, ST_MAP, TaskGrid(), TaskGridProps (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

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
- **93 isolated node(s):** `env`, `WidgetLayout`, `ProjectSettings`, `NavItem`, `NavHub` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `env`, `WidgetLayout`, `ProjectSettings` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._