import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/cache";
import { useSwipeableMarquee } from "@/hooks/useSwipeableMarquee";

interface Country {
  id: string;
  name_en: string;
  name_ar: string;
  flag_url: string | null;
  country_code: string;
}

const CACHE_KEY = "countries_v1";

export default function CountriesSection() {
  const { t, language } = useLanguage();
  const [countries, setCountries] = useState<Country[]>(
    () => getCached<Country[]>(CACHE_KEY) ?? []
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("id, name_en, name_ar, flag_url, country_code, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        const list = data as unknown as Country[];
        setCountries(list);
        setCache(CACHE_KEY, list);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loaded && countries.length === 0) return null;

  // Duplicate list for seamless infinite marquee
  const loop = [...countries, ...countries];

  return (
    <section className="py-14 md:py-12 px-6 md:px-12 lg:px-20 bg-background overflow-hidden">
      <div className="w-full mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("countries.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("countries.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t("countries.subtitle")}
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
          <div className="flex w-max animate-marquee items-center gap-10 md:gap-16">
            {loop.map((c, i) => {
              const name = language === "ar" ? c.name_ar || c.name_en : c.name_en;
              return (
                <div
                  key={`${c.id}-${i}`}
                  className="shrink-0 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-border bg-muted/40 shadow-sm flex items-center justify-center">
                    {c.flag_url ? (
                      <img
                        src={c.flag_url}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {c.country_code}
                      </span>
                    )}
                  </div>
                  <span className="text-sm md:text-base font-medium text-foreground whitespace-nowrap">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
