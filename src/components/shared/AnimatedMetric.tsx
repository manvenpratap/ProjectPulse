import React, { useRef, useEffect } from 'react';
import { animate, useReducedMotion } from 'motion/react';

export const COCKPIT_EASE: readonly [number, number, number, number] = [0.23, 1, 0.32, 1];

export interface AnimatedMetricProps {
  value: number | string;
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
 * Supports both numbers and numeric strings (e.g. from `.toFixed()`).
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

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const effectiveDecimals = decimals > 0 
    ? decimals 
    : (typeof value === 'string' && value.includes('.') ? value.split('.')[1].length : 0);

  const formatNumber = (num: number) => {
    if (effectiveDecimals > 0) {
      return num.toFixed(effectiveDecimals);
    }
    return Math.round(num).toString();
  };

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (shouldReduce || numericValue === 0 || isNaN(numericValue)) {
      el.textContent = `${prefix}${formatNumber(numericValue)}${suffix}`;
      return;
    }

    const controls = animate(0, numericValue, {
      duration,
      ease: COCKPIT_EASE,
      onUpdate: (latest) => {
        el.textContent = `${prefix}${formatNumber(latest)}${suffix}`;
      }
    });

    return () => controls.stop();
  }, [numericValue, prefix, suffix, effectiveDecimals, duration, triggerKey, shouldReduce]);

  return (
    <span ref={spanRef} className={className} data-animated-metric="true">
      {prefix}{formatNumber(numericValue)}{suffix}
    </span>
  );
};

export default AnimatedMetric;
