# Welcome to the ProjectPulse 2.0 Wiki

> **Mission**: Local-first, offline-resilient enterprise ALM governance cockpit, ExcelJS synchronization engine, and cross-platform workstation (Web, Mobile Safari QR, iOS, Android).

This wiki serves as the authoritative engineering and system architecture documentation for **ProjectPulse 2.0** (`com.projectpulse.app`, React 19 + TypeScript + ExcelJS + Capacitor 8).

---

## 📚 Core Documentation

* 📘 **[Product Capability, End-User & Technical Specification Manual (.docx)](../docs/ProjectPulse_2.0_Product_Capability_and_Specification_Manual.docx)**: Complete 10-chapter Word manual featuring executive capabilities, screen-by-screen user walkthroughs, health & EVM formulas, RBAC permissions, all 13 finite state machines, live screenshots, charts, and mobile build verification.
* 📐 **[Architecture & System Design](Architecture-and-System-Design)**: Native embedded Mermaid vector diagrams mirroring the 5 compiled ProjectPulse 2.0 Archify specs (`architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`).
* 🚀 **[Repository Root & Quickstart](../README.md)**: Local development (`npm run dev`), production builds, and Capacitor mobile builds (`mobile:android:apk`, `mobile:ios:sim`).

---

## ⚡ Key Architectural Pillars

1. **Deterministic Explicit State Machines**: Task dependency locks, ALM PDN 4-axis deploy gates, defect cycling, and session resolution (`resolveSessionPhase`) live cleanly in `src/utils/stateMachines.ts`.
2. **Round-Trip ExcelJS Engine**: Bi-directional multi-worksheet workbook import/export (`src/services/excelService.ts`) with theme-aware formatting and native mobile Share Sheet handoff (`saveBlob`).
3. **40 Themes & Zero-Clipping Responsive UI**: WCAG-guarded `getContrastInk`, View Transitions iris animations, collapsible KPI strips, and responsive desktop/mobile parity.
4. **Universal Motion & Physics Transitions**: Hardware-accelerated composite-only view transitions (`MotionPage`), DOM-direct numeric counter tickers (`AnimatedMetric`), orchestrated stagger entrances (`StaggerContainer`), and unified cockpit cubic-bezier curve (`COCKPIT_EASE: [0.23, 1, 0.32, 1]`) with automatic reduced-motion accessibility fallback.
5. **Linear-Grade Enterprise Table Architecture**: Unified 8-dimension data grid architecture across all 12 operational views (`TaskGrid`, `DefectView`, `DeliveriesView`, `RAIDView`, `TeamView`, `FunctionalMatrix`, `StepTemplates`, `CapacityView`, `DashboardView`, `QualityGovernanceTab`, `BaselineManager`, `LogView`) — featuring real-time filter presets with live counters, `/` search focus, dual-mode timeline/table toggles, spring-physics master-detail peek drawers (`<SlideOverDrawer>`) with sequential `[` / `]` navigation, floating action bars for batch operations, persistent column visibility, universal frozen Column 0 (`stickyFirstColumn` / `sticky left-0`), inline quick-edits, CSV/JSON evidence exports, and mobile-ergonomic touch cards.
