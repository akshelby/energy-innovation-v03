import { useEffect, useRef } from "react";

/**
 * Adds touch/mouse swipe control to a CSS-animated marquee that loops
 * `translateX(0)` → `translateX(-50%)` (i.e. our `animate-marquee` class).
 *
 * Drag in either direction (left/right) is supported. When the user releases,
 * the animation resumes seamlessly from the dragged offset by adjusting
 * `animation-delay` instead of snapping back to its previous position.
 *
 * Usage: attach `containerRef` to the scroll wrapper and `trackRef` to the
 * inner element that has `animate-marquee`.
 */
export function useSwipeableMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let pointerId: number | null = null;
    let moved = 0;

    const getTranslateX = (el: HTMLElement) => {
      const t = window.getComputedStyle(el).transform;
      if (!t || t === "none") return 0;
      const m = t.match(/matrix.*\((.+)\)/);
      if (!m) return 0;
      const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
      return parts.length === 6 ? parts[4] : (parts[12] ?? 0);
    };

    const getAnimDurationMs = (el: HTMLElement) => {
      const d = window.getComputedStyle(el).animationDuration;
      if (!d) return 40000;
      const v = parseFloat(d);
      return d.endsWith("ms") ? v : v * 1000;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDragging = true;
      moved = 0;
      pointerId = e.pointerId;
      startX = e.clientX;
      currentTranslate = getTranslateX(track);
      track.style.animationPlayState = "paused";
      track.style.transform = `translateX(${currentTranslate}px)`;
      container.setPointerCapture?.(e.pointerId);
      container.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== pointerId) return;
      const delta = e.clientX - startX;
      moved = delta;
      track.style.transform = `translateX(${currentTranslate + delta}px)`;
    };

    const endDrag = (e: PointerEvent) => {
      if (!isDragging || (pointerId !== null && e.pointerId !== pointerId)) return;
      isDragging = false;
      pointerId = null;
      container.style.cursor = "grab";

      // Marquee loops from translateX(0) to translateX(-halfWidth) where
      // halfWidth = trackWidth / 2 (we duplicate the list). Map the final
      // dragged X to a time offset within the animation duration so the
      // animation resumes seamlessly from this exact position.
      const finalX = currentTranslate + moved;
      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 0) {
        // Normalise finalX into the range (-halfWidth, 0]
        let normalized = finalX % halfWidth;
        if (normalized > 0) normalized -= halfWidth;
        const progress = -normalized / halfWidth; // 0 → 1
        const duration = getAnimDurationMs(track);
        // negative animation-delay starts the animation at that offset
        track.style.animationDelay = `-${progress * duration}ms`;
      }

      // Clear inline transform so the CSS animation drives motion again.
      track.style.transform = "";
      track.style.animationPlayState = "";
    };

    container.style.cursor = "grab";
    container.style.touchAction = "pan-y";

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);
    container.addEventListener("pointerleave", endDrag);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointercancel", endDrag);
      container.removeEventListener("pointerleave", endDrag);
    };
  }, []);

  return { containerRef, trackRef };
}
