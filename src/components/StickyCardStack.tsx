import React, { Fragment, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  /** Whether mobile cards take full viewport height */
  fullHeight?: boolean;
}

/**
 * Renders children as sticky-stacking cards that overlap on scroll (mobile only).
 * On tablet/desktop the cards render as a plain vertical list without sticky/parallax.
 */
export default function StickyCardStack({
  children,
  baseTop = 80,
  offsetIncrement = 20,
  scrollSpace = "35vh",
  maxWidthClass = "max-w-lg",
  fullHeight = false,
}: StickyCardStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const count = React.Children.count(children);
  const isMobile = useIsMobile();

  // Scroll-linked depth effect disabled — no scroll-speed animations.

  // Desktop/tablet: plain list without sticky behavior
  if (!isMobile) {
    return (
      <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {React.Children.map(children, (child, i) => (
          <div key={i} className="rounded-2xl h-full [&>*]:h-full">
            {child}
          </div>
        ))}
      </div>
    );
  }

  // Mobile: sticky stacking cards
  return (
    <div ref={containerRef} className={`${maxWidthClass} mx-auto px-2`}>
      {React.Children.map(children, (child, i) => (
        <Fragment key={i}>
          <div
            data-sticky-card
            className={`sticky will-change-transform rounded-2xl overflow-hidden transition-[transform,filter] duration-500 ease-out ${fullHeight ? "min-h-fit" : ""}`}
            style={{
              top: `${baseTop + i * offsetIncrement}px`,
              zIndex: i + 1,
            }}
          >
            {/* Force child scroll-reveal to be visible inside sticky stack */}
            <div className="[&>.scroll-reveal]:!opacity-100 [&>.scroll-reveal]:!translate-y-0 h-full">
              {child}
            </div>
          </div>
          {i < count - 1 && (
            <div style={{ height: fullHeight ? "0" : scrollSpace }} aria-hidden="true" />
          )}
        </Fragment>
      ))}
    </div>
  );
}