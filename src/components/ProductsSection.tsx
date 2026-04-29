import { useState, useEffect, useCallback, useMemo } from "react";
import { getResizedUrl } from "@/lib/storage";
import { getCached, setCache } from "@/lib/cache";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsMobile } from "@/hooks/use-mobile";
import StickyCardStack from "@/components/StickyCardStack";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import { ArrowUpRight, ChevronDown } from "lucide-react";
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

const fallbackProducts: Product[] = [
  { id: "1", name_en: "Fire & Smoke Safety", name_ar: "السلامة من الحريق", description_en: "Advanced fire curtains and smoke management systems for complete building protection.", description_ar: "أنظمة ستائر حريق ودخان متقدمة لحماية المباني بالكامل.", icon: "Flame", image_url: productFireLocal, pdf_url: null, tag_en: "", tag_ar: "", category_key: "" },
  { id: "2", name_en: "Roller Shutters & Doors", name_ar: "الأبواب والشتر", description_en: "Industrial, commercial, residential, high-speed, and steel door solutions.", description_ar: "حلول أبواب صناعية وتجارية وسكنية وعالية السرعة وفولاذية.", icon: "DoorOpen", image_url: productRollerLocal, pdf_url: null, tag_en: "", tag_ar: "", category_key: "" },
  { id: "3", name_en: "Oil & Gas Equipment", name_ar: "معدات النفط والغاز", description_en: "Precision well equipment, sensors, and spare parts for energy operations.", description_ar: "معدات الآبار الدقيقة وأجهزة الاستشعار وقطع الغيار لعمليات الطاقة.", icon: "Droplets", image_url: productOilLocal, pdf_url: null, tag_en: "", tag_ar: "", category_key: "" },
  { id: "4", name_en: "HVAC & Ventilation", name_ar: "التهوية والتكييف", description_en: "Industrial ventilators, exhaust systems, thermostats, and dampers.", description_ar: "مراوح صناعية وأنظمة عادم وثرموستات ومخمدات.", icon: "Wind", image_url: productHvacLocal, pdf_url: null, tag_en: "", tag_ar: "", category_key: "" },
  { id: "5", name_en: "Loading Bay Equipment", name_ar: "معدات التحميل", description_en: "Dock levelers and shelters for efficient material handling.", description_ar: "مسويات ومظلات الرصيف لمناولة المواد بكفاءة.", icon: "Truck", image_url: productLoadingLocal, pdf_url: null, tag_en: "", tag_ar: "", category_key: "" },
  { id: "6", name_en: "Louvers & Steel Doors", name_ar: "الفتحات والأبواب الفولاذية", description_en: "Heavy-duty louvers and steel security doors for industrial applications.", description_ar: "فتحات وأبواب فولاذية للتطبيقات الصناعية.", icon: "Shield", image_url: productLouversLocal, pdf_url: null, tag_en: "", tag_ar: "", category_key: "" },
];

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  image_url: string | null;
  pdf_url: string | null;
  tag_en: string;
  tag_ar: string;
  category_key: string;
}

export default function ProductsSection() {
  const { t, language } = useLanguage();
  const ref = useScrollReveal();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(() => getCached<Product[]>("products") || []);
  const [ready, setReady] = useState(() => products.length > 0);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const showToggle = isMobile;
  const isCollapsed = showToggle && !expanded;

  useEffect(() => {
    supabase.from("products").select("*").order("sort_order").then(({ data }) => {
      const result = data && data.length > 0 ? (data as Product[]) : fallbackProducts;
      setProducts(result);
      setCache("products", result);
      setReady(true);
    });
  }, []);

  const isAr = language === "ar";

  return (
    <section id="products" className="py-10 md:py-12 px-6 md:px-12 lg:px-20 bg-secondary/30 lazy-section" ref={ref}>
      <div className="w-full mx-auto">
        <div className="text-center mb-6 md:mb-16 scroll-reveal">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("products.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("products.title")}
          </h2>
          <div className="w-full mx-auto relative">
            <div
              className="overflow-hidden md:!max-h-none md:!opacity-100"
              style={{
                maxHeight: showToggle ? (expanded ? "1200px" : "5.25rem") : "none",
                opacity: showToggle ? (expanded ? 1 : 0.95) : 1,
                transition: "max-height 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.6s ease",
              }}
            >
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("products.desc")}
              </p>
            </div>
            {isCollapsed && (
              <div
                className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-secondary/30"
                aria-hidden="true"
              />
            )}
          </div>
          {showToggle && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="md:hidden mt-2 inline-flex items-center gap-1 text-accent text-sm font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
              aria-expanded={expanded}
            >
              {expanded ? "Read Less" : "Read More"}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        <div className={`transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <StickyCardStack baseTop={90} offsetIncrement={0} scrollSpace="2svh" maxWidthClass="max-w-none" fullHeight>
          {products.map((product, i) => {
            const isCustomIcon = product.icon?.startsWith("http") || product.icon?.startsWith("/") || product.icon?.startsWith("data:");
            const Icon = !isCustomIcon ? (iconMap[product.icon] || Flame) : null;
            return (
              <div
                key={i}
                className="scroll-reveal md:!opacity-100 md:!translate-y-0 group rounded-2xl cursor-pointer overflow-hidden bg-card border border-border hover:border-accent/20 transition-all duration-300 h-full flex flex-col"
                style={{ transitionDelay: `${i * 80}ms` }}
                onClick={() => {
                  if (product.category_key) {
                    navigate(`/products/${product.id}`);
                  } else if (product.pdf_url) {
                    setPdfSrc(product.pdf_url);
                    setPdfOpen(true);
                  }
                }}
              >
                {/* Image area */}
                <div className="relative aspect-[16/10] md:aspect-[4/3] md:flex-none min-h-0 overflow-hidden bg-muted">
                  {/* Shimmer skeleton shown until image loads */}
                  <div className="absolute inset-0 bg-muted animate-pulse" />

                  {product.image_url ? (
                    <img
                      src={getResizedUrl(product.image_url, 640)}
                      alt={isAr ? product.name_ar : product.name_en}
                      width={640}
                      height={480}
                      className="relative w-full h-full object-cover transition-all duration-500 group-hover:scale-105 opacity-0"
                      loading={i < 2 ? "eager" : "lazy"}
                      decoding={i < 2 ? "sync" : "async"}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).classList.remove("opacity-0");
                        (e.target as HTMLImageElement).classList.add("opacity-100");
                      }}
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {isCustomIcon ? (
                        <img src={product.icon} alt="" className="w-12 h-12 object-contain opacity-30" />
                      ) : Icon ? (
                        <Icon className="w-12 h-12 text-muted-foreground/30" />
                      ) : null}
                    </div>
                  )}

                  {/* Tag */}
                  {(isAr ? product.tag_ar : product.tag_en) && (
                    <span className="absolute top-3 right-3 text-[11px] font-bold uppercase tracking-widest bg-foreground/75 text-background px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm z-10">
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
      </div>
      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} src={pdfSrc} />
    </section>
  );
}
