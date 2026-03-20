import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useParallax } from "@/hooks/useParallax";

export default function AboutSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();
  const parallaxHeading = useParallax(-0.04);

  return (
    <section id="about" className="py-24 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center scroll-reveal">
          <span className="inline-block px-5 py-2 text-sm font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full mb-4">
            {t("about.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("about.title")}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            {t("about.desc")}
          </p>
        </div>
      </div>
    </section>
  );
}
