import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, RefreshCw, Upload, Languages, ChevronRight, ChevronDown,
  Package, FileImage, GripVertical, FileText, ToggleRight,
} from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/admin-api`;

async function apiCall(path: string, method: string, password: string, body?: unknown) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY,
  };
  if (password) headers["x-admin-password"] = password;
  const res = await fetch(`${FUNCTION_URL}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const TRANSLATE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/translate`;
async function translateTexts(texts: Record<string, string>): Promise<Record<string, string>> {
  const nonEmpty = Object.fromEntries(Object.entries(texts).filter(([_, v]) => v && v.trim()));
  if (Object.keys(nonEmpty).length === 0) return {};
  const res = await fetch(TRANSLATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ texts: nonEmpty }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Translation failed");
  return data.translations;
}

async function uploadFileAndGetUrl(file: File, bucket: string, folder: string, password: string): Promise<string> {
  const { convertToWebP } = await import("@/lib/image-utils");
  const optimized = await convertToWebP(file);
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(optimized);
  });
  const filePath = folder ? `${folder}/${optimized.name}` : optimized.name;
  const result = await apiCall("upload", "POST", password, { bucket, filePath, base64, contentType: optimized.type });
  return result.url;
}

// ─── Types ─────────────────────────────────────────────
interface Product {
  id?: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  tag_en: string;
  tag_ar: string;
  image_url: string | null;
  pdf_url: string | null;
  icon: string;
  sort_order: number;
  category_key: string | null;
  show_on_homepage?: boolean;
  homepage_sort_order?: number;
  linked_item_id?: string | null;
}

interface ProductItemNode {
  id: string;
  name_en: string;
  name_ar: string;
  category_key: string;
  parent_id: string | null;
  is_active: boolean;
  has_page: boolean;
  sort_order: number;
  image_url: string | null;
  pdf_url: string | null;
  show_on_homepage?: boolean;
  homepage_sort_order?: number;
  open_in_new_tab?: boolean;
}

interface ProductPage {
  id?: string;
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
  product_page_id: string;
  image_url: string;
  sort_order: number;
}

interface Props {
  password: string;
  isViewer: boolean;
}

export default function ProductTreeEditor({ password, isViewer }: Props) {
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [allItems, setAllItems] = useState<ProductItemNode[]>([]);
  const [allPages, setAllPages] = useState<(ProductPage & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Which product card is expanded
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  // Which tree nodes are expanded (item IDs)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Editing states
  const [editingItem, setEditingItem] = useState<Partial<ProductItemNode> | null>(null);
  const [editingPage, setEditingPage] = useState<ProductPage | null>(null);
  const [pageImages, setPageImages] = useState<PageImage[]>([]);

  const itemImgRef = useRef<HTMLInputElement>(null);
  const itemPdfRef = useRef<HTMLInputElement>(null);
  const pageImageRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((editingItem || editingPage) && editorRef.current) {
      setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [editingItem, editingPage]);

  // ─── Data Fetching ──────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, items, pages] = await Promise.all([
        apiCall("products", "GET", password),
        apiCall("product-items", "GET", password),
        apiCall("product-pages", "GET", password),
      ]);
      setProducts(prods);
      setAllItems(items);
      setAllPages(pages);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchPageImages = useCallback(async (pageId: string) => {
    try {
      const data = await apiCall(`product-page-images?page_id=${pageId}`, "GET", password);
      setPageImages(data);
    } catch (e: any) { toast.error(e.message); }
  }, [password]);

  // ─── Tree helpers ─────────────────────────────────
  const getItemsForProduct = (product: Product & { id: string }) => {
    // If product is explicitly linked to an item, surface that item as the root of the tree
    if (product.linked_item_id) {
      const linked = allItems.find(i => i.id === product.linked_item_id);
      return linked ? [linked] : [];
    }
    if (!product.category_key) return [];
    return allItems.filter(i => i.category_key === product.category_key && !i.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const getChildren = (parentId: string) =>
    allItems.filter(i => i.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  const getPageForItem = (itemId: string) =>
    allPages.find(p => p.product_item_id === itemId && p.is_active);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── CRUD: Product Items ──────────────────────────
  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      setLoading(true);
      let item = { ...editingItem };
      if (item.name_en && !item.name_ar) {
        try {
          const result = await translateTexts({ name_en: item.name_en });
          item.name_ar = result.name_ar || "";
        } catch { /* proceed */ }
      }
      await apiCall("product-items", "POST", password, item);
      toast.success("Item saved");
      setEditingItem(null);
      await fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteItem = async (id: string) => {
    const children = getChildren(id);
    if (children.length > 0) {
      toast.error(`Cannot delete: has ${children.length} child items. Delete children first.`);
      return;
    }
    try {
      await apiCall("product-items", "DELETE", password, { id });
      toast.success("Item deleted");
      await fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleItemActive = async (item: ProductItemNode) => {
    try {
      await apiCall("product-items", "POST", password, { ...item, is_active: !item.is_active });
      setAllItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i));
      toast.success(`Item ${!item.is_active ? "activated" : "deactivated"}`);
    } catch (e: any) { toast.error(e.message); }
  };

  // Toggle "show on homepage" directly on a top-level Product card
  const handleToggleProductHomepage = async (product: Product & { id: string }) => {
    try {
      const next = !product.show_on_homepage;
      await apiCall("products", "POST", password, { ...product, show_on_homepage: next });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, show_on_homepage: next } : p));
      toast.success(next ? "Shown on homepage" : "Hidden from homepage");
    } catch (e: any) { toast.error(e.message); }
  };

  // Bulk activate all items at a given level
  const handleActivateAll = async (items: ProductItemNode[]) => {
    const inactive = items.filter(i => !i.is_active);
    if (inactive.length === 0) {
      toast.info("All items are already active");
      return;
    }
    try {
      setLoading(true);
      await Promise.all(inactive.map(i => apiCall("product-items", "POST", password, { ...i, is_active: true })));
      setAllItems(prev => prev.map(i => inactive.some(x => x.id === i.id) ? { ...i, is_active: true } : i));
      toast.success(`${inactive.length} item${inactive.length > 1 ? "s" : ""} activated`);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // ─── CRUD: Product Pages ──────────────────────────
  const handleSavePage = async () => {
    if (!editingPage) return;
    try {
      setLoading(true);
      let page = { ...editingPage };
      if (page.headline_en && !page.headline_ar) {
        try {
          const result = await translateTexts({
            headline_en: page.headline_en,
            description_en: page.description_en,
            sub_description_en: page.sub_description_en,
          });
          page.headline_ar = result.headline_ar || "";
          page.description_ar = result.description_ar || "";
          page.sub_description_ar = result.sub_description_ar || "";
        } catch { /* proceed */ }
      }
      const saved = await apiCall("product-pages", "POST", password, page);
      // Keep has_page in sync — item row must reflect that a page exists
      const targetItem = allItems.find(i => i.id === page.product_item_id);
      if (targetItem && !targetItem.has_page) {
        await apiCall("product-items", "POST", password, { ...targetItem, has_page: true });
      }
      toast.success("Product page saved");
      if (!editingPage.id && saved.id) {
        setEditingPage({ ...page, id: saved.id } as any);
        fetchPageImages(saved.id);
      } else {
        setEditingPage(null);
      }
      await fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeletePage = async (pageId: string) => {
    try {
      const pageToDelete = allPages.find(p => (p as any).id === pageId);
      await apiCall("product-pages", "DELETE", password, { id: pageId });
      // Sync has_page flag back to false on the item
      if (pageToDelete) {
        const targetItem = allItems.find(i => i.id === pageToDelete.product_item_id);
        if (targetItem) {
          await apiCall("product-items", "POST", password, { ...targetItem, has_page: false });
        }
      }
      toast.success("Product page deleted");
      await fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  // ─── Render: Item Editor ──────────────────────────
  const renderItemEditor = () => {
    if (!editingItem) return null;
    return (
      <div ref={editorRef} className="bg-card border-2 border-accent/30 rounded-2xl p-5 space-y-4 my-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">
            {editingItem.id ? "✏️ Edit" : "➕ New"} Sub-Product
            {editingItem.parent_id && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                (under {allItems.find(m => m.id === editingItem.parent_id)?.name_en || "parent"})
              </span>
            )}
          </h3>
          <Button
            variant="outline" size="sm"
            disabled={translating || !editingItem.name_en}
            onClick={async () => {
              try {
                setTranslating(true);
                const result = await translateTexts({ name_en: editingItem.name_en || "" });
                setEditingItem({ ...editingItem, name_ar: result.name_ar || editingItem.name_ar });
                toast.success("Arabic translation generated");
              } catch (e: any) { toast.error(e.message); }
              finally { setTranslating(false); }
            }}
            className="rounded-xl"
          >
            <Languages className="w-4 h-4 mr-2" />
            {translating ? "..." : "Auto Translate"}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (EN) *</label>
            <Input value={editingItem.name_en || ""} onChange={(e) => setEditingItem({ ...editingItem, name_en: e.target.value })} placeholder="e.g. Fire Curtains" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (AR) — auto-generated</label>
            <Input value={editingItem.name_ar || ""} onChange={(e) => setEditingItem({ ...editingItem, name_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cover Image</label>
            <div className="flex items-center gap-2">
              <Input value={editingItem.image_url || ""} onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value || null })} placeholder="Image URL or upload" className="rounded-xl flex-1" />
              <input ref={itemImgRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploading(true);
                    uploadFileAndGetUrl(file, "images", "product-items", password)
                      .then(url => setEditingItem(prev => prev ? { ...prev, image_url: url } : prev))
                      .catch(err => toast.error(err.message))
                      .finally(() => setUploading(false));
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={() => itemImgRef.current?.click()} disabled={uploading} className="rounded-xl shrink-0">
                {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
            </div>
            {editingItem.image_url && (
              <img src={editingItem.image_url} alt="Preview" className="mt-2 w-20 h-14 object-cover rounded-lg border border-border" />
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">PDF Document</label>
            <div className="flex items-center gap-2">
              <Input value={editingItem.pdf_url || ""} onChange={(e) => setEditingItem({ ...editingItem, pdf_url: e.target.value || null })} placeholder="PDF URL or upload" className="rounded-xl flex-1" />
              <input ref={itemPdfRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploading(true);
                    uploadFileAndGetUrl(file, "pdfs", "", password)
                      .then(url => setEditingItem(prev => prev ? { ...prev, pdf_url: url } : prev))
                      .catch(err => toast.error(err.message))
                      .finally(() => setUploading(false));
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={() => itemPdfRef.current?.click()} disabled={uploading} className="rounded-xl shrink-0">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort Order (within tree)</label>
            <Input type="number" value={editingItem.sort_order ?? 0} onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Homepage Sort Order</label>
            <Input
              type="number"
              value={editingItem.homepage_sort_order ?? 0}
              onChange={(e) => setEditingItem({ ...editingItem, homepage_sort_order: parseInt(e.target.value) || 0 })}
              className="rounded-xl"
              disabled={!editingItem.show_on_homepage}
              placeholder="Lower = first"
            />
          </div>
        </div>

        {/* Show on homepage toggle */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-accent/30 bg-accent/5">
          <input
            id="show_on_homepage"
            type="checkbox"
            checked={!!editingItem.show_on_homepage}
            onChange={(e) => setEditingItem({ ...editingItem, show_on_homepage: e.target.checked })}
            className="w-4 h-4 mt-0.5 accent-primary cursor-pointer"
          />
          <label htmlFor="show_on_homepage" className="cursor-pointer flex-1">
            <span className="text-sm font-semibold text-foreground">⭐ Show on homepage</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              When on, this item appears as a card in the homepage Products section. Clicking it drills into its sub-products (or opens its product page if it's a final item).
            </p>
          </label>
        </div>

        {/* Open-in-new-tab is now controlled globally in Branding → "Open product links in new tab" */}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSaveItem} disabled={loading || !editingItem.name_en} className="gradient-accent text-accent-foreground rounded-xl border-0">
            <Save className="w-4 h-4 mr-2" />Save
          </Button>
          <Button variant="outline" onClick={() => setEditingItem(null)} className="rounded-xl">Cancel</Button>
        </div>
      </div>
    );
  };

  // ─── Render: Page Editor ──────────────────────────
  const renderPageEditor = () => {
    if (!editingPage) return null;
    return (
      <div ref={editorRef} className="bg-card border-2 border-primary/30 rounded-2xl p-5 space-y-4 my-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">
            📄 {editingPage.id ? "Edit" : "New"} Product Page
          </h3>
          <Button
            variant="outline" size="sm"
            disabled={translating || !editingPage.headline_en}
            onClick={async () => {
              try {
                setTranslating(true);
                const result = await translateTexts({
                  headline_en: editingPage.headline_en,
                  description_en: editingPage.description_en,
                  sub_description_en: editingPage.sub_description_en,
                });
                setEditingPage({
                  ...editingPage,
                  headline_ar: result.headline_ar || editingPage.headline_ar,
                  description_ar: result.description_ar || editingPage.description_ar,
                  sub_description_ar: result.sub_description_ar || editingPage.sub_description_ar,
                });
                toast.success("Arabic translations generated");
              } catch (e: any) { toast.error(e.message); }
              finally { setTranslating(false); }
            }}
            className="rounded-xl"
          >
            <Languages className="w-4 h-4 mr-2" />
            {translating ? "..." : "Auto Translate"}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Headline (EN)</label>
            <Input value={editingPage.headline_en} onChange={(e) => setEditingPage({ ...editingPage, headline_en: e.target.value })} placeholder="Product headline" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Headline (AR)</label>
            <Input value={editingPage.headline_ar} onChange={(e) => setEditingPage({ ...editingPage, headline_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (EN)</label>
            <Textarea value={editingPage.description_en} onChange={(e) => setEditingPage({ ...editingPage, description_en: e.target.value })} rows={3} className="rounded-xl resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (AR)</label>
            <Textarea value={editingPage.description_ar} onChange={(e) => setEditingPage({ ...editingPage, description_ar: e.target.value })} rows={3} className="rounded-xl resize-none bg-muted/50" dir="rtl" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sub Description (EN)</label>
            <Textarea value={editingPage.sub_description_en} onChange={(e) => setEditingPage({ ...editingPage, sub_description_en: e.target.value })} rows={2} className="rounded-xl resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sub Description (AR)</label>
            <Textarea value={editingPage.sub_description_ar} onChange={(e) => setEditingPage({ ...editingPage, sub_description_ar: e.target.value })} rows={2} className="rounded-xl resize-none bg-muted/50" dir="rtl" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={editingPage.is_active} onChange={(e) => setEditingPage({ ...editingPage, is_active: e.target.checked })} className="rounded" />
          <span className="text-sm text-foreground">Active</span>
        </label>

        {/* Gallery Images */}
        {(editingPage as any).id && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Gallery Images (up to 4)</h4>
              <div>
                <input
                  ref={pageImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !(editingPage as any).id) return;
                    try {
                      setUploading(true);
                      const url = await uploadFileAndGetUrl(file, "images", "product-pages", password);
                      await apiCall("product-page-images", "POST", password, {
                        product_page_id: (editingPage as any).id,
                        image_url: url,
                        sort_order: pageImages.length,
                      });
                      toast.success("Image added");
                      fetchPageImages((editingPage as any).id);
                    } catch (err: any) { toast.error(err.message); }
                    finally { setUploading(false); }
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => pageImageRef.current?.click()} disabled={uploading || pageImages.length >= 4} className="rounded-xl">
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="ml-1">Add Image</span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {pageImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.image_url} alt="" className="w-full aspect-square object-cover rounded-xl border border-border" />
                  <button
                    onClick={async () => {
                      try {
                        await apiCall("product-page-images", "DELETE", password, { id: img.id });
                        setPageImages(prev => prev.filter(i => i.id !== img.id));
                        toast.success("Image removed");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {pageImages.length === 0 && (
                <p className="col-span-4 text-sm text-muted-foreground py-4 text-center">No images yet. Upload up to 4 gallery images.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSavePage} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
            <Save className="w-4 h-4 mr-2" />Save
          </Button>
          <Button variant="outline" onClick={() => setEditingPage(null)} className="rounded-xl">Cancel</Button>
        </div>
      </div>
    );
  };

  // ─── Render: Tree Node (recursive) ────────────────
  const renderTreeNode = (item: ProductItemNode, depth: number, categoryKey: string): React.ReactNode => {
    const children = getChildren(item.id);
    const hasChildren = children.length > 0;
    const page = getPageForItem(item.id);
    const isExpanded = expandedNodes.has(item.id);
    const isEditingThisItem = editingItem?.id === item.id;
    const isAddingChildHere = !editingItem?.id && editingItem?.parent_id === item.id;
    const isAddingPageHere = editingPage && !editingPage.id && editingPage.product_item_id === item.id;
    const isEditingPageHere = editingPage?.id && page?.id === (editingPage as any).id;

    return (
      <div key={item.id} className="mt-1.5">
        {/* Node row */}
        {!isEditingThisItem && (
          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border transition-colors ${
              depth === 0 ? "bg-card border-border" : "bg-secondary/30 border-border/50"
            } ${!item.is_active ? "opacity-60" : ""}`}
            style={{ marginLeft: `${depth * (window.innerWidth < 640 ? 10 : 20)}px` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
              {/* Expand toggle */}
              <button
                onClick={() => toggleNode(item.id)}
                className="w-5 h-5 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {(hasChildren || page) ? (
                  isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-3.5" />
                )}
              </button>

              {depth > 0 && <span className="text-muted-foreground text-xs select-none">└</span>}

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm break-words ${depth === 0 ? "font-bold" : "font-medium"} ${item.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {item.name_en}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">/ {item.name_ar}</span>
                  {item.pdf_url && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">PDF</span>}
                  {hasChildren && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{children.length}</span>}
                  {page && <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">📄</span>}
                  {item.image_url && <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">IMG</span>}
                  {item.show_on_homepage && <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium" title="Featured on homepage">⭐ Home</span>}
                  {!item.is_active && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">Inactive</span>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 items-center flex-wrap sm:flex-nowrap sm:shrink-0 w-full sm:w-auto justify-end pl-7 sm:pl-0">
              {/* Active toggle */}
              <label className="flex items-center gap-1 cursor-pointer mr-1" title={item.is_active ? "Deactivate" : "Activate"}>
                <span className="text-[10px] text-muted-foreground">{item.is_active ? "On" : "Off"}</span>
                <input type="checkbox" checked={item.is_active} onChange={() => handleToggleItemActive(item)} className="w-3.5 h-3.5 accent-primary" />
              </label>

              {hasChildren && children.some(child => !child.is_active) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActivateAll(children)}
                  disabled={loading}
                  className="rounded-xl text-xs h-7 px-2"
                  title="Activate all children"
                >
                  <ToggleRight className="w-3 h-3 mr-1" />
                  Activate All
                </Button>
              )}

              {/* Add sub-product */}
              <Button
                variant="outline" size="sm"
                onClick={() => {
                  setEditingPage(null);
                  setEditingItem({
                    category_key: categoryKey,
                    parent_id: item.id,
                    name_en: "", name_ar: "",
                    is_active: true, has_page: false,
                    sort_order: children.length,
                    image_url: null, pdf_url: null,
                  });
                  if (!isExpanded) toggleNode(item.id);
                }}
                className="rounded-xl text-xs h-7 px-2"
                title="Add sub-product"
              >
                <Plus className="w-3 h-3" />
              </Button>

              {/* Add/Edit product page */}
              {page ? (
                <Button
                  variant="outline" size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setEditingPage(page as any);
                    fetchPageImages((page as any).id);
                    if (!isExpanded) toggleNode(item.id);
                  }}
                  className="rounded-xl text-xs h-7 px-2"
                  title="Edit product page"
                >
                  <FileImage className="w-3 h-3" />
                </Button>
              ) : (
                <Button
                  variant="outline" size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setEditingPage({
                      product_item_id: item.id,
                      headline_en: item.name_en,
                      headline_ar: item.name_ar,
                      description_en: "", description_ar: "",
                      sub_description_en: "", sub_description_ar: "",
                      is_active: true,
                    });
                    if (!isExpanded) toggleNode(item.id);
                  }}
                  className="rounded-xl text-xs h-7 px-2 text-primary"
                  title="Create product page"
                >
                  <FileImage className="w-3 h-3" />
                </Button>
              )}

              {/* Edit item */}
              <Button variant="outline" size="sm" onClick={() => { setEditingPage(null); setEditingItem({ ...item }); }} className="rounded-xl text-xs h-7">Edit</Button>

              {/* Delete */}
              <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Inline item editor */}
        {isEditingThisItem && (
          <div style={{ marginLeft: `${depth * 20}px` }}>
            {renderItemEditor()}
          </div>
        )}

        {/* Expanded children & editors */}
        {isExpanded && (
          <>
            {/* Page editor (when editing existing page for this item) */}
            {isEditingPageHere && (
              <div style={{ marginLeft: `${(depth + 1) * 20}px` }}>
                {renderPageEditor()}
              </div>
            )}

            {/* Existing page display (if not editing it) */}
            {page && !isEditingPageHere && (
              <div
                className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 mt-1.5"
                style={{ marginLeft: `${(depth + 1) * 20}px` }}
              >
                <FileImage className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground flex-1">{(page as any).headline_en || "Product Page"}</span>
                <Button variant="outline" size="sm" onClick={() => { setEditingItem(null); setEditingPage(page as any); fetchPageImages((page as any).id); }} className="rounded-xl text-xs h-7">Edit Page</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeletePage((page as any).id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && children.some(c => !c.is_active) && (
              <div className="mt-1.5" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleActivateAll(children)}
                  disabled={loading}
                  className="rounded-xl text-xs h-7 px-2 mb-1"
                >
                  <ToggleRight className="w-3 h-3 mr-1" />Activate All ({children.filter(c => !c.is_active).length})
                </Button>
              </div>
            )}
            {children.map(child => renderTreeNode(child, depth + 1, categoryKey))}

            {/* New child editor */}
            {isAddingChildHere && (
              <div style={{ marginLeft: `${(depth + 1) * 20}px` }}>
                {renderItemEditor()}
              </div>
            )}

            {/* New page editor */}
            {isAddingPageHere && (
              <div style={{ marginLeft: `${(depth + 1) * 20}px` }}>
                {renderPageEditor()}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ─── Render: Product Card (root level) ────────────
  const renderProductCard = (product: Product & { id: string }) => {
    const isExpanded = expandedProductId === product.id;
    const topLevelItems = getItemsForProduct(product);
    const isAddingTopLevel = editingItem && !editingItem.id && !editingItem.parent_id && editingItem.category_key === product.category_key;

    return (
      <div key={product.id} className="border border-border rounded-2xl overflow-hidden bg-card">
        {/* Product header */}
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
        >
          {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}

          {product.image_url ? (
            <img src={product.image_url} alt={product.name_en} className="w-16 h-12 object-cover rounded-lg border border-border shrink-0" />
          ) : (
            <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-muted-foreground/40" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{product.name_en || "Untitled"}</h3>
              {product.tag_en && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full shrink-0">{product.tag_en}</span>}
              {product.category_key && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {topLevelItems.length} sub-product{topLevelItems.length !== 1 ? "s" : ""}
                </span>
              )}
              {product.show_on_homepage && (
                <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium" title="Featured on homepage">⭐ Home</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{product.description_en || "No description"}</p>
          </div>

          {/* Show on homepage toggle (root product) */}
          <label
            className="flex items-center gap-1.5 shrink-0 cursor-pointer pl-2 pr-1"
            onClick={(e) => e.stopPropagation()}
            title={product.show_on_homepage ? "Hide from homepage" : "Show on homepage"}
          >
            <span className="text-[11px] text-muted-foreground hidden sm:inline">⭐ Home</span>
            <input
              type="checkbox"
              checked={!!product.show_on_homepage}
              onChange={() => handleToggleProductHomepage(product)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </label>
        </div>

        {/* Expanded tree */}
        {isExpanded && product.category_key && (
          <div className="border-t border-border px-4 py-4 bg-secondary/10">
            {/* Action bar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                Manage sub-products for <strong>{product.name_en}</strong>. At each level, add more sub-products or create a product page.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingPage(null);
                  setEditingItem({
                    category_key: product.category_key!,
                    parent_id: null,
                    name_en: "", name_ar: "",
                    is_active: true, has_page: false,
                    sort_order: topLevelItems.length,
                    image_url: null, pdf_url: null,
                  });
                }}
                className="gradient-accent text-accent-foreground rounded-xl border-0 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />Add Sub-Product
              </Button>
            </div>

            {/* Top-level activate all */}
            {topLevelItems.length > 0 && topLevelItems.some(i => !i.is_active) && (
              <div className="mb-1.5">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleActivateAll(topLevelItems)}
                  disabled={loading}
                  className="rounded-xl text-xs h-7 px-2"
                >
                  <ToggleRight className="w-3 h-3 mr-1" />Activate All ({topLevelItems.filter(i => !i.is_active).length})
                </Button>
              </div>
            )}

            {/* Tree */}
            {topLevelItems.length === 0 && !isAddingTopLevel && (
              <p className="text-sm text-muted-foreground text-center py-6">No sub-products yet. Click "Add Sub-Product" to get started.</p>
            )}
            {topLevelItems.map(item => renderTreeNode(item, 0, product.category_key!))}

            {/* New top-level item editor */}
            {isAddingTopLevel && renderItemEditor()}
          </div>
        )}

        {isExpanded && !product.category_key && (
          <div className="border-t border-border px-4 py-6 bg-secondary/10 text-center">
            <p className="text-sm text-muted-foreground">
              This product has no category key. Edit it in the Products tab to assign a <code className="bg-muted px-1 rounded">category_key</code> for sub-product support.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────
  return (
    <div className={isViewer ? "viewer-readonly" : ""}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Product Tree</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Click a product to expand its sub-product tree. At each level, add sub-products or product pages.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="rounded-xl">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Homepage Items Summary */}
      {(() => {
        const homepageProducts = products
          .filter(p => p.show_on_homepage)
          .sort((a, b) => (a.homepage_sort_order ?? 0) - (b.homepage_sort_order ?? 0));
        const homepageItems = allItems
          .filter(i => i.show_on_homepage)
          .sort((a, b) => (a.homepage_sort_order ?? 0) - (b.homepage_sort_order ?? 0));

        const getItemPath = (item: ProductItemNode): string => {
          const parts: string[] = [item.name_en || "(untitled)"];
          let cur: ProductItemNode | undefined = item;
          while (cur?.parent_id) {
            const parent = allItems.find(x => x.id === cur!.parent_id);
            if (!parent) break;
            parts.unshift(parent.name_en || "(untitled)");
            cur = parent;
          }
          const rootProduct = products.find(p => p.category_key === item.category_key);
          if (rootProduct) parts.unshift(rootProduct.name_en || "(untitled)");
          return parts.join(" › ");
        };

        const total = homepageProducts.length + homepageItems.length;
        return (
          <div className="mb-6 border-2 border-amber-500/30 bg-amber-500/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⭐</span>
                <h3 className="text-sm font-semibold text-foreground">Homepage Items</h3>
                <span className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  {total}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">Currently visible on the homepage</span>
            </div>

            {total === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Nothing flagged for the homepage yet. Toggle ⭐ on a product card or check "Show on homepage" inside an item form.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {homepageProducts.map(p => (
                  <div key={`p-${p.id}`} className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">Root</span>
                        <span className="text-xs font-medium text-foreground truncate">{p.name_en || "(untitled)"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Order: {p.homepage_sort_order ?? 0}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-destructive hover:text-destructive"
                      onClick={() => handleToggleProductHomepage(p)}
                      disabled={isViewer}
                    >
                      Hide
                    </Button>
                  </div>
                ))}
                {homepageItems.map(i => (
                  <div key={`i-${i.id}`} className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">Item</span>
                        <span className="text-xs font-medium text-foreground truncate">{i.name_en || "(untitled)"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate" title={getItemPath(i)}>
                        {getItemPath(i)} · Order: {i.homepage_sort_order ?? 0}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-destructive hover:text-destructive"
                      onClick={async () => {
                        try {
                          await apiCall("product-items", "POST", password, { ...i, show_on_homepage: false });
                          setAllItems(prev => prev.map(x => x.id === i.id ? { ...x, show_on_homepage: false } : x));
                          toast.success("Hidden from homepage");
                        } catch (e: any) { toast.error(e.message); }
                      }}
                      disabled={isViewer}
                    >
                      Hide
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <div className="space-y-3">
        {products.map(renderProductCard)}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No products yet.</p>
        </div>
      )}
    </div>
  );
}
