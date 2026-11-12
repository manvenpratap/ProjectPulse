# ProjectPulse 2.0 — Architecture & System Design

> **Executive Overview**: Componentized, local-first project governance and ALM workstation built with React 19, TypeScript, Tailwind CSS v4, Express (`/api/analyze` & `/api/network-info`), ExcelJS 4.4, and Capacitor 8. Operates offline via `localStorage` (`pp-data`), enforces 13 explicit finite state machines (`src/utils/stateMachines.ts`), supports 4 RBAC personas and 40 themes, and ships across Web, Mobile Safari QR, iOS, and Android.

All five core system diagrams match the compiled interactive specs in [`docs/diagrams/`](../docs/diagrams/) and are documented in full inside [`ProjectPulse_2.0_Product_Capability_and_Specification_Manual.docx`](../docs/ProjectPulse_2.0_Product_Capability_and_Specification_Manual.docx).

---

## 🏛️ 1. System Architecture

```mermaid
flowchart TD
    DesktopWeb["🌐 Desktop & Safari Web\n(Browser + LAN QR Launch)"]
    NativeMobile["📱 iOS & Android Shells\n(Capacitor 8 WebView)"]

    subgraph AppCore["⚡ Client Runtime & RBAC Sandbox"]
        RBAC["🛡️ Auth & Session Gate\n(4-Persona RBAC Guard)"]
        ReactUI["🧩 React 19 Workstation\n(6 Hubs • 19 Views • 40 Themes)"]
        StateEngine["⚙️ State & Guard Engine\n(ProjectContext + 13 FSMs)"]
        LocalDB[("💾 Local Browser Store\nlocalStorage pp-data")]
        ExcelIO["📊 ExcelJS + Share Bridge\n(.xlsx + Native OS Share)"]
        ExpressAPI["🚀 Express Node Server\n(/api/analyze + /api/network-info)"]
    end

    DesktopWeb -->|"HTTPS / LAN HTTP"| RBAC
    NativeMobile -->|"Capacitor bridge"| RBAC
    RBAC -->|"resolveSessionPhase"| ReactUI
    ReactUI -->|"guarded mutations"| StateEngine
    StateEngine -->|"sync state"| LocalDB
    StateEngine -->|"workbook export"| ExcelIO
    StateEngine -->|"REST + offline fallback"| ExpressAPI
```

### Component Responsibilities
* **Auth & Session Gate (`src/store/AuthContext.tsx`)**: Computes deterministic session phase (`unauthenticated -> onboarding -> denied | authorized`) across Admin, Project Manager, Developer, and Stakeholder roles.
* **React 19 Workstation**: 6 Journey Hubs, 19 Screen Modules, collapsible KPI summary strips, interactive SVG/Gantt canvases, and 40 curated WCAG-contrast-checked themes (`ThemeGrid.tsx`).
* **Express Server (`server.ts`)**: Optional Node backend serving `POST /api/analyze` (Gemini `gemini-3-flash-preview` with client offline fallback) and `GET /api/network-info` (LAN IPv4 discovery for the Desktop-to-Safari QR Launcher).

---

## 🔄 2. Governance & Delivery Workflow

```mermaid
flowchart LR
    Auth["🔐 RBAC Sign-In\n(4 roles + overrides)"] --> Setup["🧭 Workspace Init\n(blank / demo / .xlsx)"]
    Setup --> Scaffold["📐 Scaffolder & Matrix\n(releases, WBS, fields)"]
    Scaffold -->|"generate WBS"| Tasks["📋 Tasks & Gantt\n(grid, board & blockers)"]
    Tasks -->|"linked items"| QA["🧪 Defects & RAID\n(triage & sign-off log)"]
    QA -->|"resolved scope"| Deliver["🚦 ALM Deploy Gate\n(smoke + approval check)"]
    Deliver -->|"PDN & reports"| Export["📦 ExcelJS & Briefs\n(multi-tab .xlsx, CXO & OS Share)"]
```

---

## ⚡ 3. ExcelJS Sync & Native Share Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Lead as Project Lead
    participant UI as ShareExportMenu
    participant Excel as excelService
    participant Store as ProjectContext
    participant Bridge as saveBlob Router
    participant OS as OS Share Sheet

    Lead->>UI: Upload .xlsx database
    UI->>Excel: importProjectExcel(file)
    Excel-->>Store: Normalized entities + schema
    Store-->>UI: Commit pp-data & refresh KPIs
    Lead->>UI: Click Export Workbook
    UI->>Excel: Build multi-tab .xlsx Blob
    Excel->>Bridge: saveBlob(blob, filename)
    Bridge-->>OS: Write Cache + Share.share() (Capacitor)
```

---

## 🌊 4. Reactive Data Flow Pipeline

```mermaid
flowchart LR
    UIO["🖥️ UI & Modals\n(forms, drags, QR)"] -->|"mutations"| FSM["🛡️ stateMachines.ts\n(guards & normalization)"]
    XLS["📑 Excel Import\n(.xlsx workbooks)"] -->|"parsed rows"| FSM
    FSM -->|"verified ProjectState"| Ctx[("🗄️ ProjectContext\n(tasks, RAID, deliveries)")]
    Ctx -->|"KPI & EVM"| Cockpit["📈 Cockpit & EVM\n(health, CFD, Monte Carlo)"]
    Ctx -->|"workdays load"| Cap["👥 Capacity Engine\n(8-week heatmap)"]
    Cockpit -.->|"auto-flush"| LS[("💾 localStorage\n(pp-data & drafts)")]
    Cap -->|"briefings + .xlsx"| Rep["📤 Exports & Briefs\n(.xlsx, JSON, CXO, AI)"]
```

---

## ⏱️ 5. Entity & Gate Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated: Boot LoginView / SetupView
    Unauthenticated --> NotStarted_Sched: authorized (progress 0)
    NotStarted_Sched --> InProgress: start / progress > 0
    NotStarted_Sched --> DependencyBlocked: blockedBy unfinished > 0
    DependencyBlocked --> InProgress: dependencies completed
    InProgress --> ReadyForDeploy: review / ALM ready
    ReadyForDeploy --> Completed_Live: approved + smoke passed
    ReadyForDeploy --> GateDenied: Sign-Off Rejected / Smoke Failed
    Completed_Live --> RolledBack_Reopen: rollback / uncheck
    RolledBack_Reopen --> InProgress: rework
```
