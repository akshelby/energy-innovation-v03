import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import StickyCardStack from "@/components/StickyCardStack";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import {
  Flame, DoorOpen, Droplets, Wind, Truck, Shield, Zap, Factory,
  HardHat, Gauge, Cog, Building, PenTool, Wrench, Settings, MessageSquare, FileText, ArrowUpRight,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame, DoorOpen, Droplets, Wind, Truck, Shield, Zap, Factory,
  HardHat, Gauge, Cog, Building, PenTool, Wrench, Settings, MessageSquare,
};

const fallbackServices = [
  { name_en: "Technical Drawing", name_ar: "الرسم الفني", description_en: "Precision CAD and engineering drawings tailored to your facility specifications.", description_ar: "رسومات CAD هندسية دقيقة مصممة وفقاً لمواصفات منشأتك.", icon: "PenTool", image_url: null, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Installation", name_ar: "التركيب", description_en: "Professional installation services with certified technicians and quality assurance.", description_ar: "خدمات تركيب احترافية مع فنيين معتمدين وضمان الجودة.", icon: "Wrench", image_url: null, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Maintenance", name_ar: "الصيانة", description_en: "Preventive and corrective maintenance programs to ensure optimal performance.", description_ar: "برامج صيانة وقائية وتصحيحية لضمان الأداء الأمثل.", icon: "Settings", image_url: null, pdf_url: null, tag_en: "", tag_ar: "" },
  { name_en: "Consulting", name_ar: "الاستشارات", description_en: "Expert industrial consulting to optimize your operations and system design.", description_ar: "استشارات صناعية متخصصة لتحسين عملياتك وتصميم أنظمتك.", icon: "MessageSquare", image_url: null, pdf_url: null, tag_en: "", tag_ar: "" },
];

interface Service {
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

export default function ServicesSection() {
  const { t, language } = useLanguage();
  const ref = useScrollReveal();
  const [services, setServices] = useState<Service[]>([]);
  const [ready, setReady] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");

  useEffect(() => {
    supabase.from("services").select("*").order("sort_order").then(({ data }) => {
      setServices(data && data.length > 0 ? (data as Service[]) : fallbackServices);
      setReady(true);
    });
  }, []);

  const isAr = language === "ar";

  return (
    <section id="services" className="py-12 md:py-20 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16 scroll-reveal">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("services.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("services.desc")}
          </p>
        </div>

        <div className={`transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <StickyCardStack baseTop={72} offsetIncrement={0} scrollSpace="6svh" maxWidthClass="max-w-md">
          {services.map((service, i) => {
            const isCustomIcon = service.icon?.startsWith("http") || service.icon?.startsWith("/") || service.icon?.startsWith("data:");
            const Icon = !isCustomIcon ? (iconMap[service.icon] || Wrench) : null;
            return (
              <div
                key={i}
                className="scroll-reveal md:!opacity-100 md:!translate-y-0 group relative rounded-2xl cursor-pointer overflow-hidden border-2 border-border hover:border-accent/30 bg-card transition-all duration-300 h-full flex flex-col"
                style={{ transitionDelay: `${i * 100}ms` }}
                onClick={() => {
                  if (service.pdf_url) {
                    setPdfSrc(service.pdf_url);
                    setPdfOpen(true);
                  }
                }}
              >
                {/* Top accent strip */}
                <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent transition-all duration-500 group-hover:from-accent group-hover:via-accent group-hover:to-accent/40" />

                <div className="p-6 pb-7 flex flex-col flex-1">
                  {/* Tag */}
                  {(isAr ? service.tag_ar : service.tag_en) && (
                    <span className="inline-block text-[10px] font-semibold tracking-wide bg-accent/10 text-accent px-2.5 py-1 rounded-full mb-4">
                      {isAr ? service.tag_ar : service.tag_en}
                    </span>
                  )}

                  {/* Icon */}
                  <div className="mb-5">
                    {service.image_url ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden">
                        <img src={service.image_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" width={56} height={56} />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-accent/8 flex items-center justify-center transition-colors duration-300 group-hover:bg-destructive/10">
                        {isCustomIcon ? (
                          <img src={service.icon} alt="" className="w-7 h-7 object-contain" />
                        ) : Icon ? (
                          <Icon className="w-7 h-7 text-accent transition-colors duration-300 group-hover:text-destructive" />
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-foreground leading-snug mb-2">
                    {isAr ? service.name_ar : service.name_en}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-[13px] leading-relaxed mb-5 flex-1 line-clamp-2">
                    {isAr ? service.description_ar : service.description_en}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/60">
                    {service.pdf_url ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                        <FileText className="w-3.5 h-3.5" />
                        View Details
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/50 font-medium">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <div className="w-7 h-7 rounded-full border border-border group-hover:border-accent/30 flex items-center justify-center transition-colors duration-300">
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
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
