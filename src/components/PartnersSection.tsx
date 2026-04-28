import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/cache";

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

  // Duplicate list for seamless infinite marquee
  const loop = [...partners, ...partners];

  return (
    <section className="py-14 md:py-20 px-6 bg-background overflow-hidden">
      <div className="max-w-6xl mx-auto">
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

        <div
          className="relative w-full"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
          }}
        >
          <div className="flex w-max animate-marquee items-center gap-10 md:gap-20">
            {loop.map((p, i) => {
              const name = language === "ar" ? p.name_ar || p.name_en : p.name_en;
              const Inner = p.logo_url ? (
                <img
                  src={p.logo_url}
                  alt={name}
                  loading="lazy"
                  className="h-12 md:h-20 w-auto max-w-[140px] md:max-w-[200px] object-contain opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300"
                />
              ) : (
                <span className="text-lg md:text-2xl font-bold text-muted-foreground/70 hover:text-foreground transition-colors duration-300 whitespace-nowrap">
                  {name}
                </span>
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
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
