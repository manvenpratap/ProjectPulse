# Graph Report - ProjectPulse 2.0  (2026-11-11)

## Corpus Check
- 79 files · ~215,558 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 481 nodes · 1372 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d536dcdf`
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
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `useProject()` - 102 edges
2. `useAuth()` - 41 edges
3. `TaskStatus` - 38 edges
4. `fmtDate()` - 25 edges
5. `daysDiff()` - 22 edges
6. `getHealthScore()` - 21 edges
7. `exportProjectExcel()` - 21 edges
8. `Task` - 19 edges
9. `todayStr()` - 19 edges
10. `TaskPriority` - 17 edges

## Surprising Connections (you probably didn't know these)
- `HelpModal()` --calls--> `useProject()`  [EXTRACTED]
  src/components/shared/HelpModal.tsx → src/store/ProjectContext.tsx
- `VelocityBandChart()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/VelocityBandChart.tsx → src/store/ProjectContext.tsx
- `MemberHierarchy()` --calls--> `useProject()`  [EXTRACTED]
  src/components/team/MemberHierarchy.tsx → src/store/ProjectContext.tsx
- `CapacityView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/team/CapacityView.tsx → src/store/ProjectContext.tsx
- `ScaffolderView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/ScaffolderView.tsx → src/store/ProjectContext.tsx

## Communities (20 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (50): AccessDenied(), AccessDeniedProps, AccessManagerModal(), AccessManagerModalProps, LoginView(), getAllNavItems(), getHubForView(), getNavItem() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (55): blendColors(), buildDeliveriesSheet(), buildDeliveriesWorkbook(), buildExecutiveDashboardSheet(), buildFeatureMatrixWorkbook(), buildFeatureRolloutsSheet(), buildFeatureScreenTraceabilitySheet(), buildUnifiedTasksSheet() (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (39): PHASE_COLORS, STANDARD_BLUEPRINT_PRESETS, StepTemplates(), SyncStep, SEVERITY_COLORS, STATUS_COLORS, VALID_DASH_TABS, MatrixViewMode (+31 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (31): FEAT_PALETTE, FeatureSwimlaneChart(), FeatureSwimlaneChartProps, HitArea, LaneGroup, RELEASE_STATUS_COLORS, SwimlaneCategoryTrackProps, SwimlaneRow (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (29): DomainTab, FieldArchitect(), SchedulerView(), getWebSample(), DEFAULT_DEFECT_COLS, DEFAULT_DELIVERY_COLS, DEFAULT_TASK_COLS, getDefaultState() (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (31): FunctionalMatrix(), formatLibraryName(), LIBRARY_LABELS, RegistryView(), RESERVED_CORE_KEYS, AIPulseAnalysis(), BurndownChart(), DashboardView() (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (24): COCKPIT_EASE, DetailCardType, OverviewView(), CATEGORY_PALETTE, IMPACT_ROWS, PIPELINE_STAGES, PROB_COLS, QualityGovernanceTabProps (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (18): DEF_ST_MAP, DensityMode, ViewMode, ALM_ST_MAP, AutofitStrategy, DEL_ST_MAP, DeliveryModal(), DeliveryModalProps (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (16): getMergedFieldGuide(), GLOBAL_SHORTCUTS, ShortcutItem, STANDARD_FIELD_GUIDE, StandardFieldItem, VIEW_HELP_DATA, ViewHelpItem, DefectModal() (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (18): DARK_MAP, FilterCategory, LIGHT_MAP, ThemeDef, ThemeFlyout(), ThemeFlyoutProps, THEMES, DARK_MAP (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (10): 1.1 Brand Identity & Voice, 1.2 Design Tokens & System Replacements, 1. Executive Summary & Design Direction, 2. Actionable Task Checklist, 3. Verification & Acceptance Criteria, Anti-AI-Slop Implementation Plan: ProjectPulse 2.0, Batch 1: Token Discipline & Background De-Slopping (Priority 1), Batch 2: Icon & Copy De-Slopping (Priority 1) (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **162 isolated node(s):** `env`, `GO_CHORD_MAP`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 0` to `Community 2`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `env`, `GO_CHORD_MAP`, `WidgetLayout` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._