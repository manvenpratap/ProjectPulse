# Graph Report - ProjectPulse 2.0  (2026-11-08)

## Corpus Check
- 64 files · ~76,051 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 260 nodes · 705 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `223c7145`
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
- `BoardView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/BoardView.tsx → src/store/ProjectContext.tsx
- `TaskGrid()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/TaskGrid.tsx → src/store/ProjectContext.tsx
- `AIPulseAnalysis()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/AIPulseAnalysis.tsx → src/store/ProjectContext.tsx
- `ModuleDeliveryMatrix()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/ModuleDeliveryMatrix.tsx → src/store/ProjectContext.tsx
- `FunctionalMatrix()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/FunctionalMatrix.tsx → src/store/ProjectContext.tsx

## Communities (15 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (29): ReleaseRoadmap(), SEVERITY_COLORS, STATUS_COLORS, ModuleDeliveryMatrix(), BaselineManager(), BoardView(), BoardViewProps, DensityMode (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): StepTemplates(), AccessDenied(), AccessDeniedProps, AccessManagerModal(), AccessManagerModalProps, LoginView(), getHubForView(), NAV_HUBS (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (32): FunctionalMatrix(), ScaffolderView(), ScaffoldModule, DefectModal(), DefectModalProps, LogView(), CATEGORIES, SprintRetroView() (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (31): RegistryView(), BurndownChart(), DashboardView(), OverviewView(), PredictiveIntelligence(), DefectView(), NotificationFlyout(), NotificationFlyoutProps (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (14): FieldArchitect(), AutofitStrategy, DeliveriesView(), DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode, Button() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **78 isolated node(s):** `env`, `Leave`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 9`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 0` to `Community 2`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `env`, `Leave`, `WidgetLayout` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._