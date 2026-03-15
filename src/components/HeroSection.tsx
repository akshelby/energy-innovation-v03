import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Shield, Globe } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";

const images = [hero1, hero2, hero3, hero4, hero5];

export default function HeroSection() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background Images */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground max-w-4xl leading-tight animate-fade-in-up">
          {t("hero.headline")}
        </h1>
        <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {t("hero.subtext")}
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <Button
            onClick={() => scrollTo("#products")}
            className="gradient-accent text-accent-foreground rounded-full px-8 py-6 text-base font-semibold hover:scale-105 transition-transform border-0"
          >
            {t("hero.explore")}
          </Button>
          <Button
            onClick={() => scrollTo("#contact")}
            variant="outline"
            className="rounded-full px-8 py-6 text-base font-semibold border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            {t("hero.contact")}
          </Button>
        </div>

        {/* Slide indicators */}
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

      {/* Stats Card */}
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-10 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
        <div className="glass rounded-2xl p-5 shadow-lg border border-border/30 w-56">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("hero.safety")}</p>
              <p className="text-lg font-bold text-foreground">100%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("hero.support")}</p>
              <p className="text-lg font-bold text-foreground">24/7</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
