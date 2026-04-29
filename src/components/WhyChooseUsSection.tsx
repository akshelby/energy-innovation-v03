import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, CheckCircle, Target, Headphones, ArrowRight } from "lucide-react";

const reasons = [
  { key: "why.expertise", descKey: "why.expertise.desc", icon: Award, num: "01" },
  { key: "why.quality", descKey: "why.quality.desc", icon: CheckCircle, num: "02" },
  { key: "why.precision", descKey: "why.precision.desc", icon: Target, num: "03" },
  { key: "why.support", descKey: "why.support.desc", icon: Headphones, num: "04" },
];

export default function WhyChooseUsSection() {
  const { t } = useLanguage();
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: isMobile ? 0.05 : 0.15,
        rootMargin: isMobile ? "0px 0px 60px 0px" : "0px 0px -40px 0px",
      }
    );

    cardsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-14 md:py-14 px-6 md:px-12 lg:px-20 gradient-primary overflow-hidden">
      <div className="w-full mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("why.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            {t("why.title")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            const slideClass = i % 2 === 0 ? "card-slide-left" : "card-slide-right";
            return (
              <div
                key={reason.key}
                ref={(el) => (cardsRef.current[i] = el)}
                className={`${slideClass} group relative rounded-2xl overflow-hidden`}
                style={{
                  transitionDelay: `${i * 100}ms`,
                  transitionDuration: "1.2s",
                  transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
                  transitionProperty: "opacity, transform",
                }}
              >
                {/* Left accent edge */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent via-accent/60 to-accent/20 transition-all duration-500 group-hover:w-1.5 z-10" />

                <div className="pl-6 pr-6 py-7 bg-white border border-black/5 border-l-0 rounded-r-2xl shadow-lg shadow-black/10 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/20 flex flex-col h-full">
                  {/* Number + Icon row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-accent border border-accent flex items-center justify-center transition-colors duration-300 group-hover:bg-destructive group-hover:border-destructive">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-black text-accent/80 select-none">
                      {reason.num}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-2.5">
                    {t(reason.key)}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-[13px] leading-relaxed mb-5 flex-1 line-clamp-3">
                    {t(reason.descKey)}
                  </p>

                  {/* Learn more indicator */}
                  <div className="flex items-center gap-1.5 text-accent/70 group-hover:text-accent transition-colors duration-300">
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
