# ProjectPulse Enterprise Workstation Implementation Plan

Reverse-engineer all core capabilities from the monolithic ProjectPulse-Html workstation into a modular, production-grade React/TypeScript architecture, prioritizing the ALM Deliveries workspace, bi-directional Excel synchronization, and the Executive What-If Predictive Sandbox.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and scope decisions have been confirmed through Phase 1 requirements clarification and govern this implementation plan:

- **Confirmed Priority 1 (Workstation Scope)**: Deliver the full ALM Deliveries & Deployment Schedule workspace, bi-directional Excel sync engine, and Executive Overview What-If Predictive Sandbox first.
- **Confirmed Priority 2 (Dataset Hydration)**: Load the complete ProjectPulse enterprise dataset with ALM delivery records, multi-entity task/screen linkages, and historical log trails out of the box.
- **Confirmed Priority 3 (Visual Identity)**: Activate the **Pulse (Technical Edition)** theme by default, featuring high-density Swiss typography (`Syne` display + `Inter` body + tabular `JetBrains Mono`), subtle dot-matrix background grids, and neon cyan accents.
- **Remaining Open Choice (Excel Format Compatibility)**: Maintain strict SheetJS/ExcelJS round-trip compatibility with ProjectPulse-Html canonical sheets (`Tasks`, `Deliveries`, `Defects`, `RAID`, `System State`).

---

### 1. Overview & Core Concept

- **What It Does**: ProjectPulse is a local-first, zero-server project management workstation designed for engineering leaders, PMOs, and release managers. It combines multi-tier WBS hierarchical scheduling with a dedicated Software Deliveries (ALM / PDN) release hub, bi-directional multi-sheet Excel synchronization, and an Executive cockpit featuring a real-time What-If scenario sandbox.
- **Target Audience / Persona**: Technical Program Managers, Release Engineers, QA Leads, and PMO Directors orchestrating multi-team software deliveries, deployment readiness gates, and stakeholder reporting.
- **Key Value**: Eliminates fractured status tracking across Jira, Excel, and release emails by uniting delivery packages, test sign-offs, dependency chains, and predictive schedule models in a single high-performance browser workstation.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **ALM Deliveries & Release Orchestration**:
   - Users browse delivery items categorized by ALM ID, PDN release number, module, target environment, and sign-off status.
   - Users toggle between 3 operational views: High-Density Table, Kanban Stage Board, and 3-Perspective Visual Heatmap (`Feature × Screens`, `Environment Pipeline`, `Payload Impact Matrix`).
   - Users inspect or edit delivery packages with composite linkages (`'Task ID : Task Name'` and linked GUI screens), track cycle lead time, and log smoke test sign-offs.
2. **Executive Overview & What-If Sandbox**:
   - Live Health Index dial computed mathematically:
     $$\text{Health} = 100 - \left(\frac{\text{Overdue}}{\text{Active}} \times 50\right) - \left(\frac{\text{Blocked}}{\text{Active}} \times 30\right) - \left(\frac{\text{On Hold}}{\text{Active}} \times 20\right)$$
   - Delivery Confidence meter analyzing active backlog velocity against a 4-week moving average.
   - Interactive What-If sliders allowing PMOs to simulate capacity variations (±30% FTE load, velocity changes, date slippage) with instant visual trajectory projections.
3. **Bi-Directional Excel Round-Trip**:
   - Single-click export of an enterprise multi-tab Excel workbook containing `Tasks`, `Deliveries`, `Defects`, `RAID`, `Team`, and `System State` with telemetry banners and formula preservation.
   - Drag-and-drop import that parses workbook sheets, runs schema normalization via canonical reverse-mapping, updates the central store, and flushes to local storage.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-Density Swiss Engineering Cockpit — structured, disciplined, anti-slop, and utilitarian.
- **Color Palette & Atmosphere**:
  - Neutral Base: Deep Technical Canvas (`#0D0D0F`), Surface (`#121214`), Offset (`#050507`), Hairline Borders (`rgba(228, 228, 231, 0.1)`).
  - Accent Budget: Neon Cyan (`#38BDF8`) for primary interactive states, Emerald (`#10B981`) for deployed/passed, Amber (`#F59E0B`) for warnings/delays, Crimson (`#EF4444`) for blockers/overdue.
- **Typography & Scale**:
  - Display Headers: `Syne` (Bold, uppercase, -0.04em tracking).
  - Primary UI & Prose: `Inter` (Clean, legible, balanced text wrapping).
  - Telemetry & Data: `JetBrains Mono` with forced tabular numbers (`tabular-nums`).
