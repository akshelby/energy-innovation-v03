import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Lock, Trash2, Save, RefreshCw, Database, FileText, MessageSquare,
  LogOut, Image, Upload, Plus, Package, Briefcase, GripVertical, List, Palette,
} from "lucide-react";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import PhoneInput from "@/components/PhoneInput";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/admin-api`;
const STORAGE_BASE = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public`;

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
}

interface ContentItem {
  id: string;
  content_key: string;
  value_en: string;
  value_ar: string;
  updated_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  metadata?: { mimetype?: string; size?: number };
}

interface ProductItem {
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
}

interface ServiceItem {
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
}

interface MenuChildItem {
  id?: string;
  category_key: string;
  name_en: string;
  name_ar: string;
  pdf_url: string | null;
  sort_order: number;
}

const CATEGORY_OPTIONS = [
  { key: "cat.fire", label: "Fire & Smoke Safety Systems" },
  { key: "cat.roller", label: "Roller Shutters & Doors" },
  { key: "cat.oil", label: "Oil & Gas Industry Equipment" },
  { key: "cat.hvac", label: "HVAC & Ventilation Solutions" },
  { key: "cat.loading", label: "Loading Bay & Material Handling" },
];

const ICON_OPTIONS = [
  "Flame", "DoorOpen", "Droplets", "Wind", "Truck", "Shield",
  "PenTool", "Wrench", "Settings", "MessageSquare", "Zap", "Factory",
  "HardHat", "Gauge", "Cog", "Building",
];

const defaultContent: { content_key: string; value_en: string; value_ar: string }[] = [
  { content_key: "hero.headline", value_en: "Engineering Excellence for Modern Industry", value_ar: "التميز الهندسي للصناعة الحديثة" },
  { content_key: "hero.subtext", value_en: "Premium industrial solutions designed to optimize performance, safety, and sustainability across your operations.", value_ar: "حلول صناعية متميزة مصممة لتحسين الأداء والسلامة والاستدامة عبر عملياتك." },
  { content_key: "about.title", value_en: "Trusted Partner in Industrial Innovation", value_ar: "شريك موثوق في الابتكار الصناعي" },
  { content_key: "about.desc", value_en: "With decades of expertise in industrial technology, we deliver comprehensive solutions that drive efficiency, ensure safety, and promote sustainable operations.", value_ar: "مع عقود من الخبرة في التكنولوجيا الصناعية، نقدم حلولاً شاملة تعزز الكفاءة وتضمن السلامة وتعزز العمليات المستدامة." },
  { content_key: "products.title", value_en: "Comprehensive Industrial Solutions", value_ar: "حلول صناعية شاملة" },
  { content_key: "products.desc", value_en: "Explore our extensive range of industrial products designed to meet the demands of modern facilities.", value_ar: "اكتشف مجموعتنا الواسعة من المنتجات الصناعية المصممة لتلبية متطلبات المنشآت الحديثة." },
  { content_key: "services.title", value_en: "Expert Engineering Services", value_ar: "خدمات هندسية متخصصة" },
  { content_key: "services.desc", value_en: "We provide end-to-end industrial solutions from technical design to installation and ongoing support.", value_ar: "نقدم حلولاً صناعية شاملة من التصميم الفني إلى التركيب والدعم المستمر." },
  { content_key: "contact.title", value_en: "Let's Build Something Great", value_ar: "لنبني شيئاً رائعاً معاً" },
  { content_key: "contact.desc", value_en: "Ready to upgrade your industrial infrastructure? Send us a message and our team will respond within 24 hours.", value_ar: "هل أنت مستعد لتطوير بنيتك التحتية الصناعية؟ أرسل لنا رسالة وسيرد فريقنا خلال 24 ساعة." },
  { content_key: "contact_phone", value_en: "+966 XX XXX XXXX", value_ar: "+966 XX XXX XXXX" },
  { content_key: "contact_email", value_en: "info@energyinnvo.com", value_ar: "info@energyinnvo.com" },
  { content_key: "contact_address", value_en: "Riyadh, Saudi Arabia", value_ar: "الرياض، المملكة العربية السعودية" },
  { content_key: "footer.email", value_en: "info@energyinnovation.com", value_ar: "info@energyinnovation.com" },
  { content_key: "footer.phone", value_en: "+1 (555) 000-0000", value_ar: "+1 (555) 000-0000" },
  { content_key: "footer.address", value_en: "Industrial District, Building 7", value_ar: "المنطقة الصناعية، مبنى 7" },
];

