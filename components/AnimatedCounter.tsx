"use client";

import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  formatCurrency?: boolean;
  className?: string;
}

// helper --------------------------------------------------------------------------
// function AnimatedCounter untuk animasi angka bertambah secara efisien tanpa re-render React
// input param : target (number), duration (number optional), formatCurrency (boolean optional)
// output : React component JSX yang menampilkan angka ter-animasi
// end of helper ------------------------------------------------------------------
export default function AnimatedCounter({
  target,
  duration = 400,
  formatCurrency = false,
  className = "",
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = formatCurrency ? target.toLocaleString("id-ID") : target.toString();
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * target);

      el.textContent = formatCurrency
        ? currentCount.toLocaleString("id-ID")
        : currentCount.toString();

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        el.textContent = formatCurrency
          ? target.toLocaleString("id-ID")
          : target.toString();
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [target, duration, formatCurrency]);

  const initialText = formatCurrency ? target.toLocaleString("id-ID") : target.toString();

  return (
    <span ref={spanRef} className={className}>
      {initialText}
    </span>
  );
}
