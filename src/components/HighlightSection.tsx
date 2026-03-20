import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { Award, TrendingUp, Users, Clock } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award, TrendingUp, Users, Clock,
};

function useCountUp(end: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!start) { setCount(0); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration, start]);

  return count;
}

function parseNumericValue(val: string): { num: number; prefix: string; suffix: string } {
  const match = val.match(/^([^\d]*)([\d.]+)([^\d]*)$/);
  if (!match) return { num: 0, prefix: "", suffix: val };
  return { num: parseFloat(match[2]), prefix: match[1], suffix: match[3] };
}

function CountUpStat({ value, inView }: { value: string; inView: boolean }) {
  const { num, prefix, suffix } = parseNumericValue(value);
  const count = useCountUp(num, 1500, inView);
  if (num === 0) return <>{value}</>;
  return <>{prefix}{count}{suffix}</>;
}

interface StatCard {
  icon: string;
  value_en: string;
  value_ar: string;
  label_en: string;
  label_ar: string;
}

const defaultStats: StatCard[] = [
  { icon: "Award", value_en: "100%", value_ar: "١٠٠٪", label_en: "Quality Assurance", label_ar: "ضمان الجودة" },
  { icon: "TrendingUp", value_en: "20+", value_ar: "+٢٠", label_en: "Years of Experience", label_ar: "سنوات الخبرة" },
  { icon: "Users", value_en: "500+", value_ar: "+٥٠٠", label_en: "Satisfied Clients", label_ar: "عملاء راضون" },
];

export default function HighlightSection() {
  const { t, language } = useLanguage();
  const ref = useScrollReveal();
  const isAr = language === "ar";

  const [imageUrl, setImageUrl] = useState("");
  const [stats, setStats] = useState<StatCard[]>(defaultStats);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content_key, value_en, value_ar")
        .in("content_key", ["highlight.image", "highlight.stats"]);
      if (data) {
        const imgEntry = data.find((d) => d.content_key === "highlight.image");
        if (imgEntry?.value_en) setImageUrl(imgEntry.value_en);
        const statsEntry = data.find((d) => d.content_key === "highlight.stats");
        if (statsEntry?.value_en) {
          try {
            setStats(JSON.parse(statsEntry.value_en));
          } catch { /* use defaults */ }
        }
      }
    };
    fetchData();
  }, []);

  const statsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tagline = t("highlight.tagline");
  const title = t("highlight.title");
  const desc = t("highlight.desc");
  const subdesc = t("highlight.subdesc");

  const hasContent = tagline !== "highlight.tagline" || title !== "highlight.title";

  return (
    <section className="py-24 px-6 bg-secondary/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div className="scroll-reveal">
            {tagline !== "highlight.tagline" && (
              <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-accent mb-3">
                {tagline}
              </h3>
            )}
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-tight mb-6" style={{ textWrap: "balance" }}>
              {title !== "highlight.title" ? title : "Driving Industrial Excellence Forward"}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
              {desc !== "highlight.desc"
                ? desc
                : "Energy Innovation delivers cutting-edge industrial solutions that empower businesses to achieve operational excellence. From strategy to execution, we bring industry-leading expertise across engineering, automation, and safety systems."}
            </p>
            {subdesc !== "highlight.subdesc" && (
              <p className="text-muted-foreground/80 text-sm leading-relaxed">
                {subdesc}
              </p>
            )}
          </div>

          {/* Right — Image + Stats */}
          <div className="scroll-reveal relative" style={{ transitionDelay: "150ms" }}>
            {/* Main image */}
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={isAr ? "صورة القسم" : "Section highlight"}
                  className="w-full aspect-[4/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[4/3] gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground/40 text-sm">Upload an image in Admin</span>
                </div>
              )}
            </div>

            {/* Floating stats cards */}
            <div className="absolute -bottom-8 left-4 right-4 sm:left-6 sm:right-6 lg:-bottom-10 lg:-left-6 lg:right-6">
              <div className="bg-foreground/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
                <div className="grid grid-cols-3 divide-x divide-muted-foreground/20">
                  {stats.map((stat, i) => {
                    const Icon = iconMap[stat.icon] || Award;
                    return (
                      <div key={i} className="flex flex-col items-center px-3 text-center">
                        <Icon className="w-5 h-5 text-accent mb-2" />
                        <span className="text-xl sm:text-2xl font-bold text-background">
                          {isAr ? stat.value_ar : stat.value_en}
                        </span>
                        <span className="text-[11px] sm:text-xs text-background/60 mt-0.5 leading-tight">
                          {isAr ? stat.label_ar : stat.label_en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
