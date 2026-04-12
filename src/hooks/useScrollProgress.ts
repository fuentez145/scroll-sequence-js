import { useState, useEffect, useRef, type RefObject } from "react";
import { clamp } from "../core/math";

export interface ScrollProgressResult {
  progress: number;
  isInView: boolean;
}

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>
): ScrollProgressResult {
  const [state, setState] = useState<ScrollProgressResult>({
    progress: 0,
    isInView: false,
  });

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      const rect = el!.getBoundingClientRect();
      const scrollableHeight = el!.offsetHeight - window.innerHeight;
      const isInView = rect.bottom > 0 && rect.top < window.innerHeight;

      let progress = 0;
      if (scrollableHeight > 0) {
        progress = clamp(-rect.top / scrollableHeight, 0, 1);
      }

      setState((prev) => {
        if (prev.progress === progress && prev.isInView === isInView) return prev;
        return { progress, isInView };
      });
    }

    function handleScroll() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        update();
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [ref]);

  return state;
}
