import { useEffect, useRef } from "react";

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
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
      const children = el.querySelectorAll(".scroll-reveal");
      children.forEach((child) => observer.observe(child));
      // Also observe the element itself
      if (el.classList.contains("scroll-reveal")) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
