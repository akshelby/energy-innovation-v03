import { useEffect, useRef, useCallback } from "react";

/**
 * Applies a subtle parallax translateY effect to the referenced element.
 * `speed` controls intensity: 0 = no movement, 0.1 = subtle, 0.3 = noticeable.
 * Positive speed = element moves slower than scroll (background feel).
 * Negative speed = element moves faster (foreground pop).
 */
export function useParallax(_speed = 0) {
  const ref = useRef<HTMLDivElement>(null);
  // Parallax disabled — scroll-linked motion removed for a static feel.
  return ref;
}
