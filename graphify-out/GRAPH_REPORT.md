# Graph Report - ProjectPulse 2.0  (2026-11-12)

## Corpus Check
- 82 files · ~221,479 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 500 nodes · 1454 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f8604e7`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

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
- `AccessManagerModal()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/auth/AccessManagerModal.tsx → src/store/AuthContext.tsx
- `HelpModal()` --calls--> `useProject()`  [EXTRACTED]
  src/components/shared/HelpModal.tsx → src/store/ProjectContext.tsx
- `VelocityBandChart()` --calls--> `useProject()`  [EXTRACTED]
  src/components/dashboard/VelocityBandChart.tsx → src/store/ProjectContext.tsx
- `ScaffolderView()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/ScaffolderView.tsx → src/store/ProjectContext.tsx
- `StepTemplates()` --calls--> `useProject()`  [EXTRACTED]
  src/components/architect/StepTemplates.tsx → src/store/ProjectContext.tsx

## Communities (24 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (60): PHASE_COLORS, STANDARD_BLUEPRINT_PRESETS, StepTemplates(), SyncStep, SEVERITY_COLORS, STATUS_COLORS, VALID_DASH_TABS, MatrixViewMode (+52 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (56): blendColors(), buildDeliveriesSheet(), buildDeliveriesWorkbook(), buildExecutiveDashboardSheet(), buildFeatureMatrixWorkbook(), buildFeatureRolloutsSheet(), buildFeatureScreenTraceabilitySheet(), buildUnifiedTasksSheet() (+48 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (49): FunctionalMatrix(), AIPulseAnalysis(), BurndownChart(), PredictiveIntelligence(), DefectModal(), DefectModalProps, DEF_ST_MAP, DefectView() (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (30): FEAT_PALETTE, FeatureSwimlaneChart(), FeatureSwimlaneChartProps, HitArea, LaneGroup, RELEASE_STATUS_COLORS, SwimlaneCategoryTrackProps, SwimlaneRow (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (24): DashboardView(), COCKPIT_EASE, DetailCardType, OverviewView(), CATEGORY_PALETTE, IMPACT_ROWS, PIPELINE_STAGES, PROB_COLS (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (22): DARK_MAP, FilterCategory, LIGHT_MAP, ThemeDef, ThemeFlyout(), ThemeFlyoutProps, THEMES, DARK_MAP (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (14): ColFilter, DOMAIN_META, DOMAIN_STARTERS, DomainTab, FieldArchitect(), LOCKED_KEYS, UndoSnapshot, formatLibraryName() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (13): LoginView(), ModuleDeliveryMatrix(), ResourceUtilizationMatrix(), NotificationFlyout(), SettingsView(), VALID_SETTINGS_TABS, PageHeader(), PageHeaderProps (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): 🏛️ 1. System Architecture, 🔄 2. Project Governance & Delivery Workflow, ⚡ 3. Bi-directional Excel Sync Sequence, 🌊 4. Project Data Flow Pipeline, ⏱️ 5. Workstation Session Lifecycle, Architectural Breakdown & Component Responsibilities, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (12): getHubForView(), getNavItem(), NAV_HUBS, NavHub, NavItem, QUICK_SUBMODE_TARGETS, QuickSubModeTarget, MobileBottomNav() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (11): useMediaQuery(), Modal(), ModalProps, MainApp(), HitArea, MonteCarloTaskResult, SortMode, TimelineView() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (10): useClickOutside(), computeAlerts(), SmartAlert, SmartAlertsCenter(), SmartAlertsCenterProps, SearchResultItem, Topbar(), TopbarProps (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (10): AccessManagerModal(), AccessManagerModalProps, SetupView(), AuthContext, AuthContextType, DEFAULT_ROLE_PERMISSIONS, INITIAL_USERS, RolePermissions (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): code:bash (# 1. Install dependencies), code:bash (npm run build), code:block3 (ProjectPulse 2.0/), Installation & Launch, 🛠️ Key Capabilities & Operational Modules, 📄 License, Prerequisites, Production Build (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (11): ⚡ Bi-directional Excel Sync Sequence, code:mermaid (flowchart TD), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR), code:mermaid (stateDiagram-v2), 🌊 Project Data Flow Pipeline, 🔄 Project Governance & Delivery Workflow (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (9): getMergedFieldGuide(), GLOBAL_SHORTCUTS, ShortcutItem, STANDARD_FIELD_GUIDE, StandardFieldItem, VIEW_HELP_DATA, ViewHelpItem, HelpModal() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (5): AccessDenied(), AccessDeniedProps, getAllNavItems(), GO_CHORD_MAP, AuthProvider()

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): 1.1 Brand Identity & Voice, 1.2 Design Tokens & System Replacements, 1. Executive Summary & Design Direction, 2. Actionable Task Checklist, 3. Verification & Acceptance Criteria, Anti-AI-Slop Implementation Plan: ProjectPulse 2.0, Batch 1: Token Discipline & Background De-Slopping (Priority 1), Batch 2: Icon & Copy De-Slopping (Priority 1) (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): 1. Product Foundations, 2. Typography & Hierarchies, 3. Surface & Border Semantics (StyleSeed Standard), 4. Interaction & Motion Rules, ProjectPulse Design System — Master Specification

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (3): 📚 Core Documentation, ⚡ Key Highlights, Welcome to the ProjectPulse Wiki

## Knowledge Gaps
- **168 isolated node(s):** `env`, `GO_CHORD_MAP`, `WidgetLayout`, `ProjectSettings`, `NavItem` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProject()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 7` to `Community 0`, `Community 4`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 16`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `env`, `GO_CHORD_MAP`, `WidgetLayout` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._