import { useState, useEffect } from 'react';

function isReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Animates a numeric count from 0 to the target value once when key changes.
 * Strictly respects prefers-reduced-motion.
 */
export function useCountUp(
  target: number | null,
  key: string | null | undefined,
  duration = 400
): number | null {
  const reducedMotion = isReducedMotion();
  const [displayValue, setDisplayValue] = useState<number | null>(() => (reducedMotion ? target : 0));

  useEffect(() => {
    if (target === null || target === undefined || target === 0 || reducedMotion) {
      return;
    }

    let frameId: number;
    const start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [target, key, duration, reducedMotion]);

  return reducedMotion ? target : (target === null ? null : displayValue);
}
