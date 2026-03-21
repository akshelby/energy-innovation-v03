import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Award, CheckCircle, Target, Headphones, ArrowRight } from "lucide-react";

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
    <section className="py-14 md:py-24 px-6 gradient-primary overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16 scroll-reveal">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-primary-foreground bg-accent/30 rounded-full mb-4">
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
                className="scroll-reveal group relative rounded-2xl overflow-hidden"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Left accent edge */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent via-accent/40 to-transparent transition-all duration-500 group-hover:w-1.5 group-hover:from-accent group-hover:via-accent group-hover:to-accent/30" />

                <div className="pl-6 pr-6 py-7 bg-primary-foreground/[0.05] border border-primary-foreground/[0.08] border-l-0 rounded-r-2xl transition-colors duration-300 group-hover:bg-primary-foreground/[0.08] group-hover:border-primary-foreground/[0.12] flex flex-col h-full">
                  {/* Number + Icon row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center transition-colors duration-300 group-hover:bg-destructive/10 group-hover:border-destructive/20">
                      <Icon className="w-6 h-6 text-accent transition-colors duration-300 group-hover:text-destructive" />
                    </div>
                    <span className="text-3xl font-black text-primary-foreground/[0.06] select-none">
                      {reason.num}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-primary-foreground leading-snug mb-2.5">
                    {t(reason.key)}
                  </h3>

                  {/* Description */}
                  <p className="text-primary-foreground/60 text-[13px] leading-relaxed mb-5 flex-1 line-clamp-3">
                    {t(reason.descKey)}
                  </p>

                  {/* Learn more indicator */}
                  <div className="flex items-center gap-1.5 text-accent/60 group-hover:text-accent transition-colors duration-300">
                    <span className="text-[11px] font-semibold tracking-wide">Learn more</span>
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
