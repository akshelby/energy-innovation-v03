import React, { Fragment, useEffect, useRef } from "react";

interface StickyCardStackProps {
  children: React.ReactNode[];
  /** px from viewport top where the first card sticks */
  baseTop?: number;
  /** px added per card for the stacking offset */
  offsetIncrement?: number;
  /** CSS height value for scroll space between cards */
  scrollSpace?: string;
  /** Max-width class for the card column */
  maxWidthClass?: string;
}

/**
 * Renders children as sticky-stacking cards that overlap on scroll.
 * Each card sticks at an incrementally higher `top` value so they
 * pile up like a deck, with subtle scale + brightness depth cues.
 */
export default function StickyCardStack({
  children,
  baseTop = 80,
  offsetIncrement = 20,
  scrollSpace = "35vh",
  maxWidthClass = "max-w-lg",
}: StickyCardStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const count = React.Children.count(children);

  // Scroll-driven depth effect: cards further back scale down & dim
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>("[data-sticky-card]");
    if (!cards.length) return;

    let ticking = false;

    const update = () => {
      // Determine which cards are currently stuck
      const stuckStates: boolean[] = [];
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const targetTop = baseTop + i * offsetIncrement;
        stuckStates.push(rect.top <= targetTop + 4);
      });

      cards.forEach((card, i) => {
        if (!stuckStates[i]) {
          card.style.transform = "";
          card.style.filter = "";
          return;
        }

        // Count how many later cards are also stuck (stacking on top of this one)
        let cardsAbove = 0;
        for (let j = i + 1; j < cards.length; j++) {
          if (stuckStates[j]) cardsAbove++;
        }

        if (cardsAbove > 0) {
          const scale = 1 - cardsAbove * 0.025;
          const brightness = 1 - cardsAbove * 0.06;
          card.style.transform = `scale(${Math.max(scale, 0.88)})`;
          card.style.filter = `brightness(${Math.max(brightness, 0.7)})`;
        } else {
          card.style.transform = "";
          card.style.filter = "";
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(update);
    return () => window.removeEventListener("scroll", onScroll);
  }, [baseTop, offsetIncrement, count]);

  return (
    <div ref={containerRef} className={`${maxWidthClass} mx-auto`}>
      {React.Children.map(children, (child, i) => (
        <Fragment key={i}>
          <div
            data-sticky-card
            className="sticky will-change-transform rounded-2xl transition-[transform,filter] duration-500 ease-out"
            style={{
              top: `${baseTop + i * offsetIncrement}px`,
              zIndex: i + 1,
            }}
          >
            {child}
          </div>
          {i < count - 1 && (
            <div style={{ height: scrollSpace }} aria-hidden="true" />
          )}
        </Fragment>
      ))}
    </div>
  );
}
