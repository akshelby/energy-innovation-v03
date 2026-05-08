import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStorageUrl } from "@/lib/storage";
import { getCached, setCache } from "@/lib/cache";
import { useParallax } from "@/hooks/useParallax";

// NOTE: Local hero fallbacks were removed permanently. The hero must only ever render
// images that the admin has explicitly configured (via site_content / Supabase storage).
// Falling back to bundled assets caused deleted images (e.g. the blue robotic arms set)
// to flash on first paint even after the admin removed them.
const imageFilePattern = /\.\w+$/i;

// Persistent "last known admin state" cache. ALWAYS overwritten by the live DB fetch on
// every mount, so the next visit's flash paint always reflects the most recent admin
// changes (added/removed/replaced images, toggled UI, updated speed). Never used as a
// long-lived default — only as a mirror of the last successful fetch.
const HERO_LAST_KNOWN_KEY = "ei_hero_last_known_v2";

interface HeroSnapshot {
  images: string[];
  speed: number;
  visibility: Record<string, boolean>;
}

function getLastKnownHero(): HeroSnapshot | null {
  try {
    const raw = localStorage.getItem(HERO_LAST_KNOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HeroSnapshot;
    if (!parsed?.images?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setLastKnownHero(data: HeroSnapshot) {
  try { localStorage.setItem(HERO_LAST_KNOWN_KEY, JSON.stringify(data)); } catch {}
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
  const { t, contentLoaded } = useLanguage();
  const parallaxBg = useParallax(0.15);
  // Initial paint priority: sessionStorage (this tab, fresh) → localStorage mirror of last
  // confirmed DB state (always overwritten on each fetch, so it tracks admin changes) → empty.
  const cachedHero = getCached<HeroSnapshot>("hero");
  const lastKnown = !cachedHero?.images?.length ? getLastKnownHero() : null;
  const initialHero: HeroSnapshot | null = cachedHero?.images?.length ? cachedHero : lastKnown;
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<string[]>(initialHero?.images || []);
  const [heroReady, setHeroReady] = useState(!!initialHero);
  const [speed, setSpeed] = useState(initialHero?.speed || 6000);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialHero?.visibility || {
    "hero.show_headline": false,
    "hero.show_subtext": false,
    "hero.show_explore_btn": false,
    "hero.show_contact_btn": false,
    "hero.show_arrows": false,
    "hero.show_dots": false,
  });

  useEffect(() => {
    // Purge legacy v1 persistence so returning users don't see stale buttons/images
    try { localStorage.removeItem("ei_hero_active_v1"); } catch {}
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

      let nextSpeed = speed;
      if (speedEntry?.value_en) {
        const seconds = parseFloat(speedEntry.value_en);
        if (seconds >= 1) {
          nextSpeed = seconds * 1000;
          setSpeed(nextSpeed);
        }
      }

      const visKeys = ["hero.show_headline", "hero.show_subtext", "hero.show_explore_btn", "hero.show_contact_btn", "hero.show_arrows", "hero.show_dots"];
      const vis: Record<string, boolean> = {};
      visKeys.forEach((k) => {
        const entry = contentRows?.find((r) => r.content_key === k);
        vis[k] = entry ? entry.value_en !== "false" : true;
      });
      setVisibility(vis);

      // Helper: persist the confirmed admin state to BOTH caches so next paint is instant + fresh
      const persistSnapshot = (urls: string[]) => {
        const snapshot: HeroSnapshot = { images: urls, speed: nextSpeed, visibility: vis };
        setCache("hero", snapshot);
        if (urls.length > 0) setLastKnownHero(snapshot);
        else { try { localStorage.removeItem(HERO_LAST_KNOWN_KEY); } catch {} }
      };

      if (activeList.length > 0) {
        const urls = activeList.map((fileName) => buildHeroImageUrl(fileName));
        setCurrent(0);
        setImages(urls);
        setHeroReady(true);
        persistSnapshot(urls);
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

        setCurrent(0);
        setImages(urls);
        setHeroReady(true);
        persistSnapshot(urls);
        urls.slice(1).forEach(preloadImage);
        return;
      }

      // Admin removed everything — clear all caches so no stale image ever flashes again.
      setCurrent(0);
      setImages([]);
      setHeroReady(true);
      persistSnapshot([]);
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
    <section id="home" className="relative h-screen w-full overflow-hidden bg-primary">
      {/* Brand-tinted placeholder shown until the latest admin images are ready.
          Intentionally image-free so it can never display a deleted hero image. */}
      <div
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-700 ${heroReady && images.length > 0 ? 'opacity-0' : 'opacity-100'}`}
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 40%, hsl(var(--accent) / 0.25) 100%)',
        }}
      >
        <div className="absolute inset-0 animate-pulse opacity-30"
             style={{ background: 'radial-gradient(circle at 30% 40%, hsl(var(--primary-foreground) / 0.15), transparent 60%)' }} />
      </div>
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

      <div className="relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12 text-center px-6">
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
                className="rounded-full px-6 py-5 text-sm font-semibold border-0 text-white bg-[linear-gradient(90deg,#2BD8FF_0%,#A14BFF_25%,#FF4FCB_50%,#FF6A3D_75%,#2BD8FF_100%)] bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-700 shadow-lg"
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
