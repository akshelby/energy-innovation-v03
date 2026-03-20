import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStorageUrl } from "@/lib/storage";
import { useParallax } from "@/hooks/useParallax";

// Fallback local imports in case Supabase images aren't uploaded yet
import hero1Local from "@/assets/hero-1.webp";
import hero2Local from "@/assets/hero-2.webp";
import hero3Local from "@/assets/hero-3.webp";
import hero4Local from "@/assets/hero-4.webp";
import hero5Local from "@/assets/hero-5.webp";

const localImages = [hero1Local, hero2Local, hero3Local, hero4Local, hero5Local];
const imageFilePattern = /\.(png|jpe?g|webp|avif|svg|gif|bmp|tiff?|ico|heic|heif)$/i;

const buildHeroImageUrl = (fileName: string, version?: string) => {
  const encodedPath = `hero/${fileName}`
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const baseUrl = getStorageUrl("images", encodedPath);
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
};

export default function HeroSection() {
  const { t } = useLanguage();
  const parallaxBg = useParallax(0.15);
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<string[]>(localImages);
  const [speed, setSpeed] = useState(6000);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    "hero.show_headline": true,
    "hero.show_subtext": true,
    "hero.show_explore_btn": true,
    "hero.show_contact_btn": true,
    "hero.show_arrows": true,
    "hero.show_dots": true,
  });

  useEffect(() => {
    async function fetchHeroImages() {
      // Fetch active images list and speed from site_content
      const { data: contentRows } = await supabase
        .from("site_content")
        .select("content_key, value_en")
        .in("content_key", ["hero.active_images", "hero.speed", "hero.show_headline", "hero.show_subtext", "hero.show_explore_btn", "hero.show_contact_btn", "hero.show_arrows", "hero.show_dots"]);

      const activeEntry = contentRows?.find((r) => r.content_key === "hero.active_images");
      const speedEntry = contentRows?.find((r) => r.content_key === "hero.speed");

      const activeList: string[] = activeEntry?.value_en
        ? JSON.parse(activeEntry.value_en)
        : [];

      if (speedEntry?.value_en) {
        const seconds = parseFloat(speedEntry.value_en);
        if (seconds >= 1) setSpeed(seconds * 1000);
      }

      // Parse visibility toggles
      const visKeys = ["hero.show_headline", "hero.show_subtext", "hero.show_explore_btn", "hero.show_contact_btn", "hero.show_arrows", "hero.show_dots"];
      const vis: Record<string, boolean> = {};
      visKeys.forEach((k) => {
        const entry = contentRows?.find((r) => r.content_key === k);
        vis[k] = entry ? entry.value_en !== "false" : true;
      });
      setVisibility(vis);

      const { data, error } = await supabase.storage.from("images").list("hero", {
        sortBy: { column: "name", order: "asc" },
      });

      if (!error && data && data.length > 0) {
        let filtered = data.filter(
          (file) => file.name && !file.name.startsWith(".") && imageFilePattern.test(file.name)
        );

        // Deduplicate by filename stem first, preferring .webp
        const stemMap = new Map<string, typeof filtered[0]>();
        for (const file of filtered) {
          const stem = file.name.replace(/\.[^.]+$/, "");
          const existing = stemMap.get(stem);
          if (!existing || file.name.endsWith(".webp")) {
            stemMap.set(stem, file);
          }
        }
        let deduped = Array.from(stemMap.values());

        // If admin has set active images, filter by stem match
        if (activeList.length > 0) {
          const activeStems = new Set(
            activeList.map((name) => name.replace(/\.(png|jpe?g|webp|avif|svg)$/i, ""))
          );
          deduped = deduped.filter((file) => {
            const stem = file.name.replace(/\.(png|jpe?g|webp|avif|svg)$/i, "");
            return activeStems.has(stem);
          });
        }

        const urls = deduped.map((file) =>
          buildHeroImageUrl(file.name, file.updated_at ?? file.created_at ?? undefined)
        );

        if (urls.length > 0) {
          setCurrent(0);
          setImages(urls);
        }
      }
    }

    fetchHeroImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, speed);
    return () => clearInterval(interval);
  }, [images.length, speed]);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      <div ref={parallaxBg} className="absolute inset-0 will-change-transform" style={{ top: "-10%", bottom: "-10%", height: "120%" }}>
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt={`Industrial scene ${i + 1}`}
              className={`w-full h-full object-cover ${i === current ? "animate-ken-burns" : ""}`}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/80" />

      {visibility["hero.show_arrows"] && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12 text-center px-6">
        {visibility["hero.show_headline"] && (
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary-foreground max-w-3xl mx-auto leading-tight animate-fade-in-up drop-shadow-lg">
            {t("hero.headline")}
          </h1>
        )}
        {visibility["hero.show_subtext"] && (
          <p className="mt-4 text-sm md:text-base font-medium text-primary-foreground/80 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {t("hero.subtext")}
          </p>
        )}
        {(visibility["hero.show_explore_btn"] || visibility["hero.show_contact_btn"]) && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {visibility["hero.show_explore_btn"] && (
              <Button
                onClick={() => scrollTo("#products")}
                className="gradient-accent text-accent-foreground rounded-full px-6 py-5 text-sm font-semibold transition-all border-0"
              >
                {t("hero.explore")}
              </Button>
            )}
            {visibility["hero.show_contact_btn"] && (
              <Button
                onClick={() => scrollTo("#contact")}
                variant="outline"
                className="rounded-full px-6 py-5 text-sm font-semibold border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:border-red-500 hover:bg-white/20 hover:text-white transition-all duration-500"
              >
                {t("hero.contact")}
              </Button>
            )}
          </div>
        )}

        {visibility["hero.show_dots"] && (
          <div className="flex gap-2 justify-center mt-6">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? "w-8 bg-accent" : "bg-primary-foreground/40"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
