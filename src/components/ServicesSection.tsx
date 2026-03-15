import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import {
  Flame, DoorOpen, Droplets, Wind, Truck, Shield, Zap, Factory,
  HardHat, Gauge, Cog, Building, PenTool, Wrench, Settings, MessageSquare, FileText,
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
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");

  useEffect(() => {
    supabase.from("services").select("*").order("sort_order").then(({ data }) => {
      if (data && data.length > 0) setServices(data as Service[]);
    });
  }, []);

  const isAr = language === "ar";

  return (
    <section id="services" className="py-24 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full mb-4">
            {t("services.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("services.desc")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Wrench;
            return (
              <div
                key={i}
                className="scroll-reveal text-center p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative"
                style={{ transitionDelay: `${i * 100}ms` }}
                onClick={() => {
                  if (service.pdf_url) {
                    setPdfSrc(service.pdf_url);
                    setPdfOpen(true);
                  }
                }}
              >
                {(isAr ? service.tag_ar : service.tag_en) && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                    {isAr ? service.tag_ar : service.tag_en}
                  </span>
                )}
                {service.image_url ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-5">
                    <img src={service.image_url} alt={isAr ? service.name_ar : service.name_en} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-5 mx-auto">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {isAr ? service.name_ar : service.name_en}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {isAr ? service.description_ar : service.description_en}
                </p>
                {service.pdf_url && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-xs text-primary">
                    <FileText className="w-3 h-3" />
                    <span>View PDF</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} src={pdfSrc} />
    </section>
  );
}
