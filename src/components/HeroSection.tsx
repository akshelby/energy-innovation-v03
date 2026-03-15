import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHeroImageUrl } from "@/lib/storage";

// Fallback local imports in case Supabase images aren't uploaded yet
import hero1Local from "@/assets/hero-1.jpg";
import hero2Local from "@/assets/hero-2.jpg";
import hero3Local from "@/assets/hero-3.jpg";
import hero4Local from "@/assets/hero-4.jpg";
import hero5Local from "@/assets/hero-5.jpg";

const localImages = [hero1Local, hero2Local, hero3Local, hero4Local, hero5Local];

export default function HeroSection() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [useSupabase, setUseSupabase] = useState(true);

  // Check if Supabase images are available
  useEffect(() => {
    const img = new Image();
    img.onload = () => setUseSupabase(true);
    img.onerror = () => setUseSupabase(false);
    img.src = getHeroImageUrl(0);
  }, []);

  const images = useSupabase
    ? Array.from({ length: 5 }, (_, i) => getHeroImageUrl(i))
    : localImages;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [current, images.length]);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
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

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

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

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary-foreground max-w-4xl leading-tight animate-fade-in-up drop-shadow-lg">
          {t("hero.headline")}
        </h1>
        <p className="mt-6 text-lg md:text-xl font-semibold text-primary-foreground/85 max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {t("hero.subtext")}
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <Button
            onClick={() => scrollTo("#products")}
            className="gradient-accent text-accent-foreground rounded-full px-8 py-6 text-base font-semibold transition-all border-0"
          >
            {t("hero.explore")}
          </Button>
          <Button
            onClick={() => scrollTo("#contact")}
            variant="outline"
            className="rounded-full px-8 py-6 text-base font-semibold border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:border-red-500 hover:bg-white/20 hover:text-white transition-all duration-500"
          >
            {t("hero.contact")}
          </Button>
        </div>

        <div className="absolute bottom-24 md:bottom-20 flex gap-2">
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
      </div>
    </section>
  );
}
