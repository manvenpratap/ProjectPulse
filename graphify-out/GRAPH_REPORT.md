# Graph Report - ProjectPulse 2.0  (2026-11-10)

## Corpus Check
- 73 files · ~175,229 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 396 nodes · 1156 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f5c7eb8`
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
1. `useProject()` - 94 edges
2. `TaskStatus` - 33 edges
3. `useAuth()` - 29 edges
4. `daysDiff()` - 21 edges
5. `fmtDate()` - 20 edges
6. `exportProjectExcel()` - 20 edges
7. `todayStr()` - 19 edges
8. `getHealthScore()` - 19 edges
9. `TaskPriority` - 15 edges
10. `Task` - 15 edges

## Surprising Connections (you probably didn't know these)
- `BoardView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/tasks/BoardView.tsx → src/store/ProjectContext.tsx
- `AccessManagerModal()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/auth/AccessManagerModal.tsx → src/store/AuthContext.tsx
- `ThemeFlyout()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/ThemeFlyout.tsx → src/store/ProjectContext.tsx
- `SetupView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/SetupView.tsx → src/store/ProjectContext.tsx
- `SchedulerView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/scheduler/SchedulerView.tsx → src/store/ProjectContext.tsx

## Communities (17 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (58): ReleaseRoadmap(), PHASE_COLORS, STANDARD_BLUEPRINT_PRESETS, StepTemplates(), SyncStep, BurndownChart(), DashboardView(), SEVERITY_COLORS (+50 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (53): blendColors(), buildDeliveriesSheet(), buildDeliveriesWorkbook(), buildExecutiveDashboardSheet(), buildFeatureMatrixWorkbook(), buildFeatureRolloutsSheet(), buildFeatureScreenTraceabilitySheet(), buildUnifiedTasksSheet() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (40): ComplexityFilter, FunctionalMatrix(), ViewMode, DEF_ST_MAP, DefectView(), DensityMode, ViewMode, ALM_ST_MAP (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (31): AccessDenied(), AccessDeniedProps, LoginView(), getAllNavItems(), getHubForView(), NAV_HUBS, NavHub, NavItem (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (32): DomainTab, FieldArchitect(), ScaffolderView(), ScaffoldModule, AccessManagerModal(), AccessManagerModalProps, AIPulseAnalysis(), DefectModal() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (21): GLOBAL_SHORTCUTS, ShortcutItem, STANDARD_FIELD_GUIDE, StandardFieldItem, VIEW_HELP_DATA, ViewHelpItem, computeAlerts(), SmartAlert (+13 more)

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
Cohesion: 0.4
Nodes (4): formatLibraryName(), LIBRARY_LABELS, RegistryView(), RESERVED_CORE_KEYS

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **119 isolated node(s):** `env`, `WidgetLayout`, `ProjectSettings`, `NavItem`, `NavHub` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 10`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 3` to `Community 0`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `env`, `WidgetLayout`, `ProjectSettings` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._