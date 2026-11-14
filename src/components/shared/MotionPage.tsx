import React from 'react';
import { motion, useReducedMotion, Variants } from 'motion/react';
import clsx from 'clsx';
import { COCKPIT_EASE } from './AnimatedMetric';

export { COCKPIT_EASE };

export const PAGE_VARIANTS: Variants = {
  initial: { 
    opacity: 0, 
    transform: 'translateY(8px)' 
  },
  animate: { 
    opacity: 1, 
    transform: 'translateY(0px)',
    transition: { 
      duration: 0.24, 
      ease: COCKPIT_EASE 
    } 
  },
  exit: { 
    opacity: 0, 
    transform: 'translateY(-6px)',
    transition: { 
      duration: 0.14, 
      ease: COCKPIT_EASE 
    } 
  }
};

export const STAGGER_CONTAINER_VARIANTS = (stagger = 0.04, delay = 0.02): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay
    }
  }
});

export const STAGGER_ITEM_VARIANTS: Variants = {
  initial: { 
    opacity: 0, 
    transform: 'translateY(10px)' 
  },
  animate: { 
    opacity: 1, 
    transform: 'translateY(0px)',
    transition: { 
      duration: 0.24, 
      ease: COCKPIT_EASE 
    } 
  }
};

interface MotionPageProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Top-level view transition wrapper that provides the executive cockpit entry animation.
 * Strictly respects system prefers-reduced-motion.
 */
export const MotionPage = React.forwardRef<HTMLDivElement, MotionPageProps>(({
  children,
  className = "flex-1 overflow-y-auto custom-scroll w-full",
  id
}, ref) => {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <div ref={ref} id={id} className={className} data-motion-page="true">
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      className={className}
      data-motion-page="true"
    >
      {children}
    </motion.div>
  );
});

MotionPage.displayName = 'MotionPage';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: string;
}

/**
 * Container that orchestrates sequential entrance delays across child StaggerItems.
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
  stagger = 0.04,
  delay = 0.02
}) => {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={STAGGER_CONTAINER_VARIANTS(stagger, delay)}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Individual widget/card item with hardware-accelerated GPU translation and fade entry.
 */
export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  onClick
}) => {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={STAGGER_ITEM_VARIANTS}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export interface AnimatedProgressBarProps {
  progress: number;
  height?: number | string;
  heightClass?: string;
  trackClassName?: string;
  barClassName?: string;
  delay?: number;
}

/**
 * Smoothly animated progress bar using spring/ease physics from 0 to target percentage.
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height,
  heightClass = "h-1.5",
  trackClassName = "bg-[var(--color-surface-2)] border border-[var(--color-divider)]/40",
  barClassName = "bg-[var(--color-primary-hex)]",
  delay = 0.08
}) => {
  const shouldReduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const style = height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined;

  return (
    <div 
      className={clsx("w-full rounded-full overflow-hidden shadow-inner", !height && heightClass, trackClassName)}
      style={style}
    >
      <motion.div
        initial={shouldReduce ? { width: `${clamped}%` } : { width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={shouldReduce ? { duration: 0 } : { duration: 0.6, delay, ease: COCKPIT_EASE }}
        className={clsx("h-full rounded-full", barClassName)}
      />
    </div>
  );
};

export default MotionPage;
