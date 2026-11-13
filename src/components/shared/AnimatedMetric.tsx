import React, { useRef, useEffect } from 'react';
import { animate, useReducedMotion } from 'motion/react';

export const COCKPIT_EASE: readonly [number, number, number, number] = [0.23, 1, 0.32, 1];

export interface AnimatedMetricProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  triggerKey?: number | string;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * High-performance hardware-friendly numeric counter writing directly to DOM ref (0 React re-renders/frame).
 * Renders the final formatted value immediately in JSX so SSR, Playwright tests, and initial paint never read 0.
 * Respects system prefers-reduced-motion by default.
 */
export const AnimatedMetric: React.FC<AnimatedMetricProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 0.68,
  triggerKey,
  reducedMotion: explicitReducedMotion,
  className
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const systemReducedMotion = useReducedMotion();
  const shouldReduce = explicitReducedMotion ?? (systemReducedMotion === true);

  const formatNumber = (num: number) => {
    if (decimals > 0) {
      return num.toFixed(decimals);
    }
    return Math.round(num).toString();
  };

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (shouldReduce || value === 0 || isNaN(value)) {
      el.textContent = `${prefix}${formatNumber(value)}${suffix}`;
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: COCKPIT_EASE,
      onUpdate: (latest) => {
        el.textContent = `${prefix}${formatNumber(latest)}${suffix}`;
      }
    });

    return () => controls.stop();
  }, [value, prefix, suffix, decimals, duration, triggerKey, shouldReduce]);

  return (
    <span ref={spanRef} className={className} data-animated-metric="true">
      {prefix}{formatNumber(value)}{suffix}
    </span>
  );
};

export default AnimatedMetric;
