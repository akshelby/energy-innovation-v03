import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useParallax } from "@/hooks/useParallax";

export default function AboutSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();
  const parallaxHeading = useParallax(-0.04);

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
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            {t("about.desc")}
          </p>
        </div>
      </div>
    </section>
  );
}
