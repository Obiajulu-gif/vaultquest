"use client";

import { useEffect, useRef, useState } from "react";
import { yieldPerSecond } from "@/lib/yield-counter";

/**
 * High-performance accrued-yield display using requestAnimationFrame.
 * Accrues in real time at the rate implied by APY on principal.
 */
export function useYieldCounter(principal, apyPercent, baseAccrued = 0, enabled = true) {
  const [displayValue, setDisplayValue] = useState(baseAccrued);
  const rateRef = useRef(0);
  const valueRef = useRef(baseAccrued);
  const lastTsRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    rateRef.current = yieldPerSecond(principal, apyPercent);
    valueRef.current = baseAccrued;
    setDisplayValue(baseAccrued);
    lastTsRef.current = null;
  }, [principal, apyPercent, baseAccrued]);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return undefined;
    }

    const tick = (ts) => {
      if (lastTsRef.current != null) {
        const deltaSec = (ts - lastTsRef.current) / 1000;
        valueRef.current += rateRef.current * deltaSec;
        setDisplayValue(valueRef.current);
      }
      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, principal, apyPercent]);

  return displayValue;
}
