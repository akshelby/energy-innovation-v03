import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStorageUrl } from "@/lib/storage";
import { getCached, setCache } from "@/lib/cache";
import { useParallax } from "@/hooks/useParallax";

// Fallback local imports in case Supabase images aren't uploaded yet
import hero1Local from "@/assets/hero-1.webp";
import hero2Local from "@/assets/hero-2.webp";
import hero3Local from "@/assets/hero-3.webp";
import hero4Local from "@/assets/hero-4.webp";
import hero5Local from "@/assets/hero-5.webp";

const localImages = [hero1Local, hero2Local, hero3Local, hero4Local, hero5Local];
const imageFilePattern = /\.\w+$/i;
const PERSISTENT_HERO_KEY = "ei_hero_active_v1";
const FIRST_HERO_FILENAME = "Double wall fire shutter.jpg";

interface PersistedHero {
  images: string[];
  speed: number;
  visibility: Record<string, boolean>;
}

function getPersistedHero(): PersistedHero | null {
  try {
    const raw = localStorage.getItem(PERSISTENT_HERO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedHero;
    if (!parsed?.images?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setPersistedHero(data: PersistedHero) {
  try { localStorage.setItem(PERSISTENT_HERO_KEY, JSON.stringify(data)); } catch {}
}

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

const normalizeFileName = (fileName: string) =>
  fileName.trim().replace(/\s+\.(?=[^.]+$)/, ".");

const buildHeroImageUrl = (fileName: string, version?: string) => {
  const encodedPath = `hero/${fileName}`
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const baseUrl = getStorageUrl("images", encodedPath);
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
};

// Pre-compute the first hero image URL synchronously so it renders on first paint
export default function HeroSection() {
  const { t } = useLanguage();
  const parallaxBg = useParallax(0.15);
  const cachedHero = getCached<{ images: string[]; speed: number; visibility: Record<string, boolean> }>("hero");
  const persistedHero = getPersistedHero();
  const initialHero = (cachedHero?.images?.length ? cachedHero : persistedHero) || null;
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<string[]>(initialHero?.images || [buildHeroImageUrl(FIRST_HERO_FILENAME)]);
  const [heroReady, setHeroReady] = useState(true);
  const [speed, setSpeed] = useState(initialHero?.speed || 6000);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialHero?.visibility || {
    "hero.show_headline": true,
    "hero.show_subtext": true,
    "hero.show_explore_btn": true,
    "hero.show_contact_btn": true,
    "hero.show_arrows": true,
    "hero.show_dots": true,
  });

  useEffect(() => {
    async function fetchHeroImages() {
      const { data: contentRows } = await supabase
        .from("site_content")
        .select("content_key, value_en")
        .in("content_key", ["hero.active_images", "hero.speed", "hero.show_headline", "hero.show_subtext", "hero.show_explore_btn", "hero.show_contact_btn", "hero.show_arrows", "hero.show_dots"]);

      const activeEntry = contentRows?.find((r) => r.content_key === "hero.active_images");
      const speedEntry = contentRows?.find((r) => r.content_key === "hero.speed");

      let activeList: string[] = [];

      if (activeEntry?.value_en) {
        try {
          const parsed = JSON.parse(activeEntry.value_en);
          activeList = Array.isArray(parsed)
            ? parsed
                .map((value) => normalizeFileName(String(value)))
                .filter((value) => value.length > 0)
            : [];
        } catch {
          activeList = [];
        }
      }

      if (speedEntry?.value_en) {
        const seconds = parseFloat(speedEntry.value_en);
        if (seconds >= 1) setSpeed(seconds * 1000);
      }

      const visKeys = ["hero.show_headline", "hero.show_subtext", "hero.show_explore_btn", "hero.show_contact_btn", "hero.show_arrows", "hero.show_dots"];
      const vis: Record<string, boolean> = {};
      visKeys.forEach((k) => {
        const entry = contentRows?.find((r) => r.content_key === k);
        vis[k] = entry ? entry.value_en !== "false" : true;
      });
      setVisibility(vis);
      setContentReady(true);

      if (activeList.length > 0) {
        const urls = activeList.map((fileName) => buildHeroImageUrl(fileName));
        // Preload first image before swapping to avoid blank flash
        await preloadImage(urls[0]);
        setCurrent(0);
        setImages(urls);
        setHeroReady(true);
        setCache("hero", { images: urls, speed: speed, visibility: vis });
        setPersistedHero({ images: urls, speed, visibility: vis });
        // Prefetch remaining images in background
        urls.slice(1).forEach(preloadImage);
        return;
      }

      const { data, error } = await supabase.storage.from("images").list("hero", {
        sortBy: { column: "name", order: "asc" },
      });

      if (!error && data && data.length > 0) {
        const filtered = data.filter(
          (file) => file.name && !file.name.startsWith(".") && imageFilePattern.test(file.name)
        );

        const selectedFiles = Array.from(
          filtered.reduce((stemMap, file) => {
            const stem = file.name.replace(/\.[^.]+$/, "");
            const existing = stemMap.get(stem);
            if (!existing || file.name.toLowerCase().endsWith(".webp")) {
              stemMap.set(stem, file);
            }
            return stemMap;
          }, new Map<string, typeof filtered[number]>()).values()
        );

        const urls = selectedFiles.map((file) =>
          buildHeroImageUrl(file.name, file.updated_at ?? file.created_at ?? undefined)
        );

        const finalUrls = urls.length > 0 ? urls : activeList.length > 0 ? [] : localImages;
        if (finalUrls.length > 0) await preloadImage(finalUrls[0]);
        setCurrent(0);
        setImages(finalUrls);
        setHeroReady(true);
        setCache("hero", { images: finalUrls, speed: speed, visibility: vis });
        if (finalUrls.length > 0) setPersistedHero({ images: finalUrls, speed, visibility: vis });
        finalUrls.slice(1).forEach(preloadImage);
        return;
      }

      setCurrent(0);
      setImages(localImages);
      setHeroReady(true);
      setCache("hero", { images: localImages, speed: speed, visibility: vis });
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

  const prev = () => {
    if (images.length <= 1) return;
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };

  const next = () => {
    if (images.length <= 1) return;
    setCurrent((c) => (c + 1) % images.length);
  };
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden bg-black">
      <div ref={parallaxBg} className={`absolute inset-0 will-change-transform transition-opacity duration-500 ${heroReady ? 'opacity-100' : 'opacity-0'}`} style={{ top: "-10%", bottom: "-10%", height: "120%" }}>
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              srcSet={`${img}${img.includes("?") ? "&" : "?"}width=768 768w, ${img} 1920w`}
              sizes="(max-width: 768px) 768px, 1920px"
              alt={`Industrial scene ${i + 1}`}
              width={1920}
              height={1080}
              className={`w-full h-full object-cover ${i === 0 && current === 0 ? "animate-ken-burns" : ""}`}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding={i === 0 ? "sync" : "async"}
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

      <div className={`relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12 text-center px-6 transition-opacity duration-300 ${contentReady ? 'opacity-100' : 'opacity-0'}`}>
        {visibility["hero.show_headline"] && (
          <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-primary-foreground w-full max-w-none mx-auto leading-tight animate-fade-in-up drop-shadow-lg">
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
