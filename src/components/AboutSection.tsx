import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { key: "about.experience", value: "25+" },
  { key: "about.projects", value: "1,200+" },
  { key: "about.countries", value: "40+" },
  { key: "about.clients", value: "500+" },
];

export default function AboutSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="about" className="py-24 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full mb-4">
            {t("about.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("about.title")}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            {t("about.desc")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.key}
              className="scroll-reveal text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p className="text-3xl md:text-4xl font-extrabold text-gradient mb-2">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{t(stat.key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
