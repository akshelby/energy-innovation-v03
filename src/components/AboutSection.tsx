import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AboutSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const showToggle = isMobile;
  const isCollapsed = showToggle && !expanded;

  return (
    <section id="about" className="py-14 md:py-24 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center scroll-reveal-fade">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("about.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("about.title")}
          </h2>
          <div className="max-w-3xl mx-auto relative">
            <p
              className={`text-muted-foreground text-lg leading-relaxed ${
                isCollapsed ? "line-clamp-3" : ""
              } md:line-clamp-none`}
            >
              {t("about.desc")}
            </p>
            {isCollapsed && (
              <div
                className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-background"
                aria-hidden="true"
              />
            )}
          </div>
          {showToggle && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="md:hidden mt-2 inline-flex items-center gap-1 text-accent text-sm font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
              aria-expanded={expanded}
            >
              {expanded ? "Read Less" : "Read More"}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
