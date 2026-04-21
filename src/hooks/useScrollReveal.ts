import { useEffect, useRef } from "react";

/**
 * Scroll-reveal hook using IntersectionObserver.
 * - Animates each `.scroll-reveal` or `.animate-on-scroll` child once when it enters the viewport.
 * - Adds `.visible` (legacy) and `.is-visible` (new) so both CSS conventions work.
 * - Mobile uses a smaller rootMargin/threshold so animations trigger earlier and feel snappier.
 */
export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible", "is-visible");
            observer.unobserve(entry.target); // play once
          }
        });
      },
      {
        threshold: isMobile ? 0.01 : 0.1,
        rootMargin: isMobile ? "0px 0px 80px 0px" : "0px 0px -50px 0px",
      }
    );

    const el = ref.current;
    if (el) {
      const children = el.querySelectorAll(".scroll-reveal, .animate-on-scroll");
      children.forEach((child) => observer.observe(child));
      if (el.classList.contains("scroll-reveal") || el.classList.contains("animate-on-scroll")) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
