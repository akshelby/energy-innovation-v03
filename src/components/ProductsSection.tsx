import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import StickyCardStack from "@/components/StickyCardStack";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import { ArrowUpRight } from "lucide-react";
import {
  Flame, DoorOpen, Droplets, Wind, Truck, Shield, Zap, Factory,
  HardHat, Gauge, Cog, Building, PenTool, Wrench, Settings, MessageSquare,
} from "lucide-react";

// Local fallbacks
import productFireLocal from "@/assets/product-fire.jpg";
import productRollerLocal from "@/assets/product-roller.jpg";
import productOilLocal from "@/assets/product-oil.jpg";
import productHvacLocal from "@/assets/product-hvac.jpg";
import productLoadingLocal from "@/assets/product-loading.jpg";
import productLouversLocal from "@/assets/product-louvers.jpg";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame, DoorOpen, Droplets, Wind, Truck, Shield, Zap, Factory,
  HardHat, Gauge, Cog, Building, PenTool, Wrench, Settings, MessageSquare,
};

const fallbackProducts = [
  { name_en: "Fire & Smoke Safety", name_ar: "السلامة من الحريق", description_en: "Advanced fire curtains and smoke management systems for complete building protection.", description_ar: "أنظمة ستائر حريق ودخان متقدمة لحماية المباني بالكامل.", icon: "Flame", image_url: productFireLocal, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Roller Shutters & Doors", name_ar: "الأبواب والشتر", description_en: "Industrial, commercial, residential, high-speed, and steel door solutions.", description_ar: "حلول أبواب صناعية وتجارية وسكنية وعالية السرعة وفولاذية.", icon: "DoorOpen", image_url: productRollerLocal, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Oil & Gas Equipment", name_ar: "معدات النفط والغاز", description_en: "Precision well equipment, sensors, and spare parts for energy operations.", description_ar: "معدات الآبار الدقيقة وأجهزة الاستشعار وقطع الغيار لعمليات الطاقة.", icon: "Droplets", image_url: productOilLocal, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "HVAC & Ventilation", name_ar: "التهوية والتكييف", description_en: "Industrial ventilators, exhaust systems, thermostats, and dampers.", description_ar: "مراوح صناعية وأنظمة عادم وثرموستات ومخمدات.", icon: "Wind", image_url: productHvacLocal, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Loading Bay Equipment", name_ar: "معدات التحميل", description_en: "Dock levelers and shelters for efficient material handling.", description_ar: "مسويات ومظلات الرصيف لمناولة المواد بكفاءة.", icon: "Truck", image_url: productLoadingLocal, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Louvers & Steel Doors", name_ar: "الفتحات والأبواب الفولاذية", description_en: "Heavy-duty louvers and steel security doors for industrial applications.", description_ar: "فتحات وأبواب فولاذية للتطبيقات الصناعية.", icon: "Shield", image_url: productLouversLocal, pdf_url: null, tag_en: "", tag_ar: "" },
];

interface Product {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  image_url: string | null;
  pdf_url: string | null;
  tag_en: string;
  tag_ar: string;
}

export default function ProductsSection() {
  const { t, language } = useLanguage();
  const ref = useScrollReveal();
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");

  useEffect(() => {
    supabase.from("products").select("*").order("sort_order").then(({ data }) => {
      if (data && data.length > 0) setProducts(data as Product[]);
    });
  }, []);

  const isAr = language === "ar";

  return (
    <section id="products" className="py-10 md:py-20 px-6 bg-secondary/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-16 scroll-reveal">
          <span className="inline-block px-5 py-2 text-sm font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full mb-4">
            {t("products.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("products.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("products.desc")}
          </p>
        </div>

        <StickyCardStack baseTop={90} offsetIncrement={0} scrollSpace="2svh" maxWidthClass="max-w-full md:max-w-lg" fullHeight>
          {products.map((product, i) => {
            const isCustomIcon = product.icon?.startsWith("http") || product.icon?.startsWith("/") || product.icon?.startsWith("data:");
            const Icon = !isCustomIcon ? (iconMap[product.icon] || Flame) : null;
            return (
              <div
                key={i}
                className="scroll-reveal group rounded-2xl cursor-pointer overflow-hidden bg-card border border-border hover:border-accent/20 transition-all duration-300 h-full flex flex-col"
                style={{ transitionDelay: `${i * 80}ms` }}
                onClick={() => {
                  if (product.pdf_url) {
                    setPdfSrc(product.pdf_url);
                    setPdfOpen(true);
                  }
                }}
              >
                {/* Image area */}
                <div className="relative flex-1 min-h-0 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={isAr ? product.name_ar : product.name_en}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      {isCustomIcon ? (
                        <img src={product.icon} alt="" className="w-12 h-12 object-contain opacity-30" />
                      ) : Icon ? (
                        <Icon className="w-12 h-12 text-muted-foreground/30" />
                      ) : null}
                    </div>
                  )}

                  {/* No overlay — clean image */}

                  {/* Tag */}
                  {(isAr ? product.tag_ar : product.tag_en) && (
                    <span className="absolute top-3 right-3 text-[11px] font-bold uppercase tracking-widest bg-foreground/75 text-background px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                      {isAr ? product.tag_ar : product.tag_en}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-1.5 line-clamp-1">
                        {isAr ? product.name_ar : product.name_en}
                      </h3>
                      <p className="text-muted-foreground text-[13px] leading-relaxed line-clamp-2">
                        {isAr ? product.description_ar : product.description_en}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full border border-border group-hover:border-destructive/30 group-hover:bg-destructive/10 flex items-center justify-center shrink-0 transition-all duration-300 mt-0.5">
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </StickyCardStack>
      </div>
      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} src={pdfSrc} />
    </section>
  );
}
