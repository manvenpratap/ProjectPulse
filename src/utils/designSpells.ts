import { flushSync } from 'react-dom';
import confetti from 'canvas-confetti';

let pendingOrigin: { x: number; y: number; ts: number } | null = null;

/** Check whether user prefers reduced motion safely on client. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Record click coordinates from an interactive control so downstream
 * completion celebrations can burst from that exact UI element.
 */
export function markInteractionOrigin(el?: Element | null): void {
  if (typeof window === 'undefined' || !el) return;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return;
  pendingOrigin = {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
    ts: Date.now(),
  };
}

/**
 * Consume a recently recorded normalized viewport origin if still fresh.
 */
export function consumeInteractionOrigin(maxAgeMs = 800): { x: number; y: number } | null {
  if (!pendingOrigin || Date.now() - pendingOrigin.ts > maxAgeMs) {
    pendingOrigin = null;
    return null;
  }
  const { x, y } = pendingOrigin;
  pendingOrigin = null;
  return { x, y };
}

/**
 * Fire a lightweight confetti burst anchored cleanly to an element's viewport center
 * (or fallback coordinates), strictly honoring reduced-motion preferences.
 */
export function castOriginConfetti(
  el?: Element | null,
  options?: { particleCount?: number; spread?: number; colors?: string[] }
): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  const rect = el?.getBoundingClientRect();
  const origin = rect && (rect.width > 0 || rect.height > 0)
    ? {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.6 };

  const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-hex').trim() || '#22d3ee';
  confetti({
    particleCount: options?.particleCount ?? 36,
    spread: options?.spread ?? 58,
    startVelocity: 28,
    scalar: 0.78,
    ticks: 140,
    origin,
    colors: options?.colors ?? [primary, '#10b981', '#f59e0b', '#38bdf8'],
  });
}

/**
 * Run a circular iris reveal via the native View Transitions API anchored at the
 * triggering click coordinates, degrading cleanly when unsupported or reduced-motion.
 */
export function runCircularThemeTransition(
  applyState: () => void,
  event?: { clientX?: number; clientY?: number; currentTarget?: EventTarget | null }
): void {
  const doc = typeof document !== 'undefined' ? (document as any) : null;
  if (!doc?.startViewTransition || prefersReducedMotion()) {
    applyState();
    return;
  }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event?.clientX && event?.clientY) {
    x = event.clientX;
    y = event.clientY;
  } else if (event?.currentTarget instanceof HTMLElement) {
    const r = event.currentTarget.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) {
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  try {
    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        applyState();
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    }).catch(() => {});
  } catch {
    applyState();
  }
}

/**
 * Zero-rerender pointer spotlight updater for flagship instrument cards.
 */
export function updateCardSpotlight(e: React.PointerEvent<HTMLElement>): void {
  if (prefersReducedMotion() || e.pointerType === 'touch') return;
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
}

