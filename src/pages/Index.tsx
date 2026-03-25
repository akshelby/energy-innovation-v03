import { useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ProductsSection from "@/components/ProductsSection";
import ServicesSection from "@/components/ServicesSection";
import HighlightSection from "@/components/HighlightSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import SEOHead from "@/components/SEOHead";
import { loadImageOptimizationSetting } from "@/lib/storage";

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
            "url": "https://mivora.com",
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
      <ProductsSection />
      <ServicesSection />
      <HighlightSection />
      <WhyChooseUsSection />
      <ContactSection />
      <Footer />
      <FloatingButtons />
    </main>
  );
};

export default Index;
