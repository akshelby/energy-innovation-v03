import { useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SEOHead from "@/components/SEOHead";
import { loadImageOptimizationSetting } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/cache";

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

// Factories kept separate so we can both lazy-render AND eagerly prefetch each chunk
const productsImport = () => import("@/components/ProductsSection");
const servicesImport = () => import("@/components/ServicesSection");
const countriesImport = () => import("@/components/CountriesSection");
const highlightImport = () => import("@/components/HighlightSection");
const whyChooseImport = () => import("@/components/WhyChooseUsSection");
const partnersImport = () => import("@/components/PartnersSection");
const contactImport = () => import("@/components/ContactSection");
const footerImport = () => import("@/components/Footer");
const floatingImport = () => import("@/components/FloatingButtons");

const ProductsSection = lazyWithRetry(productsImport);
const ServicesSection = lazyWithRetry(servicesImport);
const CountriesSection = lazyWithRetry(countriesImport);
const HighlightSection = lazyWithRetry(highlightImport);
const WhyChooseUsSection = lazyWithRetry(whyChooseImport);
const PartnersSection = lazyWithRetry(partnersImport);
const ContactSection = lazyWithRetry(contactImport);
const Footer = lazyWithRetry(footerImport);
const FloatingButtons = lazyWithRetry(floatingImport);

const Index = () => {
  useEffect(() => {
    loadImageOptimizationSetting();
    // Kick off all below-fold chunk downloads in parallel right after first paint, so
    // Products / Services / etc. are already cached by the time the user scrolls.
    const prefetch = () => {
      productsImport(); servicesImport(); countriesImport(); highlightImport();
      whyChooseImport(); partnersImport(); contactImport(); footerImport(); floatingImport();
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 800 });
    } else {
      setTimeout(prefetch, 200);
    }
    // Warm partners + countries data caches in parallel so those sections
    // render instantly once the user scrolls (avoids lazy-chunk + fetch waterfall).
    const warmData = () => {
      if (!getCached("partners_v1")) {
        supabase
          .from("partners")
          .select("id, name_en, name_ar, logo_url, website_url, sort_order, is_active, logo_height")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .then(({ data, error }) => {
            if (!error && data) setCache("partners_v1", data);
          });
      }
      if (!getCached("countries_v1")) {
        supabase
          .from("countries")
          .select("id, name_en, name_ar, flag_url, country_code, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .then(({ data, error }) => {
            if (!error && data) setCache("countries_v1", data);
          });
      }
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(warmData, { timeout: 1200 });
    } else {
      setTimeout(warmData, 400);
    }
  }, []);
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
      <Suspense fallback={null}><CountriesSection /></Suspense>
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
