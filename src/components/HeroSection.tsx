import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";
import caseStudyThumb from "@/assets/case-study-thumb.jpg";

const heroImages = [hero1, hero2, hero3, hero4, hero5];

const HeroSection = () => {
  const { t, direction } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <motion.img
            src={heroImages[currentSlide]}
            alt=""
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-primary-foreground"
          >
            {t("heroHeadline")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 text-base md:text-lg text-primary-foreground/80 max-w-xl leading-relaxed"
          >
            {t("heroSubtext")}
          </motion.p>

          <motion.a
            href="#contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="inline-flex items-center mt-8 px-8 py-3.5 rounded-pill bg-gradient-eco text-secondary-foreground text-sm font-semibold shimmer hover:scale-105 transition-transform shadow-lg"
          >
            {t("getGreenQuote")}
          </motion.a>
        </div>

        {/* Case Study Card */}
        <motion.div
          initial={{ opacity: 0, x: direction === "rtl" ? -40 : 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className={`absolute bottom-16 md:bottom-20 ${direction === "rtl" ? "left-6 md:left-16" : "right-6 md:right-16"} w-72 md:w-80 bg-card rounded-xl shadow-2xl overflow-hidden border border-border`}
        >
          <div className="relative">
            <img
              src={caseStudyThumb}
              alt="Case study"
              className="w-full h-36 object-cover"
            />
            <span className="absolute bottom-2 end-2 px-3 py-1 bg-card text-xs font-medium text-foreground rounded-pill shadow-md">
              {t("getItFree")} 📄
            </span>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-card-foreground leading-snug">
              {t("caseStudyTitle")}
            </h3>
            <div className="mt-4 flex gap-6 border-t border-border pt-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("plantedTrees")}</p>
                <p className="text-lg font-bold text-card-foreground">50K</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("savingsLogistics")}</p>
                <p className="text-lg font-bold text-card-foreground">200+</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 start-6 md:start-16 flex gap-2">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? "w-8 bg-eco"
                  : "w-4 bg-primary-foreground/40 hover:bg-primary-foreground/60"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
