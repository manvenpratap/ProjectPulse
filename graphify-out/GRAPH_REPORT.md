# Graph Report - ProjectPulse 2.0  (2026-11-10)

## Corpus Check
- 73 files · ~176,069 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 386 nodes · 1105 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27d4b072`
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
1. `useProject()` - 92 edges
2. `TaskStatus` - 32 edges
3. `useAuth()` - 29 edges
4. `todayStr()` - 19 edges
5. `daysDiff()` - 19 edges
6. `exportProjectExcel()` - 19 edges
7. `fmtDate()` - 18 edges
8. `TaskPriority` - 15 edges
9. `Task` - 15 edges
10. `getHealthScore()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `HelpModal()` --calls--> `useProject()`  [EXTRACTED]
  src/components/shared/HelpModal.tsx → src/store/ProjectContext.tsx
- `ScaffolderView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/ScaffolderView.tsx → src/store/ProjectContext.tsx
- `StepTemplates()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/StepTemplates.tsx → src/store/ProjectContext.tsx
- `FieldArchitect()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/FieldArchitect.tsx → src/store/ProjectContext.tsx
- `MainApp()` --calls--> `useProject()`  [EXTRACTED]
  src/App.tsx → src/store/ProjectContext.tsx

## Communities (16 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (50): ReleaseRoadmap(), PHASE_COLORS, STANDARD_BLUEPRINT_PRESETS, StepTemplates(), SyncStep, SEVERITY_COLORS, STATUS_COLORS, NotificationFlyoutProps (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (43): AccessDenied(), AccessDeniedProps, AccessManagerModal(), AccessManagerModalProps, LoginView(), getAllNavItems(), getHubForView(), NAV_HUBS (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (50): blendColors(), buildDeliveriesSheet(), buildDeliveriesWorkbook(), buildExecutiveDashboardSheet(), buildFeatureMatrixWorkbook(), buildFeatureRolloutsSheet(), buildFeatureScreenTraceabilitySheet(), buildUnifiedTasksSheet() (+42 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (44): ComplexityFilter, FunctionalMatrix(), ViewMode, ScaffolderView(), ScaffoldModule, DefectModal(), DefectModalProps, DEF_ST_MAP (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (30): formatLibraryName(), LIBRARY_LABELS, RegistryView(), RESERVED_CORE_KEYS, AIPulseAnalysis(), BurndownChart(), ModuleDeliveryMatrix(), PredictiveIntelligence() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (14): DomainTab, FieldArchitect(), GLOBAL_SHORTCUTS, ShortcutItem, STANDARD_FIELD_GUIDE, StandardFieldItem, VIEW_HELP_DATA, ViewHelpItem (+6 more)

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
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **116 isolated node(s):** `env`, `WidgetLayout`, `ProjectSettings`, `NavItem`, `NavHub` (+111 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 0`, `Community 4`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `env`, `WidgetLayout`, `ProjectSettings` to the rest of the system?**
  _116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._