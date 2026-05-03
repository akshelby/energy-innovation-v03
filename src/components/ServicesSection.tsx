import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsMobile } from "@/hooks/use-mobile";
import StickyCardStack from "@/components/StickyCardStack";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import { getCached, setCache } from "@/lib/cache";
import drawingImg from "@/assets/services/drawing.jpg";
import installationImg from "@/assets/services/installation.jpg";
import maintenanceImg from "@/assets/services/maintenance.jpg";
import consultingImg from "@/assets/services/consulting.jpg";
import {
  Flame, DoorOpen, Droplets, Wind, Truck, Shield, Zap, Factory,
  HardHat, Gauge, Cog, Building, PenTool, Wrench, Settings, MessageSquare, FileText, ArrowUpRight, ChevronDown,
} from "lucide-react";

const assetMap: Record<string, string> = {
  "asset:drawing": drawingImg,
  "asset:installation": installationImg,
  "asset:maintenance": maintenanceImg,
  "asset:consulting": consultingImg,
};

// Map service NAME (lowercase) to a bundled fallback image so cards always
// have a hero image even if image_url is missing or points to a stale key.
const nameFallbackMap: Record<string, string> = {
  "technical drawing": drawingImg,
  drawing: drawingImg,
  installation: installationImg,
  maintenance: maintenanceImg,
  consulting: consultingImg,
};

const resolveImage = (url: string | null, nameEn?: string): string | null => {
  if (url) {
    if (url.startsWith("asset:")) {
      if (assetMap[url]) return assetMap[url];
    } else if (url.startsWith("/services/")) {
      const key = "asset:" + url.replace("/services/", "").replace(".jpg", "");
      if (assetMap[key]) return assetMap[key];
      return url;
    } else {
      return url;
    }
  }
  // Fallback: match by service name
  const key = (nameEn || "").trim().toLowerCase();
  return nameFallbackMap[key] || null;
};

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
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  // Cache full DB records (including image_url) for instant render on repeat visits.
  // Background refresh keeps content fresh.
  const initialCached = (typeof window !== "undefined" ? getCached<Service[]>("services") : null) || [];
  const [services, setServices] = useState<Service[]>(initialCached);
  const [ready, setReady] = useState(initialCached.length > 0);
  const [imagesReady, setImagesReady] = useState(initialCached.length > 0);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");

  useEffect(() => {
    supabase.from("services").select("*").order("sort_order").then(({ data }) => {
      if (data && data.length > 0) {
        const result = data as Service[];
        setServices(result);
        setCache("services", result);
        // Warm the browser image cache so subsequent renders are instant
        result.forEach((s) => {
          if (s.image_url && /^https?:/.test(s.image_url)) {
            const img = new Image();
            img.src = s.image_url;
          }
        });
      } else if (services.length === 0) {
        setServices(fallbackServices);
      }
      setImagesReady(true);
      setReady(true);
    });
  }, []);

  const isAr = language === "ar";
  const showToggle = isMobile;
  const isCollapsed = showToggle && !expanded;

  return (
    <section id="services" className="py-12 md:py-12 px-3 md:px-12 lg:px-20 bg-background lazy-section" ref={ref}>
      <div className="w-full mx-auto">
        <div className="text-center mb-10 md:mb-16 scroll-reveal-fade">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("services.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("services.title")}
          </h2>
          <div className="w-full mx-auto relative">
            <div
              className="overflow-hidden md:!max-h-none md:!opacity-100"
              style={{
                maxHeight: showToggle ? (expanded ? "1500px" : "5rem") : "none",
                opacity: showToggle ? (expanded ? 1 : 0.95) : 1,
                transition: "max-height 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.6s ease",
              }}
            >
              <p className="text-muted-foreground text-lg">
                {t("services.desc")}
              </p>
            </div>
            {isCollapsed && (
              <div
                className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-background"
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
        <StickyCardStack baseTop={72} offsetIncrement={0} scrollSpace="6svh" maxWidthClass="max-w-none">
          {services.map((service, i) => {
            const iconStr = service.icon || "";
            const isCustomIcon = /^(https?:|\/|data:)/.test(iconStr) && iconStr.length > 5;
            const Icon = !isCustomIcon ? (iconMap[iconStr] || Wrench) : null;
            const heroImg = resolveImage(service.image_url, service.name_en);
            return (
              <div
                key={i}
                className="scroll-reveal md:!opacity-100 md:!translate-y-0 group relative cursor-pointer overflow-hidden bg-card transition-all duration-500 h-full flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15 shadow-lg shadow-foreground/5"
                style={{
                  transitionDelay: `${i * 100}ms`,
                  minHeight: "400px",
                  borderRadius: "24px",
                  padding: "1.5px",
                  backgroundImage:
                    "linear-gradient(hsl(var(--card)), hsl(var(--card))), linear-gradient(135deg, #2BD8FF 0%, #A14BFF 35%, #FF4FCB 65%, #FF6A3D 100%)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                  border: "1.5px solid transparent",
                }}
                onClick={() => {
                  if (service.pdf_url) {
                    setPdfSrc(service.pdf_url);
                    setPdfOpen(true);
                  }
                }}
              >
                {/* Top content area */}
                <div className="flex flex-col gap-3 p-5 md:p-6">
                  {/* Header row: icon + tag */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-accent/15 to-primary/10 flex items-center justify-center transition-all duration-300 group-hover:from-destructive/15 group-hover:to-accent/10 group-hover:scale-110 shrink-0">
                      {isCustomIcon && iconStr ? (
                        <img src={iconStr} alt="" className="w-6 h-6 object-contain" />
                      ) : Icon ? (
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-accent transition-colors duration-300 group-hover:text-destructive" />
                      ) : (
                        <Wrench className="w-5 h-5 md:w-6 md:h-6 text-accent transition-colors duration-300 group-hover:text-destructive" />
                      )}
                    </div>
                    {(isAr ? service.tag_ar : service.tag_en) && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full truncate">
                        {isAr ? service.tag_ar : service.tag_en}
                      </span>
                    )}
                  </div>

                  {/* Title — Apple-style gradient */}
                  <h3
                    className="text-xl md:text-2xl lg:text-[1.7rem] font-bold leading-tight tracking-tight"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #2BD8FF 0%, #A14BFF 35%, #FF4FCB 65%, #FF6A3D 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                      textWrap: "balance" as any,
                    }}
                  >
                    {isAr ? service.name_ar : service.name_en}
                  </h3>

                  {/* Short description */}
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {isAr ? service.description_ar : service.description_en}
                  </p>

                  {service.pdf_url && (
                    <span className="self-start mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      View Details
                      <ArrowUpRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  )}
                </div>

                {/* Bottom image area */}
                <div
                  className="relative mt-auto w-full overflow-hidden bg-muted"
                  style={{ height: "200px" }}
                >
                  {imagesReady && heroImg && (
                    <img
                      src={heroImg}
                      alt={isAr ? service.name_ar : service.name_en}
                      className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                      style={{ objectFit: "cover" }}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                  )}
                  {/* Top fade for seamless blend */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0"
                    style={{
                      height: "72px",
                      background: "linear-gradient(to bottom, hsl(var(--card)) 0%, transparent 100%)",
                    }}
                    aria-hidden="true"
                  />
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
