# ProjectPulse — Architecture & System Design

> **Executive Overview**: Monolithic, local-first project management workstation built in pure Vanilla HTML5/JS/CSS (~80,800 LOC). Operates entirely within the browser client sandbox with zero server dependencies, sub-millisecond in-memory reactivity, bi-directional SheetJS Excel synchronization, and offline durability.

All system architectures, governance workflows, synchronization sequences, data pipelines, and workstation lifecycles are embedded below as native Mermaid diagrams with full architectural explanations.

---

## 🏛️ 1. System Architecture

```mermaid
flowchart TD
    User["👤 Project Manager / PMO\n(Browser Cockpit)"]
    
    subgraph BrowserSandbox["🌐 Browser Local-First Sandbox (Zero Server Required)"]
        SPA["⚡ ProjectPulse SPA\n(projectpulse.html ~80k LOC)"]
        StateP[("💾 Global State 'P'\n(Tasks, Deliveries, RAID)")]
        Gantt["📊 Gantt & Deliveries\n(Milestones & PDN Release)"]
        Theme["🎨 20 Curated Themes\n(Light / Dark Overrides)"]
        
        subgraph Persistence["🛡️ State & Persistence Layer"]
            Excel["📈 Excel Sync Engine\n(Bi-directional SheetJS)"]
            LocalStore[("💾 Offline Persistence\n(localStorage & IndexedDB)")]
        end
    end

    User -->|"interactive edit"| SPA
    SPA --> Gantt
    SPA -->|"mutate state"| StateP
    SPA --> Theme
    StateP -->|"bi-directional"| Excel
    StateP --> LocalStore
```

### Architectural Breakdown & Component Responsibilities
* **Browser Local-First Sandbox**: ProjectPulse executes entirely within the browser's JavaScript V8/SpiderMonkey runtime. Because no remote application server or database is required, enterprise users operate in an air-gapped, zero-leak environment compliant with strict data residency regulations.
* **ProjectPulse Monolithic SPA (`projectpulse.html`)**: A unified, high-density workstation combining UI layout, mathematical scheduling engines, SVG renderers, and event dispatchers in a clean, buildless distribution.
* **Global Reactive State Store (`P`)**: A single source of truth object tree in memory containing active project metadata, WBS task hierarchies, team capacity matrices, RAID registers, and governance notes.
* **Gantt & Delivery Scheduler**: High-performance SVG canvas rendering task timelines, dependency links (Finish-to-Start, Start-to-Start), critical path flags, and milestone markers with zero external charting libraries.
* **State & Persistence Subsystems**:
  * **Bi-directional SheetJS Reconciler**: Ingests and generates standard multi-sheet `.xlsx` workbooks, mapping cell grids to typed JavaScript objects without loss of formulas or custom columns.
  * **LocalStorage & IndexedDB Storage (`pp-data`)**: Dual-engine persistence layer that automatically snapshots the `P` state on every mutation with debounce throttling (300ms) to ensure zero data loss on browser refresh.

---

## 🔄 2. Project Governance & Delivery Workflow

```mermaid
flowchart LR
    A["1. Project Setup\n(Name, team, KPIs)"] --> B["2. Gantt Scheduler\n(WBS & dependencies)"]
    B --> C["3. Defects & RAID\n(Risk & issue triage)"]
    C --> D["4. Deliveries & PDN\n(Release packaging)"]
    D --> E["5. SheetJS Sync\n(Bi-directional .xlsx)"]
    E --> F["6. Local Flush\n(localStorage & IndexedDB)"]
```

### Operational Workflow Stages
1. **Project Scaffolding & Calibration**: Initializes project parameters, budget caps, delivery calendars, and team resource availability rosters.
2. **WBS & Critical Path Scheduling**: Tasks are mapped with durations, baselines, and parent-child hierarchies. The engine dynamically computes critical paths and slack times.
3. **Defects & RAID Matrix Triage**: Evaluates project risk impact vs. probability, logs active blockers, assigns mitigations, and tracks software defect severities.
4. **Deliveries & Project Delivery Notes (PDN)**: Batches completed tasks and acceptance criteria into formalized release milestones, generating executive release documentation.
5. **SheetJS Bi-directional Reconciler**: Reconciles external changes from PMO spreadsheets against current browser state, resolving field conflicts using timestamped delta priority.
6. **Persistence & Local Flush**: Serializes reconciled trees into compressed browser storage chunks, updating cache indices and dispatching status events.

---

## ⚡ 3. Bi-directional Excel Sync Sequence

