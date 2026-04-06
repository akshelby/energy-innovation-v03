import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useParallax } from "@/hooks/useParallax";
import { supabase } from "@/integrations/supabase/client";
import { Award, TrendingUp, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";

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
  const parallaxImage = useParallax(0.06);
  const isAr = language === "ar";

  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content_key, value_en, value_ar")
        .in("content_key", ["highlight.image", "highlight.images", "highlight.stats"]);
      if (data) {
        // Try multi-image key first, fall back to single image
        const multiEntry = data.find((d) => d.content_key === "highlight.images");
        const singleEntry = data.find((d) => d.content_key === "highlight.image");

        let imgList: string[] = [];
        if (multiEntry?.value_en) {
          try {
            const parsed = JSON.parse(multiEntry.value_en);
            if (Array.isArray(parsed)) imgList = parsed.filter((u: string) => u?.length > 0);
          } catch { /* ignore */ }
        }
        if (imgList.length === 0 && singleEntry?.value_en) {
          imgList = [singleEntry.value_en];
        }
        setImages(imgList);

        const statsEntry = data.find((d) => d.content_key === "highlight.stats");
        if (statsEntry?.value_en) {
          try {
            setStats(JSON.parse(statsEntry.value_en));
          } catch { setStats(defaultStats); }
        } else {
          setStats(defaultStats);
        }
      }
      setReady(true);
    };
    fetchData();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    if (images.length <= 1) return;
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

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

  return (
    <section className={`py-14 md:py-24 px-6 bg-secondary/30 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`} ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div className="scroll-reveal">
            {tagline !== "highlight.tagline" && (
              <h3 className="text-sm md:text-base font-semibold tracking-wide text-accent mb-3">
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

          {/* Right — Image Carousel + Stats */}
          <div className="scroll-reveal relative" style={{ transitionDelay: "150ms" }}>
            <div ref={parallaxImage} className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 will-change-transform relative">
              {images.length > 0 ? (
                <div className="relative aspect-[4/3]">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={isAr ? `صورة القسم ${i + 1}` : `Section highlight ${i + 1}`}
                      width={800}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        i === current ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-foreground/40 transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-foreground/40 transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i === current ? "w-5 bg-background" : "bg-background/50"
                            }`}
                            aria-label={`Go to image ${i + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-[4/3] gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground/40 text-sm">Upload an image in Admin</span>
                </div>
              )}
            </div>

            {/* Floating stats cards */}
            <div className="absolute -bottom-6 left-3 right-3 sm:-bottom-8 sm:left-6 sm:right-6 lg:-bottom-10 lg:-left-6 lg:right-6">
              <div className="bg-foreground/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl" ref={statsRef}>
                <div className="grid grid-cols-3 divide-x divide-muted-foreground/20">
                  {stats.map((stat, i) => {
                    const Icon = iconMap[stat.icon] || Award;
                    return (
                      <div key={i} className="flex flex-col items-center px-1.5 sm:px-3 text-center">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent mb-1 sm:mb-2" />
                        <span className="text-base sm:text-2xl font-bold text-background">
                          <CountUpStat value={isAr ? stat.value_ar : stat.value_en} inView={inView} />
                        </span>
                        <span className="text-[9px] sm:text-xs text-background/60 mt-0.5 leading-tight">
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