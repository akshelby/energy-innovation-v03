import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowUpRight } from "lucide-react";

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string | null;
  category_key: string;
}

interface ProductItem {
  id: string;
  name_en: string;
  name_ar: string;
  category_key: string;
  parent_id: string | null;
  is_active: boolean;
  has_page: boolean;
  sort_order: number;
  image_url: string | null;
}

export default function SubProductsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const [product, setProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<(ProductItem & { pageActive?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    const fetchData = async () => {
      // Fetch the parent product
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!prod) {
        setLoading(false);
        return;
      }
      setProduct(prod as Product);

      // Fetch top-level product_items for this category
      if (prod.category_key) {
        const { data: itemsData } = await supabase
          .from("product_items")
          .select("*")
          .eq("category_key", prod.category_key)
          .is("parent_id", null)
          .eq("is_active", true)
          .order("sort_order");

        if (itemsData && itemsData.length > 0) {
          const itemIds = itemsData.map((i) => i.id);
          
          // Fetch pages first, then only their images
          const { data: pages } = await supabase
            .from("product_pages")
            .select("product_item_id, id")
            .in("product_item_id", itemIds)
            .eq("is_active", true);

          const pageIds = (pages || []).map((p) => p.id);
          const { data: allImgData } = pageIds.length > 0
            ? await supabase
                .from("product_page_images")
                .select("product_page_id, image_url, sort_order")
                .in("product_page_id", pageIds)
                .order("sort_order")
            : { data: [] as any[] };

          const pagesMap = new Map((pages || []).map((p) => [p.product_item_id, p.id]));

          // Build item_id -> first image map
          let imageMap = new Map<string, string>();
          if (pages && allImgData) {
            const pageIdSet = new Set(pages.map((p) => p.id));
            const pageToImg = new Map<string, string>();
            allImgData.forEach((img) => {
              if (pageIdSet.has(img.product_page_id) && !pageToImg.has(img.product_page_id)) {
                pageToImg.set(img.product_page_id, img.image_url);
              }
            });
            pages.forEach((p) => {
              const img = pageToImg.get(p.id);
              if (img) imageMap.set(p.product_item_id, img);
            });
          }

          setItems(
            itemsData.map((i) => ({
              ...i,
              pageActive: pagesMap.has(i.id),
              image_url: (i as any).image_url || imageMap.get(i.id) || null,
            })) as any
          );
        } else {
          setItems([]);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">
            {isAr ? "جاري التحميل..." : "Loading..."}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? "المنتج غير موجود" : "Product not found"}
          </h1>
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

  const productName = isAr ? product.name_ar : product.name_en;
  const productDesc = isAr ? product.description_ar : product.description_en;

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-20 md:pt-24 pb-10 md:pb-16 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground py-4 flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
            <button
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }, 300);
              }}
              className="hover:text-foreground transition-colors"
            >
              {isAr ? "المنتجات" : "Products"}
            </button>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
            <span className="text-foreground font-medium">{productName}</span>
          </nav>

          <div className="text-center mt-6 md:mt-10">
            <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-6">
              {productName}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {isAr ? "منتجاتنا" : "Our Products"}
            </h1>
            {productDesc && (
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{productDesc}</p>
            )}
          </div>
        </div>
      </section>

      {/* Sub-products Grid */}
      <section className="py-10 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {items.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const itemName = isAr ? item.name_ar : item.name_en;
                const hasDetailPage = item.has_page && item.pageActive;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (hasDetailPage) navigate(`/product/${item.id}`);
                    }}
                    className={`group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:border-destructive/30 hover:shadow-lg ${
                      hasDetailPage ? "cursor-pointer" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {item.image_url ? (
                        <>
                          <img
                            src={item.image_url}
                            alt={itemName}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading={items.indexOf(item) < 3 ? "eager" : "lazy"}
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <div className="hidden w-full h-full items-center justify-center absolute inset-0">
                            <span className="text-muted-foreground/40 text-4xl font-bold">
                              {itemName.charAt(0)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground/40 text-4xl font-bold">
                            {itemName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground mb-1.5 line-clamp-1">
                          {itemName}
                        </h3>
                        {hasDetailPage ? (
                          <span className="text-sm text-accent font-medium">
                            {isAr ? "عرض التفاصيل" : "View Details"} →
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {isAr ? "قريباً" : "Coming soon"}
                          </span>
                        )}
                      </div>
                      {hasDetailPage && (
                        <div className="w-9 h-9 rounded-full border border-border group-hover:border-destructive/30 group-hover:bg-destructive/10 flex items-center justify-center shrink-0 transition-all duration-300">
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors duration-300" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {isAr ? "لا توجد منتجات فرعية حالياً" : "No sub-products available yet"}
              </p>
            </div>
          )}
        </div>
      </section>

      <FloatingButtons />
      <Footer />
    </main>
  );
}
