import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { Send, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  requirement: z.string().trim().min(1, "Requirement is required").max(2000),
});

interface ProductItem {
  id: string;
  name_en: string;
  name_ar: string;
  category_key: string;
  parent_id: string | null;
  is_active: boolean;
  has_page: boolean;
}

interface ProductPage {
  id: string;
  product_item_id: string;
  headline_en: string;
  headline_ar: string;
  description_en: string;
  description_ar: string;
  sub_description_en: string;
  sub_description_ar: string;
  is_active: boolean;
}

interface PageImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export default function ProductPageView() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [item, setItem] = useState<ProductItem | null>(null);
  const [page, setPage] = useState<ProductPage | null>(null);
  const [images, setImages] = useState<PageImage[]>([]);
  const [children, setChildren] = useState<(ProductItem & { pageActive?: boolean })[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", requirement: "" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActiveImage(0);

    const fetchData = async () => {
      // Fetch product item
      const { data: itemData } = await supabase
        .from("product_items")
        .select("*")
        .eq("id", id)
        .single();
      if (!itemData) { setLoading(false); return; }
      setItem(itemData as ProductItem);

      // Fetch product page
      const { data: pageData } = await supabase
        .from("product_pages")
        .select("*")
        .eq("product_item_id", id)
        .eq("is_active", true)
        .single();
      setPage(pageData as ProductPage | null);

      // Fetch images
      if (pageData) {
        const { data: imgData } = await supabase
          .from("product_page_images")
          .select("*")
          .eq("product_page_id", pageData.id)
          .order("sort_order");
        setImages((imgData || []) as PageImage[]);
      }

      // Fetch children with pages
      const { data: childData } = await supabase
        .from("product_items")
        .select("*")
        .eq("parent_id", id)
        .eq("is_active", true)
        .order("sort_order");
      
      if (childData && childData.length > 0) {
        // Check which children have active pages
        const childIds = childData.map(c => c.id);
        const { data: childPages } = await supabase
          .from("product_pages")
          .select("product_item_id")
          .in("product_item_id", childIds)
          .eq("is_active", true);
        const pagesSet = new Set((childPages || []).map(p => p.product_item_id));
        setChildren(childData.map(c => ({ ...c, pageActive: pagesSet.has(c.id) })) as any);
      } else {
        setChildren([]);
      }

      // Build breadcrumb
      const crumbs: { id: string; name: string }[] = [];
      let current = itemData;
      while (current) {
        crumbs.unshift({ id: current.id, name: isAr ? current.name_ar : current.name_en });
        if (current.parent_id) {
          const { data: parent } = await supabase
            .from("product_items")
            .select("*")
            .eq("id", current.parent_id)
            .single();
          current = parent;
        } else {
          current = null;
        }
      }
      setBreadcrumb(crumbs);
      setLoading(false);
    };

    fetchData();
  }, [id, isAr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = enquirySchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Validation error");
      return;
    }
    setFormLoading(true);
    try {
      const productName = item ? (isAr ? item.name_ar : item.name_en) : "";
      const { error } = await supabase.from("product_enquiries").insert({
        product_item_id: id,
        product_name: productName,
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        requirement: parsed.data.requirement,
      } as any);
      if (error) throw error;

      // Send email notification (fire-and-forget)
      supabase.functions.invoke("send-notification-email", {
        body: {
          type: "enquiry",
          data: {
            product_name: productName,
            name: parsed.data.name,
            email: parsed.data.email,
            company: parsed.data.company || null,
            requirement: parsed.data.requirement,
          },
        },
      }).catch((err) => console.error("Email notification failed:", err));

      toast.success(isAr ? "تم إرسال الاستفسار بنجاح!" : "Enquiry submitted successfully!");
      setForm({ name: "", email: "", company: "", requirement: "" });
    } catch {
      toast.error(isAr ? "فشل في إرسال الاستفسار" : "Failed to submit enquiry");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h1 className="text-2xl font-bold text-foreground">{isAr ? "المنتج غير موجود" : "Product not found"}</h1>
          <Link to="/">
            <Button className="gradient-accent text-accent-foreground rounded-full border-0">
              {isAr ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const productName = isAr ? item.name_ar : item.name_en;
  const headline = page ? (isAr ? page.headline_ar : page.headline_en) : productName;
  const description = page ? (isAr ? page.description_ar : page.description_en) : "";
  const subDescription = page ? (isAr ? page.sub_description_ar : page.sub_description_en) : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": item.name_en,
    "description": page?.description_en || item.name_en,
    "brand": { "@type": "Brand", "name": "Energy Innovation" },
    "url": `https://energyinnvo.com/product/${id}`,
    ...(images[0]?.image_url ? { "image": images[0].image_url } : {}),
  };

  return (
    <main className="min-h-screen">
      <SEOHead
        title={item.name_en}
        description={`${(page?.description_en || item.name_en).slice(0, 150)} — Energy Innovation`}
        path={`/product/${id}`}
        image={images[0]?.image_url || undefined}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <section className="pt-20 md:pt-24 px-6 md:px-12 lg:px-20">
        <div className="w-full mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground py-4 flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
            <button onClick={() => {
              window.location.href = "/#products";
            }} className="hover:text-foreground transition-colors">
              {isAr ? "المنتجات" : "Products"}
            </button>
            {breadcrumb.map((crumb, idx) => (
              <span key={crumb.id} className="flex items-center gap-1.5">
                <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
                {idx === breadcrumb.length - 1 ? (
                  <span className="text-foreground font-medium">{crumb.name}</span>
                ) : (
                  <Link to={`/product/${crumb.id}`} className="hover:text-foreground transition-colors">
                    {crumb.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 py-6 md:py-10">
            {/* Image Gallery */}
            <div className="space-y-4">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border">
                    <img
                      src={images[activeImage]?.image_url}
                      alt={productName}
                      className="w-full h-full object-cover transition-all duration-500"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-sm text-background flex items-center justify-center hover:bg-foreground/40 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-sm text-background flex items-center justify-center hover:bg-foreground/40 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setActiveImage(idx)}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            idx === activeImage
                              ? "border-accent shadow-md"
                              : "border-border hover:border-accent/40"
                          }`}
                        >
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] rounded-2xl bg-muted border border-border flex items-center justify-center">
                  <span className="text-muted-foreground">{isAr ? "لا توجد صور" : "No images available"}</span>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="flex flex-col justify-center">
              <span className="inline-block px-6 py-2.5 text-sm font-bold tracking-wide text-white bg-accent rounded-full mb-4 w-fit">
                {isAr ? "منتج" : "Product"}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {headline}
              </h1>
              {description && (
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  {description}
                </p>
              )}
              {subDescription && (
                <p className="text-muted-foreground leading-relaxed">
                  {subDescription}
                </p>
              )}
              <Button
                onClick={() => document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth" })}
                className="gradient-accent text-accent-foreground rounded-full px-8 py-6 text-base font-semibold mt-6 w-fit border-0 hover:scale-[1.02] transition-transform"
              >
                <Send className="w-4 h-4" />
                {isAr ? "احصل على استفسار" : "Get Enquiry"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Child Products Section */}
      {children.length > 0 && (
        <section className="py-12 md:py-16 px-6 md:px-12 lg:px-20 bg-secondary/30">
          <div className="w-full mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              {isAr ? "المنتجات ذات الصلة" : "Related Products"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => {
                const childName = isAr ? child.name_ar : child.name_en;
                const hasPage = child.has_page && child.pageActive;
                return (
                  <div
                    key={child.id}
                    className="bg-card rounded-2xl border border-border p-6 hover:border-accent/20 transition-all duration-300 group"
                  >
                    <h3 className="text-lg font-bold text-foreground mb-3">{childName}</h3>
                    {hasPage ? (
                      <Link to={`/product/${child.id}`}>
                        <Button variant="outline" className="rounded-full group-hover:border-destructive/30 group-hover:text-destructive transition-colors">
                          {isAr ? "عرض التفاصيل" : "View Details"}
                          <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">{isAr ? "قريباً" : "Coming soon"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Enquiry Form Section */}
      <section id="enquiry-form" className="py-12 md:py-20 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
              {isAr ? "استفسار" : "Enquiry"}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isAr ? "هل أنت مهتم بهذا المنتج؟" : "Interested in this product?"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isAr
                ? "أرسل لنا استفسارك وسنتواصل معك في أقرب وقت"
                : "Send us your enquiry and we'll get back to you shortly"}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {isAr ? "الاسم" : "Name"} *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isAr ? "اسمك الكامل" : "Your full name"}
                  maxLength={100}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {isAr ? "البريد الإلكتروني" : "Email ID"} *
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={isAr ? "بريدك الإلكتروني" : "your@email.com"}
                  maxLength={255}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {isAr ? "اسم الشركة / المنظمة" : "Company / Organisation Name"}
              </label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder={isAr ? "اسم شركتك" : "Your company name"}
                maxLength={100}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {isAr ? "المتطلبات" : "Requirement"} *
              </label>
              <Textarea
                value={form.requirement}
                onChange={(e) => setForm({ ...form, requirement: e.target.value })}
                placeholder={isAr ? "صف متطلباتك بالتفصيل" : "Describe your requirements in detail"}
                maxLength={2000}
                required
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={formLoading}
              className="w-full gradient-accent text-accent-foreground rounded-full py-6 text-base font-semibold hover:scale-[1.02] transition-transform border-0"
            >
              <Send className="w-4 h-4" />
              {formLoading
                ? (isAr ? "جاري الإرسال..." : "Submitting...")
                : (isAr ? "احصل على استفسار" : "Get Enquiry")}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </main>
  );
}
