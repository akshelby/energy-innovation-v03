import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PenTool, Wrench, Settings, MessageSquare } from "lucide-react";

const services = [
  { key: "services.drawing", descKey: "services.drawing.desc", icon: PenTool },
  { key: "services.install", descKey: "services.install.desc", icon: Wrench },
  { key: "services.maintenance", descKey: "services.maintenance.desc", icon: Settings },
  { key: "services.consulting", descKey: "services.consulting.desc", icon: MessageSquare },
];

export default function ServicesSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="services" className="py-24 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full mb-4">
            {t("services.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("services.desc")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={service.key}
                className="scroll-reveal text-center p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-5 mx-auto">
                  <Icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{t(service.key)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(service.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
