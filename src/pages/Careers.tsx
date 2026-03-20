import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Briefcase, ChevronRight, ArrowLeft, Users, TrendingUp, Heart, Shield, Star, Award, Globe, Zap, Phone, Mail, UserPlus, Package, Sun, Moon, FileText, MessageSquare, Database, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import careersBannerFallback from "@/assets/careers-banner.jpg";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, Heart, Users, Shield, Star, Award, Globe, Zap, Clock, Briefcase, Phone, Mail, UserPlus, Package, Sun, Moon, FileText, MessageSquare, Database, Palette,
};

interface CareerListing {
  id: string;
  title_en: string;
  title_ar: string;
  department_en: string;
  department_ar: string;
  location_en: string;
  location_ar: string;
  type_en: string;
  type_ar: string;
  description_en: string;
  description_ar: string;
  requirements_en: string;
  requirements_ar: string;
  is_active: boolean;
  status: string;
  created_at: string;
}

interface StatItem {
  value_en: string;
  value_ar: string;
  label_en: string;
  label_ar: string;
}

interface PerkItem {
  icon: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
}

export default function Careers() {
  const { language } = useLanguage();
  const heroRef = useScrollReveal();
  const perksRef = useScrollReveal();
  const listingsRef = useScrollReveal();
  const isAr = language === "ar";
  const [careers, setCareers] = useState<CareerListing[]>([]);
  const [selected, setSelected] = useState<CareerListing | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic page content
  const [heroTitle, setHeroTitle] = useState({ en: "Build Your Future With Us", ar: "ابنِ مستقبلك معنا" });
  const [heroSubtitle, setHeroSubtitle] = useState({ en: "Join a leading team in industrial innovation and engineering solutions across the Gulf region.", ar: "انضم إلى فريق رائد في الابتكار الصناعي والحلول الهندسية في منطقة الخليج." });
  const [bannerUrl, setBannerUrl] = useState("");
  const [extraStats, setExtraStats] = useState<StatItem[]>([
    { value_en: "5+", value_ar: "+٥", label_en: "Countries", label_ar: "دول" },
    { value_en: "100%", value_ar: "١٠٠٪", label_en: "Growth Focus", label_ar: "تركيز على النمو" },
  ]);
  const [perks, setPerks] = useState<PerkItem[]>([
    { icon: "TrendingUp", title_en: "Career Growth", title_ar: "النمو المهني", desc_en: "Clear advancement paths with mentorship programs and continuous learning opportunities.", desc_ar: "مسارات تقدم واضحة مع برامج إرشاد وفرص تعلم مستمرة." },
    { icon: "Heart", title_en: "Health & Wellbeing", title_ar: "الصحة والرفاهية", desc_en: "Comprehensive medical coverage and wellness programs for you and your family.", desc_ar: "تغطية طبية شاملة وبرامج صحية لك ولعائلتك." },
    { icon: "Users", title_en: "Collaborative Culture", title_ar: "ثقافة تعاونية", desc_en: "Work alongside industry experts in a supportive, inclusive team environment.", desc_ar: "اعمل جنباً إلى جنب مع خبراء الصناعة في بيئة فريق داعمة وشاملة." },
    { icon: "Shield", title_en: "Job Security", title_ar: "الأمان الوظيفي", desc_en: "Stable employment with competitive compensation and performance-based rewards.", desc_ar: "توظيف مستقر مع تعويضات تنافسية ومكافآت قائمة على الأداء." },
  ]);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch careers
      const { data: careersData } = await supabase
        .from("careers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (careersData) setCareers(careersData as CareerListing[]);

      // Fetch page content
      const { data: contentData } = await supabase
        .from("site_content")
        .select("*")
        .in("content_key", ["careers.hero_title", "careers.hero_subtitle", "careers.banner_image", "careers.stats", "careers.perks"]);

      if (contentData) {
        for (const item of contentData) {
          if (item.content_key === "careers.hero_title") setHeroTitle({ en: item.value_en, ar: item.value_ar });
          else if (item.content_key === "careers.hero_subtitle") setHeroSubtitle({ en: item.value_en, ar: item.value_ar });
          else if (item.content_key === "careers.banner_image" && item.value_en) setBannerUrl(item.value_en);
          else if (item.content_key === "careers.stats" && item.value_en) {
            try { setExtraStats(JSON.parse(item.value_en)); } catch { /* keep defaults */ }
          }
          else if (item.content_key === "careers.perks" && item.value_en) {
            try { setPerks(JSON.parse(item.value_en)); } catch { /* keep defaults */ }
          }
        }
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  const departments = [...new Set(careers.map(c => isAr ? c.department_ar : c.department_en))].filter(Boolean);

  const allStats = [
    { value: careers.length || "—", label_en: "Open Positions", label_ar: "وظائف شاغرة" },
    { value: departments.length || "—", label_en: "Departments", label_ar: "أقسام" },
    ...extraStats.map(s => ({ value: isAr ? (s.value_ar || s.value_en) : s.value_en, label_en: s.label_en, label_ar: s.label_ar })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-20 md:pt-24">
        <div className="relative h-[320px] md:h-[420px] overflow-hidden">
          <img
            src={bannerUrl || careersBannerFallback}
            alt="Careers at Energy Innovation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div
            className="absolute inset-0 flex items-center justify-center px-6"
            ref={heroRef}
          >
            <div className="max-w-3xl text-center scroll-reveal">
              <span className="inline-block text-sm font-semibold tracking-wide text-white/80 mb-4">
                {isAr ? "الوظائف" : "CAREERS"}
              </span>
              <h1
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-5"
                style={{ textWrap: "balance" }}
              >
                {isAr ? heroTitle.ar : heroTitle.en}
              </h1>
              <p className="text-base md:text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
                {isAr ? heroSubtitle.ar : heroSubtitle.en}
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-card border-b border-border">
          <div className={`max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-${Math.min(allStats.length, 4)} divide-x divide-border rtl:divide-x-reverse`}>
            {allStats.map((stat, i) => (
              <div key={i} className="py-5 md:py-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{typeof stat.value === "number" || typeof stat.value === "string" ? stat.value : "—"}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{isAr ? stat.label_ar : stat.label_en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto scroll-reveal" ref={listingsRef}>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
            {isAr ? "الوظائف المتاحة" : "Open Positions"}
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            {isAr
              ? "تصفح الفرص الحالية وابدأ رحلتك المهنية معنا."
              : "Browse current opportunities and start your career journey with us."}
          </p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : selected ? (
            <div>
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {isAr ? "العودة إلى الوظائف" : "Back to all positions"}
              </button>
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      {isAr ? selected.title_ar : selected.title_en}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {(isAr ? selected.department_ar : selected.department_en) && (
                        <span className="inline-flex items-center gap-1.5 bg-secondary/60 px-3 py-1 rounded-full">
                          <Briefcase className="w-3.5 h-3.5" />
                          {isAr ? selected.department_ar : selected.department_en}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 bg-secondary/60 px-3 py-1 rounded-full">
                        <MapPin className="w-3.5 h-3.5" />
                        {isAr ? selected.location_ar : selected.location_en}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-secondary/60 px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        {isAr ? selected.type_ar : selected.type_en}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${selected.status === "open" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                        {selected.status === "open" ? (isAr ? "مفتوح" : "Open") : (isAr ? "مغلق" : "Closed")}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      window.location.href = "mailto:info@energyinnvo.com?subject=" +
                        encodeURIComponent(`Application: ${selected.title_en}`);
                    }}
                    className="gradient-accent text-accent-foreground rounded-full px-6 font-semibold border-0 shrink-0"
                  >
                    {isAr ? "قدم الآن" : "Apply Now"}
                  </Button>
                </div>
                <div className="space-y-8">
                  {(isAr ? selected.description_ar : selected.description_en) && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {isAr ? "الوصف الوظيفي" : "Job Description"}
                      </h3>
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {isAr ? selected.description_ar : selected.description_en}
                      </div>
                    </div>
                  )}
                  {(isAr ? selected.requirements_ar : selected.requirements_en) && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {isAr ? "المتطلبات" : "Requirements"}
                      </h3>
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {isAr ? selected.requirements_ar : selected.requirements_en}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : careers.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isAr ? "لا توجد وظائف شاغرة حالياً" : "No Open Positions"}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isAr
                  ? "لا تتوفر وظائف شاغرة في الوقت الحالي. يرجى التحقق لاحقاً أو إرسال سيرتك الذاتية عبر البريد الإلكتروني."
                  : "There are no open positions at the moment. Check back later or send your resume to info@energyinnvo.com."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {careers.map((career) => (
                <button
                  key={career.id}
                  onClick={() => { setSelected(career); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full text-start bg-card border-2 border-border rounded-2xl p-5 md:p-6 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 group active:scale-[0.98] overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base md:text-lg font-semibold text-foreground group-hover:text-accent transition-colors mb-2 truncate">
                        {isAr ? career.title_ar : career.title_en}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                        {(isAr ? career.department_ar : career.department_en) && (
                          <span className="inline-flex items-center gap-1.5 bg-secondary/60 px-2.5 py-0.5 rounded-full">
                            <Briefcase className="w-3.5 h-3.5" />
                            {isAr ? career.department_ar : career.department_en}
                          </span>
                        )}
                        {(isAr ? career.location_ar : career.location_en) && (
                          <span className="inline-flex items-center gap-1.5 bg-secondary/60 px-2.5 py-0.5 rounded-full">
                            <MapPin className="w-3.5 h-3.5" />
                            {isAr ? career.location_ar : career.location_en}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 bg-secondary/60 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          {isAr ? career.type_ar : career.type_en}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${career.status === "open" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                          {career.status === "open" ? (isAr ? "مفتوح" : "Open") : (isAr ? "مغلق" : "Closed")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0 rtl:rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Us */}
      {perks.length > 0 && (
        <section className="pb-20 md:pb-32 px-6">
          <div className="max-w-5xl mx-auto scroll-reveal" ref={perksRef}>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ textWrap: "balance" }}>
                {isAr ? "لماذا تنضم إلينا؟" : "Why Join Energy Innovation?"}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {isAr
                  ? "نقدم بيئة عمل محفزة تجمع بين التحدي والدعم لتحقيق أفضل أداء."
                  : "We offer an environment where challenge meets support, enabling you to do the best work of your career."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {perks.map((perk, i) => {
                const isImageIcon = perk.icon.startsWith("http") || perk.icon.startsWith("/") || perk.icon.startsWith("data:");
                const IconComp = !isImageIcon ? (ICON_MAP[perk.icon] || Star) : null;
                return (
                  <div
                    key={i}
                    className="relative bg-card border-2 border-border rounded-2xl p-6 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent/40 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-destructive/10 transition-colors">
                      {isImageIcon ? (
                        <img src={perk.icon} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        IconComp && <IconComp className="w-5 h-5 text-accent group-hover:text-destructive transition-colors" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {isAr ? perk.title_ar : perk.title_en}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {isAr ? perk.desc_ar : perk.desc_en}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <FloatingButtons />
    </div>
  );
}
