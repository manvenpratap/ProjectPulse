# ProjectPulse Design System — Master Specification

## 1. Product Foundations
- **Product Type**: Enterprise Project Intelligence & ALM Delivery Workstation
- **Aesthetic Tone**: Linear / Vercel-inspired (High density, crisp 1px borders, subtle contrast, keyboard-centric micro-copy)
- **Primary Brand Color**: Deep Teal (`#0F4C5C` Light / `#00FF7F` Cybernetic OLED Accent)
- **Primary Highlight**: `rgba(15, 76, 92, 0.08)`
- **Secondary / Metric Accents**:
  - Emerald (`#10B981`): On-track, healthy, deployed, reached
  - Amber (`#F59E0B`): Overdue, pending sign-off, high risk
  - Rose (`#F43F5E`): Critical path blockages, defect spikes, overdue breaches
  - Sky (`#38BDF8`): Earned Value (EVM), in-pipeline deliveries, active sprints

---

## 2. Typography & Hierarchies
- **Font Stack**:
  - Display / Headings: `--font-display: 'Fraunces', serif` or `--font-sans: 'Inter', sans-serif`
  - Body / UI: `--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif`
  - Numbers, Dates & Telemetry: `--font-mono: 'JetBrains Mono', ui-monospace, monospace`
- **Text Sizing Floors**: Minimum 12px (`text-xs`) across all interactive cards and telemetry metrics.

---

## 3. Surface & Border Semantics (StyleSeed Standard)
Never hardcode raw palette colors (e.g. `text-slate-800`, `bg-indigo-600`) in shared views. Always consume semantic CSS variables:
- `var(--color-bg)`: Canvas background
- `var(--color-surface)`: Elevated container / card background
- `var(--color-surface-2)`: Sub-card / table-row background
- `var(--color-border)`: Crisp 1px structural outlines
- `var(--color-divider)`: Subtle separators and dividers
- `var(--color-text)`: Primary readable content
- `var(--color-text-muted)`: Descriptive secondary text
- `var(--color-text-faint)`: Micro-badges, timestamps, and captions
- `var(--color-primary-hex)`: Brand action triggers and active states

---

## 4. Interaction & Motion Rules
- **Hover Transitions**: `transition-colors duration-200 ease-out` or `transition-all duration-200`
- **Cursor**: `cursor-pointer` on all clickable triggers, cards, and toggles
- **Keyboard Navigation**: Focus rings `outline: 2px solid var(--color-primary-hex)` (WCAG 2.4.7 compliant)
- **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` across Framer Motion and CSS animations

