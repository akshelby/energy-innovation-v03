import { useEffect, useRef, useCallback } from "react";

/**
 * Applies a subtle parallax translateY effect to the referenced element.
 * `speed` controls intensity: 0 = no movement, 0.1 = subtle, 0.3 = noticeable.
 * Positive speed = element moves slower than scroll (background feel).
 * Negative speed = element moves faster (foreground pop).
 */
export function useParallax(speed = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Only animate when element is near or in viewport
    if (rect.bottom < -200 || rect.top > windowH + 200) {
      ticking.current = false;
      return;
    }

    // Center-based offset: 0 when element center is at viewport center
    const elCenter = rect.top + rect.height / 2;
    const viewCenter = windowH / 2;
    const offset = (elCenter - viewCenter) * speed;

    el.style.transform = `translate3d(0, ${offset}px, 0)`;
    ticking.current = false;
  }, [speed]);

  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial position
    requestAnimationFrame(update);

    return () => window.removeEventListener("scroll", onScroll);
  }, [update]);

  return ref;
}
