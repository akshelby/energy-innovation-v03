import { useCallback, useEffect, useRef } from "react";

/**
 * Adds touch/mouse swipe + arrow-button control to a CSS-animated marquee
 * that loops `translateX(0)` → `translateX(-50%)` (i.e. our `animate-marquee`
 * class).
 *
 * - Drag in either direction is supported with a smooth momentum/inertia
 *   release (velocity-based glide that decays before the auto-marquee
 *   resumes from the final offset).
 * - Vertical scroll is preserved on touch devices: we only hijack the
 *   gesture once horizontal intent is clear.
 *
 * Returns a `nudge(delta)` function for arrow buttons.
 */
export function useSwipeableMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  const resumeAt = (track: HTMLElement, finalX: number) => {
    const halfWidth = track.scrollWidth / 2;
    if (halfWidth <= 0) return;
    let normalized = finalX % halfWidth;
    if (normalized > 0) normalized -= halfWidth;
    const progress = -normalized / halfWidth;
    const duration = getAnimDurationMs(track);
    track.style.animationDelay = `-${progress * duration}ms`;
    track.style.transform = "";
    track.style.animationPlayState = "";
  };

  const nudge = useCallback((delta: number) => {
    const track = trackRef.current;
    if (!track) return;
    const current = getTranslateX(track);
    track.style.animationPlayState = "paused";
    track.style.transform = `translateX(${current}px)`;
    void track.offsetWidth;
    resumeAt(track, current + delta);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let isDragging = false;
    let directionLocked = false;
    let isHorizontal = false;
    let startX = 0;
    let startY = 0;
    let currentTranslate = 0;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px / ms
    let momentumRaf = 0;

    const cancelMomentum = () => {
      if (momentumRaf) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = 0;
      }
    };

    const runMomentum = (fromX: number, v0: number) => {
      cancelMomentum();
      let x = fromX;
      let v = v0;
      const friction = 0.94; // per frame
      const minV = 0.02; // px/ms
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(32, now - last);
        last = now;
        x += v * dt;
        track.style.transform = `translateX(${x}px)`;
        v *= Math.pow(friction, dt / 16);
        if (Math.abs(v) > minV) {
          momentumRaf = requestAnimationFrame(step);
        } else {
          momentumRaf = 0;
          resumeAt(track, x);
        }
      };
      momentumRaf = requestAnimationFrame(step);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-marquee-arrow]")) return;
      cancelMomentum();
      isDragging = true;
      directionLocked = e.pointerType === "mouse"; // mouse: lock immediately
      isHorizontal = e.pointerType === "mouse";
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = e.clientY;
      lastT = performance.now();
      velocity = 0;
      currentTranslate = getTranslateX(track);
      track.style.animationPlayState = "paused";
      track.style.transform = `translateX(${currentTranslate}px)`;
      if (isHorizontal) {
        container.setPointerCapture?.(e.pointerId);
        container.style.cursor = "grabbing";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!directionLocked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          isHorizontal = true;
          container.setPointerCapture?.(e.pointerId);
          container.style.cursor = "grabbing";
        } else {
          // vertical scroll — release control
          isHorizontal = false;
          isDragging = false;
          resumeAt(track, currentTranslate);
          return;
        }
        directionLocked = true;
      }

      if (!isHorizontal) return;
      e.preventDefault?.();
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = (e.clientX - lastX) / dt; // px / ms
      lastX = e.clientX;
      lastT = now;
      track.style.transform = `translateX(${currentTranslate + dx}px)`;
    };

    const endDrag = (e: PointerEvent) => {
      if (!isDragging || (pointerId !== null && e.pointerId !== pointerId)) return;
      isDragging = false;
      pointerId = null;
      container.style.cursor = "grab";

      if (!isHorizontal) {
        resumeAt(track, currentTranslate);
        return;
      }

      const finalX = getTranslateX(track);
      // Decay flick gestures into a glide; small drags settle immediately.
      if (Math.abs(velocity) > 0.05) {
        runMomentum(finalX, velocity);
      } else {
        resumeAt(track, finalX);
      }
    };

    container.style.cursor = "grab";
    container.style.touchAction = "pan-y";

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove, { passive: false });
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);
    container.addEventListener("pointerleave", endDrag);

    return () => {
      cancelMomentum();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointercancel", endDrag);
      container.removeEventListener("pointerleave", endDrag);
    };
  }, []);

  return { containerRef, trackRef, nudge };
}
