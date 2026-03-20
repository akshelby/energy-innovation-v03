import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Lock, Trash2, Save, RefreshCw, Database, FileText, MessageSquare,
  LogOut, Image, Upload, Plus, Package, Briefcase, GripVertical, List, Palette, Languages, Sun, Moon,
  Star, Award, TrendingUp, Users, Clock, Globe, Phone, Mail, UserPlus, Heart,
  Zap, Shield, icons,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/PhoneInput";

const TRANSLATE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/translate`;

async function translateTexts(texts: Record<string, string>): Promise<Record<string, string>> {
  const nonEmpty = Object.fromEntries(Object.entries(texts).filter(([_, v]) => v && v.trim()));
  if (Object.keys(nonEmpty).length === 0) return {};
  const res = await fetch(TRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: nonEmpty }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Translation failed");
  return data.translations;
}

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
  parent_id: string | null;
  name_en: string;
  name_ar: string;
  pdf_url: string | null;
  sort_order: number;
  is_active?: boolean;
}

interface CategoryItem {
  id?: string;
  key: string;
  label_en: string;
  label_ar: string;
  sort_order: number;
  is_active?: boolean;
}

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
  { content_key: "highlight.tagline", value_en: "Proven Industrial Partner", value_ar: "شريك صناعي موثوق" },
  { content_key: "highlight.title", value_en: "Driving Industrial Excellence Forward", value_ar: "قيادة التميز الصناعي نحو الأمام" },
  { content_key: "highlight.desc", value_en: "Energy Innovation delivers cutting-edge industrial solutions that empower businesses to achieve operational excellence. From strategy to execution, we bring industry-leading expertise across engineering, automation, and safety systems.", value_ar: "تقدم Energy Innovation حلولاً صناعية متطورة تمكّن الشركات من تحقيق التميز التشغيلي. من الاستراتيجية إلى التنفيذ، نقدم خبرة رائدة في الهندسة والأتمتة وأنظمة السلامة." },
  { content_key: "highlight.subdesc", value_en: "Your success is our priority. We welcome your inquiries as we partner on your industrial journey.", value_ar: "نجاحكم هو أولويتنا. نرحب باستفساراتكم ونتطلع للشراكة في رحلتكم الصناعية." },
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

type TabKey = "leads" | "content" | "products" | "services" | "menu-items" | "images" | "branding" | "highlight" | "careers";

const emptyMenuChild: MenuChildItem = {
  category_key: "cat.fire", parent_id: null, name_en: "", name_ar: "", pdf_url: null, sort_order: 0, is_active: true,
};

export default function Admin() {
  const { theme, toggleTheme } = useTheme();
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
  const [categories, setCategories] = useState<(CategoryItem & { id: string })[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const menuItemPdfRef = useRef<HTMLInputElement>(null);
  const menuEditorRef = useRef<HTMLDivElement>(null);

  // Scroll to editor when it opens
  useEffect(() => {
    if (editingMenuItem && menuEditorRef.current) {
      setTimeout(() => menuEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [editingMenuItem]);

  // PDF preview
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  // Images state
  const [selectedFolder, setSelectedFolder] = useState(IMAGE_FOLDERS[0]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeHeroImages, setActiveHeroImages] = useState<string[]>([]);
  const [heroSpeed, setHeroSpeed] = useState(6);

  // Branding state
  const [brandName, setBrandName] = useState("Energy Innovation");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const brandLogoRef = useRef<HTMLInputElement>(null);
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [logoSize, setLogoSize] = useState(56);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("Hello, I'm interested in your products and services.");
  const [whatsappMessageAr, setWhatsappMessageAr] = useState("مرحبًا، أنا مهتم بمنتجاتكم وخدماتكم.");
  const [floatingEmail, setFloatingEmail] = useState("");
  const [emailActive, setEmailActive] = useState(false);

  // Contact addresses state
  const [contactAddresses, setContactAddresses] = useState<{ id: string; label_en: string; label_ar: string; is_active: boolean; sort_order: number }[]>([]);
  const [editingAddress, setEditingAddress] = useState<{ id?: string; label_en: string; label_ar: string; is_active: boolean; sort_order: number } | null>(null);
  const [contactVisibility, setContactVisibility] = useState<Record<string, boolean>>({
    contact_phone_visible: true,
    contact_email_visible: true,
    contact_address_visible: true,
  });

  const [highlightImage, setHighlightImage] = useState("");
  const [highlightStats, setHighlightStats] = useState<{ icon: string; value_en: string; value_ar: string; label_en: string; label_ar: string }[]>([
    { icon: "Award", value_en: "100%", value_ar: "١٠٠٪", label_en: "Quality Assurance", label_ar: "ضمان الجودة" },
    { icon: "TrendingUp", value_en: "20+", value_ar: "+٢٠", label_en: "Years of Experience", label_ar: "سنوات الخبرة" },
    { icon: "Users", value_en: "500+", value_ar: "+٥٠٠", label_en: "Satisfied Clients", label_ar: "عملاء راضون" },
  ]);
  const highlightImageRef = useRef<HTMLInputElement>(null);

  // Hero visibility toggles
  const [heroVisibility, setHeroVisibility] = useState<Record<string, boolean>>({
    "hero.show_headline": true,
    "hero.show_subtext": true,
    "hero.show_explore_btn": true,
    "hero.show_contact_btn": true,
    "hero.show_arrows": true,
    "hero.show_dots": true,
  });
  const productImageRef = useRef<HTMLInputElement>(null);
  const productPdfRef = useRef<HTMLInputElement>(null);
  const serviceImageRef = useRef<HTMLInputElement>(null);
  const servicePdfRef = useRef<HTMLInputElement>(null);

  // Careers state
  interface CareerItem {
    id?: string;
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
    sort_order: number;
  }
  const emptyCareer: CareerItem = {
    title_en: "", title_ar: "", department_en: "", department_ar: "",
    location_en: "", location_ar: "", type_en: "Full-time", type_ar: "دوام كامل",
    description_en: "", description_ar: "", requirements_en: "", requirements_ar: "",
    is_active: true, sort_order: 0,
  };
  const [careersList, setCareersList] = useState<(CareerItem & { id: string })[]>([]);
  const [editingCareer, setEditingCareer] = useState<CareerItem | null>(null);
  const careerEditorRef = useRef<HTMLDivElement>(null);

  // Careers page content state
  const [careersHeroTitle, setCareersHeroTitle] = useState("Build Your Future With Us");
  const [careersHeroSubtitle, setCareersHeroSubtitle] = useState("Join a leading team in industrial innovation and engineering solutions across the Gulf region.");
  const [careersBannerUrl, setCareersBannerUrl] = useState("");
  const careersBannerRef = useRef<HTMLInputElement>(null);
  const [careersBannerUploading, setCareersBannerUploading] = useState(false);
  const [careersStats, setCareersStats] = useState<{ value_en: string; value_ar: string; label_en: string; label_ar: string }[]>([
    { value_en: "5+", value_ar: "+٥", label_en: "Countries", label_ar: "دول" },
    { value_en: "100%", value_ar: "١٠٠٪", label_en: "Growth Focus", label_ar: "تركيز على النمو" },
  ]);
  const [careersPerks, setCareersPerks] = useState<{ icon: string; title_en: string; title_ar: string; desc_en: string; desc_ar: string }[]>([
    { icon: "TrendingUp", title_en: "Career Growth", title_ar: "النمو المهني", desc_en: "Clear advancement paths with mentorship programs and continuous learning opportunities.", desc_ar: "مسارات تقدم واضحة مع برامج إرشاد وفرص تعلم مستمرة." },
    { icon: "Heart", title_en: "Health & Wellbeing", title_ar: "الصحة والرفاهية", desc_en: "Comprehensive medical coverage and wellness programs for you and your family.", desc_ar: "تغطية طبية شاملة وبرامج صحية لك ولعائلتك." },
    { icon: "Users", title_en: "Collaborative Culture", title_ar: "ثقافة تعاونية", desc_en: "Work alongside industry experts in a supportive, inclusive team environment.", desc_ar: "اعمل جنباً إلى جنب مع خبراء الصناعة في بيئة فريق داعمة وشاملة." },
    { icon: "Shield", title_en: "Job Security", title_ar: "الأمان الوظيفي", desc_en: "Stable employment with competitive compensation and performance-based rewards.", desc_ar: "توظيف مستقر مع تعويضات تنافسية ومكافآت قائمة على الأداء." },
  ]);
  const PERK_ICON_OPTIONS = ["TrendingUp", "Heart", "Users", "Shield", "Star", "Award", "Globe", "Zap", "Clock", "Briefcase", "Phone", "Mail", "UserPlus", "Package", "Sun", "Moon", "FileText", "MessageSquare", "Database", "Palette"];

  useEffect(() => {
    if (editingCareer && careerEditorRef.current) {
      setTimeout(() => careerEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [editingCareer]);

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

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiCall("product-categories", "GET", storedPassword);
      setCategories(data);
    } catch (e: any) { toast.error(e.message); }
  }, [storedPassword]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `files?bucket=${selectedFolder.bucket}&folder=${selectedFolder.folder}`,
        "GET",
        storedPassword
      );
      let fileList = data.filter((f: StorageFile) => f.name !== ".emptyFolderPlaceholder");

      // Deduplicate hero images by filename stem, preferring .webp
      if (selectedFolder.folder === "hero") {
        const stemMap = new Map<string, StorageFile>();
        for (const file of fileList) {
          const stem = file.name.replace(/\.(png|jpe?g|webp|avif)$/i, "");
          const existing = stemMap.get(stem);
          if (!existing || file.name.endsWith(".webp")) {
            stemMap.set(stem, file);
          }
        }
        fileList = Array.from(stemMap.values());
      }

      setFiles(fileList);

      // Fetch active hero images when viewing hero folder
      if (selectedFolder.folder === "hero") {
        try {
          const contentData = await apiCall("content", "GET", storedPassword);
          const entry = contentData.find((d: ContentItem) => d.content_key === "hero.active_images");
          if (entry) {
            setActiveHeroImages(JSON.parse(entry.value_en));
          } else {
            setActiveHeroImages([]);
          }
          const speedEntry = contentData.find((d: ContentItem) => d.content_key === "hero.speed");
          if (speedEntry) {
            setHeroSpeed(parseFloat(speedEntry.value_en) || 6);
          }
        } catch { setActiveHeroImages([]); }
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword, selectedFolder]);

  const fetchBranding = useCallback(async () => {
    // Load brand name + whatsapp from site_content
    try {
      const data = await apiCall("content", "GET", storedPassword);
      const brandEntry = data.find((d: ContentItem) => d.content_key === "brand.name");
      if (brandEntry) setBrandName(brandEntry.value_en);
      const sizeEntry = data.find((d: ContentItem) => d.content_key === "logo.size");
      if (sizeEntry) setLogoSize(parseInt(sizeEntry.value_en) || 56);
      const waEntry = data.find((d: ContentItem) => d.content_key === "whatsapp_number");
      if (waEntry) setWhatsappNumber(waEntry.value_en);
      const waActive = data.find((d: ContentItem) => d.content_key === "whatsapp_active");
      setWhatsappActive(waActive?.value_en === "true");
      const waMsg = data.find((d: ContentItem) => d.content_key === "whatsapp_message");
      if (waMsg) {
        setWhatsappMessage(waMsg.value_en);
        setWhatsappMessageAr(waMsg.value_ar);
      }
      const emailEntry = data.find((d: ContentItem) => d.content_key === "floating_email");
      if (emailEntry) setFloatingEmail(emailEntry.value_en);
      const emActive = data.find((d: ContentItem) => d.content_key === "email_active");
      setEmailActive(emActive?.value_en === "true");

      // Load hero visibility toggles
      const visKeys = ["hero.show_headline", "hero.show_subtext", "hero.show_explore_btn", "hero.show_contact_btn", "hero.show_arrows", "hero.show_dots"];
      const vis: Record<string, boolean> = {};
      visKeys.forEach((k) => {
        const entry = data.find((d: ContentItem) => d.content_key === k);
        vis[k] = entry ? entry.value_en !== "false" : true;
      });
      setHeroVisibility(vis);

      // Load contact card visibility toggles
      const cVisKeys = ["contact_phone_visible", "contact_email_visible", "contact_address_visible"];
      const cVis: Record<string, boolean> = {};
      cVisKeys.forEach((k) => {
        const entry = data.find((d: ContentItem) => d.content_key === k);
        cVis[k] = entry ? entry.value_en !== "false" : true;
      });
      setContactVisibility(cVis);
    } catch { /* ignore */ }
    const logoPublicUrl = `${STORAGE_BASE}/images/branding/logo`;
    try {
      const res = await fetch(logoPublicUrl, { method: "HEAD" });
      if (res.ok) setBrandLogoUrl(logoPublicUrl + "?t=" + Date.now());
      else setBrandLogoUrl("");
    } catch { setBrandLogoUrl(""); }
  }, [storedPassword]);

  const fetchHighlight = useCallback(async () => {
    try {
      const data = await apiCall("content", "GET", storedPassword);
      const imgEntry = data.find((d: ContentItem) => d.content_key === "highlight.image");
      if (imgEntry) setHighlightImage(imgEntry.value_en);
      const statsEntry = data.find((d: ContentItem) => d.content_key === "highlight.stats");
      if (statsEntry?.value_en) {
        try { setHighlightStats(JSON.parse(statsEntry.value_en)); } catch { /* keep defaults */ }
      }
    } catch { /* ignore */ }
  }, [storedPassword]);

  const fetchContactAddresses = useCallback(async () => {
    try {
      const { data } = await supabase.from("contact_addresses").select("*").order("sort_order");
      if (data) setContactAddresses(data);
    } catch { /* ignore */ }
  }, []);

  const fetchCareersContent = useCallback(async () => {
    try {
      const data = await apiCall("content", "GET", storedPassword);
      const titleEntry = data.find((d: ContentItem) => d.content_key === "careers.hero_title");
      if (titleEntry) setCareersHeroTitle(titleEntry.value_en);
      const subtitleEntry = data.find((d: ContentItem) => d.content_key === "careers.hero_subtitle");
      if (subtitleEntry) setCareersHeroSubtitle(subtitleEntry.value_en);
      const bannerEntry = data.find((d: ContentItem) => d.content_key === "careers.banner_image");
      if (bannerEntry) setCareersBannerUrl(bannerEntry.value_en);
      const statsEntry = data.find((d: ContentItem) => d.content_key === "careers.stats");
      if (statsEntry?.value_en) {
        try { setCareersStats(JSON.parse(statsEntry.value_en)); } catch { /* keep defaults */ }
      }
      const perksEntry = data.find((d: ContentItem) => d.content_key === "careers.perks");
      if (perksEntry?.value_en) {
        try { setCareersPerks(JSON.parse(perksEntry.value_en)); } catch { /* keep defaults */ }
      }
    } catch { /* ignore */ }
  }, [storedPassword]);

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("careers", "GET", storedPassword);
      setCareersList(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  useEffect(() => {
    if (authenticated) {
      if (activeTab === "leads") fetchLeads();
      else if (activeTab === "content") { fetchContent(); fetchContactAddresses(); }
      else if (activeTab === "products") fetchProducts();
      else if (activeTab === "services") fetchServices();
      else if (activeTab === "menu-items") { fetchMenuItems(); fetchCategories(); }
      else if (activeTab === "branding") fetchBranding();
      else if (activeTab === "highlight") fetchHighlight();
      else if (activeTab === "careers") { fetchCareers(); fetchCareersContent(); }
      else fetchFiles();
    }
  }, [authenticated, activeTab, fetchLeads, fetchContent, fetchContactAddresses, fetchProducts, fetchServices, fetchMenuItems, fetchCategories, fetchFiles, fetchBranding, fetchHighlight, fetchCareers, fetchCareersContent]);

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
      // Auto-translate if Arabic is empty
      let valueAr = edited.value_ar;
      if (edited.value_en && !valueAr) {
        try {
          const result = await translateTexts({ value_en: edited.value_en });
          valueAr = result.value_ar || "";
          updateEditedField(key, "value_ar", valueAr);
        } catch { /* proceed */ }
      }
      await apiCall("content", "POST", storedPassword, {
        content_key: key, value_en: edited.value_en, value_ar: valueAr,
      });
      toast.success(`Saved "${key}"`);
      fetchContent();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleHeroVisibility = async (key: string) => {
    const newVal = !heroVisibility[key];
    setHeroVisibility((prev) => ({ ...prev, [key]: newVal }));
    try {
      await apiCall("content", "POST", storedPassword, {
        content_key: key,
        value_en: String(newVal),
        value_ar: String(newVal),
      });
      toast.success(`${key.replace("hero.show_", "").replace(/_/g, " ")} ${newVal ? "shown" : "hidden"}`);
    } catch (e: any) {
      setHeroVisibility((prev) => ({ ...prev, [key]: !newVal }));
      toast.error(e.message);
    }
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
      // Auto-translate if Arabic fields are empty
      if (item.name_en && (!item.name_ar || !item.tag_ar || !item.description_ar)) {
        try {
          const result = await translateTexts({
            ...(item.name_en && !item.name_ar ? { name_en: item.name_en } : {}),
            ...(item.tag_en && !item.tag_ar ? { tag_en: item.tag_en } : {}),
            ...(item.description_en && !item.description_ar ? { description_en: item.description_en } : {}),
          });
          item = { ...item, name_ar: result.name_ar || item.name_ar, tag_ar: result.tag_ar || item.tag_ar, description_ar: result.description_ar || item.description_ar };
        } catch { /* proceed without translation */ }
      }
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
      if (item.name_en && (!item.name_ar || !item.tag_ar || !item.description_ar)) {
        try {
          const result = await translateTexts({
            ...(item.name_en && !item.name_ar ? { name_en: item.name_en } : {}),
            ...(item.tag_en && !item.tag_ar ? { tag_en: item.tag_en } : {}),
            ...(item.description_en && !item.description_ar ? { description_en: item.description_en } : {}),
          });
          item = { ...item, name_ar: result.name_ar || item.name_ar, tag_ar: result.tag_ar || item.tag_ar, description_ar: result.description_ar || item.description_ar };
        } catch { /* proceed without translation */ }
      }
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

  // Careers CRUD
  const handleSaveCareer = async (item: CareerItem) => {
    try {
      setLoading(true);
      if (item.title_en && (!item.title_ar || !item.department_ar || !item.location_ar || !item.type_ar || !item.description_ar || !item.requirements_ar)) {
        try {
          const toTranslate: Record<string, string> = {};
          if (item.title_en && !item.title_ar) toTranslate.title_en = item.title_en;
          if (item.department_en && !item.department_ar) toTranslate.department_en = item.department_en;
          if (item.location_en && !item.location_ar) toTranslate.location_en = item.location_en;
          if (item.type_en && !item.type_ar) toTranslate.type_en = item.type_en;
          if (item.description_en && !item.description_ar) toTranslate.description_en = item.description_en;
          if (item.requirements_en && !item.requirements_ar) toTranslate.requirements_en = item.requirements_en;
          const result = await translateTexts(toTranslate);
          item = {
            ...item,
            title_ar: result.title_ar || item.title_ar,
            department_ar: result.department_ar || item.department_ar,
            location_ar: result.location_ar || item.location_ar,
            type_ar: result.type_ar || item.type_ar,
            description_ar: result.description_ar || item.description_ar,
            requirements_ar: result.requirements_ar || item.requirements_ar,
          };
        } catch { /* proceed */ }
      }
      await apiCall("careers", "POST", storedPassword, item);
      toast.success("Career listing saved");
      setEditingCareer(null);
      fetchCareers();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteCareer = async (id: string) => {
    try {
      await apiCall("careers", "DELETE", storedPassword, { id });
      setCareersList((prev) => prev.filter((c) => c.id !== id));
      toast.success("Career listing deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  // Careers page content save helpers
  const saveCareersContentKey = async (key: string, value_en: string, value_ar: string = value_en) => {
    await apiCall("content", "POST", storedPassword, { content_key: key, value_en, value_ar });
  };

  const handleSaveCareersHero = async () => {
    try {
      setLoading(true);
      let titleAr = "", subtitleAr = "";
      try {
        const result = await translateTexts({ title: careersHeroTitle, subtitle: careersHeroSubtitle });
        titleAr = result.title || "";
        subtitleAr = result.subtitle || "";
      } catch { /* proceed */ }
      await saveCareersContentKey("careers.hero_title", careersHeroTitle, titleAr);
      await saveCareersContentKey("careers.hero_subtitle", careersHeroSubtitle, subtitleAr);
      toast.success("Hero text saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleUploadCareersBanner = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    try {
      setCareersBannerUploading(true);
      const url = await uploadFileAndGetUrl(file, "images", "careers", storedPassword);
      setCareersBannerUrl(url);
      await saveCareersContentKey("careers.banner_image", url);
      toast.success("Banner image updated");
    } catch (e: any) { toast.error(e.message); }
    finally { setCareersBannerUploading(false); }
  };

  const handleSaveCareersStats = async () => {
    try {
      setLoading(true);
      await saveCareersContentKey("careers.stats", JSON.stringify(careersStats));
      toast.success("Stats saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleSaveCareersPerks = async () => {
    try {
      setLoading(true);
      // Auto-translate empty Arabic fields
      for (let i = 0; i < careersPerks.length; i++) {
        const p = careersPerks[i];
        if (p.title_en && (!p.title_ar || !p.desc_ar)) {
          try {
            const toTranslate: Record<string, string> = {};
            if (p.title_en && !p.title_ar) toTranslate[`t${i}`] = p.title_en;
            if (p.desc_en && !p.desc_ar) toTranslate[`d${i}`] = p.desc_en;
            const result = await translateTexts(toTranslate);
            careersPerks[i] = {
              ...p,
              title_ar: result[`t${i}`] || p.title_ar,
              desc_ar: result[`d${i}`] || p.desc_ar,
            };
          } catch { /* proceed */ }
        }
      }
      await saveCareersContentKey("careers.perks", JSON.stringify(careersPerks));
      toast.success("Perks cards saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };


  const handleSaveMenuItem = async (item: MenuChildItem) => {
    try {
      setLoading(true);
      if (item.name_en && !item.name_ar) {
        try {
          const result = await translateTexts({ name_en: item.name_en });
          item = { ...item, name_ar: result.name_ar || item.name_ar };
        } catch { /* proceed */ }
      }
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

  // Category CRUD
  const handleSaveCategory = async (cat: CategoryItem) => {
    try {
      setLoading(true);
      if (cat.label_en && !cat.label_ar) {
        try {
          const result = await translateTexts({ label_en: cat.label_en });
          cat = { ...cat, label_ar: result.label_ar || cat.label_ar };
        } catch { /* proceed */ }
      }
      await apiCall("product-categories", "POST", storedPassword, cat);
      toast.success("Category saved");
      setEditingCategory(null);
      fetchCategories();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    const catItems = menuItems.filter(m => categories.find(c => c.id === id)?.key === m.category_key);
    if (catItems.length > 0) {
      toast.error(`Cannot delete: ${catItems.length} items belong to this category`);
      return;
    }
    try {
      await apiCall("product-categories", "DELETE", storedPassword, { id });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleCategoryActive = async (cat: CategoryItem & { id: string }) => {
    try {
      const updated = { ...cat, is_active: !cat.is_active };
      await apiCall("product-categories", "POST", storedPassword, updated);
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !cat.is_active } : c));
      toast.success(`Category ${updated.is_active ? "activated" : "deactivated"}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleItemActive = async (item: MenuChildItem & { id: string }) => {
    try {
      const updated = { ...item, is_active: !item.is_active };
      await apiCall("product-items", "POST", storedPassword, updated);
      setMenuItems((prev) => prev.map((m) => m.id === item.id ? { ...m, is_active: !item.is_active } : m));
      toast.success(`Item ${updated.is_active ? "activated" : "deactivated"}`);
    } catch (e: any) { toast.error(e.message); }
  };

  // File uploads for images tab
  const handleUploadFiles = async (fileList: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        // Prevent duplicate hero images (same stem, different extension)
        if (selectedFolder.folder === "hero") {
          const stem = file.name.replace(/\.(png|jpe?g|webp|avif)$/i, "");
          const duplicate = files.find(
            (f) => f.name !== file.name && f.name.replace(/\.(png|jpe?g|webp|avif)$/i, "") === stem
          );
          if (duplicate) {
            toast.error(`Skipped "${file.name}" — a similar image "${duplicate.name}" already exists.`);
            continue;
          }
        }
        await uploadFileAndGetUrl(file, selectedFolder.bucket, selectedFolder.folder, storedPassword);
      }
      toast.success(`Upload complete`);
      fetchFiles();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      const folder = selectedFolder.folder;
      const basePath = folder ? `${folder}/${fileName}` : fileName;
      const pathsToDelete = [basePath];

      // For hero folder, also delete duplicate variants (jpg/webp/png with same stem)
      if (folder === "hero") {
        const stem = fileName.replace(/\.(png|jpe?g|webp|avif)$/i, "");
        // Fetch full file list to find all variants
        const allFiles = await apiCall(
          `files?bucket=${selectedFolder.bucket}&folder=${folder}`,
          "GET",
          storedPassword
        );
        for (const f of allFiles) {
          if (f.name !== fileName && f.name.replace(/\.(png|jpe?g|webp|avif)$/i, "") === stem) {
            pathsToDelete.push(folder ? `${folder}/${f.name}` : f.name);
          }
        }
      }

      await apiCall("files", "DELETE", storedPassword, { bucket: selectedFolder.bucket, paths: pathsToDelete });
      const deletedNames = pathsToDelete.map((p) => p.split("/").pop());
      setFiles((prev) => prev.filter((f) => !deletedNames.includes(f.name)));
      toast.success(pathsToDelete.length > 1 ? `Deleted ${pathsToDelete.length} file variants` : "File deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const getPublicUrl = (fileName: string) => {
    const path = selectedFolder.folder ? `${selectedFolder.folder}/${fileName}` : fileName;
    return `${STORAGE_BASE}/${selectedFolder.bucket}/${path}`;
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);

  const toggleHeroImageActive = async (fileName: string) => {
    const updated = activeHeroImages.includes(fileName)
      ? activeHeroImages.filter((f) => f !== fileName)
      : [...activeHeroImages, fileName];
    setActiveHeroImages(updated);
    try {
      await apiCall("content", "POST", storedPassword, {
        content_key: "hero.active_images",
        value_en: JSON.stringify(updated),
        value_ar: JSON.stringify(updated),
      });
      toast.success("Active hero images updated");
    } catch (e: any) { toast.error(e.message); }
  };

  const saveHeroSpeed = async (seconds: number) => {
    setHeroSpeed(seconds);
    try {
      await apiCall("content", "POST", storedPassword, {
        content_key: "hero.speed",
        value_en: String(seconds),
        value_ar: String(seconds),
      });
      toast.success(`Carousel speed set to ${seconds}s`);
    } catch (e: any) { toast.error(e.message); }
  };

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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{item.id ? "Edit" : "New"} {type === "product" ? "Product" : "Service"}</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={translating || (!item.name_en && !item.tag_en && !item.description_en)}
          onClick={async () => {
            try {
              setTranslating(true);
              const result = await translateTexts({
                name_en: item.name_en,
                tag_en: item.tag_en,
                description_en: item.description_en,
              });
              setItem({
                ...item,
                name_ar: result.name_ar || item.name_ar,
                tag_ar: result.tag_ar || item.tag_ar,
                description_ar: result.description_ar || item.description_ar,
              });
              toast.success("Arabic translations generated");
            } catch (e: any) { toast.error(e.message); }
            finally { setTranslating(false); }
          }}
          className="rounded-xl"
        >
          <Languages className="w-4 h-4 mr-2" />
          {translating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Auto Translate to Arabic"}
        </Button>
      </div>
      
      {/* Tags */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tag (EN)</label>
          <Input value={item.tag_en} onChange={(e) => setItem({ ...item, tag_en: e.target.value })} placeholder="e.g. Fire Safety" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tag (AR) — auto-generated</label>
          <Input value={item.tag_ar} onChange={(e) => setItem({ ...item, tag_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
        </div>
      </div>

      {/* Names */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (EN)</label>
          <Input value={item.name_en} onChange={(e) => setItem({ ...item, name_en: e.target.value })} placeholder="Product name" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (AR) — auto-generated</label>
          <Input value={item.name_ar} onChange={(e) => setItem({ ...item, name_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (EN)</label>
          <Textarea value={item.description_en} onChange={(e) => setItem({ ...item, description_en: e.target.value })} rows={3} className="rounded-xl resize-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (AR) — auto-generated</label>
          <Textarea value={item.description_ar} onChange={(e) => setItem({ ...item, description_ar: e.target.value })} rows={3} className="rounded-xl resize-none bg-muted/50" dir="rtl" />
        </div>
      </div>

      {/* Icon & Sort Order */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon</label>
          <div className="space-y-2">
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setItem({ ...item, icon: "Flame" })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  !item.icon.startsWith("http") && !item.icon.startsWith("/") && !item.icon.startsWith("data:")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input text-muted-foreground hover:text-foreground"
                }`}
              >
                Preset Icons
              </button>
              <button
                type="button"
                onClick={() => setItem({ ...item, icon: "" })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  item.icon.startsWith("http") || item.icon.startsWith("/") || item.icon.startsWith("data:") || item.icon === ""
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom Icon
              </button>
            </div>

            {/* Preset dropdown or custom URL/upload */}
            {!item.icon.startsWith("http") && !item.icon.startsWith("/") && !item.icon.startsWith("data:") && item.icon !== "" ? (
              <select
                value={item.icon}
                onChange={(e) => setItem({ ...item, icon: e.target.value })}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={item.icon.startsWith("http") || item.icon.startsWith("/") ? item.icon : ""}
                    onChange={(e) => setItem({ ...item, icon: e.target.value })}
                    placeholder="Paste icon URL (Google Icons, CDN, etc.)"
                    className="rounded-xl flex-1"
                  />
                  <input
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    ref={(el) => { if (el) el.dataset.iconUpload = "true"; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFormFileUpload(file, "images", "icons", (url) => setItem({ ...item, icon: url }));
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[data-icon-upload="true"]') as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={uploading}
                    className="rounded-xl shrink-0"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Upload SVG/PNG/JPG or paste a URL from Google Icons, Font Awesome CDN, etc.</p>
              </div>
            )}

            {/* Icon preview */}
            {item.icon && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">Preview:</span>
                {item.icon.startsWith("http") || item.icon.startsWith("/") || item.icon.startsWith("data:") ? (
                  <img src={item.icon} alt="icon" className="w-8 h-8 object-contain rounded border border-border" />
                ) : (
                  <span className="text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground">{item.icon}</span>
                )}
              </div>
            )}
          </div>
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
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
          {item.image_url ? (
            <div className="mt-2 flex items-center gap-2">
              <img src={item.image_url} alt="Preview" className="h-20 w-32 object-cover rounded-lg border border-border" />
              <span className="text-xs text-green-600 font-medium">✓ Image uploaded</span>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">No image uploaded</p>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem("admin_pw"); setAuthenticated(false); setPassword(""); }} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
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
            { key: "highlight" as TabKey, icon: Star, label: "Highlight Section" },
            { key: "menu-items" as TabKey, icon: List, label: `Product Catalog (${menuItems.length})` },
            { key: "careers" as TabKey, icon: UserPlus, label: `Careers (${careersList.length})` },
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

                {/* Logo Size Slider */}
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">Logo Size</h4>
                  <p className="text-xs text-muted-foreground mb-3">Adjust the logo height across the website ({logoSize}px)</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { label: "Default (56px)", value: 56 },
                      { label: "Medium (80px)", value: 80 },
                      { label: "Large (100px)", value: 100 },
                      { label: "Extra Large (120px)", value: 120 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setLogoSize(preset.value)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          logoSize === preset.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-foreground border-border hover:bg-accent"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-8">32</span>
                    <input
                      type="range"
                      min={32}
                      max={120}
                      step={2}
                      value={logoSize}
                      onChange={(e) => setLogoSize(parseInt(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-8">120</span>
                  </div>
                  {brandLogoUrl && (
                    <div className="mt-3 p-3 bg-secondary rounded-xl flex items-center justify-center">
                      <img src={brandLogoUrl} alt="Preview" className="w-auto object-contain" style={{ height: `${logoSize}px` }} />
                    </div>
                  )}
                  <Button
                    onClick={async () => {
                      try {
                        await apiCall("content", "POST", storedPassword, {
                          content_key: "logo.size",
                          value_en: String(logoSize),
                          value_ar: String(logoSize),
                        });
                        toast.success("Logo size saved! Refresh the main site to see changes.");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="gradient-accent text-accent-foreground rounded-xl border-0 mt-3"
                  >
                    <Save className="w-4 h-4 mr-2" />Save Size
                  </Button>
                </div>
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
                  <Textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Default WhatsApp message (English)..."
                    className="bg-muted/50 border-border text-foreground min-h-[60px]"
                    rows={2}
                  />
                  <Textarea
                    value={whatsappMessageAr}
                    onChange={(e) => setWhatsappMessageAr(e.target.value)}
                    placeholder="رسالة واتساب الافتراضية (عربي)..."
                    className="bg-muted/50 border-border text-foreground min-h-[60px]"
                    dir="rtl"
                    rows={2}
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const cleaned = whatsappNumber.replace(/[^0-9+]/g, "");
                        await Promise.all([
                          apiCall("content", "POST", storedPassword, {
                            content_key: "whatsapp_number",
                            value_en: cleaned,
                            value_ar: cleaned,
                          }),
                          apiCall("content", "POST", storedPassword, {
                            content_key: "whatsapp_message",
                            value_en: whatsappMessage,
                            value_ar: whatsappMessageAr,
                          }),
                        ]);
                        toast.success("WhatsApp settings saved!");
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
                <div className="flex flex-col gap-3">
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
                    className="gradient-accent text-accent-foreground rounded-xl border-0 w-full sm:w-auto"
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

            {/* Hero Visibility Toggles */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Image className="w-4 h-4 text-accent" />
                Hero Section Visibility
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "hero.show_headline", label: "Headline" },
                  { key: "hero.show_subtext", label: "Subtext" },
                  { key: "hero.show_explore_btn", label: "Explore Products Button" },
                  { key: "hero.show_contact_btn", label: "Contact Us Button" },
                  { key: "hero.show_arrows", label: "Navigation Arrows" },
                  { key: "hero.show_dots", label: "Slide Dots" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      heroVisibility[key]
                        ? "bg-accent/10 border-accent/30"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={heroVisibility[key]}
                      onChange={() => handleToggleHeroVisibility(key)}
                      className="w-4 h-4 accent-[hsl(var(--accent))] rounded"
                    />
                    <span className={`text-sm font-medium ${heroVisibility[key] ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Contact Card Visibility Toggles */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                Contact Card Visibility
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "contact_phone_visible", label: "Phone Card", icon: Phone },
                  { key: "contact_email_visible", label: "Email Card", icon: Mail },
                  { key: "contact_address_visible", label: "Address Cards", icon: Globe },
                ].map(({ key, label, icon: Ico }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      contactVisibility[key]
                        ? "bg-accent/10 border-accent/30"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={contactVisibility[key]}
                      onChange={async () => {
                        const newVal = !contactVisibility[key];
                        setContactVisibility((prev) => ({ ...prev, [key]: newVal }));
                        try {
                          await apiCall("content", "POST", storedPassword, {
                            content_key: key,
                            value_en: String(newVal),
                            value_ar: String(newVal),
                          });
                          toast.success(`${label} ${newVal ? "shown" : "hidden"}`);
                        } catch (err: any) { toast.error(err.message); }
                      }}
                      className="w-4 h-4 accent-[hsl(var(--accent))] rounded"
                    />
                    <Ico className="w-4 h-4" />
                    <span className={`text-sm font-medium ${contactVisibility[key] ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Contact Addresses Management */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  Addresses
                </h3>
                <Button
                  size="sm"
                  onClick={() => setEditingAddress({ label_en: "", label_ar: "", is_active: true, sort_order: contactAddresses.length })}
                  className="gradient-accent text-accent-foreground rounded-xl border-0"
                >
                  <Plus className="w-4 h-4 mr-1" />Add Address
                </Button>
              </div>

              {editingAddress && (
                <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">English</label>
                      <Input
                        value={editingAddress.label_en}
                        onChange={(e) => setEditingAddress({ ...editingAddress, label_en: e.target.value })}
                        placeholder="e.g. UAE & India"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Arabic</label>
                      <Input
                        value={editingAddress.label_ar}
                        onChange={(e) => setEditingAddress({ ...editingAddress, label_ar: e.target.value })}
                        placeholder="e.g. الإمارات والهند"
                        className="rounded-xl"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      disabled={translating}
                      variant="outline"
                      onClick={async () => {
                        if (!editingAddress.label_en) return;
                        try {
                          setTranslating(true);
                          const result = await translateTexts({ label_en: editingAddress.label_en });
                          if (result.label_en) setEditingAddress({ ...editingAddress, label_ar: result.label_en });
                          toast.success("Translated");
                        } catch (e: any) { toast.error(e.message); }
                        finally { setTranslating(false); }
                      }}
                      className="rounded-xl"
                    >
                      <Languages className="w-4 h-4 mr-1" />{translating ? "..." : "Translate"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          if (editingAddress.id) {
                            await supabase.from("contact_addresses").update({
                              label_en: editingAddress.label_en,
                              label_ar: editingAddress.label_ar,
                              is_active: editingAddress.is_active,
                              sort_order: editingAddress.sort_order,
                            }).eq("id", editingAddress.id);
                          } else {
                            await supabase.from("contact_addresses").insert({
                              label_en: editingAddress.label_en,
                              label_ar: editingAddress.label_ar,
                              is_active: editingAddress.is_active,
                              sort_order: editingAddress.sort_order,
                            });
                          }
                          toast.success("Address saved");
                          setEditingAddress(null);
                          fetchContactAddresses();
                        } catch (e: any) { toast.error(e.message); }
                      }}
                      className="gradient-accent text-accent-foreground rounded-xl border-0"
                    >
                      <Save className="w-4 h-4 mr-1" />Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingAddress(null)} className="rounded-xl">Cancel</Button>
                  </div>
                </div>
              )}

              {contactAddresses.length === 0 && !editingAddress ? (
                <p className="text-sm text-muted-foreground text-center py-4">No addresses yet. Add one above.</p>
              ) : (
                <div className="space-y-2">
                  {contactAddresses.map((addr) => (
                    <div key={addr.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{addr.label_en}</p>
                          <p className="text-xs text-muted-foreground" dir="rtl">{addr.label_ar}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <span className="text-xs text-muted-foreground">{addr.is_active ? "Active" : "Inactive"}</span>
                          <input
                            type="checkbox"
                            checked={addr.is_active}
                            onChange={async () => {
                              try {
                                await supabase.from("contact_addresses").update({ is_active: !addr.is_active }).eq("id", addr.id);
                                fetchContactAddresses();
                                toast.success(addr.is_active ? "Address hidden" : "Address shown");
                              } catch (e: any) { toast.error(e.message); }
                            }}
                            className="w-4 h-4 accent-[hsl(var(--accent))]"
                          />
                        </label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAddress(addr)}
                          className="rounded-lg h-8 px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await supabase.from("contact_addresses").delete().eq("id", addr.id);
                              fetchContactAddresses();
                              toast.success("Address deleted");
                            } catch (e: any) { toast.error(e.message); }
                          }}
                          className="rounded-lg h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {content.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No content yet. Click "Seed Defaults" to populate.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const grouped: Record<string, ContentItem[]> = {};
                  content.forEach((item) => {
                    const section = item.content_key.split(".")[0] || "other";
                    if (!grouped[section]) grouped[section] = [];
                    grouped[section].push(item);
                  });
                  const sectionLabels: Record<string, string> = {
                    about: "About Section",
                    brand: "Brand",
                    hero: "Hero Section",
                    highlight: "Highlight Section",
                    contact: "Contact Section",
                    footer: "Footer",
                    nav: "Navigation",
                    why: "Why Choose Us",
                    services: "Services",
                    products: "Products",
                  };
                  return Object.entries(grouped).map(([section, items]) => (
                    <div key={section} className="border border-border rounded-2xl overflow-hidden">
                      <div className="bg-secondary/50 px-5 py-3 flex items-center gap-2 border-b border-border">
                        <span className="text-sm font-semibold text-foreground capitalize">{sectionLabels[section] || section}</span>
                        <span className="text-xs text-muted-foreground">({items.length})</span>
                      </div>
                      <div className="divide-y divide-border">
                        {items.map((item) => (
                          <div key={item.id} className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-mono bg-secondary px-3 py-1 rounded-lg text-secondary-foreground">{item.content_key}</span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={translating || !editedContent[item.content_key]?.value_en}
                                  onClick={async () => {
                                    try {
                                      setTranslating(true);
                                      const result = await translateTexts({ value_en: editedContent[item.content_key]?.value_en || "" });
                                      if (result.value_ar) {
                                        updateEditedField(item.content_key, "value_ar", result.value_ar);
                                        toast.success("Arabic translation generated");
                                      }
                                    } catch (e: any) { toast.error(e.message); }
                                    finally { setTranslating(false); }
                                  }}
                                  className="rounded-xl"
                                >
                                  <Languages className="w-4 h-4 mr-1" />
                                  {translating ? "..." : "Translate"}
                                </Button>
                                <Button size="sm" onClick={() => handleSaveContent(item.content_key)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                                  <Save className="w-4 h-4 mr-2" />Save
                                </Button>
                              </div>
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
                    </div>
                  ));
                })()}
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

        {/* ─── Menu Items Tab (Hierarchical Tree) ─────── */}
        {activeTab === "menu-items" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Product Catalog Tree</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage the full product hierarchy: Categories → Sub-products → Children → Grandchildren. Each item can have its own PDF.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditingCategory({ key: "", label_en: "", label_ar: "", sort_order: categories.length })} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Plus className="w-4 h-4 mr-2" />New Category
                </Button>
                <Button variant="outline" size="sm" onClick={() => { fetchMenuItems(); fetchCategories(); }} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>

            {/* New Category form (when creating, no id) */}
            {editingCategory && !editingCategory.id && (
              <div className="bg-card border-2 border-accent/30 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">➕ New Category</h4>
                  <Button
                    variant="outline" size="sm"
                    disabled={translating || !editingCategory.label_en}
                    onClick={async () => {
                      try {
                        setTranslating(true);
                        const result = await translateTexts({ label_en: editingCategory.label_en });
                        setEditingCategory({ ...editingCategory, label_ar: result.label_ar || editingCategory.label_ar });
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
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Key (unique identifier)</label>
                    <Input value={editingCategory.key} onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value })} placeholder="cat.new-category" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (EN)</label>
                    <Input value={editingCategory.label_en} onChange={(e) => setEditingCategory({ ...editingCategory, label_en: e.target.value })} placeholder="Category Name" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (AR) — auto-generated</label>
                    <Input value={editingCategory.label_ar} onChange={(e) => setEditingCategory({ ...editingCategory, label_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveCategory(editingCategory)} disabled={loading || !editingCategory.key || !editingCategory.label_en} className="gradient-accent text-accent-foreground rounded-xl border-0">
                    <Save className="w-3.5 h-3.5 mr-1" />Save Category
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingCategory(null)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            )}

            {/* Inline editor renderer */}
            {(() => {
              const renderInlineEditor = (depth: number) => {
                if (!editingMenuItem) return null;
                const categoryItems = menuItems.filter(m => m.category_key === editingMenuItem.category_key && m.id !== editingMenuItem.id);
                const topLevelItems = categoryItems.filter(m => !m.parent_id);
                const getChildrenOf = (pid: string) => categoryItems.filter(m => m.parent_id === pid);
                const parentOptions: { id: string; label: string; depth: number }[] = [];
                topLevelItems.sort((a, b) => a.sort_order - b.sort_order).forEach(item => {
                  parentOptions.push({ id: item.id!, label: item.name_en, depth: 0 });
                  getChildrenOf(item.id!).sort((a, b) => a.sort_order - b.sort_order).forEach(child => {
                    parentOptions.push({ id: child.id!, label: child.name_en, depth: 1 });
                  });
                });

                return (
                  <div ref={menuEditorRef} className="bg-card border-2 border-accent/30 rounded-2xl p-5 space-y-4" style={{ marginLeft: `${depth * 24}px` }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm">
                        {editingMenuItem.id ? "✏️ Edit" : "➕ New"} Item
                        {editingMenuItem.parent_id && !editingMenuItem.id && (
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            (under {menuItems.find(m => m.id === editingMenuItem.parent_id)?.name_en || "parent"})
                          </span>
                        )}
                      </h3>
                      <Button
                        variant="outline" size="sm"
                        disabled={translating || !editingMenuItem.name_en}
                        onClick={async () => {
                          try {
                            setTranslating(true);
                            const result = await translateTexts({ name_en: editingMenuItem.name_en });
                            setEditingMenuItem({ ...editingMenuItem, name_ar: result.name_ar || editingMenuItem.name_ar });
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
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                        <select
                          value={editingMenuItem.category_key}
                          onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category_key: e.target.value, parent_id: null })}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          {categories.map((cat) => (
                            <option key={cat.key} value={cat.key}>{cat.label_en}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Parent Item</label>
                        <select
                          value={editingMenuItem.parent_id || ""}
                          onChange={(e) => setEditingMenuItem({ ...editingMenuItem, parent_id: e.target.value || null })}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          <option value="">— Top Level (no parent) —</option>
                          {parentOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {"　".repeat(opt.depth)}{"└ ".repeat(opt.depth ? 1 : 0)}{opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (EN)</label>
                        <Input value={editingMenuItem.name_en} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name_en: e.target.value })} placeholder="e.g. Fire Curtains" className="rounded-xl" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (AR) — auto-generated</label>
                        <Input value={editingMenuItem.name_ar} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
                      </div>
                    </div>

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

                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleSaveMenuItem(editingMenuItem)} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                        <Save className="w-4 h-4 mr-2" />Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingMenuItem(null)} className="rounded-xl">Cancel</Button>
                    </div>
                  </div>
                );
              };

              // Determine where editor should show: after which item ID, or at category top level
              const editorParentId = editingMenuItem?.parent_id || null;
              const editorItemId = editingMenuItem?.id || null;
              // "showEditorAfter" = the item id after which the form renders
              // If editing an existing item: show after that item
              // If adding child to a parent: show after that parent's children
              // If adding top-level to category: show at bottom of that category

              return (
                <>
                  {/* Tree List grouped by category */}
                  {menuItems.length === 0 && !editingMenuItem ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <List className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No menu items yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {categories.map((cat) => {
                        const catItems = menuItems.filter((m) => m.category_key === cat.key);
                        const topLevel = catItems.filter(m => !m.parent_id).sort((a, b) => a.sort_order - b.sort_order);
                        const getChildren = (pid: string) => menuItems.filter(m => m.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order);
                        const isEditorForThisCategory = editingMenuItem && editingMenuItem.category_key === cat.key;

                        const renderItem = (item: typeof menuItems[0], depth: number) => {
                          const children = getChildren(item.id);
                          const hasChildren = children.length > 0;
                          const isEditingThis = editingMenuItem && editorItemId === item.id;
                          const isAddingChildHere = editingMenuItem && !editorItemId && editorParentId === item.id;

                          return (
                            <div key={item.id}>
                              {!isEditingThis && (
                                <div
                                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                    depth === 0 ? "bg-card border-border" : depth === 1 ? "bg-secondary/50 border-border/50" : "bg-muted/30 border-border/30"
                                  }`}
                                  style={{ marginLeft: `${depth * 24}px` }}
                                >
                                  <div className="flex items-center gap-1 shrink-0">
                                    {depth > 0 && <span className="text-muted-foreground text-xs select-none">└</span>}
                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                   <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-medium ${(item as any).is_active === false ? "text-muted-foreground line-through" : "text-foreground"} ${depth === 0 ? "text-sm font-bold" : "text-sm"}`}>
                                        {item.name_en}
                                      </span>
                                      <span className="text-xs text-muted-foreground">/ {item.name_ar}</span>
                                      {item.pdf_url ? (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">PDF ✓</span>
                                      ) : (
                                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">No PDF</span>
                                      )}
                                      {hasChildren && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                          {children.length} sub-item{children.length > 1 ? "s" : ""}
                                        </span>
                                      )}
                                      {(item as any).is_active === false && (
                                        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Inactive</span>
                                      )}
                                    </div>
                                   </div>
                                   <div className="flex gap-1 items-center shrink-0">
                                    <label className="flex items-center gap-1 cursor-pointer mr-1" title={(item as any).is_active === false ? "Activate item" : "Deactivate item"}>
                                      <span className="text-[10px] text-muted-foreground">{(item as any).is_active === false ? "Off" : "On"}</span>
                                      <input
                                        type="checkbox"
                                        checked={(item as any).is_active !== false}
                                        onChange={() => handleToggleItemActive(item as MenuChildItem & { id: string })}
                                        className="w-3.5 h-3.5 accent-primary"
                                      />
                                    </label>
                                     <Button
                                       variant="outline" size="sm"
                                       onClick={() => setEditingMenuItem({
                                         ...emptyMenuChild,
                                         category_key: item.category_key,
                                         parent_id: item.id!,
                                         sort_order: children.length,
                                       })}
                                       className="rounded-xl text-xs h-7 px-2"
                                       title="Add child item"
                                     >
                                       <Plus className="w-3 h-3" />
                                     </Button>
                                     <Button variant="outline" size="sm" onClick={() => setEditingMenuItem({ ...item })} className="rounded-xl text-xs h-7">Edit</Button>
                                     <Button variant="ghost" size="sm" onClick={() => handleDeleteMenuItem(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0">
                                       <Trash2 className="w-3.5 h-3.5" />
                                     </Button>
                                   </div>
                                 </div>
                               )}
                              {isEditingThis && renderInlineEditor(depth)}
                              {children.map(child => renderItem(child, depth + 1))}
                              {isAddingChildHere && renderInlineEditor(depth + 1)}
                            </div>
                          );
                        };

                        return (
                          <div key={cat.key}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${cat.is_active === false ? "text-muted-foreground line-through" : "text-accent"}`}>{cat.label_en}</h3>
                                <span className="text-xs text-muted-foreground">/ {cat.label_ar}</span>
                                {cat.is_active === false && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                              </div>
                              <div className="flex gap-1 items-center">
                                <label className="flex items-center gap-1.5 cursor-pointer mr-2" title={cat.is_active === false ? "Activate category" : "Deactivate category"}>
                                  <span className="text-[10px] text-muted-foreground">{cat.is_active === false ? "Off" : "On"}</span>
                                  <input
                                    type="checkbox"
                                    checked={cat.is_active !== false}
                                    onChange={() => handleToggleCategoryActive(cat as CategoryItem & { id: string })}
                                    className="w-4 h-4 accent-primary"
                                  />
                                </label>
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => setEditingMenuItem({
                                    ...emptyMenuChild,
                                    category_key: cat.key,
                                    sort_order: topLevel.length,
                                  })}
                                  className="rounded-xl text-xs h-7"
                                >
                                  <Plus className="w-3 h-3 mr-1" />Add Item
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setEditingCategory({ ...cat })} className="rounded-xl text-xs h-7">Edit</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id!)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            {/* Inline category editor */}
                            {editingCategory && editingCategory.id === cat.id && (
                              <div className="bg-card border-2 border-accent/30 rounded-2xl p-4 mb-3 space-y-3">
                                <h4 className="text-sm font-semibold text-foreground">✏️ Edit Category</h4>
                                <div className="grid md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Key</label>
                                    <Input value={editingCategory.key} onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value })} placeholder="cat.new" className="rounded-xl" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (EN)</label>
                                    <Input value={editingCategory.label_en} onChange={(e) => setEditingCategory({ ...editingCategory, label_en: e.target.value })} placeholder="Category Name" className="rounded-xl" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (AR)</label>
                                    <Input value={editingCategory.label_ar} onChange={(e) => setEditingCategory({ ...editingCategory, label_ar: e.target.value })} placeholder="auto-generated" className="rounded-xl bg-muted/50" dir="rtl" />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveCategory(editingCategory)} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                                    <Save className="w-3.5 h-3.5 mr-1" />Save
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setEditingCategory(null)} className="rounded-xl">Cancel</Button>
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              {topLevel.map(item => renderItem(item, 0))}
                              {/* Show editor at bottom of category if adding top-level item here */}
                              {isEditorForThisCategory && !editorItemId && !editorParentId && renderInlineEditor(0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ─── Highlight Tab ─────── */}
        {activeTab === "highlight" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Highlight Section</h2>
              <Button variant="outline" size="sm" onClick={fetchHighlight} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>

            <div className="space-y-6">
              {/* Text Content — managed via Site Content tab */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Text Content</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Edit the highlight section text (tagline, title, description, sub-description) in the <button className="text-accent underline" onClick={() => setActiveTab("content")}>Site Content</button> tab under the "Highlight" group.
                </p>
              </div>

              {/* Image Upload */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Section Image</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload an image that appears on the right side of the highlight section.</p>
                
                {highlightImage && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-border max-w-md">
                    <img src={highlightImage} alt="Highlight" className="w-full aspect-[4/3] object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Input
                    value={highlightImage}
                    onChange={(e) => setHighlightImage(e.target.value)}
                    placeholder="Image URL or upload"
                    className="rounded-xl flex-1 max-w-md"
                  />
                  <input
                    ref={highlightImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setUploading(true);
                          const url = await uploadFileAndGetUrl(file, "images", "highlight", storedPassword);
                          setHighlightImage(url);
                          toast.success("Image uploaded");
                        } catch (err: any) { toast.error(err.message); }
                        finally { setUploading(false); }
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => highlightImageRef.current?.click()} disabled={uploading} className="rounded-xl">
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await apiCall("content", "POST", storedPassword, {
                        content_key: "highlight.image",
                        value_en: highlightImage,
                        value_ar: highlightImage,
                      });
                      toast.success("Image saved!");
                    } catch (err: any) { toast.error(err.message); }
                  }}
                  className="gradient-accent text-accent-foreground rounded-xl border-0 mt-3"
                >
                  <Save className="w-4 h-4 mr-2" />Save Image
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Stat Cards</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHighlightStats([...highlightStats, { icon: "Award", value_en: "", value_ar: "", label_en: "", label_ar: "" }])}
                    className="rounded-xl"
                    disabled={highlightStats.length >= 4}
                  >
                    <Plus className="w-4 h-4 mr-1" />Add Stat
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">These appear as overlay cards on the image. Maximum 4 stats recommended.</p>

                <div className="space-y-4">
                  {highlightStats.map((stat, i) => (
                    <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Stat #{i + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHighlightStats(highlightStats.filter((_, idx) => idx !== i))}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0"
                          disabled={highlightStats.length <= 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                          <select
                            value={stat.icon}
                            onChange={(e) => {
                              const updated = [...highlightStats];
                              updated[i] = { ...stat, icon: e.target.value };
                              setHighlightStats(updated);
                            }}
                            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                          >
                            {["Award", "TrendingUp", "Users", "Clock"].map((ic) => (
                              <option key={ic} value={ic}>{ic}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Value (EN)</label>
                          <Input
                            value={stat.value_en}
                            onChange={(e) => {
                              const updated = [...highlightStats];
                              updated[i] = { ...stat, value_en: e.target.value };
                              setHighlightStats(updated);
                            }}
                            placeholder="e.g. 100%"
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Value (AR)</label>
                          <Input
                            value={stat.value_ar}
                            onChange={(e) => {
                              const updated = [...highlightStats];
                              updated[i] = { ...stat, value_ar: e.target.value };
                              setHighlightStats(updated);
                            }}
                            placeholder="e.g. ١٠٠٪"
                            className="rounded-xl bg-muted/50"
                            dir="rtl"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (EN)</label>
                          <Input
                            value={stat.label_en}
                            onChange={(e) => {
                              const updated = [...highlightStats];
                              updated[i] = { ...stat, label_en: e.target.value };
                              setHighlightStats(updated);
                            }}
                            placeholder="e.g. Quality Assurance"
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (AR)</label>
                          <Input
                            value={stat.label_ar}
                            onChange={(e) => {
                              const updated = [...highlightStats];
                              updated[i] = { ...stat, label_ar: e.target.value };
                              setHighlightStats(updated);
                            }}
                            placeholder="e.g. ضمان الجودة"
                            className="rounded-xl bg-muted/50"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={async () => {
                    try {
                      await apiCall("content", "POST", storedPassword, {
                        content_key: "highlight.stats",
                        value_en: JSON.stringify(highlightStats),
                        value_ar: JSON.stringify(highlightStats),
                      });
                      toast.success("Stats saved!");
                    } catch (err: any) { toast.error(err.message); }
                  }}
                  className="gradient-accent text-accent-foreground rounded-xl border-0 mt-4"
                >
                  <Save className="w-4 h-4 mr-2" />Save Stats
                </Button>
              </div>
            </div>
          </div>
        )}


        {/* ─── Careers Tab ──────── */}
        {activeTab === "careers" && (
          <div className="space-y-8">

            {/* ── Banner & Hero Text ── */}
            <div className="bg-secondary/40 border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Image className="w-4 h-4" /> Banner & Hero Text
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Banner Image</label>
                  <div className="flex items-center gap-4">
                    {careersBannerUrl && (
                      <img src={careersBannerUrl} alt="Banner" className="w-32 h-20 object-cover rounded-xl border border-border" />
                    )}
                    <input ref={careersBannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUploadCareersBanner(e.target.files)} />
                    <Button variant="outline" size="sm" onClick={() => careersBannerRef.current?.click()} disabled={careersBannerUploading} className="rounded-xl">
                      <Upload className={`w-4 h-4 mr-2 ${careersBannerUploading ? "animate-spin" : ""}`} />
                      {careersBannerUploading ? "Uploading..." : "Upload Banner"}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Hero Title (English)</label>
                  <Input value={careersHeroTitle} onChange={(e) => setCareersHeroTitle(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Hero Subtitle (English)</label>
                  <Textarea value={careersHeroSubtitle} onChange={(e) => setCareersHeroSubtitle(e.target.value)} rows={2} className="rounded-xl" />
                </div>
                <Button onClick={handleSaveCareersHero} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Save className="w-4 h-4 mr-2" />{loading ? "Saving..." : "Save Hero Text"}
                </Button>
              </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="bg-secondary/40 border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Stats Bar
              </h3>
              <p className="text-xs text-muted-foreground mb-4">The first two stats (Open Positions & Departments) are auto-calculated. Manage the additional stats below.</p>
              <div className="space-y-3">
                {careersStats.map((stat, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Value (EN)</label>
                      <Input value={stat.value_en} onChange={(e) => { const s = [...careersStats]; s[i] = { ...s[i], value_en: e.target.value }; setCareersStats(s); }} className="rounded-xl" placeholder="e.g. 5+" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (EN)</label>
                      <Input value={stat.label_en} onChange={(e) => { const s = [...careersStats]; s[i] = { ...s[i], label_en: e.target.value }; setCareersStats(s); }} className="rounded-xl" placeholder="e.g. Countries" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCareersStats(careersStats.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-9 w-9 p-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setCareersStats([...careersStats, { value_en: "", value_ar: "", label_en: "", label_ar: "" }])} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />Add Stat
                </Button>
                <Button onClick={handleSaveCareersStats} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Save className="w-4 h-4 mr-2" />{loading ? "Saving..." : "Save Stats"}
                </Button>
              </div>
            </div>

            {/* ── Why Join Us Cards ── */}
            <div className="bg-secondary/40 border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" /> Why Join Us Cards
              </h3>
              <div className="space-y-4">
                {careersPerks.map((perk, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">Card {i + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => setCareersPerks(careersPerks.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                        <div className="flex flex-wrap gap-1.5">
                          {PERK_ICON_OPTIONS.map((ic) => {
                            const Ic = icons[ic as keyof typeof icons];
                            return Ic ? (
                              <button
                                key={ic}
                                type="button"
                                title={ic}
                                onClick={() => { const p = [...careersPerks]; p[i] = { ...p[i], icon: ic }; setCareersPerks(p); }}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${perk.icon === ic ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground"}`}
                              >
                                <Ic className="w-4 h-4" />
                              </button>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
                        <Input value={perk.title_en} onChange={(e) => { const p = [...careersPerks]; p[i] = { ...p[i], title_en: e.target.value }; setCareersPerks(p); }} className="rounded-xl" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (EN)</label>
                        <Input value={perk.desc_en} onChange={(e) => { const p = [...careersPerks]; p[i] = { ...p[i], desc_en: e.target.value }; setCareersPerks(p); }} className="rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setCareersPerks([...careersPerks, { icon: "Star", title_en: "", title_ar: "", desc_en: "", desc_ar: "" }])} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />Add Card
                </Button>
                <Button onClick={handleSaveCareersPerks} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Save className="w-4 h-4 mr-2" />{loading ? "Saving..." : "Save Cards"}
                </Button>
              </div>
            </div>

            {/* ── Job Listings ── */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Career Listings</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingCareer({ ...emptyCareer, sort_order: careersList.length })} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />Add Position
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchCareers} disabled={loading} className="rounded-xl">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                Manage job openings displayed on the Careers page. Only active listings are shown publicly. Arabic fields are auto-translated from English.
              </p>

              {/* Career Editor */}
              {editingCareer && (
                <div ref={careerEditorRef} className="bg-secondary/40 border border-border rounded-2xl p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    {(editingCareer as any).id ? "Edit Position" : "New Position"}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title (English)</label>
                      <Input
                        value={editingCareer.title_en}
                        onChange={(e) => setEditingCareer({ ...editingCareer, title_en: e.target.value })}
                        placeholder="e.g. Senior Mechanical Engineer"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Department (English)</label>
                      <Input
                        value={editingCareer.department_en}
                        onChange={(e) => setEditingCareer({ ...editingCareer, department_en: e.target.value })}
                        placeholder="e.g. Engineering"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Location (English)</label>
                      <Input
                        value={editingCareer.location_en}
                        onChange={(e) => setEditingCareer({ ...editingCareer, location_en: e.target.value })}
                        placeholder="e.g. Riyadh, Saudi Arabia"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Employment Type (English)</label>
                      <Input
                        value={editingCareer.type_en}
                        onChange={(e) => setEditingCareer({ ...editingCareer, type_en: e.target.value })}
                        placeholder="e.g. Full-time"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Description (English)</label>
                      <Textarea
                        value={editingCareer.description_en}
                        onChange={(e) => setEditingCareer({ ...editingCareer, description_en: e.target.value })}
                        placeholder="Describe the role, responsibilities, and what the candidate will do..."
                        rows={5}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Requirements (English)</label>
                      <Textarea
                        value={editingCareer.requirements_en}
                        onChange={(e) => setEditingCareer({ ...editingCareer, requirements_en: e.target.value })}
                        placeholder="List qualifications, skills, and experience required..."
                        rows={5}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
                      <Input
                        type="number"
                        value={editingCareer.sort_order}
                        onChange={(e) => setEditingCareer({ ...editingCareer, sort_order: Number(e.target.value) })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <label className="text-xs font-medium text-muted-foreground">Active</label>
                      <button
                        onClick={() => setEditingCareer({ ...editingCareer, is_active: !editingCareer.is_active })}
                        className={`w-10 h-6 rounded-full transition-colors ${editingCareer.is_active ? "bg-accent" : "bg-muted-foreground/30"} relative`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${editingCareer.is_active ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleSaveCareer(editingCareer)} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                      <Save className="w-4 h-4 mr-2" />{loading ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingCareer(null)} className="rounded-xl">Cancel</Button>
                  </div>
                </div>
              )}

              {/* Career Listings */}
              {careersList.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No career listings yet. Add your first position!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {careersList.map((career) => (
                    <div
                      key={career.id}
                      className={`bg-card border rounded-2xl p-4 flex items-center justify-between gap-4 ${career.is_active ? "border-border" : "border-border opacity-50"}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">{career.title_en}</span>
                          {!career.is_active && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <span>{career.department_en}</span>
                          <span>·</span>
                          <span>{career.location_en}</span>
                          <span>·</span>
                          <span>{career.type_en}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setEditingCareer(career)} className="rounded-lg h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCareer(career.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


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
              {selectedFolder.folder === "hero" && " Toggle images on/off to control which ones appear in the homepage slider."}
              {selectedFolder.folder === "products" && " Name files product-fire.jpg, product-roller.jpg, etc. for product cards."}
            </p>

            {selectedFolder.folder === "hero" && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/50 rounded-xl">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Slide Speed:</span>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={1}
                  value={heroSpeed}
                  onChange={(e) => setHeroSpeed(Number(e.target.value))}
                  onMouseUp={(e) => saveHeroSpeed(Number((e.target as HTMLInputElement).value))}
                  onTouchEnd={(e) => saveHeroSpeed(Number((e.target as HTMLInputElement).value))}
                  className="flex-1 accent-accent h-1.5"
                />
                <span className="text-xs font-semibold text-foreground min-w-[3rem] text-center">{heroSpeed}s</span>
              </div>
            )}

            {files.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No files in this folder yet. Upload some!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file) => {
                  const isHeroFolder = selectedFolder.folder === "hero";
                  const isActive = activeHeroImages.includes(file.name);
                  return (
                    <div key={file.id || file.name} className={`bg-card border rounded-2xl overflow-hidden group ${isHeroFolder && isImage(file.name) ? (isActive ? "border-accent ring-2 ring-accent/30" : "border-border opacity-60") : "border-border"}`}>
                      {isImage(file.name) ? (
                        <div className="aspect-video bg-muted relative">
                          <img src={getPublicUrl(file.name)} alt={file.name} className="w-full h-full object-cover" />
                          {isHeroFolder && (
                            <button
                              onClick={() => toggleHeroImageActive(file.name)}
                              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? "bg-accent text-accent-foreground shadow-md" : "bg-card/80 text-muted-foreground border border-border backdrop-blur-sm"}`}
                              title={isActive ? "Active – click to hide" : "Inactive – click to show"}
                            >
                              {isActive ? "✓" : "○"}
                            </button>
                          )}
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <PdfViewerDialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen} src={pdfPreviewUrl} />
    </div>
  );
}
