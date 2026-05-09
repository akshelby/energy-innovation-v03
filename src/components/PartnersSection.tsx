import { useEffect, useState } from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/cache";
import { useSwipeableMarquee } from "@/hooks/useSwipeableMarquee";

interface Partner {
  id: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  website_url: string | null;
  logo_height?: number | null;
}

const CACHE_KEY = "partners_v1";

export default function PartnersSection() {
  const { t, language } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>(() => getCached<Partner[]>(CACHE_KEY) ?? []);
  const [loaded, setLoaded] = useState(false);
  const { containerRef, trackRef, nudge } = useSwipeableMarquee();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name_en, name_ar, logo_url, website_url, sort_order, is_active, logo_height")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        const list = data as unknown as Partner[];
        setPartners(list);
        setCache(CACHE_KEY, list);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loaded && partners.length === 0) return null;

  const showSkeleton = !loaded && partners.length === 0;

  // Repeat enough so a single copy is wider than any viewport (the wrap
  // logic in useSwipeableMarquee requires unit width > container width;
  // otherwise scrollLeft hits its max and the marquee freezes).
  const repeatBase = Math.max(1, Math.ceil(16 / Math.max(1, partners.length)));
  const base = Array.from({ length: repeatBase }, () => partners).flat();
  const loop = [...base, ...base, ...base];

  return (
    <section className="py-14 md:py-12 px-6 md:px-12 lg:px-20 bg-background overflow-hidden">
      <div className="w-full mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("partners.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("partners.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t("partners.subtitle")}
          </p>
        </div>

        <div className="relative w-full">
        <button
          type="button"
          aria-label="Scroll left"
          data-marquee-arrow
          onClick={() => nudge(240)}
          className="hidden md:flex absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur border border-border text-foreground shadow-md hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          data-marquee-arrow
          onClick={() => nudge(-240)}
          className="hidden md:flex absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur border border-border text-foreground shadow-md hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div
          ref={containerRef}
          className="relative w-full select-none overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, #000 4%, #000 96%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 4%, #000 96%, transparent 100%)",
            scrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div ref={trackRef} className="flex w-fit animate-none items-center gap-10 md:gap-20">
            {showSkeleton
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={`sk-${i}`} className="shrink-0 flex items-center justify-center">
                    <div className="h-12 md:h-20 w-32 md:w-48 rounded-lg bg-muted animate-pulse" />
                  </div>
                ))
              : (() => {
              const phBgRaw = t("partners.placeholder_bg");
              const phTextRaw = t("partners.placeholder_text");
              const phShapeRaw = t("partners.placeholder_shape");
              const phBg = phBgRaw && phBgRaw !== "partners.placeholder_bg" ? phBgRaw : "hsl(var(--muted))";
              const phText = phTextRaw && phTextRaw !== "partners.placeholder_text" ? phTextRaw : "hsl(var(--foreground))";
              const phShape = phShapeRaw && phShapeRaw !== "partners.placeholder_shape" ? phShapeRaw : "rounded";
              const shapeClass = phShape === "pill" ? "rounded-full" : phShape === "square" ? "rounded-none" : "rounded-lg";
              return loop.map((p, i) => {
                const name = language === "ar" ? p.name_ar || p.name_en : p.name_en;
                const desktopH = p.logo_height && p.logo_height > 0 ? p.logo_height : 80;
                const mobileH = Math.max(24, Math.round(desktopH * 0.6));
                const Inner = p.logo_url ? (
                  <div
                    style={{ ['--ph-m' as any]: `${mobileH}px`, ['--ph-d' as any]: `${desktopH}px` }}
                    className="flex items-center justify-center h-[var(--ph-m)] md:h-[var(--ph-d)]"
                  >
                    <img
                      src={p.logo_url}
                      alt={name}
                      loading={i < partners.length ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-auto max-w-[40vw] md:max-w-[260px] object-contain opacity-80 hover:opacity-100 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div className="group flex flex-col items-center gap-2 md:gap-3">
                    <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border border-navy/15 text-navy shadow-sm transition-all duration-300 ease-out group-hover:bg-destructive group-hover:text-white group-hover:border-destructive group-hover:shadow-lg group-hover:-translate-y-0.5 will-change-transform transform-gpu">
                      <Building2 className="w-7 h-7 md:w-9 md:h-9" strokeWidth={1.75} />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground/80 group-hover:text-destructive transition-colors duration-300 whitespace-nowrap">
                      {name}
                    </span>
                  </div>
                );
                return p.website_url ? (
                  <a
                    key={`${p.id}-${i}`}
                    href={p.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center justify-center"
                  >
                    {Inner}
                  </a>
                ) : (
                  <div key={`${p.id}-${i}`} className="shrink-0 flex items-center justify-center">
                    {Inner}
                  </div>
                );
              });
            })()}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
