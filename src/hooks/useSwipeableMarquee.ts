import { useCallback, useEffect, useRef } from "react";

/**
 * Native-scroll marquee.
 *
 * The container uses real horizontal `overflow-x: auto`, so swiping feels
 * exactly like vertical page scrolling — including the OS's own inertial
 * momentum on iOS/Android/trackpads. We auto-advance by nudging
 * `scrollLeft` each frame (paused while the user is interacting), and we
 * seamlessly wrap by jumping by `halfWidth` whenever the scroll position
 * crosses the loop boundary. The track must contain the content duplicated
 * twice so the wrap is invisible.
 *
 * Consumers should:
 *   - apply `animate-marquee` to NOTHING (we drive scroll ourselves)
 *   - render the items twice inside `trackRef`
 *   - keep the existing `nudge(delta)` arrow buttons
 */
export function useSwipeableMarquee(opts?: { speed?: number }) {
  // px / second for the auto scroll. Default tuned to feel similar to the
  // previous CSS marquee.
  const speed = opts?.speed ?? 40;

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const interactingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);

  const pauseAuto = (resumeAfterMs = 1500) => {
    interactingRef.current = true;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      interactingRef.current = false;
      idleTimerRef.current = null;
    }, resumeAfterMs);
  };

  const nudge = useCallback((delta: number) => {
    const c = containerRef.current;
    if (!c) return;
    pauseAuto(1500);
    // delta is in "marquee" coords (positive = scroll content right). Native
    // scrollLeft is the opposite sign, so subtract.
    c.scrollBy({ left: -delta, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    // ---- Loop wrapping ----
    // We render content twice; halfWidth is the width of one copy. Whenever
    // scrollLeft crosses [halfWidth, 2*halfWidth] we subtract halfWidth (and
    // mirror for the other side) so the user never reaches an edge.
    const getHalf = () => track.scrollWidth / 2;

    const wrap = () => {
      const half = getHalf();
      if (half <= 0) return;
      const sl = container.scrollLeft;
      if (sl >= half * 2 - 1) {
        container.scrollLeft = sl - half;
      } else if (sl <= 0) {
        container.scrollLeft = sl + half;
      }
    };

    // Start in the middle so the user can swipe in either direction freely.
    const initScroll = () => {
      const half = getHalf();
      if (half > 0) container.scrollLeft = half / 2;
    };
    // Wait a frame for layout/images to settle.
    const initRaf = requestAnimationFrame(initScroll);

    // ---- Auto-advance loop ----
    let rafId = 0;
    let lastT = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - lastT); // clamp big gaps (tab switch)
      lastT = now;
      if (!interactingRef.current && document.visibilityState === "visible") {
        // RTL feel: content drifts to the left → scrollLeft increases.
        container.scrollLeft += (speed * dt) / 1000;
      }
      wrap();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // ---- Pause while user is touching / dragging / wheeling ----
    const onScroll = () => wrap();
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-marquee-arrow]")) return;
      pauseAuto(2500);
    };
    const onPointerUp = () => pauseAuto(1500);
    const onWheel = () => pauseAuto(1200);
    const onTouchStart = () => pauseAuto(2500);
    const onTouchEnd = () => pauseAuto(1500);
    const onMouseEnter = () => pauseAuto(800);
    const onMouseLeave = () => pauseAuto(50); // resume almost immediately

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);

    // Re-init position if size changes (fonts/images load).
    const ro = new ResizeObserver(() => {
      // Keep relative position inside the loop after a resize.
      wrap();
    });
    ro.observe(track);

    return () => {
      cancelAnimationFrame(initRaf);
      cancelAnimationFrame(rafId);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      ro.disconnect();
    };
  }, [speed]);

  return { containerRef, trackRef, nudge };
}