const IMAGE_FOLDERS = [
  { label: "Hero Images", bucket: "images", folder: "hero" },
  { label: "Product Images", bucket: "images", folder: "products" },
  { label: "PDFs", bucket: "pdfs", folder: "" },
];

async function apiCall(path: string, method: string, password: string, body?: unknown) {
  const res = await fetch(`${FUNCTION_URL}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload a file and return the public URL
async function uploadFileAndGetUrl(
  file: File,
  bucket: string,
  folder: string,
  password: string
): Promise<string> {
  const base64 = await fileToBase64(file);
  const filePath = folder ? `${folder}/${file.name}` : file.name;
  const result = await apiCall("upload", "POST", password, {
    bucket,
    filePath,
    base64,
    contentType: file.type,
  });
  return result.url;
}

const emptyProduct: ProductItem = {
  name_en: "", name_ar: "", description_en: "", description_ar: "",
  tag_en: "", tag_ar: "", image_url: null, pdf_url: null, icon: "Flame", sort_order: 0,
};

const emptyService: ServiceItem = {
  name_en: "", name_ar: "", description_en: "", description_ar: "",
  tag_en: "", tag_ar: "", image_url: null, pdf_url: null, icon: "Wrench", sort_order: 0,
};

type TabKey = "leads" | "content" | "products" | "services" | "menu-items" | "images" | "branding";

const emptyMenuChild: MenuChildItem = {
  category_key: "cat.fire", name_en: "", name_ar: "", pdf_url: null, sort_order: 0,
};

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem("admin_pw") || "");
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem("admin_pw"));
  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, { value_en: string; value_ar: string }>>({});

  // Products & Services state
  const [products, setProducts] = useState<(ProductItem & { id: string })[]>([]);
  const [services, setServices] = useState<(ServiceItem & { id: string })[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Menu Items state
  const [menuItems, setMenuItems] = useState<(MenuChildItem & { id: string })[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuChildItem | null>(null);
  const menuItemPdfRef = useRef<HTMLInputElement>(null);

  // PDF preview
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  // Images state
  const [selectedFolder, setSelectedFolder] = useState(IMAGE_FOLDERS[0]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding state
  const [brandName, setBrandName] = useState("Energy Innovation");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const brandLogoRef = useRef<HTMLInputElement>(null);
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [floatingEmail, setFloatingEmail] = useState("");
  const [emailActive, setEmailActive] = useState(false);
  const productImageRef = useRef<HTMLInputElement>(null);
  const productPdfRef = useRef<HTMLInputElement>(null);
  const serviceImageRef = useRef<HTMLInputElement>(null);
  const servicePdfRef = useRef<HTMLInputElement>(null);

  const storedPassword = authenticated ? password : "";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("leads", "GET", storedPassword);
      setLeads(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("content", "GET", storedPassword);
      setContent(data);
      const edits: Record<string, { value_en: string; value_ar: string }> = {};
      data.forEach((item: ContentItem) => {
        edits[item.content_key] = { value_en: item.value_en, value_ar: item.value_ar };
      });
      setEditedContent(edits);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("products", "GET", storedPassword);
      setProducts(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("services", "GET", storedPassword);
      setServices(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("product-items", "GET", storedPassword);
      setMenuItems(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `files?bucket=${selectedFolder.bucket}&folder=${selectedFolder.folder}`,
        "GET",
        storedPassword
      );
      setFiles(data.filter((f: StorageFile) => f.name !== ".emptyFolderPlaceholder"));
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword, selectedFolder]);

  const fetchBranding = useCallback(async () => {
    // Load brand name + whatsapp from site_content
    try {
      const data = await apiCall("content", "GET", storedPassword);
      const brandEntry = data.find((d: ContentItem) => d.content_key === "brand.name");
      if (brandEntry) setBrandName(brandEntry.value_en);
      const waEntry = data.find((d: ContentItem) => d.content_key === "whatsapp_number");
      if (waEntry) setWhatsappNumber(waEntry.value_en);
      const waActive = data.find((d: ContentItem) => d.content_key === "whatsapp_active");
      setWhatsappActive(waActive?.value_en === "true");
      const emailEntry = data.find((d: ContentItem) => d.content_key === "floating_email");
      if (emailEntry) setFloatingEmail(emailEntry.value_en);
      const emActive = data.find((d: ContentItem) => d.content_key === "email_active");
      setEmailActive(emActive?.value_en === "true");
    } catch { /* ignore */ }
    const logoPublicUrl = `${STORAGE_BASE}/images/branding/logo`;
    try {
      const res = await fetch(logoPublicUrl, { method: "HEAD" });
      if (res.ok) setBrandLogoUrl(logoPublicUrl + "?t=" + Date.now());
      else setBrandLogoUrl("");
    } catch { setBrandLogoUrl(""); }
  }, [storedPassword]);

  useEffect(() => {
    if (authenticated) {
      if (activeTab === "leads") fetchLeads();
      else if (activeTab === "content") fetchContent();
      else if (activeTab === "products") fetchProducts();
      else if (activeTab === "services") fetchServices();
      else if (activeTab === "menu-items") fetchMenuItems();
      else if (activeTab === "branding") fetchBranding();
      else fetchFiles();
    }
  }, [authenticated, activeTab, fetchLeads, fetchContent, fetchProducts, fetchServices, fetchMenuItems, fetchFiles, fetchBranding]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall("leads", "GET", password);
      sessionStorage.setItem("admin_pw", password);
      setAuthenticated(true);
      toast.success("Logged in successfully");
    } catch { toast.error("Invalid password"); }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await apiCall("leads", "DELETE", storedPassword, { id });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveContent = async (key: string) => {
    const edited = editedContent[key];
    if (!edited) return;
    try {
      await apiCall("content", "POST", storedPassword, {
        content_key: key, value_en: edited.value_en, value_ar: edited.value_ar,
      });
      toast.success(`Saved "${key}"`);
      fetchContent();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSeedContent = async () => {
    try {
      setLoading(true);
      await apiCall("seed", "POST", storedPassword, { entries: defaultContent });
      toast.success("Content seeded successfully");
      fetchContent();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const updateEditedField = (key: string, field: "value_en" | "value_ar", value: string) => {
    setEditedContent((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Products CRUD
  const handleSaveProduct = async (item: ProductItem) => {
    try {
      setLoading(true);
      await apiCall("products", "POST", storedPassword, item);
      toast.success("Product saved");
      setEditingProduct(null);
      fetchProducts();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiCall("products", "DELETE", storedPassword, { id });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  // Services CRUD
  const handleSaveService = async (item: ServiceItem) => {
    try {
      setLoading(true);
      await apiCall("services", "POST", storedPassword, item);
      toast.success("Service saved");
      setEditingService(null);
      fetchServices();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await apiCall("services", "DELETE", storedPassword, { id });
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  // Menu Items CRUD
  const handleSaveMenuItem = async (item: MenuChildItem) => {
    try {
      setLoading(true);
      await apiCall("product-items", "POST", storedPassword, item);
      toast.success("Menu item saved");
      setEditingMenuItem(null);
      fetchMenuItems();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await apiCall("product-items", "DELETE", storedPassword, { id });
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
      toast.success("Menu item deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  // File uploads for images tab
  const handleUploadFiles = async (fileList: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await uploadFileAndGetUrl(file, selectedFolder.bucket, selectedFolder.folder, storedPassword);
      }
      toast.success(`Uploaded ${fileList.length} file(s)`);
      fetchFiles();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      const path = selectedFolder.folder ? `${selectedFolder.folder}/${fileName}` : fileName;
      await apiCall("files", "DELETE", storedPassword, { bucket: selectedFolder.bucket, paths: [path] });
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      toast.success("File deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const getPublicUrl = (fileName: string) => {
    const path = selectedFolder.folder ? `${selectedFolder.folder}/${fileName}` : fileName;
    return `${STORAGE_BASE}/${selectedFolder.bucket}/${path}`;
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);

  // File upload handlers for product/service forms
  const handleFormFileUpload = async (
    file: File,
    bucket: string,
    folder: string,
    setter: (url: string) => void
  ) => {
    try {
      setUploading(true);
      const url = await uploadFileAndGetUrl(file, bucket, folder, storedPassword);
      setter(url);
      toast.success("File uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  // ─── Login Screen ────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Enter admin password to continue</p>
          </div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-xl" required />
          <Button type="submit" className="w-full gradient-accent text-accent-foreground rounded-xl border-0">Login</Button>
        </form>
      </div>
    );
  }

  // ─── Item Editor (shared for products/services) ──────────
  const renderItemEditor = (
    item: ProductItem | ServiceItem,
    setItem: (item: ProductItem | ServiceItem) => void,
    onSave: () => void,
    onCancel: () => void,
    imageRef: React.RefObject<HTMLInputElement | null>,
    pdfRef: React.RefObject<HTMLInputElement | null>,
    type: "product" | "service"
  ) => (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-foreground">{item.id ? "Edit" : "New"} {type === "product" ? "Product" : "Service"}</h3>
      
      {/* Tags */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tag (EN)</label>
          <Input value={item.tag_en} onChange={(e) => setItem({ ...item, tag_en: e.target.value })} placeholder="e.g. Fire Safety" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tag (AR)</label>
          <Input value={item.tag_ar} onChange={(e) => setItem({ ...item, tag_ar: e.target.value })} placeholder="e.g. السلامة من الحريق" className="rounded-xl" dir="rtl" />
        </div>
      </div>

      {/* Names */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (EN)</label>
          <Input value={item.name_en} onChange={(e) => setItem({ ...item, name_en: e.target.value })} placeholder="Product name" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (AR)</label>
          <Input value={item.name_ar} onChange={(e) => setItem({ ...item, name_ar: e.target.value })} placeholder="اسم المنتج" className="rounded-xl" dir="rtl" />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (EN)</label>
          <Textarea value={item.description_en} onChange={(e) => setItem({ ...item, description_en: e.target.value })} rows={3} className="rounded-xl resize-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (AR)</label>
          <Textarea value={item.description_ar} onChange={(e) => setItem({ ...item, description_ar: e.target.value })} rows={3} className="rounded-xl resize-none" dir="rtl" />
        </div>
      </div>

      {/* Icon & Sort Order */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon</label>
          <select
            value={item.icon}
            onChange={(e) => setItem({ ...item, icon: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort Order</label>
          <Input type="number" value={item.sort_order} onChange={(e) => setItem({ ...item, sort_order: parseInt(e.target.value) || 0 })} className="rounded-xl" />
        </div>
      </div>

      {/* Image Upload */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Image</label>
          <div className="flex items-center gap-2">
            <Input value={item.image_url || ""} onChange={(e) => setItem({ ...item, image_url: e.target.value || null })} placeholder="Image URL or upload" className="rounded-xl flex-1" />
            <input ref={imageRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFormFileUpload(file, "images", type === "product" ? "products" : "services", (url) => setItem({ ...item, image_url: url }));
              }}
            />
            <Button variant="outline" size="sm" onClick={() => imageRef.current?.click()} disabled={uploading} className="rounded-xl shrink-0">
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          {item.image_url && (
            <img src={item.image_url} alt="Preview" className="mt-2 h-20 w-32 object-cover rounded-lg border border-border" />
          )}
        </div>

        {/* PDF Upload */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">PDF Document</label>
          <div className="flex items-center gap-2">
            <Input value={item.pdf_url || ""} onChange={(e) => setItem({ ...item, pdf_url: e.target.value || null })} placeholder="PDF URL or upload" className="rounded-xl flex-1" />
            <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFormFileUpload(file, "pdfs", "", (url) => setItem({ ...item, pdf_url: url }));
              }}
            />
            <Button variant="outline" size="sm" onClick={() => pdfRef.current?.click()} disabled={uploading} className="rounded-xl shrink-0">
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          {item.pdf_url && (
            <button
              onClick={() => { setPdfPreviewUrl(item.pdf_url!); setPdfPreviewOpen(true); }}
              className="mt-2 text-xs text-primary underline"
            >
              Preview PDF
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
      </div>
    </div>
  );

  // ─── Main Layout ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Energy Innovation Admin</h1>
          <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem("admin_pw"); setAuthenticated(false); setPassword(""); }} className="rounded-xl">
            <LogOut className="w-4 h-4 mr-2" />Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            { key: "branding" as TabKey, icon: Palette, label: "Branding" },
            { key: "leads" as TabKey, icon: MessageSquare, label: `Leads (${leads.length})` },
            { key: "content" as TabKey, icon: FileText, label: "Site Content" },
            { key: "products" as TabKey, icon: Package, label: `Products (${products.length})` },
            { key: "services" as TabKey, icon: Briefcase, label: `Services (${services.length})` },
            { key: "menu-items" as TabKey, icon: List, label: `Menu Items (${menuItems.length})` },
            { key: "images" as TabKey, icon: Image, label: "Files & Images" },
          ]).map((tab) => (
            <Button key={tab.key} variant={activeTab === tab.key ? "default" : "outline"} onClick={() => setActiveTab(tab.key)} className="rounded-xl">
              <tab.icon className="w-4 h-4 mr-2" />{tab.label}
            </Button>
          ))}
        </div>

        {/* ─── Branding Tab ──────── */}
        {activeTab === "branding" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Branding</h2>
              <Button variant="outline" size="sm" onClick={fetchBranding} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Logo Upload */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Company Logo</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload your logo (PNG, JPG, SVG). It will appear in the header and footer.</p>
                
                {brandLogoUrl && (
                  <div className="mb-4 p-4 bg-secondary rounded-xl flex items-center justify-center">
                    <img src={brandLogoUrl} alt="Current logo" className="max-h-20 w-auto object-contain" />
                  </div>
                )}
                
                <input
                  ref={brandLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBrandLogoUploading(true);
                    try {
                      // Upload as branding/logo (no extension, upsert)
                      const base64 = await fileToBase64(file);
                      await apiCall("upload", "POST", storedPassword, {
                        bucket: "images",
                        filePath: "branding/logo",
                        base64,
                        contentType: file.type,
                      });
                      toast.success("Logo uploaded! Refresh the main site to see changes.");
                      fetchBranding();
                    } catch (err: any) { toast.error(err.message); }
                    finally { setBrandLogoUploading(false); }
                  }}
                />
                <Button
                  onClick={() => brandLogoRef.current?.click()}
                  disabled={brandLogoUploading}
                  className="gradient-accent text-accent-foreground rounded-xl border-0"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {brandLogoUploading ? "Uploading..." : brandLogoUrl ? "Replace Logo" : "Upload Logo"}
                </Button>
              </div>

              {/* Business Name */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Business Name</h3>
                <p className="text-sm text-muted-foreground mb-4">This name appears in the footer copyright and page metadata.</p>
                
                <div className="space-y-3">
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your business name"
                    className="rounded-xl"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        await apiCall("content", "POST", storedPassword, {
                          content_key: "brand.name",
                          value_en: brandName,
                          value_ar: brandName,
                        });
                        toast.success("Business name saved! Refresh the main site to see changes.");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="gradient-accent text-accent-foreground rounded-xl border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />Save Name
                  </Button>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">WhatsApp Button</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-muted-foreground">{whatsappActive ? "Active" : "Inactive"}</span>
                    <input
                      type="checkbox"
                      checked={whatsappActive}
                      onChange={async (e) => {
                        const val = e.target.checked;
                        setWhatsappActive(val);
                        try {
                          await apiCall("content", "POST", storedPassword, {
                            content_key: "whatsapp_active",
                            value_en: String(val),
                            value_ar: String(val),
                          });
                          toast.success(val ? "WhatsApp activated" : "WhatsApp deactivated");
                        } catch (err: any) { toast.error(err.message); }
                      }}
                      className="w-5 h-5 accent-primary"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-3">
                  <PhoneInput
                    value={whatsappNumber}
                    onChange={(val) => setWhatsappNumber(val)}
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const cleaned = whatsappNumber.replace(/[^0-9+]/g, "");
                        await apiCall("content", "POST", storedPassword, {
                          content_key: "whatsapp_number",
                          value_en: cleaned,
                          value_ar: cleaned,
                        });
                        toast.success("WhatsApp number saved!");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="gradient-accent text-accent-foreground rounded-xl border-0 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />Save
                  </Button>
                </div>
              </div>

              {/* Floating Email */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Email Button</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-muted-foreground">{emailActive ? "Active" : "Inactive"}</span>
                    <input
                      type="checkbox"
                      checked={emailActive}
                      onChange={async (e) => {
                        const val = e.target.checked;
                        setEmailActive(val);
                        try {
                          await apiCall("content", "POST", storedPassword, {
                            content_key: "email_active",
                            value_en: String(val),
                            value_ar: String(val),
                          });
                          toast.success(val ? "Email activated" : "Email deactivated");
                        } catch (err: any) { toast.error(err.message); }
                      }}
                      className="w-5 h-5 accent-primary"
                    />
                  </label>
                </div>
                <div className="flex gap-3">
                  <Input
                    value={floatingEmail}
                    onChange={(e) => setFloatingEmail(e.target.value)}
                    placeholder="info@example.com"
                    className="rounded-xl"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        await apiCall("content", "POST", storedPassword, {
                          content_key: "floating_email",
                          value_en: floatingEmail,
                          value_ar: floatingEmail,
                        });
                        toast.success("Email saved!");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="gradient-accent text-accent-foreground rounded-xl border-0 shrink-0"
                  >
                    <Save className="w-4 h-4 mr-2" />Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Leads Tab ──────── */}
        {activeTab === "leads" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Contact Submissions</h2>
              <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>
            {leads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No leads yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{lead.name}</h3>
                          <span className="text-sm text-muted-foreground">{lead.email}</span>
                          {lead.company && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">{lead.company}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{lead.message}</p>
                        <p className="text-xs text-muted-foreground mt-3">{new Date(lead.created_at).toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Content Tab ─────── */}
        {activeTab === "content" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Site Content</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSeedContent} disabled={loading} className="rounded-xl">
                  <Database className="w-4 h-4 mr-2" />Seed Defaults
                </Button>
                <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>
            {content.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No content yet. Click "Seed Defaults" to populate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-mono bg-secondary px-3 py-1 rounded-lg text-secondary-foreground">{item.content_key}</span>
                      <Button size="sm" onClick={() => handleSaveContent(item.content_key)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                        <Save className="w-4 h-4 mr-2" />Save
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">English</label>
                        {(editedContent[item.content_key]?.value_en?.length || 0) > 100 ? (
                          <Textarea value={editedContent[item.content_key]?.value_en || ""} onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)} rows={3} className="rounded-xl resize-none" />
                        ) : (
                          <Input value={editedContent[item.content_key]?.value_en || ""} onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)} className="rounded-xl" />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Arabic</label>
                        {(editedContent[item.content_key]?.value_ar?.length || 0) > 100 ? (
                          <Textarea value={editedContent[item.content_key]?.value_ar || ""} onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)} rows={3} className="rounded-xl resize-none" dir="rtl" />
                        ) : (
                          <Input value={editedContent[item.content_key]?.value_ar || ""} onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)} className="rounded-xl" dir="rtl" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Products Tab ─────── */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Products</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditingProduct({ ...emptyProduct, sort_order: products.length })} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Plus className="w-4 h-4 mr-2" />Add Product
                </Button>
                <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>

            {editingProduct && renderItemEditor(
              editingProduct,
              (item) => setEditingProduct(item as ProductItem),
              () => handleSaveProduct(editingProduct),
              () => setEditingProduct(null),
              productImageRef,
              productPdfRef,
              "product"
            )}

            {products.length === 0 && !editingProduct ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No products yet. Add your first one!</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name_en} className="w-16 h-12 object-cover rounded-lg border border-border shrink-0" />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{p.name_en || "Untitled"}</h3>
                        {p.tag_en && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full shrink-0">{p.tag_en}</span>}
                        {p.pdf_url && <FileText className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.description_en || "No description"}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setEditingProduct({ ...p })} className="rounded-xl">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Services Tab ─────── */}
        {activeTab === "services" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Services</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditingService({ ...emptyService, sort_order: services.length })} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Plus className="w-4 h-4 mr-2" />Add Service
                </Button>
                <Button variant="outline" size="sm" onClick={fetchServices} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>

            {editingService && renderItemEditor(
              editingService,
              (item) => setEditingService(item as ServiceItem),
              () => handleSaveService(editingService),
              () => setEditingService(null),
              serviceImageRef,
              servicePdfRef,
              "service"
            )}

            {services.length === 0 && !editingService ? (
              <div className="text-center py-16 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No services yet. Add your first one!</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {services.map((s) => (
                  <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name_en} className="w-16 h-12 object-cover rounded-lg border border-border shrink-0" />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{s.name_en || "Untitled"}</h3>
                        {s.tag_en && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full shrink-0">{s.tag_en}</span>}
                        {s.pdf_url && <FileText className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.description_en || "No description"}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setEditingService({ ...s })} className="rounded-xl">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteService(s.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Menu Items Tab ─────── */}
        {activeTab === "menu-items" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Menu Items</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  These are the child items shown in the Products mega menu. Each item can have its own PDF document.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditingMenuItem({ ...emptyMenuChild, sort_order: menuItems.length })} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Plus className="w-4 h-4 mr-2" />Add Item
                </Button>
                <Button variant="outline" size="sm" onClick={fetchMenuItems} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>

            {/* Editor */}
            {editingMenuItem && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
                <h3 className="font-semibold text-foreground">{editingMenuItem.id ? "Edit" : "New"} Menu Item</h3>
                
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                  <select
                    value={editingMenuItem.category_key}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category_key: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Names */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (EN)</label>
                    <Input value={editingMenuItem.name_en} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name_en: e.target.value })} placeholder="e.g. Fire Curtains" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (AR)</label>
                    <Input value={editingMenuItem.name_ar} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name_ar: e.target.value })} placeholder="e.g. ستائر الحريق" className="rounded-xl" dir="rtl" />
                  </div>
                </div>

                {/* PDF & Sort Order */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">PDF Document</label>
                    <div className="flex items-center gap-2">
                      <Input value={editingMenuItem.pdf_url || ""} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, pdf_url: e.target.value || null })} placeholder="PDF URL or upload" className="rounded-xl flex-1" />
                      <input ref={menuItemPdfRef} type="file" accept=".pdf" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFormFileUpload(file, "pdfs", "", (url) => setEditingMenuItem({ ...editingMenuItem!, pdf_url: url }));
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => menuItemPdfRef.current?.click()} disabled={uploading} className="rounded-xl shrink-0">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    {editingMenuItem.pdf_url && (
                      <button
                        onClick={() => { setPdfPreviewUrl(editingMenuItem.pdf_url!); setPdfPreviewOpen(true); }}
                        className="mt-2 text-xs text-primary underline"
                      >
                        Preview PDF
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort Order</label>
                    <Input type="number" value={editingMenuItem.sort_order} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, sort_order: parseInt(e.target.value) || 0 })} className="rounded-xl" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleSaveMenuItem(editingMenuItem)} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                    <Save className="w-4 h-4 mr-2" />Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingMenuItem(null)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            )}

            {/* List grouped by category */}
            {menuItems.length === 0 && !editingMenuItem ? (
              <div className="text-center py-16 text-muted-foreground">
                <List className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No menu items yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {CATEGORY_OPTIONS.map((cat) => {
                  const items = menuItems.filter((m) => m.category_key === cat.key);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.key}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-3">{cat.label}</h3>
                      <div className="space-y-2">
                        {items.sort((a, b) => a.sort_order - b.sort_order).map((m) => (
                          <div key={m.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground text-sm">{m.name_en}</span>
                                <span className="text-xs text-muted-foreground">/ {m.name_ar}</span>
                                {m.pdf_url ? (
                                  <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">PDF ✓</span>
                                ) : (
                                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">No PDF</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="outline" size="sm" onClick={() => setEditingMenuItem({ ...m })} className="rounded-xl text-xs h-7">Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteMenuItem(m.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Images Tab ─────── */}
        {activeTab === "images" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Files & Images</h2>
                <div className="flex gap-1">
                  {IMAGE_FOLDERS.map((folder) => (
                    <Button key={`${folder.bucket}-${folder.folder}`} variant={selectedFolder === folder ? "default" : "outline"} size="sm" onClick={() => setSelectedFolder(folder)} className="rounded-xl text-xs">
                      {folder.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" multiple className="hidden" accept={selectedFolder.bucket === "pdfs" ? ".pdf" : "image/*,.pdf"} onChange={(e) => e.target.files && handleUploadFiles(e.target.files)} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-xl">
                  <Upload className={`w-4 h-4 mr-2 ${uploading ? "animate-spin" : ""}`} />{uploading ? "Uploading..." : "Upload"}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Upload to <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{selectedFolder.bucket}/{selectedFolder.folder}</span>.
              {selectedFolder.folder === "hero" && " Name files hero-1.jpg through hero-5.jpg for the homepage slider."}
              {selectedFolder.folder === "products" && " Name files product-fire.jpg, product-roller.jpg, etc. for product cards."}
            </p>

            {files.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No files in this folder yet. Upload some!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div key={file.id || file.name} className="bg-card border border-border rounded-2xl overflow-hidden group">
                    {isImage(file.name) ? (
                      <div className="aspect-video bg-muted">
                        <img src={getPublicUrl(file.name)} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <FileText className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-foreground truncate flex-1" title={file.name}>{file.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PdfViewerDialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen} src={pdfPreviewUrl} />
    </div>
  );
}
