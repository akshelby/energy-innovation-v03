import { useCallback, useEffect, useRef } from "react";

/**
 * Swipe + arrow-button control for a CSS-animated marquee that loops
 * `translateX(0)` → `translateX(-50%)` (our `animate-marquee` class).
 *
 * Design notes:
 * - During a drag, the CSS animation is paused and we drive the transform
 *   directly. On release, an inertial glide continues using the release
 *   velocity (so glide distance/duration scale linearly with swipe speed),
 *   and ONLY when the glide is fully done do we resume the CSS animation
 *   from the final offset. This avoids the "two animations fighting"
 *   glitch that happens if the auto-marquee resumes mid-glide.
 * - On touch we only hijack the gesture once horizontal intent is clear,
 *   so vertical page scrolling stays smooth.
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
    const progress = -normalized / halfWidth; // 0 → 1
    const duration = getAnimDurationMs(track);
    // Set the delay first, then in the SAME frame clear the inline transform
    // and animation-play-state so the animation picks up exactly where the
    // glide left off — no visible jump.
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
    let momentumRaf = 0;

    // Velocity tracking via a small ring buffer of recent samples — gives a
    // much more stable release velocity than a single last-delta reading.
    type Sample = { x: number; t: number };
    const samples: Sample[] = [];
    const pushSample = (x: number, t: number) => {
      samples.push({ x, t });
      // keep ~80ms of history
      const cutoff = t - 80;
      while (samples.length > 1 && samples[0].t < cutoff) samples.shift();
    };
    const releaseVelocity = () => {
      if (samples.length < 2) return 0;
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = b.t - a.t;
      if (dt <= 0) return 0;
      return (b.x - a.x) / dt; // px / ms
    };

    const cancelMomentum = () => {
      if (momentumRaf) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = 0;
      }
    };

    /**
     * Inertial glide using exponential decay:
     *   x(t) = x0 + v0 * τ * (1 - exp(-t/τ))
     * Total travel = v0 * τ. So glide distance is proportional to release
     * velocity → speed feels naturally linked to swipe speed.
     */
    const runMomentum = (fromX: number, v0: number, isTouch: boolean) => {
      cancelMomentum();
      // Touch gets a longer time constant for a smoother, more natural feel.
      const tau = isTouch ? 380 : 240;
      const minV = 0.01; // px/ms — stop threshold
      const maxV = 5; // clamp absurd flick speeds (px/ms)
      const v = Math.max(-maxV, Math.min(maxV, v0));
      if (Math.abs(v) < minV) {
        resumeAt(track, fromX);
        return;
      }
      const startT = performance.now();
      const step = (now: number) => {
        const t = now - startT;
        const decay = Math.exp(-t / tau);
        const offset = v * tau * (1 - decay);
        const x = fromX + offset;
        track.style.transform = `translateX(${x}px)`;
        const currentV = v * decay; // px/ms
        if (Math.abs(currentV) > minV && t < 1500) {
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
      directionLocked = e.pointerType === "mouse";
      isHorizontal = e.pointerType === "mouse";
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      samples.length = 0;
      pushSample(e.clientX, performance.now());
      // Snapshot current translate BEFORE pausing so we don't miss a frame.
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
        const threshold = e.pointerType === "touch" ? 4 : 5;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          isHorizontal = true;
          container.setPointerCapture?.(e.pointerId);
          container.style.cursor = "grabbing";
        } else {
          isHorizontal = false;
          isDragging = false;
          resumeAt(track, currentTranslate);
          return;
        }
        directionLocked = true;
      }

      if (!isHorizontal) return;
      e.preventDefault?.();
      pushSample(e.clientX, performance.now());
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

      pushSample(e.clientX, performance.now());
      const finalX = getTranslateX(track);
      const v = releaseVelocity();
      runMomentum(finalX, v);
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
