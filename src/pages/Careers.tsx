import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Briefcase, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  created_at: string;
}

export default function Careers() {
  const { language, t } = useLanguage();
  const ref = useScrollReveal();
  const isAr = language === "ar";
  const [careers, setCareers] = useState<CareerListing[]>([]);
  const [selected, setSelected] = useState<CareerListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCareers = async () => {
      const { data } = await supabase
        .from("careers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setCareers(data as CareerListing[]);
      setLoading(false);
    };
    fetchCareers();
  }, []);

  const departments = [...new Set(careers.map(c => isAr ? c.department_ar : c.department_en))].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center scroll-reveal" ref={ref}>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            style={{ textWrap: "balance" }}
          >
            {isAr ? "انضم إلى فريقنا" : "Join Our Team"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "نبحث عن محترفين موهوبين يشاركوننا شغفنا بالابتكار الصناعي والتميز الهندسي."
              : "We're looking for talented professionals who share our passion for industrial innovation and engineering excellence."}
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="pb-20 md:pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : selected ? (
            /* Detail View */
            <div className="scroll-reveal">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                {isAr ? "العودة إلى الوظائف" : "Back to all positions"}
              </button>

              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      {isAr ? selected.title_ar : selected.title_en}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {isAr ? selected.department_ar : selected.department_en}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {isAr ? selected.location_ar : selected.location_en}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {isAr ? selected.type_ar : selected.type_en}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const el = document.querySelector("#contact");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
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
                  ? "لا تتوفر وظائف شاغرة في الوقت الحالي. يرجى التحقق لاحقاً أو إرسال سيرتك الذاتية عبر نموذج الاتصال."
                  : "There are no open positions at the moment. Please check back later or send your resume through our contact form."}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {departments.map((dept) => {
                const deptCareers = careers.filter(c =>
                  (isAr ? c.department_ar : c.department_en) === dept
                );
                return (
                  <div key={dept}>
                    <h2 className="text-sm font-semibold tracking-wide text-accent mb-4">
                      {dept}
                    </h2>
                    <div className="space-y-3">
                      {deptCareers.map((career) => (
                        <button
                          key={career.id}
                          onClick={() => setSelected(career)}
                          className="w-full text-start bg-card border border-border rounded-2xl p-5 md:p-6 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-base md:text-lg font-semibold text-foreground group-hover:text-accent transition-colors mb-2 truncate">
                                {isAr ? career.title_ar : career.title_en}
                              </h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {isAr ? career.location_ar : career.location_en}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {isAr ? career.type_ar : career.type_en}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0 rtl:rotate-180" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
  );
}
