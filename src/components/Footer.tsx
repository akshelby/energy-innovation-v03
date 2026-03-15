import { useLanguage } from "@/contexts/LanguageContext";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  const quickLinks = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.products"), href: "#products" },
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const productLinks = [
    t("cat.fire"),
    t("cat.roller"),
    t("cat.oil"),
    t("cat.hvac"),
    t("cat.loading"),
  ];

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="gradient-primary text-primary-foreground pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center">
                <Leaf className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-lg font-bold">Mivora™</span>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">{t("footer.quick")}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-bold mb-4">{t("footer.products")}</h4>
            <ul className="space-y-2">
              {productLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo("#products")}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors text-start"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4">{t("footer.contactInfo")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <Mail className="w-4 h-4 shrink-0" />
                {t("footer.email")}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <Phone className="w-4 h-4 shrink-0" />
                {t("footer.phone")}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <MapPin className="w-4 h-4 shrink-0" />
                {t("footer.address")}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 text-center">
          <p className="text-sm text-primary-foreground/40">
            © {new Date().getFullYear()} Mivora™. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
