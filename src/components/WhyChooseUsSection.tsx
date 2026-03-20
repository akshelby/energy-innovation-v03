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
    <section className="py-24 px-6 gradient-primary overflow-hidden" ref={ref}>
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
                className="scroll-reveal group relative h-[280px] rounded-2xl cursor-default"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Resting state — number + icon + title */}
                <div className="absolute inset-0 rounded-2xl border border-primary-foreground/[0.08] bg-gradient-to-b from-primary-foreground/[0.07] to-transparent p-7 flex flex-col justify-between transition-all duration-500 group-hover:opacity-0 group-hover:scale-95">
                  {/* Large watermark number */}
                  <span className="absolute -top-2 -right-1 text-[7rem] font-black leading-none text-accent/[0.06] select-none pointer-events-none">
                    {reason.num}
                  </span>

                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-primary-foreground leading-snug mb-2">
                      {t(reason.key)}
                    </h3>
                    <div className="w-10 h-[2px] rounded-full bg-gradient-to-r from-accent to-accent/0" />
                  </div>
                </div>

                {/* Hover state */}
                <div className="absolute inset-0 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.12] via-accent/[0.06] to-transparent backdrop-blur-sm p-7 flex flex-col justify-between opacity-0 scale-105 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-base font-bold text-primary-foreground leading-snug">
                      {t(reason.key)}
                    </h3>
                  </div>

                  <p className="text-primary-foreground/75 text-[13px] leading-relaxed">
                    {t(reason.descKey)}
                  </p>

                  <span className="text-[11px] font-mono font-bold tracking-widest text-accent/50">
                    {reason.num} / 04
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
