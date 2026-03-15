import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";
type Direction = "ltr" | "rtl";

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  home: { en: "Home", ar: "الرئيسية" },
  about: { en: "About", ar: "حول" },
  products: { en: "Products", ar: "المنتجات" },
  caseStudies: { en: "Case studies", ar: "دراسات الحالة" },
  blog: { en: "Blog", ar: "المدونة" },
  contactUs: { en: "Contact us", ar: "تواصل معنا" },
  heroHeadline: { en: "Eco-Supply the green pulse of modern logistics", ar: "التوريد البيئي النبض الأخضر للوجستيات الحديثة" },
  heroSubtext: { en: "Eco-friendly, efficient, and future-ready supply chain solutions that reduce your carbon footprint while maximizing business efficiency.", ar: "حلول سلسلة التوريد الصديقة للبيئة والفعالة والمستقبلية التي تقلل من بصمتك الكربونية مع تعظيم كفاءة الأعمال." },
  getGreenQuote: { en: "Get green quote", ar: "احصل على عرض أخضر" },
  caseStudyTitle: { en: "How one city turned its zero-waste vision into reality", ar: "كيف حولت مدينة رؤيتها لصفر نفايات إلى واقع" },
  getItFree: { en: "Get it for FREE", ar: "احصل عليها مجاناً" },
  plantedTrees: { en: "Planted trees to restore biodiversity", ar: "أشجار مزروعة لاستعادة التنوع البيولوجي" },
  savingsLogistics: { en: "Savings through smart logistics", ar: "توفير من خلال اللوجستيات الذكية" },
  // Mega menu categories
  fireSafety: { en: "Fire & Smoke Safety Systems", ar: "أنظمة الحماية من الحريق والدخان" },
  fireCurtains: { en: "Fire Curtains", ar: "ستائر الحريق" },
  fireCurtainsDesc: { en: "Fast-acting and compliant fire protection", ar: "حماية سريعة ومتوافقة من الحريق" },
  smokeCurtains: { en: "Smoke Curtains", ar: "ستائر الدخان" },
  smokeCurtainsDesc: { en: "Efficient smoke control for safer evacuation", ar: "التحكم الفعال في الدخان لإخلاء أكثر أماناً" },
  rollerShutters: { en: "Roller Shutters & Doors", ar: "الأبواب والستائر الدوارة" },
  industrialDoors: { en: "Industrial & Commercial Doors", ar: "أبواب صناعية وتجارية" },
  industrialDoorsDesc: { en: "Durable, high-performance protection", ar: "حماية متينة وعالية الأداء" },
  residentialDoors: { en: "Residential Doors", ar: "أبواب سكنية" },
  residentialDoorsDesc: { en: "Elegant and secure entry solutions", ar: "حلول دخول أنيقة وآمنة" },
  garageDoors: { en: "Garage Doors", ar: "أبواب الكراج" },
  garageDoorsDesc: { en: "Smooth, reliable operation for homes and businesses", ar: "تشغيل سلس وموثوق للمنازل والشركات" },
  highSpeedDoors: { en: "High-Speed Doors", ar: "أبواب عالية السرعة" },
  highSpeedDoorsDesc: { en: "Speed, efficiency, and energy savings", ar: "سرعة وكفاءة وتوفير في الطاقة" },
  steelDoors: { en: "Steel Doors", ar: "أبواب فولاذية" },
  steelDoorsDesc: { en: "Robust protection for high-security areas", ar: "حماية قوية للمناطق عالية الأمان" },
  louvers: { en: "Louvers", ar: "شرائح التهوية" },
  louversDesc: { en: "Optimized airflow and ventilation control", ar: "تحكم محسن في تدفق الهواء والتهوية" },
  oilGas: { en: "Oil & Gas Industry Equipment", ar: "معدات صناعة النفط والغاز" },
  wellEquipment: { en: "Well Equipment & Devices", ar: "معدات وأجهزة الآبار" },
  wellEquipmentDesc: { en: "Engineered for optimal oil & gas operations", ar: "مصممة لعمليات النفط والغاز المثلى" },
  sensors: { en: "Sensors (Pressure, Flow, Temperature, Gas)", ar: "أجهزة الاستشعار (الضغط، التدفق، الحرارة، الغاز)" },
  sensorsDesc: { en: "Accurate monitoring for safety and efficiency", ar: "مراقبة دقيقة للسلامة والكفاءة" },
  spareParts: { en: "Spare Parts & Consumables", ar: "قطع الغيار والمستهلكات" },
  sparePartsDesc: { en: "High-quality replacements to keep systems running", ar: "بدائل عالية الجودة لضمان استمرارية الأنظمة" },
  hvac: { en: "HVAC & Ventilation Solutions", ar: "حلول التكييف والتهوية" },
  ventilators: { en: "Industrial Ventilators & Fans", ar: "مراوح ومهويات صناعية" },
  ventilatorsDesc: { en: "Powerful air circulation for large spaces", ar: "دوران هواء قوي للمساحات الكبيرة" },
  exhaustSystems: { en: "Vehicle Exhaust Extraction Systems", ar: "أنظمة استخلاص عوادم المركبات" },
  exhaustSystemsDesc: { en: "Cleaner, safer industrial environments", ar: "بيئات صناعية أنظف وأكثر أماناً" },
  vavControls: { en: "VAV Thermostats & Controls", ar: "منظمات حرارة وتحكم VAV" },
  vavControlsDesc: { en: "Intelligent temperature regulation for energy savings", ar: "تنظيم ذكي للحرارة لتوفير الطاقة" },
  dampers: { en: "Dampers", ar: "مخمدات" },
  dampersDesc: { en: "Optimized airflow and system control", ar: "تحكم محسن في تدفق الهواء والنظام" },
  loadingBay: { en: "Loading Bay & Material Handling Equipment", ar: "معدات رصيف التحميل ومناولة المواد" },
  dockLevelers: { en: "Dock Levelers", ar: "معادلات الأرصفة" },
  dockLevelersDesc: { en: "Safe, smooth loading and unloading", ar: "تحميل وتفريغ آمن وسلس" },
  dockShelters: { en: "Dock Shelters", ar: "مظلات الأرصفة" },
  dockSheltersDesc: { en: "Weatherproof and efficient loading bay protection", ar: "حماية رصيف التحميل من الطقس بكفاءة" },
};

interface LanguageContextType {
  language: Language;
  direction: Direction;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction);
    document.documentElement.setAttribute("lang", language);
  }, [language, direction]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
