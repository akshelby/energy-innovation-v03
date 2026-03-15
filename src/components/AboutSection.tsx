import { useLanguage } from "@/contexts/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  aboutTitle: { en: "Pioneering Sustainable Industry", ar: "ريادة الصناعة المستدامة" },
  aboutDesc: {
    en: "Mivora is a leading B2B supplier of industrial safety systems, doors, HVAC solutions, and oil & gas equipment. We combine cutting-edge technology with eco-conscious practices to deliver future-ready solutions that protect people, assets, and the planet.",
    ar: "ميفورا هي مورد رائد في مجال أنظمة السلامة الصناعية والأبواب وحلول التكييف ومعدات النفط والغاز. نجمع بين التكنولوجيا المتطورة والممارسات الصديقة للبيئة لتقديم حلول مستقبلية تحمي الأشخاص والأصول والكوكب."
  },
  stat1Label: { en: "Projects Delivered", ar: "مشاريع منجزة" },
  stat2Label: { en: "Countries Served", ar: "دول مخدومة" },
  stat3Label: { en: "Carbon Offset (tons)", ar: "تعويض الكربون (طن)" },
  stat4Label: { en: "Client Satisfaction", ar: "رضا العملاء" },
  missionTitle: { en: "Our Mission", ar: "مهمتنا" },
  missionDesc: {
    en: "To accelerate the transition to sustainable industrial operations by providing world-class equipment and solutions that reduce environmental impact without compromising performance.",
    ar: "تسريع الانتقال إلى العمليات الصناعية المستدامة من خلال توفير معدات وحلول عالمية المستوى تقلل من التأثير البيئي دون المساومة على الأداء."
  },
  visionTitle: { en: "Our Vision", ar: "رؤيتنا" },
  visionDesc: {
    en: "A world where every industrial facility operates at peak efficiency with zero environmental harm — powered by innovative, green supply chain solutions.",
    ar: "عالم تعمل فيه كل منشأة صناعية بأقصى كفاءة بدون ضرر بيئي — مدعومة بحلول سلسلة التوريد الخضراء المبتكرة."
  },
};

const stats = [
  { key: "stat1Label", value: "2,500+" },
  { key: "stat2Label", value: "45+" },
  { key: "stat3Label", value: "12K" },
  { key: "stat4Label", value: "98%" },
];

const AboutSection = () => {
  const { language } = useLanguage();
  const t = (key: string) => translations[key]?.[language] || key;

  return (
    <section id="about" className="py-24 px-6 md:px-16 lg:px-24 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, idx) => (
            <div
              key={stat.key}
              className="text-center p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <p className="text-3xl md:text-4xl font-bold text-gradient-eco">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t(stat.key)}</p>
            </div>
          ))}
        </div>

        {/* About Content */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {t("aboutTitle")}
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {t("aboutDesc")}
            </p>
          </div>

          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">{t("missionTitle")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("missionDesc")}</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">{t("visionTitle")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("visionDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
