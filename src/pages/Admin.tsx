import { useState, useEffect, useCallback, useRef } from "react";
import SEOHead from "@/components/SEOHead";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Lock, Trash2, Save, RefreshCw, Database, FileText, MessageSquare,
  LogOut, Image, Upload, Plus, Package, Briefcase, GripVertical, List, Palette, Languages, Sun, Moon,
  Star, Award, TrendingUp, Users, Clock, Globe, Phone, Mail, UserPlus, Heart,
  Zap, Shield, icons, FileImage, Inbox, Building,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import { supabase } from "@/integrations/supabase/client";
import ProductTreeEditor from "@/components/admin/ProductTreeEditor";
import PhoneInput from "@/components/PhoneInput";
import { checkServiceImages, type ServiceImageIssue } from "@/lib/serviceImageCheck";
import { AlertTriangle } from "lucide-react";
import drawingImg from "@/assets/services/drawing.jpg";
import installationImg from "@/assets/services/installation.jpg";
import maintenanceImg from "@/assets/services/maintenance.jpg";
import consultingImg from "@/assets/services/consulting.jpg";

const ASSET_PREVIEW_MAP: Record<string, string> = {
  "asset:drawing": drawingImg,
  "asset:installation": installationImg,
  "asset:maintenance": maintenanceImg,
  "asset:consulting": consultingImg,
};

const resolvePreviewUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("asset:")) return ASSET_PREVIEW_MAP[url] || "";
  return url;
};

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
  image_url: string | null;
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
  { content_key: "contact.tag", value_en: "Get in Touch", value_ar: "تواصل معنا" },
  { content_key: "contact.title", value_en: "Let's Build Something Great", value_ar: "لنبني شيئاً رائعاً معاً" },
  { content_key: "contact.desc", value_en: "Ready to upgrade your industrial infrastructure? Send us a message and our team will respond within 24 hours.", value_ar: "هل أنت مستعد لتطوير بنيتك التحتية الصناعية؟ أرسل لنا رسالة وسيرد فريقنا خلال 24 ساعة." },
  { content_key: "contact_phone", value_en: "+966 XX XXX XXXX", value_ar: "+966 XX XXX XXXX" },
  { content_key: "contact_phone_label", value_en: "Phone Number", value_ar: "رقم الهاتف" },
  { content_key: "contact_phone_icon", value_en: "Phone", value_ar: "Phone" },
  { content_key: "contact_email", value_en: "info@energyinnvo.com", value_ar: "info@energyinnvo.com" },
  { content_key: "contact_email_label", value_en: "Email Address", value_ar: "البريد الإلكتروني" },
  { content_key: "contact_email_icon", value_en: "Mail", value_ar: "Mail" },
  { content_key: "contact_address", value_en: "Riyadh, Saudi Arabia", value_ar: "الرياض، المملكة العربية السعودية" },
  { content_key: "contact_address_label", value_en: "Our Location", value_ar: "موقعنا" },
  { content_key: "contact_address_icon", value_en: "Globe", value_ar: "Globe" },
  { content_key: "footer.email", value_en: "info@energyinnovation.com", value_ar: "info@energyinnovation.com" },
  { content_key: "footer.phone", value_en: "+1 (555) 000-0000", value_ar: "+1 (555) 000-0000" },
  { content_key: "footer.address", value_en: "Industrial District, Building 7", value_ar: "المنطقة الصناعية، مبنى 7" },
  { content_key: "footer.desc", value_en: "Premium industrial technology solutions for modern facilities worldwide.", value_ar: "حلول تكنولوجيا صناعية متميزة للمنشآت الحديثة حول العالم." },
  { content_key: "footer.social_linkedin", value_en: "https://linkedin.com", value_ar: "https://linkedin.com" },
  { content_key: "footer.social_twitter", value_en: "https://x.com", value_ar: "https://x.com" },
  { content_key: "footer.social_facebook", value_en: "https://facebook.com", value_ar: "https://facebook.com" },
  { content_key: "footer.social_instagram", value_en: "https://instagram.com", value_ar: "https://instagram.com" },
  { content_key: "footer.social_youtube", value_en: "https://youtube.com", value_ar: "https://youtube.com" },
  { content_key: "footer.contact_email", value_en: "info@energyinnvo.com", value_ar: "info@energyinnvo.com" },
  { content_key: "footer.contact_website", value_en: "www.energyinnvo.com", value_ar: "www.energyinnvo.com" },
  { content_key: "footer.address_1_heading", value_en: "Industrial District, Building 7", value_ar: "المنطقة الصناعية، مبنى 7" },
  { content_key: "footer.address_1_body", value_en: "Office No. BC-891284, 26th Floor,\nAmber Gem Tower, Ajman, UAE.", value_ar: "مكتب رقم BC-891284، الطابق 26،\nبرج أمبر جيم، عجمان، الإمارات." },
  { content_key: "footer.address_2_heading", value_en: "India Branch:", value_ar: "فرع الهند:" },
  { content_key: "footer.address_2_body", value_en: "Office 167, Chetpet,\nTamil Nadu, India.", value_ar: "مكتب 167، شيتبيت،\nتاميل نادو، الهند." },
  { content_key: "contact_phone_visible", value_en: "true", value_ar: "true" },
  { content_key: "contact_email_visible", value_en: "true", value_ar: "true" },
  { content_key: "contact_address_visible", value_en: "true", value_ar: "true" },
  // Email template settings
  { content_key: "email.brand_name", value_en: "Energy Innvo", value_ar: "Energy Innvo" },
  { content_key: "email.tagline", value_en: "Industrial Solutions & Innovation", value_ar: "حلول صناعية وابتكار" },
  { content_key: "email.logo_url", value_en: "", value_ar: "" },
  { content_key: "email.banner_url", value_en: "", value_ar: "" },
  { content_key: "email.lead_subject", value_en: "Thank you for contacting Energy Innvo, {{name}}!", value_ar: "شكراً لتواصلك مع Energy Innvo، {{name}}!" },
  { content_key: "email.lead_heading", value_en: "Thank You for Reaching Out!", value_ar: "شكراً لتواصلك معنا!" },
  { content_key: "email.lead_body", value_en: "We have received your message and our team will get back to you as soon as possible. We appreciate your interest in Energy Innvo and look forward to assisting you.", value_ar: "لقد تلقينا رسالتك وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن. نقدر اهتمامك بـ Energy Innvo ونتطلع لمساعدتك." },
  { content_key: "email.enquiry_subject", value_en: "Your enquiry about {{product}} has been received!", value_ar: "تم استلام استفسارك حول {{product}}!" },
  { content_key: "email.enquiry_heading", value_en: "Product Enquiry Received!", value_ar: "تم استلام استفسار المنتج!" },
  { content_key: "email.enquiry_body", value_en: "Thank you for your interest in {{product}}. Our team has received your enquiry and will review your requirements shortly. We'll get back to you with the information you need.", value_ar: "شكراً لاهتمامك بـ {{product}}. لقد تلقى فريقنا استفسارك وسيراجع متطلباتك قريباً. سنتواصل معك بالمعلومات التي تحتاجها." },
  { content_key: "email.primary_color", value_en: "#f97316", value_ar: "#f97316" },
];

const IMAGE_FOLDERS = [
  { label: "Hero Images", bucket: "images", folder: "hero" },
  { label: "Product Images", bucket: "images", folder: "products" },
  { label: "PDFs", bucket: "pdfs", folder: "" },
];

