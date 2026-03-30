import { useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SEOHead from "@/components/SEOHead";
import { loadImageOptimizationSetting } from "@/lib/storage";

const AboutSection = lazy(() => import("@/components/AboutSection"));
const ProductsSection = lazy(() => import("@/components/ProductsSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const HighlightSection = lazy(() => import("@/components/HighlightSection"));
const WhyChooseUsSection = lazy(() => import("@/components/WhyChooseUsSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));
const FloatingButtons = lazy(() => import("@/components/FloatingButtons"));

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
      <Suspense fallback={null}>
        <AboutSection />
        <ProductsSection />
        <ServicesSection />
        <HighlightSection />
        <WhyChooseUsSection />
        <ContactSection />
        <Footer />
        <FloatingButtons />
      </Suspense>
    </main>
  );
};

export default Index;
