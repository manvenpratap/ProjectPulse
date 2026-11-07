# ProjectPulse — Project Context & System Architecture

> **Monolithic Local-First Project Management Workstation**  
> High-density interactive PM workstation (~80,800 lines of Vanilla HTML5/JS/CSS) featuring 20 curated themes, bi-directional Excel synchronization, offline local storage persistence, Gantt scheduling, and software delivery tracking.

---

## 🏛️ System Architecture

Interactive Archify HTML: [`docs/diagrams/architecture.html`](./docs/diagrams/architecture.html)  
Specification: [`docs/diagrams/architecture.json`](./docs/diagrams/architecture.json)

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

---

## 🔄 Project Governance & Delivery Workflow

Interactive Archify HTML: [`docs/diagrams/workflow.html`](./docs/diagrams/workflow.html)  
Specification: [`docs/diagrams/workflow.json`](./docs/diagrams/workflow.json)

```mermaid
flowchart LR
    A["1. Project Setup\n(Name, team, KPIs)"] --> B["2. Gantt Scheduler\n(WBS & dependencies)"]
    B --> C["3. Defects & RAID\n(Risk & issue triage)"]
    C --> D["4. Deliveries & PDN\n(Release packaging)"]
    D --> E["5. SheetJS Sync\n(Bi-directional .xlsx)"]
    E --> F["6. Local Flush\n(localStorage & IndexedDB)"]
```

---

## ⚡ Bi-directional Excel Sync Sequence

Interactive Archify HTML: [`docs/diagrams/sequence.html`](./docs/diagrams/sequence.html)  
Specification: [`docs/diagrams/sequence.json`](./docs/diagrams/sequence.json)

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

---

## 🌊 Project Data Flow Pipeline

Interactive Archify HTML: [`docs/diagrams/dataflow.html`](./docs/diagrams/dataflow.html)  
Specification: [`docs/diagrams/dataflow.json`](./docs/diagrams/dataflow.json)

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

---

## ⏱️ Workstation Session Lifecycle

Interactive Archify HTML: [`docs/diagrams/lifecycle.html`](./docs/diagrams/lifecycle.html)  
Specification: [`docs/diagrams/lifecycle.json`](./docs/diagrams/lifecycle.json)

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
