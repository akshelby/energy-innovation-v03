import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useParallax } from "@/hooks/useParallax";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AboutSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();
  const parallaxHeading = useParallax(-0.04);
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const showToggle = isMobile;
  const isCollapsed = showToggle && !expanded;

  return (
    <section id="about" className="py-14 md:py-24 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div ref={parallaxHeading} className="text-center scroll-reveal will-change-transform">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("about.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("about.title")}
          </h2>
          <div
            className={`grid max-w-3xl mx-auto transition-[grid-template-rows] duration-500 ease-in-out ${
              isCollapsed ? "[grid-template-rows:4.5rem]" : "[grid-template-rows:1fr]"
            } md:[grid-template-rows:1fr]`}
          >
            <p
              className={`text-muted-foreground text-lg leading-relaxed overflow-hidden ${
                isCollapsed ? "line-clamp-3" : ""
              } md:line-clamp-none`}
            >
              {t("about.desc")}
            </p>
          </div>
          {showToggle && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="md:hidden mt-4 inline-flex items-center gap-1.5 text-accent font-semibold text-sm hover:opacity-80 transition-opacity"
              aria-expanded={expanded}
            >
              {expanded ? "Read Less" : "Read More"}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
