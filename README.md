# ProjectPulse 2.0

> **Enterprise Local-First Project Management Workstation**  
> High-performance React 19 + TypeScript + Tailwind CSS v4 project management cockpit. Built as a componentized, local-first cross-platform suite featuring 40 curated themes, 13 explicit finite state machines, bi-directional multi-sheet ExcelJS synchronization, offline local storage persistence, interactive SVG & Gantt scheduling, Release Roadmap governance, native iOS/Android Capacitor 8 apps, and Desktop-to-Mobile Safari QR launching.

---

## 🏛️ System Architecture, Diagrams & Enterprise Manual

* 📘 **Full 3-in-1 Capability, End-User & Technical Manual (.docx)**: [**ProjectPulse 2.0 Product Capability & Specification Manual**](./docs/ProjectPulse_2.0_Product_Capability_and_Specification_Manual.docx)

ProjectPulse architecture, delivery workflows, synchronization sequences, data pipelines, and workstation lifecycles are formally modeled and compiled via [Archify](https://github.com/tt-a1i/archify):

* 📐 **System Architecture**: [Interactive HTML View](./docs/diagrams/architecture.html) | [Spec](./docs/diagrams/architecture.json)
* 🔄 **Governance Workflow**: [Interactive HTML View](./docs/diagrams/workflow.html) | [Spec](./docs/diagrams/workflow.json)
* ⚡ **Excel Sync Sequence**: [Interactive HTML View](./docs/diagrams/sequence.html) | [Spec](./docs/diagrams/sequence.json)
* 🌊 **Data Flow Pipeline**: [Interactive HTML View](./docs/diagrams/dataflow.html) | [Spec](./docs/diagrams/dataflow.json)
* ⏱️ **Workstation Lifecycle**: [Interactive HTML View](./docs/diagrams/lifecycle.html) | [Spec](./docs/diagrams/lifecycle.json)

For detailed blueprints, sequence traces, and state machines, see [**`PROJECT_CONTEXT.md`**](./PROJECT_CONTEXT.md) and [`wiki/`](./wiki/).

---

## 🚀 Quick Start

### Prerequisites
* Node.js (v18+ recommended)
* npm

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional, for Gemini AI features)
cp .env.example .env

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

### Production Build
```bash
npm run build
npm start
```

### Native Mobile Builds (iOS & Android via Capacitor 8)
```bash
# Sync web dist/ and Capacitor plugins into native projects
npm run mobile:sync

# Build Android Debug APK (android/app/build/outputs/apk/debug/ProjectPulse-v2.0.0-debug.apk)
npm run mobile:android:apk

# Build iOS Simulator .app (Swift Package Manager + Xcode)
npm run mobile:ios:sim
```

---

## 🛠️ Key Capabilities & Operational Modules

