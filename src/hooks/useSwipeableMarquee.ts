import { useEffect, useRef } from "react";

/**
 * Adds touch/mouse swipe control to a CSS-animated marquee.
 *
 * Usage: attach `containerRef` to the scroll wrapper and `trackRef` to the
 * inner element that has `animate-marquee`. While the user drags, the CSS
 * animation pauses and the track follows the pointer. On release the
 * animation resumes from the dragged offset.
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

    const getTranslateX = (el: HTMLElement) => {
      const t = window.getComputedStyle(el).transform;
      if (!t || t === "none") return 0;
      // matrix(a, b, c, d, tx, ty)  |  matrix3d(... , tx, ty, tz, 1)
      const m = t.match(/matrix.*\((.+)\)/);
      if (!m) return 0;
      const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
      return parts.length === 6 ? parts[4] : parts[12] ?? 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only react to primary button / touch / pen
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDragging = true;
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
      track.style.transform = `translateX(${currentTranslate + delta}px)`;
    };

    const endDrag = (e: PointerEvent) => {
      if (!isDragging || (pointerId !== null && e.pointerId !== pointerId)) return;
      isDragging = false;
      pointerId = null;
      container.style.cursor = "";
      // Clear the inline transform so the CSS animation takes over again,
      // resuming visually from where it was paused (animation kept its time).
      track.style.transform = "";
      track.style.animationPlayState = "";
    };

    container.style.cursor = "grab";
    container.style.touchAction = "pan-y"; // allow vertical scroll, capture horizontal

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
