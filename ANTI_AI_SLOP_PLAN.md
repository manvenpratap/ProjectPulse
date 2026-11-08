# Anti-AI-Slop Implementation Plan: ProjectPulse 2.0

> **Audit Date:** 2026-11-08  
> **Status:** Ready for Execution  
> **AI-Slop Score:** 14/30 patterns triggered (4 Critical, 5 High, 5 Medium)  
> **The 10 Vital States Score:** 4/10 fully implemented (6 requiring architectural completion)  
> **Target Viewports:** Desktop (1440px) & Mobile (375px)  
> **Design Philosophy:** Human-Crafted Mission-Critical Engineering Cockpit — Precision, density, tactile feedback, crisp structural borders, zero decorative sparkle fluff.

---

## 1. Executive Summary & Design Direction

### 1.1 Brand Identity & Voice
- **Tone:** Technical, authoritative, dense, mission-oriented. Built for Staff Engineers, Engineering Directors, and Release Managers.
- **Voice Guidelines:**
  - Eliminate generic tech tropes ("seamless", "unlock", "magic ✨", "supercharge").
  - Ground all descriptions in concrete software engineering mechanics: ALM defect lifecycle, double-entry ledgers, Git branching, Monte Carlo burnup, and zero-downtime deployment pipelines.
  - Reserve iconography strictly for functional controls (chevrons, copy, external link, download, search) or semantic statuses (green pass, amber in-flight, red blocker).

### 1.2 Design Tokens & System Replacements
- **Color Discipline:**
  - Standardize on semantic tokens from `src/index.css` (`--color-surface`, `--color-border`, `--color-divider`, `--color-primary-hex`).
  - Purge arbitrary neon color gradients and unprincipled rainbow badge accents.
- **Elevation & Borders:**
  - Eliminate heavy fuzzy drop shadows (`shadow-2xl`, `shadow-xl`) that blur card perimeters.
  - Standardize on crisp 1px structural borders (`border border-[var(--color-divider)]` or `border-[var(--color-border)]`) with subtle surface contrast. Elevation is reserved strictly for active floating popovers and modal overlays.
- **Corner Radii Hierarchy:**
  - *Contracting inward scale:*
    - Outer View/Modal Containers: `rounded-2xl` (16px)
    - Content Cards & Workstation Panes: `rounded-xl` (12px)
    - Buttons, Selects & Inputs: `rounded-lg` (8px)
    - Micro-Badges & Filter Pills: `rounded-md` (4px–6px)
  - Eliminates the pervasive `rounded-3xl` / `rounded-2xl` AI template uniformity.
- **Typography Scale:**
  - Calibrate `--font-sans` ("Plus Jakarta Sans") and `--font-mono` ("JetBrains Mono").
  - Tabular numeric alignment (`tabular-nums`) for all metrics, percentages, ALM defect counts, and timestamps.
- **Backgrounds:**
  - Remove all blurred floating radial gradient circles (`blur-3xl rounded-full`).
  - Replace with solid structural surfaces, architectural divider lines, and clean card containers.

---

## 2. Actionable Task Checklist

Grouped into sequential execution batches. Every task is tied to exact file locations and diff blueprints.

### Batch 1: Token Discipline & Background De-Slopping (Priority 1)
- [x] **Task 1.1: Purge floating gradient orbs in Login and Access Denied**
  - **Pattern:** #2 (Floating gradient orbs)
  - **Location:** `src/components/auth/LoginView.tsx:59-61`, `src/components/auth/AccessDenied.tsx:23`
  - **Problem:** Oversized 500px blurred radial gradient circles floating behind auth cards as lazy background filler.
  - **Fix:** Remove radial blur divs. Use clean solid surfaces with subtle architectural grid borders.
  - **Verification:** Inspect login screen on desktop and mobile; confirm clean, crisp presentation without background blur artifacts.

- [x] **Task 1.2: Enforce inward-contracting corner radius scale**
  - **Pattern:** #7 (Identical corner radii)
  - **Location:** `src/components/layout/SetupView.tsx:66`, `src/components/settings/SettingsView.tsx`, `src/components/auth/LoginView.tsx:69`
  - **Problem:** Everything sharing uniform `rounded-3xl` (24px) or `rounded-2xl` regardless of scale.
  - **Fix:** Scale radii: Modals/Containers `16px`, Cards `12px`, Inputs/Buttons `8px`, Badges `6px`.
  - **Verification:** Verify visual balance on desktop and mobile.

- [x] **Task 1.3: Eliminate fuzzy drop shadows on cards**
  - **Pattern:** #12 (Shadows on every card)
  - **Location:** `src/components/auth/LoginView.tsx:69`, `src/components/settings/SettingsView.tsx`, `src/components/dashboard/OverviewView.tsx`
  - **Problem:** Pervasive `shadow-2xl` and `shadow-xl` blurring card edges.
  - **Fix:** Replace with crisp 1px borders (`border border-[var(--color-divider)]`) and zero ambient shadow.
  - **Verification:** Inspect in dark and light modes; confirm high-contrast crisp card perimeters.

---

### Batch 2: Icon & Copy De-Slopping (Priority 1)
- [x] **Task 2.1: Purge decorative Sparkles (`✨`) across all views**
  - **Pattern:** #27 (Unnecessary sparkle icons) & #3 (Lucide icons everywhere)
  - **Location:** 
    - `src/components/dashboard/DashboardView.tsx:433` (Predictive tab icon)
    - `src/components/team/CapacityView.tsx:523, 617, 1047, 1064, 1389`
    - `src/components/auth/LoginView.tsx:87`
    - `src/components/layout/SetupView.tsx:184`
    - `src/components/settings/SettingsView.tsx:255, 375`
  - **Problem:** Sparkles prepended to buttons, tabs, and insights to pretend features are "magical".
  - **Fix:** Replace with functional semantic icons (e.g. `TrendingUp` for predictive, `Wand2`/`Cpu` for scheduler heuristics, `Sliders` for simulation) or let typography stand alone.
  - **Verification:** Grep `Sparkles` in `src/`; verify zero decorative sparkles remain.