1. **Executive Overview Dashboard (`OverviewView`)**: Motion-choreographed Bento telemetry cockpit featuring a live command strip (`Pause Sweep` / `Replay`), precision-tick Health Index gauge + sparkline, spring-physics 180° Confidence Speedometer, live rotating Threat Radar, switchable Weekly/Cumulative Delivery Velocity corridor, interactive Module Mass donut, 3×3 RAID Threat Heatmap, Dual Scope & Effort rings, connected Milestone Runway flight path, and animated drill-down inspector modals.
2. **Live Velocity, Predictive & Quality Intelligence (`Project Intelligence Cockpit`)**: 4-week moving average completion velocity, Earned Value Management (EVM), Burndown / Burnup trajectories, Cumulative Flow Diagrams (CFD), and the **Quality & Governance** tab (Quality Reliability Index, Defect Pipeline Progression, Root Cause & Module Hotspots, Analytics Data Integrity, Release Sign-Off & Smoke Gate, interactive 3×3 RAID Threat Heatmap, and Steering Decisions Log).
3. **Software Deliveries & Deployment Schedule**: Dedicated ALM / PDN release workstation, multi-entity linkage to parent tasks and screen specs, cycle lead time & variance metrics, smoke test sign-offs, and 3 Delivery Heatmap perspectives (`feat_screens`, `env_pipeline`, `del_impact`).
4. **Release Roadmap & Version Governance**: Milestone version lifecycle (`Planned`, `Active`, `Released`), cycle start and target date synchronization, and mapped assets intelligence.
5. **Hierarchical Tasks Matrix & Spreadsheet Grid**: Multi-tier WBS hierarchy, quick inline status cycling, subtask checklist expansion, column sorting, density adjustments (`compact` / `comfortable`), and module/release filters.
6. **Project Timeline (Gantt)**: Interactive canvas/SVG roadmap, dynamic zoom levels (`day`, `week`, `month`), dependency blocker tracking, and milestone markers.
7. **Intelligent Weekly Scheduler & Conflict Resolver**: Interactive resource heatmap grid, automated conflict detection, and heuristics.
8. **Unified RAID Register**: Risk, Assumption, Issue, and Dependency scoring, threat matrices, mitigation owners, and due dates.
9. **Defect Workshop**: QA bug logging, severity/priority matrices (S1-S4), direct task linkage, and resolution lifecycle tracking.
10. **Executive Reporting & Board Packs**: One-click executive summaries, weekly stakeholder packs, milestone checklists, one-click CXO Email briefing generator, and filtered multi-tab Excel export.
11. **Performance Baselines**: Capture point-in-time baseline snapshots, compare live drift against commitments, and auto-align schedules.
12. **Team Capacity Hub**: Real-time FTE load distribution, leave schedules, role quotas, and cross-project utilization balancing.
13. **Bi-Directional Excel Synchronization & Hierarchical Traceability**: Production-grade ExcelJS engine generating multi-tab relational workbooks with theme-aware palette injection across light and dark modes. Features comprehensive workbooks including the **Deliveries Enterprise Export** with **Sheet 1 (`Deliveries`)** (hierarchical delivered components and telemetry) and **Sheet 2 (`Feature & Screen Traceability`)** (3-tier outline rollup: Level 0 Feature, Level 1 Canonical Screens [visible by default], and Level 2 Deduplicated Components & Linked Tasks with bidirectional cross-sheet hyperlinks), plus full executive cockpits, 5-sheet Feature Matrix workbooks, and schema-aware roundtrip state reconstruction.
14. **Role-Based Access Control (RBAC) & Authentication**: Secure multi-persona session management (Admin, Project Manager, Developer, Stakeholder), route access guards (`AccessDenied`), quick persona switching for testing, and an Admin Governance Studio for live role assignment, granular view overrides, and user enrollment.
15. **Journey-First Navigation, Command Search & Keyboard Chords**: Six clear workflow hubs (**Insights & Reporting**, **Planning & Scope**, **Delivery & Execution**, **People & Capacity**, **Quality & Governance**, and collapsible **Workspace & Schema**) backed by RBAC-aware dual routing, live Global Command Search (`/` or `Cmd/Ctrl+K`) across screens and entities, two-key navigation chords (`G` + `O/D/R/T/L/F/C/B/K/S`, `Cmd/Ctrl+E` Excel export), interactive PageHeader hub breadcrumbs, URL sub-tab deep-linking (`#/cxo`, `#/scheduler`, `?tab=...`), adaptive `MobileBottomNav`, and a utility header on onboarding setup.
16. **Field Architect & Custom Schema Studio**: Two-panel dynamic metadata architect featuring a live proportional `Live Table Header Blueprint` preview with click-to-jump navigation, drag-and-drop and keyboard column reordering (`GripVertical` + live `role="status"` announcements), `All`/`Visible`/`Hidden`/`Modified` attribute state filters, per-row default restoration and domain-wide `Reset Defaults` with non-blocking `Undo`, custom display labels and local-draft pixel width inputs with visual proportion bars, proprietary custom field extensions with 1-click domain starter templates, inline validation (`aria-invalid` / `role="alert"`), and live column/cell preview dynamically synced across Tasks, Defects, and Deliveries tables.
17. **40 Curated Themes & Live Cockpit Previews**: Theme switcher (`ThemeFlyout` & `SettingsView` -> `ThemeGrid`) depicting real canvases, surface elevation, corner radii, typography, and contrast tokens across light and dark design systems.
18. **Mobile-First Responsive App Shell, Native Touch Ergonomics & Adaptive Table Density**: Zero-clipping `PageHeader` flex architecture, full-width inset mobile `ShareExportMenu`, swipe-to-dismiss `Sidebar` drawer (`inert` background shell + elevated backdrop), draggable bottom-sheet `Modal` dialogs (`overscroll-contain`), `DataTable` mobile card views with Cards/Matrix toggle (`Deliveries`, `Tasks`, `RAID`), responsive single-DOM `FieldArchitect` schema cards, dynamic `<meta name="theme-color">` and OS `color-scheme` sync across all 40 themes, progressive scroll-fade tabs (`.scroll-fade-x`), reactive `useMediaQuery` breakpoint awareness, and a unified **Table Density System** (`compact` vs `comfortable`) with semantic `.cell-secondary` subtext hiding that provides true 36px spreadsheet row density in Compact mode and rich 54px two-line contextual telemetry in Comfortable mode across Tasks, Defects, Deliveries, Step Blueprints, and Functional Matrix.
19. **Tactile Design Spells & Micro-Interactions**: Physics-backed CSS `linear()` spring curves (`--ease-spring-physics`), circular iris `startViewTransition` reveals across all 40 themes and light/dark toggles, shared Framer Motion `layoutId` indicators across `Sidebar`, `MobileBottomNav`, and `ThemeGrid`, compositor-only primary CTA specular sweeps (`.btn-spell-primary`), zero-rerender radial card spotlights (`.spell-spotlight`), CSS scroll-driven reading hairlines (`.spell-scroll-hairline`), origin-anchored celebration bursts, morphing clipboard icons, Command Search spells (`magic` / `surprise`), and Shift/triple-tap pulse easter eggs under global `<MotionConfig reducedMotion="user">`.
20. **Decluttered Surface UI & Section-Anchored Help (`SectionHelpButton` + `HelpModal`)**: All product-feature explanations, capability summaries, formula mechanics, email client compatibility specs, and architecture notes are housed cleanly in [`viewHelpData.ts`](./src/config/viewHelpData.ts) and [`HelpModal.tsx`](./src/components/shared/HelpModal.tsx), accessible from every `PageHeader` (`F1`/`?`), onboarding/auth screens (`SetupView`, `LoginView`), and individual widgets/sections via [`SectionHelpButton`](./src/components/shared/SectionHelpButton.tsx) with section focus highlighting.
21. **Native iOS & Android Mobile Apps (`Capacitor 8`)**: Native Swift Package Manager (`ios/`) and Android Gradle (`android/`) mobile shells wrapping the production Vite bundle with safe-area notch/Dynamic Island insets (`env(safe-area-inset-*)`), branded app icons & splash assets, native OS Share Sheet exports via `@capacitor/filesystem` and `@capacitor/share` (`saveBlob`), and an offline on-device Executive Pulse telemetry fallback (`analyzeProject`).
22. **Desktop-to-Mobile Safari QR Launcher (`MobileLaunchQrModal` + `/api/network-info`)**: One-click desktop header QR button (`Topbar` & `SetupView`) resolving local LAN IPv4 addresses automatically via `/api/network-info` (avoiding broken `localhost` mobile links) with `Workspace Home` vs. `Current View` deep-link toggle, editable host override, and crisp SVG QR rendering (`uqr`).