async function apiCall(path: string, method: string, password: string, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

// Upload a file and return the public URL (auto-converts images to WebP)
async function uploadFileAndGetUrl(
  file: File,
  bucket: string,
  folder: string,
  password: string
): Promise<string> {
  // Convert images to WebP for smaller file sizes & faster loading
  const { convertToWebP } = await import("@/lib/image-utils");
  const optimized = await convertToWebP(file);
  const base64 = await fileToBase64(optimized);
  const filePath = folder ? `${folder}/${optimized.name}` : optimized.name;
  const result = await apiCall("upload", "POST", password, {
    bucket,
    filePath,
    base64,
    contentType: optimized.type,
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

type TabKey = "leads" | "content" | "products" | "services" | "images" | "branding" | "highlight" | "careers" | "admin-emails" | "product-enquiries" | "footer" | "contact" | "email-templates" | "seo" | "partners";

const emptyMenuChild: MenuChildItem = {
  category_key: "cat.fire", parent_id: null, name_en: "", name_ar: "", pdf_url: null, image_url: null, sort_order: 0, is_active: true,
};

export default function Admin() {
  const { theme, toggleTheme } = useTheme();
  const [password, setPassword] = useState(() => sessionStorage.getItem("admin_pw") || "");
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem("admin_pw"));
  const [isViewer, setIsViewer] = useState(() => sessionStorage.getItem("admin_role") === "viewer");
  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const [adminEmails, setAdminEmails] = useState<{ id: string; email: string; label: string; is_active: boolean }[]>([]);
  const [editingAdminEmail, setEditingAdminEmail] = useState<{ id?: string; email: string; label: string; is_active: boolean } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, { value_en: string; value_ar: string }>>({});

  // Products & Services state
  const [products, setProducts] = useState<(ProductItem & { id: string })[]>([]);
  const [services, setServices] = useState<(ServiceItem & { id: string })[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceImageIssues, setServiceImageIssues] = useState<ServiceImageIssue[]>([]);
  const [checkingServiceImages, setCheckingServiceImages] = useState(false);

  // Partners state
  type PartnerItem = { id?: string; name_en: string; name_ar: string; logo_url: string | null; website_url: string | null; sort_order: number; is_active: boolean };
  const [partners, setPartners] = useState<(PartnerItem & { id: string })[]>([]);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [partnersTag, setPartnersTag] = useState("Our Partners");
  const [partnersTitle, setPartnersTitle] = useState("Trusted by Industry Leaders");
  const [partnersSubtitle, setPartnersSubtitle] = useState("We collaborate with world-class brands to deliver excellence.");
  const partnerLogoRef = useRef<HTMLInputElement>(null);

  // Menu Items state
  const [menuItems, setMenuItems] = useState<(MenuChildItem & { id: string })[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuChildItem | null>(null);
  const [categories, setCategories] = useState<(CategoryItem & { id: string })[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const menuItemPdfRef = useRef<HTMLInputElement>(null);
  const menuItemImgRef = useRef<HTMLInputElement>(null);
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
  const [mobileLogoSize, setMobileLogoSize] = useState(40);
  const [floatingMobileBottom, setFloatingMobileBottom] = useState(80);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("Hello, I'm interested in your products and services.");
  const [whatsappMessageAr, setWhatsappMessageAr] = useState("مرحبًا، أنا مهتم بمنتجاتكم وخدماتكم.");
  const [floatingEmail, setFloatingEmail] = useState("");
  const [emailActive, setEmailActive] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinActive, setLinkedinActive] = useState(false);
  const [imageOptimization, setImageOptimization] = useState(false);

  // SEO state
  const [seoDescription, setSeoDescription] = useState({ en: "", ar: "" });
  const [seoSaving, setSeoSaving] = useState(false);

  // Contact addresses state
  const [contactAddresses, setContactAddresses] = useState<{ id: string; label_en: string; label_ar: string; is_active: boolean; sort_order: number }[]>([]);
  const [editingAddress, setEditingAddress] = useState<{ id?: string; label_en: string; label_ar: string; is_active: boolean; sort_order: number } | null>(null);
  const [contactVisibility, setContactVisibility] = useState<Record<string, boolean>>({
    contact_phone_visible: true,
    contact_email_visible: true,
    contact_address_visible: true,
  });

  const [highlightImage, setHighlightImage] = useState("");
  const [highlightImages, setHighlightImages] = useState<string[]>([]);
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
    status: string;
  }
  const emptyCareer: CareerItem = {
    title_en: "", title_ar: "", department_en: "", department_ar: "",
    location_en: "", location_ar: "", type_en: "Full-time", type_ar: "دوام كامل",
    description_en: "", description_ar: "", requirements_en: "", requirements_ar: "",
    is_active: true, sort_order: 0, status: "open",
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

  // Product Pages state
  interface ProductPageItem {
    id?: string;
    product_item_id: string;
    headline_en: string;
    headline_ar: string;
    description_en: string;
    description_ar: string;
    sub_description_en: string;
    sub_description_ar: string;
    is_active: boolean;
    product_items?: { name_en: string; name_ar: string; category_key: string; parent_id: string | null };
  }
  interface PageImageItem {
    id?: string;
    product_page_id: string;
    image_url: string;
    sort_order: number;
  }
  interface ProductEnquiryItem {
    id: string;
    product_item_id: string | null;
    product_name: string;
    name: string;
    email: string;
    company: string | null;
    requirement: string;
    created_at: string;
  }
  const [productPages, setProductPages] = useState<(ProductPageItem & { id: string })[]>([]);
  const [editingPage, setEditingPage] = useState<ProductPageItem | null>(null);
  const [pageImages, setPageImages] = useState<(PageImageItem & { id: string })[]>([]);
  const [productEnquiries, setProductEnquiries] = useState<ProductEnquiryItem[]>([]);
  const pageImageRef = useRef<HTMLInputElement>(null);
  const pageEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingPage && pageEditorRef.current) {
      setTimeout(() => pageEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [editingPage]);
  const PERK_ICON_OPTIONS = ["TrendingUp", "Heart", "Users", "Shield", "Star", "Award", "Globe", "Zap", "Clock", "Briefcase", "Phone", "Mail", "UserPlus", "Package", "Sun", "Moon", "FileText", "MessageSquare", "Database", "Palette"];

  const prevEditingCareerRef = useRef<boolean>(false);
  useEffect(() => {
    const isEditing = !!editingCareer;
    if (isEditing && !prevEditingCareerRef.current && careerEditorRef.current) {
      setTimeout(() => careerEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
    prevEditingCareerRef.current = isEditing;
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

  const fetchSeo = useCallback(async () => {
    try {
      const data = await apiCall("content", "GET", storedPassword);
      const seoRow = data.find((item: ContentItem) => item.content_key === "seo.description");
      if (seoRow) setSeoDescription({ en: seoRow.value_en, ar: seoRow.value_ar });
    } catch (e: any) { toast.error(e.message); }
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

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("partners", "GET", storedPassword);
      setPartners(data);
      // Load section text from site_content
      const content = await apiCall("content", "GET", storedPassword);
      const tag = content.find((c: ContentItem) => c.content_key === "partners.tag");
      const title = content.find((c: ContentItem) => c.content_key === "partners.title");
      const sub = content.find((c: ContentItem) => c.content_key === "partners.subtitle");
      if (tag) setPartnersTag(tag.value_en || "");
      if (title) setPartnersTitle(title.value_en || "");
      if (sub) setPartnersSubtitle(sub.value_en || "");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const handleSavePartner = async (item: PartnerItem) => {
    try {
      setLoading(true);
      let name_ar = item.name_ar;
      if (!name_ar && item.name_en) {
        try {
          const result = await translateTexts({ name: item.name_en });
          name_ar = result.name || item.name_en;
        } catch { name_ar = item.name_en; }
      }
      await apiCall("partners", "POST", storedPassword, { ...item, name_ar });
      toast.success("Partner saved");
      setEditingPartner(null);
      fetchPartners();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm("Delete this partner?")) return;
    try {
      await apiCall("partners", "DELETE", storedPassword, { id });
      toast.success("Partner deleted");
      fetchPartners();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSavePartnersText = async () => {
    try {
      setLoading(true);
      let tagAr = "", titleAr = "", subtitleAr = "";
      try {
        const result = await translateTexts({ tag: partnersTag, title: partnersTitle, subtitle: partnersSubtitle });
        tagAr = result.tag || partnersTag;
        titleAr = result.title || partnersTitle;
        subtitleAr = result.subtitle || partnersSubtitle;
      } catch { /* proceed */ }
      await apiCall("content", "POST", storedPassword, { content_key: "partners.tag", value_en: partnersTag, value_ar: tagAr });
      await apiCall("content", "POST", storedPassword, { content_key: "partners.title", value_en: partnersTitle, value_ar: titleAr });
      await apiCall("content", "POST", storedPassword, { content_key: "partners.subtitle", value_en: partnersSubtitle, value_ar: subtitleAr });
      toast.success("Section text saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

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
          const stem = file.name.replace(/\.[^.]+$/, "");
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
            const parsed = JSON.parse(entry.value_en);
            const validSelections = Array.isArray(parsed)
              ? parsed.filter((name): name is string => typeof name === "string" && fileList.some((file) => file.name === name))
              : [];
            setActiveHeroImages(validSelections);
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
      const mobileSizeEntry = data.find((d: ContentItem) => d.content_key === "header.mobile_logo_size");
      if (mobileSizeEntry) setMobileLogoSize(parseInt(mobileSizeEntry.value_en) || 40);
      const floatingBottomEntry = data.find((d: ContentItem) => d.content_key === "floating.mobile_bottom");
      if (floatingBottomEntry) setFloatingMobileBottom(parseInt(floatingBottomEntry.value_en) || 80);
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
      const liEntry = data.find((d: ContentItem) => d.content_key === "linkedin_url");
      if (liEntry) setLinkedinUrl(liEntry.value_en);
      const liActive = data.find((d: ContentItem) => d.content_key === "linkedin_active");
      setLinkedinActive(liActive?.value_en === "true");

      const imgOptEntry = data.find((d: ContentItem) => d.content_key === "settings.image_optimization");
      setImageOptimization(imgOptEntry?.value_en === "true");

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
      const multiEntry = data.find((d: ContentItem) => d.content_key === "highlight.images");
      if (multiEntry?.value_en) {
        try { setHighlightImages(JSON.parse(multiEntry.value_en)); } catch { /* keep empty */ }
      } else if (imgEntry?.value_en) {
        setHighlightImages([imgEntry.value_en]);
      }
      const statsEntry = data.find((d: ContentItem) => d.content_key === "highlight.stats");
      if (statsEntry?.value_en) {
        try { setHighlightStats(JSON.parse(statsEntry.value_en)); } catch { /* keep defaults */ }
      }
    } catch { /* ignore */ }
  }, [storedPassword]);

  const fetchContactAddresses = useCallback(async () => {
    try {
      const data = await apiCall("contact-addresses", "GET", storedPassword);
      setContactAddresses(data);
    } catch { /* ignore */ }
  }, [storedPassword]);

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

  const fetchAdminEmails = useCallback(async () => {
    try {
      const data = await apiCall("admin-emails", "GET", storedPassword);
      setAdminEmails(data);
    } catch (e: any) { toast.error(e.message); }
  }, [storedPassword]);

  const fetchProductPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("product-pages", "GET", storedPassword);
      setProductPages(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchProductEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("product-enquiries", "GET", storedPassword);
      setProductEnquiries(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [storedPassword]);

  const fetchPageImages = useCallback(async (pageId: string) => {
    try {
      const data = await apiCall(`product-page-images?page_id=${pageId}`, "GET", storedPassword);
      setPageImages(data);
    } catch (e: any) { toast.error(e.message); }
  }, [storedPassword]);

  useEffect(() => {
    if (authenticated) {
      if (activeTab === "leads") fetchLeads();
      else if (activeTab === "content") { fetchContent(); fetchContactAddresses(); }
      else if (activeTab === "products") { /* handled by ProductTreeEditor */ }
      else if (activeTab === "services") fetchServices();
      else if (activeTab === "branding") fetchBranding();
      else if (activeTab === "highlight") fetchHighlight();
      else if (activeTab === "careers") { fetchCareers(); fetchCareersContent(); }
      else if (activeTab === "admin-emails") fetchAdminEmails();
      else if (activeTab === "product-enquiries") fetchProductEnquiries();
      else if (activeTab === "footer") fetchContent();
      else if (activeTab === "contact") { fetchContent(); fetchContactAddresses(); }
      else if (activeTab === "email-templates") fetchContent();
      else if (activeTab === "seo") fetchSeo();
      else if (activeTab === "partners") fetchPartners();
      else fetchFiles();
    }
  }, [authenticated, activeTab, fetchLeads, fetchContent, fetchContactAddresses, fetchProducts, fetchServices, fetchMenuItems, fetchCategories, fetchFiles, fetchBranding, fetchHighlight, fetchCareers, fetchCareersContent, fetchAdminEmails, fetchProductPages, fetchProductEnquiries]);

  // Validate service images whenever the services list changes
  useEffect(() => {
    if (activeTab !== "services" || services.length === 0) {
      setServiceImageIssues([]);
      return;
    }
    let cancelled = false;
    setCheckingServiceImages(true);
    checkServiceImages(services).then((issues) => {
      if (!cancelled) setServiceImageIssues(issues);
    }).finally(() => {
      if (!cancelled) setCheckingServiceImages(false);
    });
    return () => { cancelled = true; };
  }, [activeTab, services]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roleData = await apiCall("auth-role", "GET", password);
      sessionStorage.setItem("admin_pw", password);
      sessionStorage.setItem("admin_role", roleData.role);
      setAuthenticated(true);
      setIsViewer(roleData.role === "viewer");
      toast.success(roleData.role === "viewer" ? "Logged in (View Only)" : "Logged in successfully");
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
          const stem = file.name.replace(/\.[^.]+$/, "");
          const duplicate = files.find(
            (f) => f.name !== file.name && f.name.replace(/\.[^.]+$/, "") === stem
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
        const stem = fileName.replace(/\.[^.]+$/, "");
        // Fetch full file list to find all variants
        const allFiles = await apiCall(
          `files?bucket=${selectedFolder.bucket}&folder=${folder}`,
          "GET",
          storedPassword
        );
        for (const f of allFiles) {
          if (f.name !== fileName && f.name.replace(/\.[^.]+$/, "") === stem) {
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
        <SEOHead title="Admin" noindex />
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
              <img src={resolvePreviewUrl(item.image_url)} alt="Preview" className="h-20 w-32 object-cover rounded-lg border border-border" />
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
      <SEOHead title="Admin" noindex />
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Energy Innovation Admin</h1>
            {isViewer && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                👁 View Only
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem("admin_pw"); sessionStorage.removeItem("admin_role"); setAuthenticated(false); setIsViewer(false); setPassword(""); }} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>
      {isViewer && (
        <div className="bg-muted border-b border-border px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-muted-foreground text-center">🔒 You have <strong>view-only</strong> access. All edit, save, and delete actions are disabled.</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {([
            { key: "branding" as TabKey, icon: Palette, label: "Branding" },
            { key: "leads" as TabKey, icon: MessageSquare, label: `Leads (${leads.length})` },
            { key: "content" as TabKey, icon: FileText, label: "Site Content" },
            { key: "products" as TabKey, icon: Package, label: "Product Tree" },
            { key: "services" as TabKey, icon: Briefcase, label: `Services (${services.length})` },
            { key: "highlight" as TabKey, icon: Star, label: "Highlight Section" },
            { key: "product-enquiries" as TabKey, icon: Inbox, label: `Enquiries (${productEnquiries.length})` },
            { key: "careers" as TabKey, icon: UserPlus, label: `Careers (${careersList.length})` },
            { key: "images" as TabKey, icon: Image, label: "Files & Images" },
            { key: "contact" as TabKey, icon: Phone, label: "Contact Section" },
            { key: "footer" as TabKey, icon: Globe, label: "Footer" },
            { key: "admin-emails" as TabKey, icon: Shield, label: `Admin Access (${adminEmails.length})` },
            { key: "partners" as TabKey, icon: Building, label: `Partners (${partners.length})` },
            { key: "email-templates" as TabKey, icon: Mail, label: "Email Templates" },
          ]).map((tab) => (
            <Button key={tab.key} variant={activeTab === tab.key ? "default" : "outline"} onClick={() => setActiveTab(tab.key)} className="rounded-xl">
              <tab.icon className="w-4 h-4 mr-2" />{tab.label}
            </Button>
          ))}
        </div>

        {/* Tab content - disable all edit controls in viewer mode */}
        <div className={isViewer ? "viewer-readonly" : ""}>

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
                      // Convert to WebP and upload as branding/logo
                      const { convertToWebP } = await import("@/lib/image-utils");
                      const optimized = await convertToWebP(file);
                      const base64 = await fileToBase64(optimized);
                      await apiCall("upload", "POST", storedPassword, {
                        bucket: "images",
                        filePath: "branding/logo",
                        base64,
                        contentType: optimized.type,
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

              {/* Mobile Layout Controls */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Mobile Layout</h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Mobile Logo Size (px)</label>
                    <p className="text-xs text-muted-foreground mb-2">Logo height on screens below 768px (default 40)</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={16}
                        max={120}
                        value={mobileLogoSize}
                        onChange={(e) => setMobileLogoSize(parseInt(e.target.value) || 40)}
                        className="rounded-xl w-32"
                      />
                      <Button
                        onClick={async () => {
                          try {
                            await apiCall("content", "POST", storedPassword, {
                              content_key: "header.mobile_logo_size",
                              value_en: String(mobileLogoSize),
                              value_ar: String(mobileLogoSize),
                            });
                            toast.success("Mobile logo size saved!");
                          } catch (err: any) { toast.error(err.message); }
                        }}
                        className="gradient-accent text-accent-foreground rounded-xl border-0"
                      >
                        <Save className="w-4 h-4 mr-2" />Save
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Floating Buttons Bottom Position (px)</label>
                    <p className="text-xs text-muted-foreground mb-2">Bottom offset for WhatsApp/email buttons on mobile (default 80)</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={400}
                        value={floatingMobileBottom}
                        onChange={(e) => setFloatingMobileBottom(parseInt(e.target.value) || 80)}
                        className="rounded-xl w-32"
                      />
                      <Button
                        onClick={async () => {
                          try {
                            await apiCall("content", "POST", storedPassword, {
                              content_key: "floating.mobile_bottom",
                              value_en: String(floatingMobileBottom),
                              value_ar: String(floatingMobileBottom),
                            });
                            toast.success("Floating button position saved!");
                          } catch (err: any) { toast.error(err.message); }
                        }}
                        className="gradient-accent text-accent-foreground rounded-xl border-0"
                      >
                        <Save className="w-4 h-4 mr-2" />Save
                      </Button>
                    </div>
                  </div>
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

            {/* Image Optimization Toggle */}
            <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Image Optimization (Pro Feature)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uses Supabase image transformation to resize and optimize images on-the-fly. 
                    <span className="text-destructive font-medium"> Disable this if the pro feature is not available on your Supabase plan</span> — images will load directly from storage instead.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-4">
                  <span className="text-sm text-muted-foreground">{imageOptimization ? "On" : "Off"}</span>
                  <input
                    type="checkbox"
                    checked={imageOptimization}
                    onChange={async (e) => {
                      const val = e.target.checked;
                      setImageOptimization(val);
                      try {
                        await apiCall("content", "POST", storedPassword, {
                          content_key: "settings.image_optimization",
                          value_en: String(val),
                          value_ar: String(val),
                        });
                        toast.success(val ? "Image optimization enabled (Pro)" : "Image optimization disabled (direct URLs)");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
              </div>
            </div>

            {/* LinkedIn Button */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">LinkedIn Button</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-muted-foreground">{linkedinActive ? "Active" : "Inactive"}</span>
                  <input
                    type="checkbox"
                    checked={linkedinActive}
                    onChange={async (e) => {
                      const val = e.target.checked;
                      setLinkedinActive(val);
                      try {
                        await apiCall("content", "POST", storedPassword, {
                          content_key: "linkedin_active",
                          value_en: val ? "true" : "false",
                          value_ar: val ? "true" : "false",
                        });
                        toast.success(val ? "LinkedIn enabled" : "LinkedIn disabled");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                    className="w-5 h-5 accent-primary rounded"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/your-company"
                  className="rounded-xl"
                />
                <Button
                  onClick={async () => {
                    try {
                      await apiCall("content", "POST", storedPassword, {
                        content_key: "linkedin_url",
                        value_en: linkedinUrl,
                        value_ar: linkedinUrl,
                      });
                      toast.success("LinkedIn URL saved!");
                    } catch (err: any) { toast.error(err.message); }
                  }}
                  className="gradient-accent text-accent-foreground rounded-xl border-0 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />Save
                </Button>
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
                  <div key={lead.id} className="bg-card border border-border rounded-2xl p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                          <h3 className="font-semibold text-foreground">{lead.name}</h3>
                          <span className="text-sm text-muted-foreground truncate">{lead.email}</span>
                          {lead.company && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">{lead.company}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed break-words">{lead.message}</p>
                        <p className="text-xs text-muted-foreground mt-3">{new Date(lead.created_at).toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0">
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
              <div className="space-y-6">
                {/* ── Hero Section ── */}
                <div className="border border-border rounded-2xl overflow-hidden">
                  <div className="bg-secondary/50 px-5 py-3 flex items-center gap-2 border-b border-border">
                    <Image className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">Hero Section</span>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Visibility toggles */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Visibility</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { key: "hero.show_headline", label: "Headline" },
                          { key: "hero.show_subtext", label: "Subtext" },
                          { key: "hero.show_explore_btn", label: "Explore Products" },
                          { key: "hero.show_contact_btn", label: "Contact Us" },
                          { key: "hero.show_arrows", label: "Arrows" },
                          { key: "hero.show_dots", label: "Dots" },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
                            <span className={`text-sm font-medium ${heroVisibility[key] ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                            <Switch checked={heroVisibility[key]} onCheckedChange={() => handleToggleHeroVisibility(key)} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Text content */}
                    <div className="border-t border-border pt-5">
                      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Text Content</p>
                      <div className="space-y-4">
                        {content.filter(c => c.content_key.startsWith("hero.") && !c.content_key.startsWith("hero.show_") && c.content_key !== "hero.active_images" && c.content_key !== "hero.speed").map((item) => (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground capitalize">{item.content_key.replace("hero.", "").replace(/_/g, " ")}</span>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={translating || !editedContent[item.content_key]?.value_en} onClick={async () => { try { setTranslating(true); const r = await translateTexts({ v: editedContent[item.content_key]?.value_en || "" }); if (r.v) { updateEditedField(item.content_key, "value_ar", r.v); toast.success("Translated"); } } catch (e: any) { toast.error(e.message); } finally { setTranslating(false); } }} className="rounded-xl h-7 text-xs">
                                  <Languages className="w-3 h-3 mr-1" />{translating ? "..." : "Translate"}
                                </Button>
                                <Button size="sm" onClick={() => handleSaveContent(item.content_key)} className="gradient-accent text-accent-foreground rounded-xl border-0 h-7 text-xs">
                                  <Save className="w-3 h-3 mr-1" />Save
                                </Button>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <Input value={editedContent[item.content_key]?.value_en || ""} onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)} placeholder="English" className="rounded-xl text-sm" />
                              <Input value={editedContent[item.content_key]?.value_ar || ""} onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)} placeholder="Arabic" className="rounded-xl text-sm" dir="rtl" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Generic Sections (ordered by site layout) ── */}
                {(() => {
                  const grouped: Record<string, ContentItem[]> = {};
                  const managedPrefixes = new Set(["hero", "contact", "footer", "highlight", "careers", "email"]);
                  const managedKeys = new Set([
                    "contact_phone", "contact_email", "contact_address",
                    "contact_phone_visible", "contact_email_visible", "contact_address_visible",
                    "whatsapp_number", "whatsapp_message", "whatsapp_active",
                    "floating_email", "email_active",
                    "linkedin_url", "linkedin_active",
                    "logo.size", "brand.name",
                    "header.mobile_logo_size", "floating.mobile_bottom",
                  ]);
                  content.forEach((item) => {
                    const section = item.content_key.split(".")[0] || "other";
                    if (managedPrefixes.has(section) || managedKeys.has(item.content_key)) return;
                    if (!grouped[section]) grouped[section] = [];
                    grouped[section].push(item);
                  });
                  const sectionOrder = ["brand", "nav", "about", "products", "services", "highlight", "why", "whatsapp", "linkedin", "email", "floating"];
                  const sectionLabels: Record<string, string> = {
                    about: "About Section",
                    brand: "Brand",
                    highlight: "Highlight Section",
                    nav: "Navigation",
                    why: "Why Choose Us",
                    services: "Services",
                    products: "Products",
                    whatsapp: "WhatsApp",
                    linkedin: "LinkedIn",
                    email: "Email (Floating)",
                    floating: "Floating Buttons",
                  };
                  const sectionIcons: Record<string, typeof Star> = {
                    about: Users,
                    brand: Palette,
                    highlight: Star,
                    nav: Globe,
                    why: Award,
                    services: Briefcase,
                    products: Package,
                    whatsapp: Phone,
                    linkedin: Globe,
                    email: Mail,
                    floating: Zap,
                  };
                  const sortedSections = Object.keys(grouped).sort((a, b) => {
                    const ai = sectionOrder.indexOf(a);
                    const bi = sectionOrder.indexOf(b);
                    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                  });
                  return sortedSections.map((section) => {
                    const items = grouped[section];
                    const SectionIcon = sectionIcons[section] || FileText;
                    return (
                      <div key={section} className="border border-border rounded-2xl overflow-hidden">
                        <div className="bg-secondary/50 px-5 py-3 flex items-center gap-2 border-b border-border">
                          <SectionIcon className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold text-foreground">{sectionLabels[section] || section}</span>
                          <span className="text-xs text-muted-foreground">({items.length})</span>
                        </div>
                        <div className="divide-y divide-border">
                          {items.map((item) => {
                            const isBool = (editedContent[item.content_key]?.value_en || "").toLowerCase() === "true" || (editedContent[item.content_key]?.value_en || "").toLowerCase() === "false";
                            const isActive = (editedContent[item.content_key]?.value_en || "").toLowerCase() === "true";
                            const friendlyLabel = item.content_key.replace(/^[^.]+\./, "").replace(/^[^_]+_/, "").replace(/_/g, " ");
                            return (
                              <div key={item.id} className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-medium text-muted-foreground capitalize">{friendlyLabel || item.content_key}</span>
                                  {isBool ? (
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-medium ${isActive ? "text-accent" : "text-muted-foreground"}`}>{isActive ? "Active" : "Inactive"}</span>
                                      <Switch
                                        checked={isActive}
                                        onCheckedChange={(checked) => {
                                          updateEditedField(item.content_key, "value_en", String(checked));
                                          updateEditedField(item.content_key, "value_ar", String(checked));
                                        }}
                                      />
                                      <Button size="sm" onClick={() => handleSaveContent(item.content_key)} className="gradient-accent text-accent-foreground rounded-xl border-0 h-7 text-xs">
                                        <Save className="w-3 h-3 mr-1" />Save
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" disabled={translating || !editedContent[item.content_key]?.value_en} onClick={async () => { try { setTranslating(true); const r = await translateTexts({ v: editedContent[item.content_key]?.value_en || "" }); if (r.v) { updateEditedField(item.content_key, "value_ar", r.v); toast.success("Translated"); } } catch (e: any) { toast.error(e.message); } finally { setTranslating(false); } }} className="rounded-xl h-7 text-xs">
                                        <Languages className="w-3 h-3 mr-1" />{translating ? "..." : "Translate"}
                                      </Button>
                                      <Button size="sm" onClick={() => handleSaveContent(item.content_key)} className="gradient-accent text-accent-foreground rounded-xl border-0 h-7 text-xs">
                                        <Save className="w-3 h-3 mr-1" />Save
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {!isBool && (
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-1 block">English</label>
                                      {(editedContent[item.content_key]?.value_en?.length || 0) > 100 ? (
                                        <Textarea value={editedContent[item.content_key]?.value_en || ""} onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)} rows={3} className="rounded-xl resize-none text-sm" />
                                      ) : (
                                        <Input value={editedContent[item.content_key]?.value_en || ""} onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)} className="rounded-xl text-sm" />
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-1 block">Arabic</label>
                                      {(editedContent[item.content_key]?.value_ar?.length || 0) > 100 ? (
                                        <Textarea value={editedContent[item.content_key]?.value_ar || ""} onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)} rows={3} className="rounded-xl resize-none text-sm" dir="rtl" />
                                      ) : (
                                        <Input value={editedContent[item.content_key]?.value_ar || ""} onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)} className="rounded-xl text-sm" dir="rtl" />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
        {activeTab === "products" && (
          <ProductTreeEditor password={storedPassword} isViewer={isViewer} />
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

            {serviceImageIssues.length > 0 && (
              <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-destructive text-sm mb-1">
                    {serviceImageIssues.length} service{serviceImageIssues.length > 1 ? "s" : ""} {serviceImageIssues.length > 1 ? "have" : "has"} an image problem
                  </h3>
                  <ul className="text-xs text-foreground/80 space-y-0.5">
                    {serviceImageIssues.map((iss) => (
                      <li key={iss.id}>
                        <span className="font-medium">{iss.name}</span>
                        {" — "}
                        {iss.reason === "missing" && "no image set"}
                        {iss.reason === "broken" && "image URL failed to load"}
                        {iss.reason === "unknown-asset" && "references an unknown bundled asset"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {checkingServiceImages && serviceImageIssues.length === 0 && services.length > 0 && (
              <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking service images…
              </div>
            )}

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
                      <img src={resolvePreviewUrl(s.image_url)} alt={s.name_en} className="w-16 h-12 object-cover rounded-lg border border-border shrink-0" />
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
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Text Content</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Edit the highlight section text in the <button className="text-accent underline" onClick={() => setActiveTab("content")}>Site Content</button> tab.
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Section Images</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload up to 5 images for the highlight carousel.</p>
                {highlightImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {highlightImages.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-border">
                        <img src={url} alt={`Highlight ${idx + 1}`} className="w-full aspect-[4/3] object-cover" />
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                          <Button variant="destructive" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" onClick={() => setHighlightImages((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-3 h-3 mr-1" />Remove
                          </Button>
                        </div>
                        <span className="absolute top-1.5 left-1.5 bg-foreground/70 text-background text-[10px] font-bold px-1.5 py-0.5 rounded-md">{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                {highlightImages.length < 5 && (
                  <div className="flex items-center gap-3 mb-3">
                    <input ref={highlightImageRef} type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setUploading(true);
                            const url = await uploadFileAndGetUrl(file, "images", "highlight", storedPassword);
                            setHighlightImages((prev) => [...prev, url]);
                            toast.success("Image uploaded");
                          } catch (err: any) { toast.error(err.message); }
                          finally { setUploading(false); }
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => highlightImageRef.current?.click()} disabled={uploading || highlightImages.length >= 5} className="rounded-xl">
                      {uploading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Add Image ({highlightImages.length}/5)
                    </Button>
                  </div>
                )}
                <Button onClick={async () => {
                  try {
                    await apiCall("content", "POST", storedPassword, { content_key: "highlight.images", value_en: JSON.stringify(highlightImages), value_ar: JSON.stringify(highlightImages) });
                    await apiCall("content", "POST", storedPassword, { content_key: "highlight.image", value_en: highlightImages[0] || "", value_ar: highlightImages[0] || "" });
                    toast.success("Images saved!");
                  } catch (err: any) { toast.error(err.message); }
                }} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Save className="w-4 h-4 mr-2" />Save Images
                </Button>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Stat Cards</h3>
                  <Button variant="outline" size="sm" onClick={() => setHighlightStats([...highlightStats, { icon: "Award", value_en: "", value_ar: "", label_en: "", label_ar: "" }])} className="rounded-xl" disabled={highlightStats.length >= 4}>
                    <Plus className="w-4 h-4 mr-1" />Add Stat
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Overlay cards on the image. Maximum 4 stats.</p>
                <div className="space-y-4">
                  {highlightStats.map((stat, i) => (
                    <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Stat #{i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => setHighlightStats(highlightStats.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-7 w-7 p-0" disabled={highlightStats.length <= 1}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                          <select value={stat.icon} onChange={(e) => { const updated = [...highlightStats]; updated[i] = { ...stat, icon: e.target.value }; setHighlightStats(updated); }} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                            {["Award", "TrendingUp", "Users", "Clock"].map((ic) => (<option key={ic} value={ic}>{ic}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Value (EN)</label>
                          <Input value={stat.value_en} onChange={(e) => { const updated = [...highlightStats]; updated[i] = { ...stat, value_en: e.target.value }; setHighlightStats(updated); }} placeholder="e.g. 100%" className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Value (AR)</label>
                          <Input value={stat.value_ar} onChange={(e) => { const updated = [...highlightStats]; updated[i] = { ...stat, value_ar: e.target.value }; setHighlightStats(updated); }} placeholder="e.g. ١٠٠٪" className="rounded-xl bg-muted/50" dir="rtl" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (EN)</label>
                          <Input value={stat.label_en} onChange={(e) => { const updated = [...highlightStats]; updated[i] = { ...stat, label_en: e.target.value }; setHighlightStats(updated); }} placeholder="e.g. Quality Assurance" className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Label (AR)</label>
                          <Input value={stat.label_ar} onChange={(e) => { const updated = [...highlightStats]; updated[i] = { ...stat, label_ar: e.target.value }; setHighlightStats(updated); }} placeholder="e.g. ضمان الجودة" className="rounded-xl bg-muted/50" dir="rtl" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={async () => {
                  try {
                    await apiCall("content", "POST", storedPassword, { content_key: "highlight.stats", value_en: JSON.stringify(highlightStats), value_ar: JSON.stringify(highlightStats) });
                    toast.success("Stats saved!");
                  } catch (err: any) { toast.error(err.message); }
                }} className="gradient-accent text-accent-foreground rounded-xl border-0 mt-4">
                  <Save className="w-4 h-4 mr-2" />Save Stats
                </Button>
              </div>
            </div>
          </div>
        )}


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
                      <div className="md:col-span-3">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                        {/* Mode tabs */}
                        <div className="flex gap-1 mb-2">
                          {["preset", "custom"].map((mode) => {
                            const isCustom = perk.icon === "" || perk.icon.startsWith("http") || perk.icon.startsWith("/") || perk.icon.startsWith("data:");
                            const active = mode === "custom" ? isCustom : !isCustom;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                  if (mode === "preset") {
                                    const p = [...careersPerks]; p[i] = { ...p[i], icon: "Star" }; setCareersPerks(p);
                                  }
                                  if (mode === "custom") {
                                    const p = [...careersPerks]; p[i] = { ...p[i], icon: "" }; setCareersPerks(p);
                                  }
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}
                              >
                                {mode === "preset" ? "Preset" : "Custom / URL"}
                              </button>
                            );
                          })}
                        </div>
                        {!(perk.icon === "" || perk.icon.startsWith("http") || perk.icon.startsWith("/") || perk.icon.startsWith("data:")) ? (
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
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={perk.icon.startsWith("http") || perk.icon.startsWith("/") ? perk.icon : ""}
                                onChange={(e) => { const p = [...careersPerks]; p[i] = { ...p[i], icon: e.target.value }; setCareersPerks(p); }}
                                placeholder="Paste icon URL (Google Icons, CDN, etc.)"
                                className="rounded-xl flex-1"
                              />
                              <input
                                type="file"
                                accept="image/*,.svg"
                                className="hidden"
                                id={`perk-icon-upload-${i}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFormFileUpload(file, "images", "icons", (url) => { const p = [...careersPerks]; p[i] = { ...p[i], icon: url }; setCareersPerks(p); });
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => (document.getElementById(`perk-icon-upload-${i}`) as HTMLInputElement)?.click()}
                                disabled={uploading}
                                className="rounded-xl shrink-0"
                              >
                                {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              </Button>
                            </div>
                            {(perk.icon.startsWith("http") || perk.icon.startsWith("/")) && (
                              <img src={perk.icon} alt="icon preview" className="w-8 h-8 object-contain rounded border border-input" />
                            )}
                            <p className="text-[10px] text-muted-foreground">Upload SVG/PNG/JPG or paste a URL from Google Icons, Font Awesome CDN, etc.</p>
                          </div>
                        )}
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
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <div className="flex gap-1.5">
                        {["open", "closed"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditingCareer({ ...editingCareer, status: s })}
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${editingCareer.status === s
                              ? s === "open" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"
                              : "bg-muted text-muted-foreground border border-border hover:bg-accent"
                            }`}
                          >
                            {s === "open" ? "Open" : "Closed"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3">
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
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${career.status === "open" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                            {career.status === "open" ? "Open" : "Closed"}
                          </span>
                          {!career.is_active && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Inactive</span>}
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

        {/* ─── Admin Emails Tab ──────── */}
        {activeTab === "admin-emails" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Admin Email Access</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchAdminEmails} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
                <Button size="sm" onClick={() => setEditingAdminEmail({ email: "", label: "", is_active: true })} className="gradient-accent text-accent-foreground rounded-xl border-0">
                  <Plus className="w-4 h-4 mr-2" />Add Email
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Manage email addresses that receive enquiry notifications from contact forms and product enquiries. Toggle active/inactive to control which emails receive notifications.
            </p>

            {editingAdminEmail && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
                <h3 className="font-semibold text-foreground">{editingAdminEmail.id ? "Edit" : "New"} Admin Email</h3>
                <Input
                  type="email"
                  value={editingAdminEmail.email}
                  onChange={(e) => setEditingAdminEmail({ ...editingAdminEmail, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="rounded-xl"
                />
                <Input
                  value={editingAdminEmail.label}
                  onChange={(e) => setEditingAdminEmail({ ...editingAdminEmail, label: e.target.value })}
                  placeholder="Label (e.g. John - Manager)"
                  className="rounded-xl"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAdminEmail.is_active}
                    onChange={(e) => setEditingAdminEmail({ ...editingAdminEmail, is_active: e.target.checked })}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-sm text-foreground">Active</span>
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await apiCall("admin-emails", "POST", storedPassword, editingAdminEmail);
                        toast.success("Admin email saved");
                        setEditingAdminEmail(null);
                        fetchAdminEmails();
                      } catch (e: any) { toast.error(e.message); }
                    }}
                    className="gradient-accent text-accent-foreground rounded-xl border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingAdminEmail(null)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {adminEmails.map((ae) => (
                <div key={ae.id} className={`bg-card border rounded-2xl p-4 flex items-center justify-between ${ae.is_active ? 'border-border' : 'border-border opacity-60'}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Mail className={`w-4 h-4 shrink-0 ${ae.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <span className="font-medium text-foreground block truncate">{ae.email}</span>
                      {ae.label && <p className="text-sm text-muted-foreground mt-0.5">{ae.label}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${ae.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {ae.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={ae.is_active}
                        onCheckedChange={async (checked) => {
                          try {
                            await apiCall("admin-emails", "POST", storedPassword, { ...ae, is_active: checked });
                            toast.success(`Email ${checked ? 'activated' : 'deactivated'}`);
                            fetchAdminEmails();
                          } catch (e: any) { toast.error(e.message); }
                        }}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingAdminEmail(ae)} className="rounded-xl">Edit</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await apiCall("admin-emails", "DELETE", storedPassword, { id: ae.id });
                          toast.success("Email removed");
                          fetchAdminEmails();
                        } catch (e: any) { toast.error(e.message); }
                      }}
                      className="rounded-xl text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {adminEmails.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No admin emails added yet. Only password login is available.</p>
              )}
            </div>
          </div>
        )}



        {/* ─── Product Enquiries Tab ──────── */}
        {activeTab === "product-enquiries" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Product Enquiries</h2>
              <Button variant="outline" size="sm" onClick={fetchProductEnquiries} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {productEnquiries.map((eq) => (
                <div key={eq.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{eq.name}</span>
                        <span className="text-xs text-muted-foreground">({eq.email})</span>
                      </div>
                      {eq.company && <p className="text-sm text-muted-foreground">Company: {eq.company}</p>}
                      <p className="text-sm text-muted-foreground">Product: {eq.product_name || "N/A"}</p>
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{eq.requirement}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(eq.created_at).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await apiCall("product-enquiries", "DELETE", storedPassword, { id: eq.id });
                          setProductEnquiries((prev) => prev.filter((e) => e.id !== eq.id));
                          toast.success("Enquiry deleted");
                        } catch (e: any) { toast.error(e.message); }
                      }}
                      className="rounded-xl text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {productEnquiries.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No enquiries received yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── Contact Section Tab ──────── */}
        {activeTab === "contact" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Contact Section Settings</h2>
              <Button variant="outline" size="sm" onClick={() => { fetchContent(); fetchContactAddresses(); }} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>

            {/* Section Title & Description */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Section Title & Description
              </h3>
              {[
                { key: "contact.tag", label: "Section Tag (Eyebrow)" },
                { key: "contact.title", label: "Title" },
                { key: "contact.desc", label: "Description" },
              ].map(({ key, label }) => {
                const item = content.find((c) => c.content_key === key);
                const edited = editedContent[key];
                const isLong = (edited?.value_en ?? item?.value_en ?? "").length > 80;
                return (
                  <div key={key} className="mb-5 last:mb-0">
                    <h4 className="text-sm font-medium text-foreground mb-2">{label}</h4>
                    <div className="grid md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">English</label>
                        {isLong ? (
                          <Textarea value={edited?.value_en ?? item?.value_en ?? ""} onChange={(e) => updateEditedField(key, "value_en", e.target.value)} rows={2} className="rounded-xl resize-none" />
                        ) : (
                          <Input value={edited?.value_en ?? item?.value_en ?? ""} onChange={(e) => updateEditedField(key, "value_en", e.target.value)} className="rounded-xl" />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Arabic</label>
                        {isLong ? (
                          <Textarea value={edited?.value_ar ?? item?.value_ar ?? ""} onChange={(e) => updateEditedField(key, "value_ar", e.target.value)} rows={2} className="rounded-xl resize-none" dir="rtl" />
                        ) : (
                          <Input value={edited?.value_ar ?? item?.value_ar ?? ""} onChange={(e) => updateEditedField(key, "value_ar", e.target.value)} className="rounded-xl" dir="rtl" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={translating || !edited?.value_en} onClick={async () => {
                        try {
                          setTranslating(true);
                          const result = await translateTexts({ value_en: edited?.value_en || "" });
                          if (result.value_en) updateEditedField(key, "value_ar", result.value_en);
                          toast.success("Translated");
                        } catch (e: any) { toast.error(e.message); }
                        finally { setTranslating(false); }
                      }} className="rounded-xl">
                        <Languages className="w-4 h-4 mr-1" />{translating ? "..." : "Translate"}
                      </Button>
                      {edited && (
                        <Button size="sm" onClick={() => handleSaveContent(key)} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                          <Save className="w-3 h-3 mr-1" />Save
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact Info (Phone, Email, Address) */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                Contact Info Cards
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Customize each contact card's value, label, icon, and visibility as shown on the website.</p>
              {[
                { key: "contact_phone", visKey: "contact_phone_visible", labelKey: "contact_phone_label", iconKey: "contact_phone_icon", title: "Phone", placeholder: "+971 XX XXX XXXX" },
                { key: "contact_email", visKey: "contact_email_visible", labelKey: "contact_email_label", iconKey: "contact_email_icon", title: "Email", placeholder: "info@example.com" },
                { key: "contact_address", visKey: "contact_address_visible", labelKey: "contact_address_label", iconKey: "contact_address_icon", title: "Address", placeholder: "Riyadh, Saudi Arabia" },
              ].map(({ key, visKey, labelKey, iconKey, title, placeholder }) => {
                const item = content.find((c) => c.content_key === key);
                const edited = editedContent[key];
                const visItem = content.find((c) => c.content_key === visKey);
                const visEdited = editedContent[visKey];
                const isVisible = (visEdited?.value_en ?? visItem?.value_en ?? "true") !== "false";

                // Label
                const labelItem = content.find((c) => c.content_key === labelKey);
                const labelEdited = editedContent[labelKey];
                const labelEn = labelEdited?.value_en ?? labelItem?.value_en ?? "";
                const labelAr = labelEdited?.value_ar ?? labelItem?.value_ar ?? "";

                // Icon
                const iconItem = content.find((c) => c.content_key === iconKey);
                const iconEdited = editedContent[iconKey];
                const iconVal = iconEdited?.value_en ?? iconItem?.value_en ?? "Phone";
                const isCustomIcon = iconVal.startsWith("http") || iconVal.startsWith("/") || iconVal.startsWith("data:");

                const CONTACT_ICON_OPTIONS = ["Phone", "Mail", "Globe", "MapPin", "Building", "MessageSquare", "Shield", "Zap", "Factory", "Truck"];

                return (
                  <div key={key} className="mb-5 last:mb-0 p-4 border border-border rounded-xl space-y-3">
                    {/* Header with title & visibility */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{title}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-muted-foreground">{isVisible ? "Visible" : "Hidden"}</span>
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={async () => {
                            const newVal = isVisible ? "false" : "true";
                            setEditedContent((prev) => ({ ...prev, [visKey]: { value_en: newVal, value_ar: newVal } }));
                            try {
                              await apiCall("content", "POST", storedPassword, { content_key: visKey, value_en: newVal, value_ar: newVal });
                              fetchContent();
                              toast.success(`${title} ${newVal === "true" ? "shown" : "hidden"}`);
                            } catch (e: any) { toast.error(e.message); }
                          }}
                          className="w-4 h-4 accent-[hsl(var(--accent))]"
                        />
                      </label>
                    </div>

                    {/* Value field */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Value (displayed text)</label>
                      <Input
                        value={edited?.value_en ?? item?.value_en ?? ""}
                        onChange={(e) => setEditedContent((prev) => ({
                          ...prev,
                          [key]: { value_en: e.target.value, value_ar: e.target.value },
                        }))}
                        placeholder={placeholder}
                        className="rounded-xl text-sm"
                      />
                    </div>

                    {/* Label / Tagline (EN + AR) */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Label / Tagline</label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Input
                          value={labelEn}
                          onChange={(e) => updateEditedField(labelKey, "value_en", e.target.value)}
                          placeholder="e.g. Phone Number"
                          className="rounded-xl text-sm"
                        />
                        <Input
                          value={labelAr}
                          onChange={(e) => updateEditedField(labelKey, "value_ar", e.target.value)}
                          placeholder="e.g. رقم الهاتف"
                          className="rounded-xl text-sm"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    {/* Icon selector */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon</label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => updateEditedField(iconKey, "value_en", "Phone")}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            !isCustomIcon
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-input text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Preset Icons
                        </button>
                        <button
                          type="button"
                          onClick={() => { updateEditedField(iconKey, "value_en", ""); updateEditedField(iconKey, "value_ar", ""); }}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            isCustomIcon || iconVal === ""
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-input text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Custom Icon
                        </button>
                      </div>
                      {!isCustomIcon && iconVal !== "" ? (
                        <select
                          value={iconVal}
                          onChange={(e) => { updateEditedField(iconKey, "value_en", e.target.value); updateEditedField(iconKey, "value_ar", e.target.value); }}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          {CONTACT_ICON_OPTIONS.map((ic) => (
                            <option key={ic} value={ic}>{ic}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={isCustomIcon ? iconVal : ""}
                              onChange={(e) => { updateEditedField(iconKey, "value_en", e.target.value); updateEditedField(iconKey, "value_ar", e.target.value); }}
                              placeholder="Paste icon URL or upload"
                              className="rounded-xl flex-1"
                            />
                            <input
                              type="file"
                              accept="image/*,.svg"
                              className="hidden"
                              id={`contact-icon-upload-${key}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFormFileUpload(file, "images", "icons", (url) => {
                                  updateEditedField(iconKey, "value_en", url);
                                  updateEditedField(iconKey, "value_ar", url);
                                });
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (document.getElementById(`contact-icon-upload-${key}`) as HTMLInputElement)?.click()}
                              disabled={uploading}
                              className="rounded-xl shrink-0"
                            >
                              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Upload SVG/PNG/JPG or paste a URL</p>
                        </div>
                      )}
                      {/* Icon preview */}
                      {iconVal && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">Preview:</span>
                          {isCustomIcon ? (
                            <img src={iconVal} alt="icon" className="w-7 h-7 object-contain rounded border border-border" />
                          ) : (() => {
                            const Ic = icons[iconVal as keyof typeof icons];
                            return Ic ? <Ic className="w-5 h-5 text-accent" /> : <span className="text-xs text-muted-foreground">{iconVal}</span>;
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Save button for all fields */}
                    {(edited || labelEdited || iconEdited) && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={async () => {
                          try {
                            setLoading(true);
                            if (edited) await handleSaveContent(key);
                            if (labelEdited) await handleSaveContent(labelKey);
                            if (iconEdited) await handleSaveContent(iconKey);
                            toast.success(`${title} card updated`);
                          } catch (e: any) { toast.error(e.message); }
                          finally { setLoading(false); }
                        }} disabled={loading} className="gradient-accent text-accent-foreground rounded-xl border-0">
                          <Save className="w-3 h-3 mr-1" />Save All Changes
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Address Visibility Toggle */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  Addresses
                </h3>
                <div className="flex items-center gap-3">
                  {(() => {
                    const visKey = "contact_address_visible";
                    const visItem = content.find((c) => c.content_key === visKey);
                    const visEdited = editedContent[visKey];
                    const isVisible = (visEdited?.value_en ?? visItem?.value_en ?? "true") !== "false";
                    return (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-muted-foreground">{isVisible ? "Visible" : "Hidden"}</span>
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={async () => {
                            const newVal = isVisible ? "false" : "true";
                            setEditedContent((prev) => ({ ...prev, [visKey]: { value_en: newVal, value_ar: newVal } }));
                            try {
                              await apiCall("content", "POST", storedPassword, { content_key: visKey, value_en: newVal, value_ar: newVal });
                              fetchContent();
                              toast.success(`Addresses ${newVal === "true" ? "shown" : "hidden"}`);
                            } catch (e: any) { toast.error(e.message); }
                          }}
                          className="w-4 h-4 accent-[hsl(var(--accent))]"
                        />
                      </label>
                    );
                  })()}
                  <Button
                    size="sm"
                    onClick={() => setEditingAddress({ label_en: "", label_ar: "", is_active: true, sort_order: contactAddresses.length })}
                    className="gradient-accent text-accent-foreground rounded-xl border-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />Add Address
                  </Button>
                </div>
              </div>

              {editingAddress && (
                <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">English</label>
                      <Input value={editingAddress.label_en} onChange={(e) => setEditingAddress({ ...editingAddress, label_en: e.target.value })} placeholder="e.g. UAE & India" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Arabic</label>
                      <Input value={editingAddress.label_ar} onChange={(e) => setEditingAddress({ ...editingAddress, label_ar: e.target.value })} placeholder="e.g. الإمارات والهند" className="rounded-xl" dir="rtl" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" disabled={translating} variant="outline" onClick={async () => {
                      if (!editingAddress.label_en) return;
                      try {
                        setTranslating(true);
                        const result = await translateTexts({ label_en: editingAddress.label_en });
                        if (result.label_en) setEditingAddress({ ...editingAddress, label_ar: result.label_en });
                        toast.success("Translated");
                      } catch (e: any) { toast.error(e.message); }
                      finally { setTranslating(false); }
                    }} className="rounded-xl">
                      <Languages className="w-4 h-4 mr-1" />{translating ? "..." : "Translate"}
                    </Button>
                    <Button size="sm" onClick={async () => {
                      try {
                        if (editingAddress.id) {
                          await apiCall("contact-addresses", "POST", storedPassword, { id: editingAddress.id, label_en: editingAddress.label_en, label_ar: editingAddress.label_ar, is_active: editingAddress.is_active, sort_order: editingAddress.sort_order });
                        } else {
                          await apiCall("contact-addresses", "POST", storedPassword, { label_en: editingAddress.label_en, label_ar: editingAddress.label_ar, is_active: editingAddress.is_active, sort_order: editingAddress.sort_order });
                        }
                        toast.success("Address saved");
                        setEditingAddress(null);
                        fetchContactAddresses();
                      } catch (e: any) { toast.error(e.message); }
                    }} className="gradient-accent text-accent-foreground rounded-xl border-0">
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
                  {contactAddresses.map((addr) => {
                    const isInlineEditing = editingAddress?.id === addr.id;
                    return (
                      <div key={addr.id} className="p-3 rounded-xl border border-border bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-xs font-medium text-muted-foreground">Address Card</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <span className="text-xs text-muted-foreground">{addr.is_active ? "Active" : "Inactive"}</span>
                              <input type="checkbox" checked={addr.is_active} onChange={async () => {
                                try {
                                  await apiCall("contact-addresses", "POST", storedPassword, { id: addr.id, is_active: !addr.is_active });
                                  fetchContactAddresses();
                                  toast.success(addr.is_active ? "Address hidden" : "Address shown");
                                } catch (e: any) { toast.error(e.message); }
                              }} className="w-4 h-4 accent-[hsl(var(--accent))]" />
                            </label>
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                await apiCall("contact-addresses", "DELETE", storedPassword, { id: addr.id });
                                fetchContactAddresses();
                                toast.success("Address deleted");
                              } catch (e: any) { toast.error(e.message); }
                            }} className="rounded-lg h-8 px-2 text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {isInlineEditing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">English</label>
                                <Input value={editingAddress.label_en} onChange={(e) => setEditingAddress({ ...editingAddress, label_en: e.target.value })} className="rounded-xl text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Arabic</label>
                                <Input value={editingAddress.label_ar} onChange={(e) => setEditingAddress({ ...editingAddress, label_ar: e.target.value })} className="rounded-xl text-sm" dir="rtl" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" disabled={translating} onClick={async () => {
                                if (!editingAddress.label_en) return;
                                try {
                                  setTranslating(true);
                                  const result = await translateTexts({ label_en: editingAddress.label_en });
                                  if (result.label_en) setEditingAddress({ ...editingAddress, label_ar: result.label_en });
                                  toast.success("Translated");
                                } catch (e: any) { toast.error(e.message); }
                                finally { setTranslating(false); }
                              }} className="rounded-xl">
                                <Languages className="w-4 h-4 mr-1" />{translating ? "..." : "Translate"}
                              </Button>
                              <Button size="sm" onClick={async () => {
                                try {
                                  await apiCall("contact-addresses", "POST", storedPassword, { id: addr.id, label_en: editingAddress.label_en, label_ar: editingAddress.label_ar });
                                  toast.success("Address saved");
                                  setEditingAddress(null);
                                  fetchContactAddresses();
                                } catch (e: any) { toast.error(e.message); }
                              }} className="gradient-accent text-accent-foreground rounded-xl border-0">
                                <Save className="w-3 h-3 mr-1" />Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingAddress(null)} className="rounded-xl">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="cursor-pointer hover:bg-secondary/50 rounded-lg p-2 -m-1 transition-colors" onClick={() => setEditingAddress(addr)}>
                            <p className="text-sm font-medium text-foreground">{addr.label_en}</p>
                            <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{addr.label_ar}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Click to edit</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Footer Tab ──────── */}
        {activeTab === "footer" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Footer Settings</h2>
              <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>

            {/* Social Media Links */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Social Media Links
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Leave a URL empty to hide that social icon from the footer.</p>
              <div className="space-y-3">
                {[
                  { key: "footer.social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
                  { key: "footer.social_twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
                  { key: "footer.social_facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
                  { key: "footer.social_instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
                  { key: "footer.social_youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
                ].map(({ key, label, placeholder }) => {
                  const item = content.find((c) => c.content_key === key);
                  const edited = editedContent[key];
                  return (
                    <div key={key} className="flex flex-col sm:flex-row gap-2">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <Input
                        value={edited?.value_en ?? item?.value_en ?? ""}
                        onChange={(e) => setEditedContent((prev) => ({
                          ...prev,
                          [key]: { value_en: e.target.value, value_ar: e.target.value },
                        }))}
                        placeholder={placeholder}
                        className="rounded-xl flex-1 text-sm"
                      />
                      {edited && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveContent(key)}
                          disabled={loading}
                          className="gradient-accent text-accent-foreground rounded-xl border-0"
                        >
                          <Save className="w-3 h-3 mr-1" />Save
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                Footer Contact Info
              </h3>
              <div className="space-y-3">
                {[
                  { key: "footer.contact_email", label: "Email", placeholder: "info@example.com" },
                  { key: "footer.contact_website", label: "Website", placeholder: "www.example.com" },
                ].map(({ key, label, placeholder }) => {
                  const item = content.find((c) => c.content_key === key);
                  const edited = editedContent[key];
                  return (
                    <div key={key} className="flex flex-col sm:flex-row gap-2">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <Input
                        value={edited?.value_en ?? item?.value_en ?? ""}
                        onChange={(e) => setEditedContent((prev) => ({
                          ...prev,
                          [key]: { value_en: e.target.value, value_ar: e.target.value },
                        }))}
                        placeholder={placeholder}
                        className="rounded-xl flex-1 text-sm"
                      />
                      {edited && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveContent(key)}
                          disabled={loading}
                          className="gradient-accent text-accent-foreground rounded-xl border-0"
                        >
                          <Save className="w-3 h-3 mr-1" />Save
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Description */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Footer Description
              </h3>
              {(() => {
                const key = "footer.desc";
                const item = content.find((c) => c.content_key === key);
                const edited = editedContent[key];
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">English</label>
                      <Textarea
                        value={edited?.value_en ?? item?.value_en ?? ""}
                        onChange={(e) => updateEditedField(key, "value_en", e.target.value)}
                        rows={2}
                        className="rounded-xl resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Arabic</label>
                      <Textarea
                        value={edited?.value_ar ?? item?.value_ar ?? ""}
                        onChange={(e) => updateEditedField(key, "value_ar", e.target.value)}
                        rows={2}
                        className="rounded-xl resize-none"
                        dir="rtl"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={translating || !editedContent[key]?.value_en}
                        onClick={async () => {
                          try {
                            setTranslating(true);
                            const result = await translateTexts({ value_en: editedContent[key]?.value_en || "" });
                            if (result.value_en) updateEditedField(key, "value_ar", result.value_en);
                            toast.success("Translated");
                          } catch (e: any) { toast.error(e.message); }
                          finally { setTranslating(false); }
                        }}
                        className="rounded-xl"
                      >
                        <Languages className="w-4 h-4 mr-1" />{translating ? "..." : "Translate"}
                      </Button>
                      <Button size="sm" onClick={() => handleSaveContent(key)} disabled={!edited} className="gradient-accent text-accent-foreground rounded-xl border-0">
                        <Save className="w-3 h-3 mr-1" />Save
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Address Blocks */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Address Blocks
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Two address blocks shown in the footer contact column. Use line breaks for multi-line content.</p>
              {[
                { headingKey: "footer.address_1_heading", bodyKey: "footer.address_1_body", label: "Address Block 1" },
                { headingKey: "footer.address_2_heading", bodyKey: "footer.address_2_body", label: "Address Block 2" },
              ].map(({ headingKey, bodyKey, label }) => {
                const headingItem = content.find((c) => c.content_key === headingKey);
                const bodyItem = content.find((c) => c.content_key === bodyKey);
                const headingEdited = editedContent[headingKey];
                const bodyEdited = editedContent[bodyKey];
                return (
                  <div key={headingKey} className="mb-6 last:mb-0 border border-border rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">{label}</h4>
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Heading (EN)</label>
                        <Input
                          value={headingEdited?.value_en ?? headingItem?.value_en ?? ""}
                          onChange={(e) => setEditedContent((prev) => ({
                            ...prev,
                            [headingKey]: { value_en: e.target.value, value_ar: prev[headingKey]?.value_ar ?? headingItem?.value_ar ?? "" },
                          }))}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Heading (AR)</label>
                        <Input
                          value={headingEdited?.value_ar ?? headingItem?.value_ar ?? ""}
                          onChange={(e) => setEditedContent((prev) => ({
                            ...prev,
                            [headingKey]: { value_en: prev[headingKey]?.value_en ?? headingItem?.value_en ?? "", value_ar: e.target.value },
                          }))}
                          className="rounded-xl"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Body (EN)</label>
                        <Textarea
                          value={bodyEdited?.value_en ?? bodyItem?.value_en ?? ""}
                          onChange={(e) => setEditedContent((prev) => ({
                            ...prev,
                            [bodyKey]: { value_en: e.target.value, value_ar: prev[bodyKey]?.value_ar ?? bodyItem?.value_ar ?? "" },
                          }))}
                          rows={3}
                          className="rounded-xl resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Body (AR)</label>
                        <Textarea
                          value={bodyEdited?.value_ar ?? bodyItem?.value_ar ?? ""}
                          onChange={(e) => setEditedContent((prev) => ({
                            ...prev,
                            [bodyKey]: { value_en: prev[bodyKey]?.value_en ?? bodyItem?.value_en ?? "", value_ar: e.target.value },
                          }))}
                          rows={3}
                          className="rounded-xl resize-none"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={translating}
                        onClick={async () => {
                          try {
                            setTranslating(true);
                            const hEn = editedContent[headingKey]?.value_en || headingItem?.value_en || "";
                            const bEn = editedContent[bodyKey]?.value_en || bodyItem?.value_en || "";
                            const result = await translateTexts({ heading: hEn, body: bEn });
                            if (result.heading) setEditedContent((prev) => ({ ...prev, [headingKey]: { value_en: prev[headingKey]?.value_en ?? headingItem?.value_en ?? "", value_ar: result.heading } }));
                            if (result.body) setEditedContent((prev) => ({ ...prev, [bodyKey]: { value_en: prev[bodyKey]?.value_en ?? bodyItem?.value_en ?? "", value_ar: result.body } }));
                            toast.success("Translated");
                          } catch (e: any) { toast.error(e.message); }
                          finally { setTranslating(false); }
                        }}
                        className="rounded-xl"
                      >
                        <Languages className="w-4 h-4 mr-1" />{translating ? "..." : "Translate"}
                      </Button>
                      {headingEdited && (
                        <Button size="sm" onClick={() => handleSaveContent(headingKey)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                          <Save className="w-3 h-3 mr-1" />Save Heading
                        </Button>
                      )}
                      {bodyEdited && (
                        <Button size="sm" onClick={() => handleSaveContent(bodyKey)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                          <Save className="w-3 h-3 mr-1" />Save Body
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Email Templates Tab ──────── */}
        {activeTab === "email-templates" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Email Templates</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
                </Button>
                <Button size="sm" onClick={handleSeedContent} disabled={loading} className="rounded-xl gradient-accent text-accent-foreground border-0">
                  <Database className="w-4 h-4 mr-2" />Seed Defaults
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Customize confirmation emails sent to visitors. Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> for visitor name and <code className="bg-muted px-1 rounded">{"{{product}}"}</code> for product name.
            </p>

            {/* Brand Settings */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" />Brand Settings (shared across all emails)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "email.brand_name", label: "Brand Name" },
                  { key: "email.tagline", label: "Tagline" },
                  { key: "email.primary_color", label: "Primary Color (hex)" },
                ].map(({ key, label }) => {
                  const val = editedContent[key] || { value_en: "", value_ar: "" };
                  const original = content.find((c) => c.content_key === key);
                  const edited = original && (val.value_en !== original.value_en);
                  return (
                    <div key={key}>
                      <label className="text-sm font-medium text-foreground">{label}</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={val.value_en}
                          onChange={(e) => updateEditedField(key, "value_en", e.target.value)}
                          className="rounded-xl"
                        />
                        {edited && (
                          <Button size="sm" onClick={() => handleSaveContent(key)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                            <Save className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Logo Upload */}
                {(() => {
                  const key = "email.logo_url";
                  const val = editedContent[key] || { value_en: "", value_ar: "" };
                  const original = content.find((c) => c.content_key === key);
                  const edited = original && (val.value_en !== original.value_en);
                  return (
                    <div>
                      <label className="text-sm font-medium text-foreground">Logo Image</label>
                      <div className="flex gap-2 mt-1 items-center flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="email-logo-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploading(true);
                              const url = await uploadFileAndGetUrl(file, "images", "email", storedPassword);
                              updateEditedField(key, "value_en", url);
                              updateEditedField(key, "value_ar", url);
                              toast.success("Logo uploaded — click Save to apply");
                            } catch (err: any) { toast.error(err.message); }
                            finally { setUploading(false); e.target.value = ""; }
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById("email-logo-upload")?.click()} disabled={uploading} className="rounded-xl">
                          <Upload className={`w-4 h-4 mr-2 ${uploading ? "animate-spin" : ""}`} />{uploading ? "Uploading..." : "Upload Logo"}
                        </Button>
                        {val.value_en && (
                          <Button variant="outline" size="sm" onClick={() => { updateEditedField(key, "value_en", ""); updateEditedField(key, "value_ar", ""); }} className="rounded-xl text-destructive">
                            <Trash2 className="w-3 h-3 mr-1" />Remove
                          </Button>
                        )}
                        {edited && (
                          <Button size="sm" onClick={() => handleSaveContent(key)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                            <Save className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {val.value_en && (
                        <div className="mt-2 p-2 bg-muted rounded-lg inline-block">
                          <img src={val.value_en} alt="Logo preview" className="h-10 object-contain" />
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* Banner Upload */}
                {(() => {
                  const key = "email.banner_url";
                  const val = editedContent[key] || { value_en: "", value_ar: "" };
                  const original = content.find((c) => c.content_key === key);
                  const edited = original && (val.value_en !== original.value_en);
                  return (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Promotion Banner Image</label>
                      <div className="flex gap-2 mt-1 items-center flex-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="email-banner-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploading(true);
                              const url = await uploadFileAndGetUrl(file, "images", "email", storedPassword);
                              updateEditedField(key, "value_en", url);
                              updateEditedField(key, "value_ar", url);
                              toast.success("Banner uploaded — click Save to apply");
                            } catch (err: any) { toast.error(err.message); }
                            finally { setUploading(false); e.target.value = ""; }
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById("email-banner-upload")?.click()} disabled={uploading} className="rounded-xl">
                          <Upload className={`w-4 h-4 mr-2 ${uploading ? "animate-spin" : ""}`} />{uploading ? "Uploading..." : "Upload Banner"}
                        </Button>
                        {val.value_en && (
                          <Button variant="outline" size="sm" onClick={() => { updateEditedField(key, "value_en", ""); updateEditedField(key, "value_ar", ""); }} className="rounded-xl text-destructive">
                            <Trash2 className="w-3 h-3 mr-1" />Remove
                          </Button>
                        )}
                        {edited && (
                          <Button size="sm" onClick={() => handleSaveContent(key)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                            <Save className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {val.value_en && (
                        <div className="mt-2 p-2 bg-muted rounded-lg">
                          <img src={val.value_en} alt="Banner preview" className="max-h-24 object-contain rounded" />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Template Cards */}
            {[
              { id: "lead", title: "Contact Form Confirmation", subjectKey: "email.lead_subject", headingKey: "email.lead_heading", bodyKey: "email.lead_body", placeholders: "{{name}}" },
              { id: "enquiry", title: "Product Enquiry Confirmation", subjectKey: "email.enquiry_subject", headingKey: "email.enquiry_heading", bodyKey: "email.enquiry_body", placeholders: "{{name}}, {{product}}" },
            ].map((tmpl) => (
              <div key={tmpl.id} className="bg-card border border-border rounded-xl p-5 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />{tmpl.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Placeholders: {tmpl.placeholders}</p>
                {[
                  { key: tmpl.subjectKey, label: "Subject Line", isTextarea: false },
                  { key: tmpl.headingKey, label: "Heading", isTextarea: false },
                  { key: tmpl.bodyKey, label: "Body Text", isTextarea: true },
                ].map(({ key, label, isTextarea }) => {
                  const val = editedContent[key] || { value_en: "", value_ar: "" };
                  const original = content.find((c) => c.content_key === key);
                  const edited = original && (val.value_en !== original.value_en || val.value_ar !== original.value_ar);
                  return (
                    <div key={key} className="mb-4">
                      <label className="text-sm font-medium text-foreground">{label}</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="text-xs text-muted-foreground">English</span>
                          {isTextarea ? (
                            <Textarea value={val.value_en} onChange={(e) => updateEditedField(key, "value_en", e.target.value)} className="rounded-xl mt-1" rows={3} />
                          ) : (
                            <Input value={val.value_en} onChange={(e) => updateEditedField(key, "value_en", e.target.value)} className="rounded-xl mt-1" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Arabic</span>
                          {isTextarea ? (
                            <Textarea value={val.value_ar} onChange={(e) => updateEditedField(key, "value_ar", e.target.value)} className="rounded-xl mt-1" rows={3} dir="rtl" />
                          ) : (
                            <Input value={val.value_ar} onChange={(e) => updateEditedField(key, "value_ar", e.target.value)} className="rounded-xl mt-1" dir="rtl" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm" variant="outline" disabled={translating || !val.value_en}
                          onClick={async () => {
                            setTranslating(true);
                            try {
                              const result = await translateTexts({ [key]: val.value_en });
                              if (result[key]) updateEditedField(key, "value_ar", result[key]);
                              toast.success("Translated");
                            } catch (e: any) { toast.error(e.message); }
                            finally { setTranslating(false); }
                          }}
                          className="rounded-xl"
                        >
                          <Languages className="w-3 h-3 mr-1" />{translating ? "..." : "Translate"}
                        </Button>
                        {edited && (
                          <Button size="sm" onClick={() => handleSaveContent(key)} className="gradient-accent text-accent-foreground rounded-xl border-0">
                            <Save className="w-3 h-3 mr-1" />Save
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <PdfViewerDialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen} src={pdfPreviewUrl} />
    </div>
  );
}