- [x] **Task 2.2: Rewrite generic marketing copy into technical domain declarations**
  - **Pattern:** #1 (Generic marketing copy) & #25 (“It’s not X, it’s Y” copy)
  - **Location:** `src/components/layout/SetupView.tsx:58-64`, `src/components/auth/LoginView.tsx:75-80`
  - **Problem:** Vague buzzwords ("Track. Log. Report. Unified engineering delivery.", "Intelligent workspace").
  - **Fix:** Replace with concrete operational copy: "ProjectPulse Engineering Delivery Cockpit • Multi-Tier Backlog, ALM Packaging, and Capacity Governance".
  - **Verification:** Check reading flow and tone consistency.

---

### Batch 3: The 10 Vital States UX/UI Architecture (Priority 1 & 2)

- [x] **Task 3.1: Complete Dead-End-Free Empty & Filter States (State 1 & 6)**
  - **Pattern:** #26 (The 10 Vital States Failure)
  - **Location:** 
    - `src/components/deliveries/DeliveriesView.tsx:926-936`
    - `src/components/tasks/TaskGrid.tsx`
    - `src/components/team/TeamView.tsx`
  - **Problem:** Filtering with no matches produces a passive text row ("No delivery packages match your filter") with zero recovery actions.
  - **Fix:** Add interactive 1-click "Clear All Filters" button, suggested keyword chips, and direct "Create Package" primary CTA.
  - **Verification:** Type non-matching search; click "Clear All Filters"; verify instant reset.

- [x] **Task 3.2: Implement Global Ambient Offline Indicator (State 4)**
  - **Pattern:** #26 (The 10 Vital States Failure)
  - **Location:** `src/components/layout/OfflineBanner.tsx` (new component mounted in `App.tsx`)
  - **Fix:** Listen to `window.addEventListener('online')` and `window.addEventListener('offline')`. When offline, render an ambient, non-blocking top banner informing the user: "Offline Mode Active • Local snapshot preserved. Edits will sync automatically upon reconnection."
  - **Verification:** Toggle offline mode in DevTools Network tab; verify banner displays without breaking navigation.

- [x] **Task 3.3: Implement Slow Network & Latency Telemetry Pill (State 5)**
  - **Pattern:** #26 (The 10 Vital States Failure)
  - **Location:** Global Topbar / Status pill
  - **Fix:** Implement high-latency detection on async Excel imports or AI calls (>2,000ms) with a non-blocking floating pill ("Processing large dataset (65KB)...").
  - **Verification:** Throttle CPU in DevTools; verify latency feedback.

- [x] **Task 3.4: Implement In-Flight Form Auto-Draft Preservation (State 8)**
  - **Pattern:** #26 (The 10 Vital States Failure)
  - **Location:** `TaskModal.tsx`, `DeliveryModal.tsx`, `DefectModal.tsx`
  - **Fix:** Auto-save draft inputs to `localStorage` under `pp_draft_<modal_type>`. If modal is closed accidentally or session reloads, prompt: "Restore unfinished draft?" with 1-click restore.
  - **Verification:** Open New Task modal, type name/description, reload page, reopen modal; verify draft restoration.

- [x] **Task 3.5: Implement Inline Field Validation with 1-Click Quick-Fixes (State 9)**
  - **Pattern:** #26 (The 10 Vital States Failure)
  - **Location:** `src/components/tasks/TaskModal.tsx`, `src/components/deliveries/DeliveryModal.tsx`
  - **Fix:** Show inline micro-validation badges directly adjacent to inputs (e.g. Due Date before Start Date) with 1-click quick-fix pill: `[Snap to Start Date + 5d]`.
  - **Verification:** Enter due date earlier than start date; click quick-fix pill; verify date auto-corrects.

- [x] **Task 3.6: Implement Structured Success Receipt with Next Steps (State 10)**
  - **Pattern:** #26 (The 10 Vital States Failure)
  - **Location:** Creation actions across Tasks, Deliveries, and Defects
  - **Fix:** Replace disappearing toasts with celebratory structured action feedback or confirmation dialog providing 3 strategic next-action buttons ("View in Matrix", "Schedule in Capacity", "Log Another").
  - **Verification:** Create a task; verify clear visual receipt with next steps.

---

### Batch 4: Animation & Interaction Discipline (Priority 3)
- [x] **Task 4.1: Cap transitions and enforce `prefers-reduced-motion`**
  - **Pattern:** #18 (Pointless animations)
  - **Location:** `src/index.css`, Framer Motion components
  - **Fix:** Ensure all transition curves stay under 200ms (`--apple-spring-snappy`). Verify `@media (prefers-reduced-motion: reduce)` disables scale/translate animations across all components.
  - **Verification:** Toggle reduced motion in macOS System Settings; verify app operates cleanly without motion.

---

## 3. Verification & Acceptance Criteria
- [x] `npm run build` passes with zero errors and zero warnings.
- [x] All 10 Vital States verified across Desktop (1440px) and Mobile (375px).
- [x] 0 floating gradient orbs in DOM.
- [x] 0 decorative sparkle icons remaining.
- [x] Corner radii hierarchically structured (`16px` -> `12px` -> `8px` -> `6px`).
- [x] Full regression test suites (`test_demo_excel_import.py`, `test_auth_rbac.py`, `test_mobile_capacity.py`) passing 100%.
