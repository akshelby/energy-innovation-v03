import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.about": "About Us",
    "nav.products": "Products",
    "nav.services": "Services",
    "nav.contact": "Contact Us",
    "hero.headline": "Engineering Excellence for Modern Industry",
    "hero.subtext": "Premium industrial solutions designed to optimize performance, safety, and sustainability across your operations.",
    "hero.explore": "Explore Products",
    "hero.contact": "Contact Us",
    "hero.safety": "Safety Rating",
    "hero.support": "Global Support",
    "about.tag": "About Us",
    "about.title": "Trusted Partner in Industrial Innovation",
    "about.desc": "With decades of expertise in industrial technology, we deliver comprehensive solutions that drive efficiency, ensure safety, and promote sustainable operations. Our engineering team works closely with clients to design and implement systems that meet the highest international standards.",
    "about.experience": "Years Experience",
    "about.projects": "Projects Delivered",
    "about.countries": "Countries Served",
    "about.clients": "Active Clients",
    "products.tag": "Our Products",
    "products.title": "Comprehensive Industrial Solutions",
    "products.desc": "Explore our extensive range of industrial products designed to meet the demands of modern facilities.",
    "products.fire": "Fire & Smoke Safety",
    "products.fire.desc": "Advanced fire curtains and smoke management systems for complete building protection.",
    "products.roller": "Roller Shutters & Doors",
    "products.roller.desc": "Industrial, commercial, residential, high-speed, and steel door solutions.",
    "products.oil": "Oil & Gas Equipment",
    "products.oil.desc": "Precision well equipment, sensors, and spare parts for energy operations.",
    "products.hvac": "HVAC & Ventilation",
    "products.hvac.desc": "Industrial ventilators, exhaust systems, thermostats, and dampers.",
    "products.loading": "Loading Bay Equipment",
    "products.loading.desc": "Dock levelers and shelters for efficient material handling.",
    "products.louvers": "Louvers & Steel Doors",
    "products.louvers.desc": "Heavy-duty louvers and steel security doors for industrial applications.",
    "services.tag": "Our Services",
    "services.title": "Expert Engineering Services",
    "services.desc": "We provide end-to-end industrial solutions from technical design to installation and ongoing support.",
    "services.drawing": "Technical Drawing",
    "services.drawing.desc": "Precision CAD and engineering drawings tailored to your facility specifications.",
    "services.install": "Installation",
    "services.install.desc": "Professional installation services with certified technicians and quality assurance.",
    "services.maintenance": "Maintenance",
    "services.maintenance.desc": "Preventive and corrective maintenance programs to ensure optimal performance.",
    "services.consulting": "Consulting",
    "services.consulting.desc": "Expert industrial consulting to optimize your operations and system design.",
    "why.tag": "Why Choose Us",
    "why.title": "Built on Trust, Driven by Excellence",
    "why.expertise": "Industry Expertise",
    "why.expertise.desc": "Decades of experience across fire safety, HVAC, oil & gas, and industrial automation sectors.",
    "why.quality": "High Quality Equipment",
    "why.quality.desc": "Every product meets rigorous international standards with comprehensive certifications.",
    "why.precision": "Engineering Precision",
    "why.precision.desc": "Custom-engineered solutions designed with mathematical precision for optimal performance.",
    "why.support": "Reliable Support",
    "why.support.desc": "24/7 technical support with rapid response teams across multiple regions worldwide.",
    "highlight.tagline": "Proven Industrial Partner",
    "highlight.title": "Driving Industrial Excellence Forward",
    "highlight.desc": "Energy Innovation delivers cutting-edge industrial solutions that empower businesses to achieve operational excellence. From strategy to execution, we bring industry-leading expertise across engineering, automation, and safety systems.",
    "highlight.subdesc": "Your success is our priority. We welcome your inquiries as we partner on your industrial journey.",
    "contact.tag": "Get in Touch",
    "contact.title": "Let's Build Something Great",
    "contact.desc": "Ready to upgrade your industrial infrastructure? Send us a message and our team will respond within 24 hours.",
    "contact.name": "Full Name",
    "contact.email": "Email Address",
    "contact.phone": "Phone Number",
    "contact.company": "Company (Optional)",
    "contact.message": "Your Message",
    "contact.send": "Send Message",
    "contact.sending": "Sending...",
    "contact.success": "Message sent successfully!",
    "contact.error": "Failed to send message. Please try again.",
    "footer.desc": "Premium industrial technology solutions for modern facilities worldwide.",
    "footer.quick": "Quick Links",
    "footer.products": "Product Categories",
    "footer.contactInfo": "Contact Info",
    "footer.rights": "All rights reserved.",
    "footer.email": "info@energyinnovation.com",
    "footer.phone": "+1 (555) 000-0000",
    "footer.address": "Industrial District, Building 7",
    // Product categories
    "cat.fire": "Fire & Smoke Safety Systems",
    "cat.roller": "Roller Shutters & Doors",
    "cat.oil": "Oil & Gas Industry Equipment",
    "cat.hvac": "HVAC & Ventilation Solutions",
    "cat.loading": "Loading Bay & Material Handling",
    // Product items
    "item.fireCurtains": "Fire Curtains",
    "item.smokeCurtains": "Smoke Curtains",
    "item.industrial": "Industrial & Commercial Doors",
    "item.residential": "Residential Doors",
    "item.garage": "Garage Doors",
    "item.highSpeed": "High-Speed Doors",
    "item.steel": "Steel Doors",
    "item.louvers": "Louvers",
    "item.well": "Well Equipment & Devices",
    "item.sensors": "Sensors (Pressure, Flow, Temperature, Gas Detection)",
    "item.spare": "Spare Parts & Consumables",
    "item.ventilators": "Industrial Ventilators & Fans",
    "item.exhaust": "Vehicle Exhaust Extraction Systems",
    "item.vav": "VAV Thermostats & Controls",
    "item.dampers": "Dampers",
    "item.dockLevelers": "Dock Levelers",
    "item.dockShelters": "Dock Shelters",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.about": "من نحن",
    "nav.products": "المنتجات",
    "nav.services": "الخدمات",
    "nav.contact": "اتصل بنا",
    "hero.headline": "التميز الهندسي للصناعة الحديثة",
    "hero.subtext": "حلول صناعية متميزة مصممة لتحسين الأداء والسلامة والاستدامة عبر عملياتك.",
    "hero.explore": "استكشف المنتجات",
    "hero.contact": "اتصل بنا",
    "hero.safety": "تقييم السلامة",
    "hero.support": "دعم عالمي",
    "about.tag": "من نحن",
    "about.title": "شريك موثوق في الابتكار الصناعي",
    "about.desc": "مع عقود من الخبرة في التكنولوجيا الصناعية، نقدم حلولاً شاملة تعزز الكفاءة وتضمن السلامة وتعزز العمليات المستدامة. يعمل فريقنا الهندسي بشكل وثيق مع العملاء لتصميم وتنفيذ أنظمة تلبي أعلى المعايير الدولية.",
    "about.experience": "سنوات الخبرة",
    "about.projects": "مشاريع منجزة",
    "about.countries": "دولة نخدمها",
    "about.clients": "عملاء نشطون",
    "products.tag": "منتجاتنا",
    "products.title": "حلول صناعية شاملة",
    "products.desc": "اكتشف مجموعتنا الواسعة من المنتجات الصناعية المصممة لتلبية متطلبات المنشآت الحديثة.",
    "products.fire": "السلامة من الحريق",
    "products.fire.desc": "أنظمة ستائر حريق ودخان متقدمة لحماية المباني بالكامل.",
    "products.roller": "الأبواب والشتر",
    "products.roller.desc": "حلول أبواب صناعية وتجارية وسكنية وعالية السرعة وفولاذية.",
    "products.oil": "معدات النفط والغاز",
    "products.oil.desc": "معدات الآبار الدقيقة وأجهزة الاستشعار وقطع الغيار لعمليات الطاقة.",
    "products.hvac": "التهوية والتكييف",
    "products.hvac.desc": "مراوح صناعية وأنظمة عادم وثرموستات ومخمدات.",
    "products.loading": "معدات التحميل",
    "products.loading.desc": "مسويات ومظلات الرصيف لمناولة المواد بكفاءة.",
    "products.louvers": "الفتحات والأبواب الفولاذية",
    "products.louvers.desc": "فتحات وأبواب فولاذية للتطبيقات الصناعية.",
    "services.tag": "خدماتنا",
    "services.title": "خدمات هندسية متخصصة",
    "services.desc": "نقدم حلولاً صناعية شاملة من التصميم الفني إلى التركيب والدعم المستمر.",
    "services.drawing": "الرسم الفني",
    "services.drawing.desc": "رسومات CAD هندسية دقيقة مصممة وفقاً لمواصفات منشأتك.",
    "services.install": "التركيب",
    "services.install.desc": "خدمات تركيب احترافية مع فنيين معتمدين وضمان الجودة.",
    "services.maintenance": "الصيانة",
    "services.maintenance.desc": "برامج صيانة وقائية وتصحيحية لضمان الأداء الأمثل.",
    "services.consulting": "الاستشارات",
    "services.consulting.desc": "استشارات صناعية متخصصة لتحسين عملياتك وتصميم أنظمتك.",
    "why.tag": "لماذا نحن",
    "why.title": "مبنيون على الثقة، مدفوعون بالتميز",
    "why.expertise": "خبرة صناعية",
    "why.expertise.desc": "عقود من الخبرة في مجالات السلامة من الحريق والتكييف والنفط والغاز والأتمتة الصناعية.",
    "why.quality": "معدات عالية الجودة",
    "why.quality.desc": "كل منتج يلبي المعايير الدولية الصارمة مع شهادات شاملة.",
    "why.precision": "دقة هندسية",
    "why.precision.desc": "حلول مصممة هندسياً بدقة رياضية للأداء الأمثل.",
    "why.support": "دعم موثوق",
    "why.support.desc": "دعم فني على مدار الساعة مع فرق استجابة سريعة في مناطق متعددة حول العالم.",
    "highlight.tagline": "شريك صناعي موثوق",
    "highlight.title": "قيادة التميز الصناعي نحو الأمام",
    "highlight.desc": "تقدم Energy Innovation حلولاً صناعية متطورة تمكّن الشركات من تحقيق التميز التشغيلي. من الاستراتيجية إلى التنفيذ، نقدم خبرة رائدة في الهندسة والأتمتة وأنظمة السلامة.",
    "highlight.subdesc": "نجاحكم هو أولويتنا. نرحب باستفساراتكم ونتطلع للشراكة في رحلتكم الصناعية.",
    "contact.tag": "تواصل معنا",
    "contact.title": "لنبني شيئاً رائعاً معاً",
    "contact.desc": "هل أنت مستعد لتطوير بنيتك التحتية الصناعية؟ أرسل لنا رسالة وسيرد فريقنا خلال 24 ساعة.",
    "contact.name": "الاسم الكامل",
    "contact.email": "البريد الإلكتروني",
    "contact.phone": "رقم الهاتف",
    "contact.company": "الشركة (اختياري)",
    "contact.message": "رسالتك",
    "contact.send": "إرسال الرسالة",
    "contact.sending": "جاري الإرسال...",
    "contact.success": "تم إرسال الرسالة بنجاح!",
    "contact.error": "فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.",
    "footer.desc": "حلول تكنولوجيا صناعية متميزة للمنشآت الحديثة حول العالم.",
    "footer.quick": "روابط سريعة",
    "footer.products": "فئات المنتجات",
    "footer.contactInfo": "معلومات الاتصال",
    "footer.rights": "جميع الحقوق محفوظة.",
    "footer.email": "info@energyinnovation.com",
    "footer.phone": "+1 (555) 000-0000",
    "footer.address": "المنطقة الصناعية، مبنى 7",
    "cat.fire": "أنظمة السلامة من الحريق والدخان",
    "cat.roller": "الأبواب والشتر",
    "cat.oil": "معدات صناعة النفط والغاز",
    "cat.hvac": "حلول التهوية والتكييف",
    "cat.loading": "معدات التحميل ومناولة المواد",
    "item.fireCurtains": "ستائر الحريق",
    "item.smokeCurtains": "ستائر الدخان",
    "item.industrial": "أبواب صناعية وتجارية",
    "item.residential": "أبواب سكنية",
    "item.garage": "أبواب جراج",
    "item.highSpeed": "أبواب عالية السرعة",
    "item.steel": "أبواب فولاذية",
    "item.louvers": "فتحات التهوية",
    "item.well": "معدات وأجهزة الآبار",
    "item.sensors": "أجهزة استشعار (ضغط، تدفق، حرارة، كشف غاز)",
    "item.spare": "قطع غيار ومستهلكات",
    "item.ventilators": "مراوح ومنفاخات صناعية",
    "item.exhaust": "أنظمة استخراج عوادم المركبات",
    "item.vav": "ثرموستات وأنظمة تحكم VAV",
    "item.dampers": "مخمدات",
    "item.dockLevelers": "مسويات الرصيف",
    "item.dockShelters": "مظلات الرصيف",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CONTENT_CACHE_KEY = "ei_site_content_v1";

function readCachedContent(): Record<string, { en: string; ar: string }> {
  try {
    const raw = localStorage.getItem(CONTENT_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const initialCached = readCachedContent();
  const [dynamicContent, setDynamicContent] = useState<Record<string, { en: string; ar: string }>>(initialCached);
  const [contentLoaded, setContentLoaded] = useState<boolean>(Object.keys(initialCached).length > 0);

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  // Fetch dynamic content from Supabase
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase.from("site_content").select("content_key, value_en, value_ar");
        if (data && data.length > 0) {
          const contentMap: Record<string, { en: string; ar: string }> = {};
          data.forEach((item: any) => {
            contentMap[item.content_key] = { en: item.value_en, ar: item.value_ar };
          });
          setDynamicContent(contentMap);
          try { localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(contentMap)); } catch {}
        }
      } catch {
        // Silently fall back to hardcoded translations
      } finally {
        setContentLoaded(true);
      }
    };
    fetchContent();
  }, []);

  const t = useCallback((key: string): string => {
    // Dynamic content takes priority
    if (dynamicContent[key]) {
      return dynamicContent[key][language] || translations[language][key] || key;
    }
    return translations[language][key] || key;
  }, [language, dynamicContent]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, contentLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
