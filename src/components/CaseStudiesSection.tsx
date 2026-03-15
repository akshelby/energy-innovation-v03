import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import caseStudyThumb from "@/assets/case-study-thumb.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero5 from "@/assets/hero-5.jpg";

const translations: Record<string, Record<string, string>> = {
  csTitle: { en: "Case Studies", ar: "دراسات الحالة" },
  csSubtitle: { en: "Real results from real partnerships", ar: "نتائج حقيقية من شراكات حقيقية" },
  cs1Title: { en: "How one city turned its zero-waste vision into reality", ar: "كيف حولت مدينة رؤيتها لصفر نفايات إلى واقع" },
  cs1Tag: { en: "Sustainability", ar: "الاستدامة" },
  cs2Title: { en: "Reducing energy costs by 40% with smart HVAC solutions", ar: "تقليل تكاليف الطاقة بنسبة 40٪ مع حلول التكييف الذكية" },
  cs2Tag: { en: "Energy Efficiency", ar: "كفاءة الطاقة" },
  cs3Title: { en: "Modernizing oil & gas monitoring with IoT sensors", ar: "تحديث مراقبة النفط والغاز باستخدام أجهزة استشعار إنترنت الأشياء" },
  cs3Tag: { en: "Oil & Gas", ar: "النفط والغاز" },
  readMore: { en: "Read more", ar: "اقرأ المزيد" },
  blogTitle: { en: "Latest Insights", ar: "أحدث المقالات" },
  blogSubtitle: { en: "Industry trends, tips, and thought leadership", ar: "اتجاهات الصناعة والنصائح والقيادة الفكرية" },
  b1Title: { en: "The Future of Fire Safety in Smart Buildings", ar: "مستقبل السلامة من الحرائق في المباني الذكية" },
  b1Date: { en: "March 10, 2026", ar: "10 مارس 2026" },
  b2Title: { en: "5 Ways to Optimize Your Loading Bay Operations", ar: "5 طرق لتحسين عمليات رصيف التحميل" },
  b2Date: { en: "March 5, 2026", ar: "5 مارس 2026" },
  b3Title: { en: "Why High-Speed Doors Are Essential for Cold Chain Logistics", ar: "لماذا الأبواب عالية السرعة ضرورية للوجستيات سلسلة التبريد" },
  b3Date: { en: "Feb 28, 2026", ar: "28 فبراير 2026" },
  b4Title: { en: "Sustainable Ventilation: Balancing Air Quality and Energy", ar: "التهوية المستدامة: التوازن بين جودة الهواء والطاقة" },
  b4Date: { en: "Feb 20, 2026", ar: "20 فبراير 2026" },
};

const caseStudies = [
  { titleKey: "cs1Title", tagKey: "cs1Tag", img: caseStudyThumb },
  { titleKey: "cs2Title", tagKey: "cs2Tag", img: hero3 },
  { titleKey: "cs3Title", tagKey: "cs3Tag", img: hero5 },
];

const blogPosts = [
  { titleKey: "b1Title", dateKey: "b1Date" },
  { titleKey: "b2Title", dateKey: "b2Date" },
  { titleKey: "b3Title", dateKey: "b3Date" },
  { titleKey: "b4Title", dateKey: "b4Date" },
];

const CaseStudiesSection = () => {
  const { language } = useLanguage();
  const t = (key: string) => translations[key]?.[language] || key;

  return (
    <>
      {/* Case Studies */}
      <section id="cases" className="py-24 px-6 md:px-16 lg:px-24 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("csTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("csSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {caseStudies.map((cs) => (
              <a
                key={cs.titleKey}
                href="#"
                className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="overflow-hidden h-48">
                  <img
                    src={cs.img}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-eco/10 text-eco rounded-pill mb-3">
                    {t(cs.tagKey)}
                  </span>
                  <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-eco transition-colors">
                    {t(cs.titleKey)}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-eco font-medium">
                    {t("readMore")} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="py-24 px-6 md:px-16 lg:px-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("blogTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("blogSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.map((post) => (
              <a
                key={post.titleKey}
                href="#"
                className="group flex items-center gap-5 p-5 rounded-xl bg-card border border-border hover:border-eco/50 hover:shadow-md transition-all duration-300"
              >
                <div className="w-2 h-12 rounded-full bg-gradient-eco shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t(post.dateKey)}</p>
                  <h3 className="text-sm md:text-base font-semibold text-foreground group-hover:text-eco transition-colors">
                    {t(post.titleKey)}
                  </h3>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-eco ms-auto shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CaseStudiesSection;
