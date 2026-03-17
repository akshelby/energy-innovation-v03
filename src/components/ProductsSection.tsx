import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerDialog from "@/components/PdfViewerDialog";
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
    <section id="products" className="py-24 px-6 bg-secondary/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => {
            const isCustomIcon = product.icon?.startsWith("http") || product.icon?.startsWith("/") || product.icon?.startsWith("data:");
            const Icon = !isCustomIcon ? (iconMap[product.icon] || Flame) : null;
            return (
              <div
                key={i}
                className="scroll-reveal group rounded-2xl bg-transparent border border-border hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ transitionDelay: `${i * 80}ms` }}
                onClick={() => {
                  if (product.pdf_url) {
                    setPdfSrc(product.pdf_url);
                    setPdfOpen(true);
                  }
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={isAr ? product.name_ar : product.name_en}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                  <div className="absolute inset-0" />
                  <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    {isCustomIcon ? (
                      <img src={product.icon} alt="" className="w-5 h-5 object-contain" />
                    ) : Icon ? (
                      <Icon className="w-5 h-5 text-accent-foreground" />
                    ) : null}
                  </div>
                  {(isAr ? product.tag_ar : product.tag_en) && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider bg-accent/90 text-accent-foreground px-2.5 py-1 rounded-full">
                      {isAr ? product.tag_ar : product.tag_en}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {isAr ? product.name_ar : product.name_en}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {isAr ? product.description_ar : product.description_en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} src={pdfSrc} />
    </section>
  );
}
