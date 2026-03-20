import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Award, CheckCircle, Target, Headphones } from "lucide-react";

const reasons = [
  { key: "why.expertise", descKey: "why.expertise.desc", icon: Award, num: "01" },
  { key: "why.quality", descKey: "why.quality.desc", icon: CheckCircle, num: "02" },
  { key: "why.precision", descKey: "why.precision.desc", icon: Target, num: "03" },
  { key: "why.support", descKey: "why.support.desc", icon: Headphones, num: "04" },
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.key}
                className="scroll-reveal group relative overflow-hidden rounded-2xl transition-all duration-300"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Card body */}
                <div className="relative p-7 pb-8 h-full flex flex-col bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl hover:border-primary-foreground/25 transition-colors duration-300">
                  {/* Step number — top right */}
                  <span className="absolute top-5 right-5 text-[11px] font-bold tracking-widest text-primary-foreground/20 select-none">
                    {reason.num}
                  </span>

                  {/* Icon with accent line */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-primary-foreground mb-2.5 leading-snug">
                    {t(reason.key)}
                  </h3>

                  {/* Description */}
                  <p className="text-primary-foreground/60 text-[13px] leading-relaxed flex-1">
                    {t(reason.descKey)}
                  </p>

                  {/* Bottom accent bar — reveals on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