```mermaid
sequenceDiagram
    autonumber
    actor PMO as Project Lead
    participant UI as ProjectPulse UI
    participant SheetJS as SheetJS Engine
    participant State as State Store 'P'
    participant Storage as LocalStorage (pp-data)

    PMO->>UI: Drop Project_Plan.xlsx
    UI->>SheetJS: Pass ArrayBuffer workbook
    SheetJS-->>State: Parsed Tasks, Deliveries, Defects
    State->>Storage: Commit updated 'P' to pp-data
    Storage-->>State: Storage flushed
    State->>UI: Dispatch stateChange event
    UI-->>PMO: Gantt, Deliveries & Health gauges refreshed
```

### Execution Sequence Details
* **Step 1–2 (File Ingestion & Binary Array Parsing)**: Dragging an Excel file over the browser viewport triggers a native `DragEvent`. The file's binary stream is read via `FileReader.readAsArrayBuffer()` and delivered to the embedded SheetJS parser.
* **Step 3 (Schema Sniffing & In-Memory Entity Mapping)**: SheetJS inspects sheet names (`Tasks`, `RAID`, `Deliveries`), mapping tabular columns into typed JSON models with schema fallback heuristics for missing fields.
* **Step 4–5 (Atomic State Commit & Storage Write)**: The central state `P` merges imported entities. An atomic commit is executed to `localStorage['pp-data']`. If storage limits are approached, secondary large payload trees roll over to IndexedDB.
* **Step 6–7 (Reactive Event Dispatch & 60 FPS Re-render)**: A custom `stateChange` synthetic event triggers DOM sub-tree updates, updating the Gantt timeline, progress meters, and RAID matrix simultaneously.

---

## 🌊 4. Project Data Flow Pipeline

```mermaid
flowchart LR
    subgraph S1["1. Inputs"]
        Inputs["📄 User Edits / Excel\n(.xlsx, forms, clicks)"]
    end
    subgraph S2["2. Parser"]
        SheetJS["⚙️ SheetJS Parser\n(Workbook reader)"]
    end
    subgraph S3["3. State"]
        StateP[("💾 Central State 'P'\n(Tasks, Deliveries, RAID)")]
    end
    subgraph S4["4. Views"]
        Gantt["📊 Gantt & Timeline"]
        Deliv["📦 Delivery Grid"]
    end
    subgraph S5["5. Storage"]
        Cache[("💾 LocalStorage Cache\n(pp-data)")]
    end

    Inputs -->|"file drop"| SheetJS
    SheetJS -->|"reconciled objects"| StateP
    StateP -->|"task trees"| Gantt
    StateP -->|"release packages"| Deliv
    StateP -->|"auto-save"| Cache
```

### Data Pipeline Mechanics & Invariants
* **Input Layer**: Handles both direct DOM micro-edits (inline editing of task name, date pickers, drag handles) and macro file drops (.xlsx).
* **Parser Layer**: Sanitizes input strings, validates ISO date formats, normalizes percentages, and prevents XSS by escaping HTML entities.
* **Central State**: Manages memory layout. Immutable clone snapshots are stored in a ring buffer to provide multi-step Undo/Redo capabilities.
* **View Layer**: Implements virtualized DOM rendering for task lists and pure SVG path construction for Gantt dependency curves.
* **Storage Layer**: Guarantees zero data loss across browser tabs using the StorageEvent API to synchronize state changes across multiple open windows.

---

## ⏱️ 5. Workstation Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> App_Boot: Load projectpulse.html
    App_Boot --> Hydrate_State: Read localStorage (pp-data)
    Hydrate_State --> Workstation_Live: Render Dashboard
    Workstation_Live --> Excel_Reconciling: Import .xlsx Workbook
    Excel_Reconciling --> State_Persisted: Merge Complete
    Workstation_Live --> State_Persisted: User Edits / Modals
    State_Persisted --> Workstation_Live: Ready for Interaction
    State_Persisted --> Reports_Generated: Export Word / Excel
    Reports_Generated --> [*]
```

### Lifecycle State Machine Rules
* **`App_Boot`**: HTML document loads, stylesheets initialize theme variables, and global namespace `window.P` is verified.
* **`Hydrate_State`**: Queries `localStorage.getItem('pp-data')`. If valid JSON exists, it hydrates the working state; if empty, it initializes the project template.
* **`Workstation_Live`**: Interactive operational state. Event listeners handle keyboard shortcuts, drag-and-drop operations, and modal views.
* **`Excel_Reconciling`**: Asynchronous modal state during large workbook parsing to prevent thread blocking.
* **`State_Persisted`**: Transitory checkpoint reached after debounced serialization, ensuring all modifications are durably saved.
* **`Reports_Generated`**: Packaging state where Word (`.docx`), Excel (`.xlsx`), or PDF delivery documents are compiled and triggered for browser download.
