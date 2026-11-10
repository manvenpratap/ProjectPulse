# Graph Report - ProjectPulse 2.0  (2026-11-10)

## Corpus Check
- 73 files · ~175,433 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 391 nodes · 1135 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af22f47d`
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
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `useProject()` - 92 edges
2. `TaskStatus` - 32 edges
3. `useAuth()` - 29 edges
4. `daysDiff()` - 20 edges
5. `exportProjectExcel()` - 20 edges
6. `todayStr()` - 19 edges
7. `fmtDate()` - 18 edges
8. `getHealthScore()` - 17 edges
9. `TaskPriority` - 15 edges
10. `Task` - 15 edges

## Surprising Connections (you probably didn't know these)
- `AccessManagerModal()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/auth/AccessManagerModal.tsx → src/store/AuthContext.tsx
- `ThemeFlyout()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/ThemeFlyout.tsx → src/store/ProjectContext.tsx
- `SetupView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/layout/SetupView.tsx → src/store/ProjectContext.tsx
- `HelpModal()` --calls--> `useProject()`  [EXTRACTED]
  src/components/shared/HelpModal.tsx → src/store/ProjectContext.tsx
- `AIPulseAnalysis()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/AIPulseAnalysis.tsx → src/store/ProjectContext.tsx

## Communities (19 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (52): OverviewView(), blendColors(), buildDeliveriesSheet(), buildDeliveriesWorkbook(), buildExecutiveDashboardSheet(), buildFeatureMatrixWorkbook(), buildFeatureRolloutsSheet(), buildFeatureScreenTraceabilitySheet() (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (40): formatLibraryName(), LIBRARY_LABELS, RegistryView(), RESERVED_CORE_KEYS, ReleaseRoadmap(), SEVERITY_COLORS, STATUS_COLORS, CxoEmailModal() (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (34): AccessDenied(), AccessDeniedProps, LoginView(), getAllNavItems(), getHubForView(), NAV_HUBS, NavHub, NavItem (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (37): ComplexityFilter, FunctionalMatrix(), ViewMode, BurndownChart(), ModuleDeliveryMatrix(), PredictiveIntelligence(), DEF_ST_MAP, DefectView() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (26): DomainTab, FieldArchitect(), AccessManagerModal(), AccessManagerModalProps, AIPulseAnalysis(), LogView(), COLORS, ReportType (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (19): ScaffolderView(), ScaffoldModule, GLOBAL_SHORTCUTS, ShortcutItem, STANDARD_FIELD_GUIDE, StandardFieldItem, VIEW_HELP_DATA, ViewHelpItem (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (12): ALM_ST_MAP, AutofitStrategy, DEL_ST_MAP, DeliveryModal(), DeliveryModalProps, HeatmapPerspective, ViewMode, SetupView() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (8): PHASE_COLORS, STANDARD_BLUEPRINT_PRESETS, StepTemplates(), SyncStep, TaskModal(), TaskModalProps, StepTemplate, Subtask

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (10): 1.1 Brand Identity & Voice, 1.2 Design Tokens & System Replacements, 1. Executive Summary & Design Direction, 2. Actionable Task Checklist, 3. Verification & Acceptance Criteria, Anti-AI-Slop Implementation Plan: ProjectPulse 2.0, Batch 1: Token Discipline & Background De-Slopping (Priority 1), Batch 2: Icon & Copy De-Slopping (Priority 1) (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): DARK_MAP, FilterCategory, LIGHT_MAP, ThemeDef, ThemeFlyout(), ThemeFlyoutProps, THEMES

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **116 isolated node(s):** `env`, `WidgetLayout`, `ProjectSettings`, `NavItem`, `NavHub` (+111 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 12`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `env`, `WidgetLayout`, `ProjectSettings` to the rest of the system?**
  _116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._