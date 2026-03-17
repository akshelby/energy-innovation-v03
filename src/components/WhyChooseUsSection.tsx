import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Award, CheckCircle, Target, Headphones } from "lucide-react";

const reasons = [
  { key: "why.expertise", descKey: "why.expertise.desc", icon: Award },
  { key: "why.quality", descKey: "why.quality.desc", icon: CheckCircle },
  { key: "why.precision", descKey: "why.precision.desc", icon: Target },
  { key: "why.support", descKey: "why.support.desc", icon: Headphones },
];

export default function WhyChooseUsSection() {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="py-24 px-6 gradient-primary" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground bg-accent/20 rounded-full mb-4">
            {t("why.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            {t("why.title")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.key}
                className="scroll-reveal text-center p-8 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 hover:border-primary-foreground/30 hover:bg-primary-foreground/20 backdrop-blur-sm transition-all duration-300"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-5 mx-auto">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-primary-foreground mb-3">{t(reason.key)}</h3>
                <p className="text-primary-foreground/70 text-sm leading-relaxed">{t(reason.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