- **Layout Density & Discipline**:
  - Zero-pill metadata rule: Statuses and metadata use clean, unboxed text and typographic separators (`·` or `/`) rather than candy-colored badge sandwiches.
  - Single-row Top Bar Contract with breadcrumbs and primary action.
  - Autofit Column Engine with 5 selectable column layout strategies (`all`, `content-only`, `header-only`, `compact`, `comfortable`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular Component Architecture over Monolithic Script**:
  - *Chosen Approach*: Deconstruct the 80k-line single-file `projectpulse.html` into strongly typed React components and custom hooks, while preserving exact data structures and business formulas.
  - *Why*: Provides maintainability, fast HMR in development, and clear separation of concerns without sacrificing performance.
  - *Alternatives Considered*: Direct iframe embedding of the 80k HTML file was rejected because it would block React reactivity, state inspection, and modular feature expansion.

- **Decision 2: Local-First State Persistence with IndexedDB / LocalStorage**:
  - *Chosen Approach*: Maintain local-first persistence storing the unified project state in `localStorage` (`pp-data`) with automatic state hydration and revision history.
  - *Why*: Matches ProjectPulse-Html core design of zero server dependencies, offline operability, and fast instant-on boot.

- **Decision 3: Complete Bi-Directional Excel Synchronization**:
  - *Chosen Approach*: Build a robust SheetJS parser/generator that produces canonical multi-sheet workbooks compatible with ProjectPulse-Html, handling reverse header mappings (e.g. `Description - ALM Description` $\leftrightarrow$ `name`).
  - *Why*: Allows PMOs to freely round-trip data between the web workstation and corporate desktop Excel without data loss.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### System Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ProjectPulse Workstation                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│   Navigation & UI     │                           │  Central State (P) │
│ - Topbar (3-zone)     │                           │ - Tasks & Subtasks │
│ - Collapsible Sidebar │◄───────── Reactive ───────┤ - Deliveries (ALM) │
│ - Theme Switcher      │         Subscriptions     │ - Defects & RAID   │
│ - Autofit Engine      │                           │ - Releases & Team  │
└─────────┬─────────────┘                           │ - Settings & Logs  │
          │                                         └─────────┬──────────┘
          ▼                                                   │
┌─────────────────────────────────────────────────────────┐   │
│                     Workspace Views                     │   │
│ ┌─────────────────────┐ ┌─────────────────────────────┐ │   │
│ │ Executive Overview  │ │ ALM Deliveries Workstation  │ │   │
│ │ - Health Dial (SVG) │ │ - Multi-Column Data Table   │ │   │
│ │ - Delivery Conf.    │ │ - Kanban Pipeline Board     │ │   │
│ │ - What-If Sandbox   │ │ - 3 Perspective Heatmaps    │ │   │
│ └─────────────────────┘ └─────────────────────────────┘ │   │
│ ┌─────────────────────┐ ┌─────────────────────────────┐ │   │
│ │ Gantt & Tasks WBS   │ │ Excel Synchronization Engine│ │   │
│ │ - Interactive SVG   │ │ - SheetJS Bi-dir Parser     │ │   │
│ │ - Inline Cell Edit  │ │ - Multi-tab canonical export│ │   │
│ └─────────────────────┘ └─────────────────────────────┘ │   │
└─────────────────────────────────────────────────────────┘   │
                                                              ▼
                                                    ┌────────────────────┐
                                                    │ Offline Storage    │
                                                    │ - localStorage     │
                                                    │ - IndexedDB Backup │
                                                    │ - Excel .xlsx Sync │
                                                    └────────────────────┘
```

#### Core Data Entities & Extensions

```
┌──────────────────┐       1..* ┌───────────────────────────┐
│     Release      │◄───────────┤         Delivery          │
│ - id, name       │            │ - id, almId, pdn          │
│ - startDate      │            │ - name, componentsDeliv.  │
│ - targetDate     │            │ - category, module, env   │
│ - status         │            │ - almStatus, status       │
└──────────────────┘            │ - signOffStatus, approver │
                                │ - smokeTestStatus         │
                                │ - leadTimeDays, variance  │
                                │ - linkedTasks: string[]   │
                                │ - linkedScreens: string[] │
                                └─────────────┬─────────────┘
                                              │ references
                                              ▼
┌──────────────────┐            ┌───────────────────────────┐
│       Task       │            │         GUI Screen        │
│ - id, name       │            │ - screen identifier       │
│ - status, module │            │ - module linkage          │
│ - startDate, due │            │ - spec reference          │
└──────────────────┘            └───────────────────────────┘
```

#### Implementation Phases (Execution Strategy)

1. **Phase 1: Types & Central State Expansion**:
   - Extend `src/types/index.ts` with complete `Delivery` entity interface, delivery dropdown options, column definitions, and filter contracts.
   - Update `src/store/ProjectContext.tsx` with delivery CRUD, batch actions, and state change dispatchers.
   - Seed `src/services/sampleData.ts` with the rich ProjectPulse enterprise dataset including realistic ALM releases, deliveries, and multi-entity linkages.

2. **Phase 2: ALM Deliveries Workstation**:
   - Build `DeliveriesView.tsx` with view mode switcher (`Table`, `Kanban`, `Heatmap`).
   - Implement Delivery Table with sortable headers, multi-select, and 5-strategy autofit column engine.
   - Implement Delivery Kanban with drag-and-drop or status stage advancement.
   - Implement 3-Perspective Delivery Heatmap (`Feature × Screens`, `Environment Pipeline`, `Payload Impact Matrix`).
   - Build Delivery Modal for creating and editing packages with task/screen linkage chips.

3. **Phase 3: Executive Overview What-If Predictive Sandbox**:
   - Implement the mathematical Health Index dial SVG with smooth radial gauges.
   - Build the Delivery Confidence gauge powered by 4-week moving average task velocity.
   - Implement the interactive What-If scenario sandbox slider panel (team capacity, velocity multiplier, scope expansion) with real-time health recalculation.

4. **Phase 4: Bi-Directional Excel Synchronization Engine**:
   - Upgrade `src/services/excelService.ts` to generate canonical multi-tab workbooks matching ProjectPulse-Html specifications.
   - Implement reverse-mapping parser on `.xlsx` file upload to reconstruct tasks, deliveries, defects, and configuration states seamlessly.

5. **Phase 5: Navigation & Theme Polish**:
   - Integrate Deliveries into `Sidebar.tsx` navigation with delivery count indicators.
   - Validate strict Pulse Technical Edition styling, responsive layout, and compilation integrity.