---

## 📁 Repository Structure

```
ProjectPulse 2.0/
├── docs/                        # Compiled Archify diagrams, specs & Enterprise .docx Manual
│   ├── ProjectPulse_2.0_Product_Capability_and_Specification_Manual.docx
│   └── diagrams/                # 5 core Archify diagrams (.html + .json)
├── wiki/                        # Markdown wiki documentation with vector diagrams
├── src/
│   ├── components/
│   │   ├── architect/           # ReleaseRoadmap, Scaffolder, Matrix, StepTemplates
│   │   ├── auth/                # LoginView, AccessDenied guard, AccessManagerModal
│   │   ├── dashboard/           # OverviewView, DashboardView, QualityGovernanceTab, Burndown, Velocity, Heatmap
│   │   ├── defects/             # Defect tracking & triage modal
│   │   ├── deliveries/          # ALM / PDN Deliveries workstation & heatmap
│   │   ├── layout/              # Sidebar, Topbar Command Search, MobileBottomNav, SetupView, ThemeFlyout
│   │   ├── log/                 # Audit & change journaling
│   │   ├── reports/             # Executive Reporting & CXO Email Generator
│   │   ├── risks/               # Unified RAID Register & Decision Matrix
│   │   ├── settings/            # Workspace Settings & BaselineManager
│   │   ├── shared/              # PageHeader Breadcrumbs, ShareExportMenu, CollapsibleSummaryStrip, HelpModal, SectionHelpButton, UI primitives
│   │   ├── tasks/               # TaskGrid, BoardView, TaskView, TaskModal
│   │   ├── team/                # Team Hub, Capacity & 5-Day Scheduler, MemberHierarchy
│   │   └── timeline/            # Interactive Gantt & Roadmap
│   ├── config/
│   │   ├── navigation.ts        # Canonical 6-hub journey navigation & quick-jump targets
│   │   └── viewHelpData.ts      # Contextual guides, dynamic field dictionary & shortcuts
│   ├── hooks/
│   │   ├── useClickOutside.ts   # Shared outside-click & Escape dismiss hook
│   │   ├── useEntityDraft.ts    # Explicit modal draft-recovery state machine
│   │   └── useMediaQuery.ts     # Reactive CSS media query listener hook
│   ├── services/
│   │   ├── aiService.ts         # Gemini AI Pulse intelligence
│   │   └── excelService.ts      # Bi-directional ExcelJS synchronization
│   ├── store/
│   │   ├── AuthContext.tsx      # Multi-user RBAC session provider & permissions
│   │   ├── ProjectContext.tsx   # Global reactive state provider
│   │   └── defaultState.ts      # Authoritative clean schema factory (0 sample data)
│   ├── types/                   # Unified TypeScript schemas
│   ├── utils/                   # Domain math (projectUtils), state machines (stateMachines) & animations (designSpells)
│   ├── index.css                # 40 Curated theme design tokens, Design Spells & Tailwind
│   └── App.tsx                  # Main router, MotionConfig reduced-motion & layout shell
├── demo_project_database.xlsx   # Full enterprise showcase workbook (24 tasks, 12 deliveries, etc.)
├── android/                     # Native Capacitor Android Gradle project (com.projectpulse.app)
├── ios/                         # Native Capacitor iOS Xcode + SwiftPM project (com.projectpulse.app)
├── capacitor.config.ts          # Capacitor 8 runtime & native WebView configuration
├── server.ts                    # Node / Express SSR & API backend
├── vite.config.ts               # Vite bundler configuration
└── package.json                 # Project dependencies & build scripts
```

---

## 📄 License

MIT © [ProjectPulse Team](https://github.com/manvenpratap/ProjectPulse)
