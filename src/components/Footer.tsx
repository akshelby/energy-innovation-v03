import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  tagline: { en: "Sustainable Industrial Solutions", ar: "حلول صناعية مستدامة" },
  quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
  productCats: { en: "Products", ar: "المنتجات" },
  contactInfo: { en: "Contact Info", ar: "معلومات الاتصال" },
  rights: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  terms: { en: "Terms of Service", ar: "شروط الخدمة" },
  home: { en: "Home", ar: "الرئيسية" },
  about: { en: "About", ar: "حول" },
  caseStudies: { en: "Case Studies", ar: "دراسات الحالة" },
  blog: { en: "Blog", ar: "المدونة" },
  contact: { en: "Contact", ar: "تواصل" },
  fireSafety: { en: "Fire & Smoke Safety", ar: "السلامة من الحريق" },
  rollerShutters: { en: "Roller Shutters & Doors", ar: "الأبواب الدوارة" },
  oilGas: { en: "Oil & Gas Equipment", ar: "معدات النفط والغاز" },
  hvac: { en: "HVAC Solutions", ar: "حلول التكييف" },
  loadingBay: { en: "Loading Bay Equipment", ar: "معدات التحميل" },
  address: { en: "Dubai Industrial City, UAE", ar: "مدينة دبي الصناعية، الإمارات" },
};

const Footer = () => {
  const { language } = useLanguage();
  const t = (key: string) => translations[key]?.[language] || key;

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-eco" />
              <span className="text-xl font-bold">Mivora™</span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("quickLinks")}</h4>
            <ul className="space-y-2">
              {["home", "about", "caseStudies", "blog", "contact"].map((key) => (
                <li key={key}>
                  <a href={`#${key === "home" ? "" : key === "caseStudies" ? "cases" : key}`} className="text-sm text-primary-foreground/70 hover:text-eco transition-colors">
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">{t("productCats")}</h4>
            <ul className="space-y-2">
              {["fireSafety", "rollerShutters", "oilGas", "hvac", "loadingBay"].map((key) => (
                <li key={key}>
                  <a href="#products" className="text-sm text-primary-foreground/70 hover:text-eco transition-colors">
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t("contactInfo")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 text-eco shrink-0" />
                info@mivora.com
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 text-eco shrink-0" />
                +971 4 XXX XXXX
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4 text-eco shrink-0" />
                {t("address")}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Mivora™. {t("rights")}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-primary-foreground/50 hover:text-eco transition-colors">
              {t("privacy")}
            </a>
            <a href="#" className="text-xs text-primary-foreground/50 hover:text-eco transition-colors">
              {t("terms")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
