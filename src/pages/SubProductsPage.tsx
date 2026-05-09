import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
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

interface DisplayItem extends ProductItem {
  pageActive?: boolean;
  hasChildren?: boolean;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function SubProductsPage() {
  const { productId, itemId } = useParams<{ productId?: string; itemId?: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const [product, setProduct] = useState<Product | null>(null);
  const [parentItem, setParentItem] = useState<ProductItem | null>(null);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isItemView = !!itemId;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId, itemId]);

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      if (isItemView) {
        // Viewing children of a product_item
        const { data: parent } = await supabase
          .from("product_items")
          .select("id,name_en,name_ar,category_key,parent_id,is_active,has_page,sort_order,image_url")
          .eq("id", itemId)
          .single();

        if (!parent) {
          setLoading(false);
          return;
        }
        setParentItem(parent as ProductItem);

        // Build breadcrumb by fetching ALL items in this category at once, then walk the tree in memory
        const { data: allCategoryItems } = await supabase
          .from("product_items")
          .select("id,name_en,name_ar,parent_id")
          .eq("category_key", parent.category_key);

        const itemMap = new Map((allCategoryItems || []).map((i) => [i.id, i]));
        const crumbs: BreadcrumbItem[] = [];
        let currentId = parent.parent_id;
        while (currentId) {
          const ancestor = itemMap.get(currentId);
          if (!ancestor) break;
          crumbs.unshift({
            label: isAr ? ancestor.name_ar : ancestor.name_en,
            path: `/products/item/${ancestor.id}`,
          });
          currentId = ancestor.parent_id;
        }

        // Find the root product for this category in parallel with children fetch
        const [rootProdResult] = await Promise.all([
          supabase.from("products").select("id,name_en,name_ar,description_en,description_ar,image_url,category_key").eq("category_key", parent.category_key).single(),
          fetchChildren(parent.category_key, parent.id),
        ]);
        const rootProd = rootProdResult.data;
        if (rootProd) {
          setProduct(rootProd as Product);
          crumbs.unshift({
            label: isAr ? rootProd.name_ar : rootProd.name_en,
            path: `/products/${rootProd.id}`,
          });
        }
        setBreadcrumbs(crumbs);
      } else if (productId) {
        // Viewing top-level items for a product category
        const { data: prod } = await supabase
          .from("products")
          .select("id,name_en,name_ar,description_en,description_ar,image_url,category_key")
          .eq("id", productId)
          .single();

        if (!prod) {
          setLoading(false);
          return;
        }
        setProduct(prod as Product);
        setParentItem(null);
        setBreadcrumbs([]);

        if (!prod.category_key) {
          setItems([]);
          setLoading(false);
          return;
        }

        const hasTopLevelItems = await fetchChildren(prod.category_key, null);
        if (!hasTopLevelItems) {
          const productName = prod.name_en?.trim();
          if (productName) {
            const { data: matchingRootItems } = await supabase
              .from("product_items")
              .select("id")
              .eq("is_active", true)
              .is("parent_id", null)
              .ilike("name_en", productName)
              .limit(1);

            const matchingRootItem = matchingRootItems?.[0];
            if (matchingRootItem) {
              navigate(`/products/item/${matchingRootItem.id}`, { replace: true });
              return;
            }
          }
        }
      }
    };

    const fetchChildren = async (categoryKey: string, parentId: string | null) => {
      let query = supabase
        .from("product_items")
        .select("id,name_en,name_ar,category_key,parent_id,is_active,has_page,sort_order,image_url")
        .eq("is_active", true)
        .order("sort_order");

      if (parentId) {
        // Fetch by parent_id only — don't filter by category_key
        // because deep children may not have category_key set
        query = query.eq("parent_id", parentId);
      } else {
        // Top-level items — use category_key + parent_id IS NULL
        query = query.eq("category_key", categoryKey).is("parent_id", null);
      }

      const [{ data: itemsData }, { data: pages }] = await Promise.all([
        query,
        supabase.from("product_pages").select("product_item_id,id").eq("is_active", true),
      ]);

      if (!itemsData || itemsData.length === 0) {
        setItems([]);
        setLoading(false);
        return false;
      }

      const itemIds = itemsData.map((i) => i.id);

      // Check which items have children
      const { data: childCounts } = await supabase
        .from("product_items")
        .select("parent_id")
        .in("parent_id", itemIds);

      const parentIdsWithChildren = new Set((childCounts || []).map((c) => c.parent_id));

      const itemIdSet = new Set(itemIds);
      const relevantPages = (pages || []).filter((p) => itemIdSet.has(p.product_item_id));
      const pagesMap = new Map(relevantPages.map((p) => [p.product_item_id, p.id]));

      // Fetch images
      let imageMap = new Map<string, string>();
      const pageIds = relevantPages.map((p) => p.id);
      if (pageIds.length > 0) {
        const { data: allImgData } = await supabase
          .from("product_page_images")
          .select("product_page_id,image_url,sort_order")
          .in("product_page_id", pageIds)
          .order("sort_order");

        if (allImgData) {
          const pageToImg = new Map<string, string>();
          allImgData.forEach((img) => {
            if (!pageToImg.has(img.product_page_id)) {
              pageToImg.set(img.product_page_id, img.image_url);
            }
          });
          relevantPages.forEach((p) => {
            const img = pageToImg.get(p.id);
            if (img) imageMap.set(p.product_item_id, img);
          });
        }
      }

      setItems(
        itemsData.map((i) => ({
          ...i,
          pageActive: pagesMap.has(i.id),
          hasChildren: parentIdsWithChildren.has(i.id),
          image_url: i.image_url || imageMap.get(i.id) || null,
        })) as DisplayItem[]
      );
      setLoading(false);
      return true;
    };

    fetchData();
  }, [productId, itemId, isAr]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-20 md:pt-24 pb-10 md:pb-16 px-6 md:px-12 lg:px-20 bg-secondary/30">
          <div className="w-full mx-auto">
            <div className="h-4 w-48 bg-muted animate-pulse rounded mt-4" />
            <div className="text-center mt-10">
              <div className="h-12 w-56 bg-muted animate-pulse rounded-full mx-auto mb-6" />
              <div className="h-10 w-64 bg-muted animate-pulse rounded mx-auto mb-4" />
            </div>
          </div>
        </section>
        <section className="py-6 md:py-10 px-6 md:px-12 lg:px-20">
          <div className="w-full mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-5 space-y-2">
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (!product && !parentItem) {
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

  const displayName = isItemView && parentItem
    ? (isAr ? parentItem.name_ar : parentItem.name_en)
    : product
      ? (isAr ? product.name_ar : product.name_en)
      : "";
  const displayDesc = !isItemView && product
    ? (isAr ? product.description_ar : product.description_en)
    : "";
  const seoName = isItemView && parentItem ? parentItem.name_en : product?.name_en || "";
  const seoDesc = product?.description_en || "";
  const seoImage = product?.image_url || undefined;
  const seoPath = isItemView ? `/products/item/${itemId}` : `/products/${productId}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": seoName,
    "description": seoDesc,
    "brand": { "@type": "Brand", "name": "Energy Innovation" },
    "url": `https://energyinnvo.com${seoPath}`,
    ...(seoImage ? { "image": seoImage } : {}),
  };

  return (
    <main className="min-h-screen">
      <SEOHead
        title={seoName}
        description={`${seoDesc.slice(0, 150)} — Energy Innovation`}
        path={seoPath}
        image={seoImage}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* Hero */}
      <section className="pt-20 md:pt-24 pb-10 md:pb-16 px-6 md:px-12 lg:px-20 bg-secondary/30">
        <div className="w-full mx-auto">
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
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
            <span className="text-foreground font-medium">{displayName}</span>
          </nav>

          <div className="text-center mt-6 md:mt-10">
            <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-6">
              {displayName}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {isAr ? "منتجاتنا" : "Our Products"}
            </h1>
            {displayDesc && (
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{displayDesc}</p>
            )}
          </div>
        </div>
      </section>

      {/* Sub-products Grid */}
      <section className="py-6 md:py-10 px-6 md:px-12 lg:px-20">
        <div className="w-full mx-auto">
          {items.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const itemName = isAr ? item.name_ar : item.name_en;
                // Containers (items with children) take precedence over detail pages,
                // matching the click handler and header navigation behavior.
                const isContainer = item.hasChildren;
                const hasDetailPage = !isContainer && item.pageActive === true;
                const isClickable = isContainer || hasDetailPage;
                const href = isContainer
                  ? `/products/item/${item.id}`
                  : hasDetailPage
                    ? `/product/${item.id}`
                    : null;
                const handleClick = (e: React.MouseEvent) => {
                  if (!href) return;
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as any).button === 1) return;
                  e.preventDefault();
                  navigate(href);
                };
                const cls = `group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:border-destructive/30 hover:shadow-lg ${
                  isClickable ? "cursor-pointer" : ""
                }`;
                const Wrapper: any = href ? "a" : "div";
                const wrapperProps: any = href
                  ? { href, onClick: handleClick, className: cls + " no-underline text-inherit block" }
                  : { className: cls };

                return (
                  <Wrapper key={item.id} {...wrapperProps}>
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
                        ) : isContainer ? (
                          <span className="text-sm text-accent font-medium">
                            {isAr ? "عرض المنتجات" : "View Products"} →
                          </span>
                        ) : null}
                      </div>
                      {isClickable && (
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
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                {isAr ? "قريباً" : "Coming Soon"}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {isAr
                  ? "نعمل على إضافة المنتجات لهذا القسم. يرجى التواصل معنا للاستفسار."
                  : "We're working on adding products to this section. Contact us for enquiries."}
              </p>
              <a
                href="/#contact"
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {isAr ? "تواصل معنا" : "Contact Us"}
              </a>
            </div>
          )}
        </div>
      </section>

      <FloatingButtons />
      <Footer />
    </main>
  );
}
