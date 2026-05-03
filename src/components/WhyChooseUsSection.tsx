import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, CheckCircle, Target, Headphones } from "lucide-react";

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
                className={`${slideClass} group relative h-full`}
                style={{
                  transitionDelay: `${i * 100}ms`,
                  transitionDuration: "1.2s",
                  transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
                  transitionProperty: "opacity, transform",
                }}
              >
                <div className="relative h-full overflow-hidden rounded-2xl bg-white border border-black/5 shadow-lg shadow-black/10 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/20">
                  {/* Diagonal corner accent */}
                  <div
                    className="absolute top-0 right-0 w-28 h-28 bg-accent transition-colors duration-500 group-hover:bg-destructive"
                    style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                    aria-hidden="true"
                  />
                  <span className="absolute top-2.5 right-3.5 z-10 text-white text-sm font-black tracking-wider select-none">
                    {reason.num}
                  </span>

                  {/* Subtle backdrop number watermark */}
                  <span
                    className="absolute -bottom-6 -left-2 text-[110px] font-black leading-none text-accent/[0.05] select-none pointer-events-none"
                    aria-hidden="true"
                  >
                    {reason.num}
                  </span>

                  <div className="relative z-10 px-6 pt-7 pb-6 flex flex-col h-full">
                    {/* Icon tile */}
                    <div className="size-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center mb-5 transition-all duration-500 group-hover:bg-destructive/10 group-hover:border-destructive/25 group-hover:rotate-3">
                      <Icon className="w-6 h-6 text-accent transition-colors duration-500 group-hover:text-destructive" strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-2.5 pr-12">
                      {t(reason.key)}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-[13px] leading-relaxed mb-5 flex-1 line-clamp-3 min-h-[calc(1.625em*3)]">
                      {t(reason.descKey)}
                    </p>

                    {/* Animated underline accent */}
                    <div className="h-px w-10 bg-accent transition-all duration-500 group-hover:w-20 group-hover:bg-destructive" />
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
