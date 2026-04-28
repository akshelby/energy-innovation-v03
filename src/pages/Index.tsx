import { useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SEOHead from "@/components/SEOHead";
import { loadImageOptimizationSetting } from "@/lib/storage";

// Auto-recover from stale chunk hashes after a redeploy
const lazyWithRetry = <T,>(factory: () => Promise<T>) =>
  lazy(() =>
    (factory() as Promise<any>).catch((err) => {
      const msg = String(err?.message || "");
      if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
        const key = "lovable_chunk_reload_at";
        const last = Number(sessionStorage.getItem(key) || 0);
        if (Date.now() - last > 10000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      }
      throw err;
    })
  );

const ProductsSection = lazyWithRetry(() => import("@/components/ProductsSection"));
const ServicesSection = lazyWithRetry(() => import("@/components/ServicesSection"));
const HighlightSection = lazyWithRetry(() => import("@/components/HighlightSection"));
const WhyChooseUsSection = lazyWithRetry(() => import("@/components/WhyChooseUsSection"));
const PartnersSection = lazyWithRetry(() => import("@/components/PartnersSection"));
const ContactSection = lazyWithRetry(() => import("@/components/ContactSection"));
const Footer = lazyWithRetry(() => import("@/components/Footer"));
const FloatingButtons = lazyWithRetry(() => import("@/components/FloatingButtons"));

const Index = () => {
  useEffect(() => { loadImageOptimizationSetting(); }, []);
  return (
    <main className="min-h-screen">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Energy Innovation",
            "url": "https://energyinnvo.com",
            "description": "Premium industrial technology solutions for modern facilities worldwide. Fuelling the Future.",
            "sameAs": [],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Industrial Products & Services",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Fire & Smoke Safety Systems" } },
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Roller Shutters & Doors" } },
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Oil & Gas Equipment" } },
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "HVAC Systems" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Technical Drawing" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Installation" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Maintenance" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Consulting" } },
              ],
            },
          }),
        }}
      />
      <Header />
      <HeroSection />
      <AboutSection />
      {/* Per-section Suspense so each chunk paints independently */}
      <Suspense fallback={null}><ProductsSection /></Suspense>
      <Suspense fallback={null}><ServicesSection /></Suspense>
      <Suspense fallback={null}><HighlightSection /></Suspense>
      <Suspense fallback={null}><WhyChooseUsSection /></Suspense>
      <Suspense fallback={null}><PartnersSection /></Suspense>
      <Suspense fallback={null}><ContactSection /></Suspense>
      <Suspense fallback={null}><Footer /></Suspense>
      <Suspense fallback={null}><FloatingButtons /></Suspense>
    </main>
  );
};

export default Index;
