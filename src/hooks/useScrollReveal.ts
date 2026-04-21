import { useEffect, useRef } from "react";

/**
 * Scroll-reveal hook using IntersectionObserver.
 * - The section root itself slides in from the left or right (based on its order in the page).
 *   Odd sections (1st, 3rd, 5th...) slide in from the left.
 *   Even sections (2nd, 4th, 6th...) slide in from the right.
 * - Inner `.scroll-reveal` / `.animate-on-scroll` children continue to fade up with stagger.
 * - Plays once per element. Mobile uses smaller offsets so animations feel snappier.
 */
export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const el = ref.current;
    if (!el) return;

    // Determine section order among siblings to pick slide direction.
    const parent = el.parentElement;
    let sectionIndex = 0;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === "SECTION");
      const idx = siblings.indexOf(el);
      sectionIndex = idx >= 0 ? idx : 0;
    }
    const slideClass = sectionIndex % 2 === 0 ? "section-reveal-left" : "section-reveal-right";
    el.classList.add(slideClass);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible", "is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: isMobile ? 0.01 : 0.1,
        rootMargin: isMobile ? "0px 0px 80px 0px" : "0px 0px -50px 0px",
      }
    );

    // Observe the section itself for the slide-in.
    observer.observe(el);

    // Observe inner reveal children for staggered fade-up.
    const children = el.querySelectorAll(".scroll-reveal, .animate-on-scroll");
    children.forEach((child) => observer.observe(child));
    if (el.classList.contains("scroll-reveal") || el.classList.contains("animate-on-scroll")) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
