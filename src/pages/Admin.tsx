import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Lock, Trash2, Save, RefreshCw, Database, FileText, MessageSquare, LogOut, Image, Upload } from "lucide-react";

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

// Default content for seeding
const defaultContent: { content_key: string; value_en: string; value_ar: string }[] = [
  { content_key: "hero.headline", value_en: "Engineering Excellence for Modern Industry", value_ar: "التميز الهندسي للصناعة الحديثة" },
  { content_key: "hero.subtext", value_en: "Premium industrial solutions designed to optimize performance, safety, and sustainability across your operations.", value_ar: "حلول صناعية متميزة مصممة لتحسين الأداء والسلامة والاستدامة عبر عملياتك." },
  { content_key: "about.title", value_en: "Trusted Partner in Industrial Innovation", value_ar: "شريك موثوق في الابتكار الصناعي" },
  { content_key: "about.desc", value_en: "With decades of expertise in industrial technology, we deliver comprehensive solutions that drive efficiency, ensure safety, and promote sustainable operations.", value_ar: "مع عقود من الخبرة في التكنولوجيا الصناعية، نقدم حلولاً شاملة تعزز الكفاءة وتضمن السلامة وتعزز العمليات المستدامة." },
  { content_key: "products.title", value_en: "Comprehensive Industrial Solutions", value_ar: "حلول صناعية شاملة" },
  { content_key: "products.desc", value_en: "Explore our extensive range of industrial products designed to meet the demands of modern facilities.", value_ar: "اكتشف مجموعتنا الواسعة من المنتجات الصناعية المصممة لتلبية متطلبات المنشآت الحديثة." },
  { content_key: "products.fire", value_en: "Fire & Smoke Safety", value_ar: "السلامة من الحريق" },
  { content_key: "products.fire.desc", value_en: "Advanced fire curtains and smoke management systems for complete building protection.", value_ar: "أنظمة ستائر حريق ودخان متقدمة لحماية المباني بالكامل." },
  { content_key: "products.roller", value_en: "Roller Shutters & Doors", value_ar: "الأبواب والشتر" },
  { content_key: "products.roller.desc", value_en: "Industrial, commercial, residential, high-speed, and steel door solutions.", value_ar: "حلول أبواب صناعية وتجارية وسكنية وعالية السرعة وفولاذية." },
  { content_key: "products.oil", value_en: "Oil & Gas Equipment", value_ar: "معدات النفط والغاز" },
  { content_key: "products.oil.desc", value_en: "Precision well equipment, sensors, and spare parts for energy operations.", value_ar: "معدات الآبار الدقيقة وأجهزة الاستشعار وقطع الغيار لعمليات الطاقة." },
  { content_key: "products.hvac", value_en: "HVAC & Ventilation", value_ar: "التهوية والتكييف" },
  { content_key: "products.hvac.desc", value_en: "Industrial ventilators, exhaust systems, thermostats, and dampers.", value_ar: "مراوح صناعية وأنظمة عادم وثرموستات ومخمدات." },
  { content_key: "products.loading", value_en: "Loading Bay Equipment", value_ar: "معدات التحميل" },
  { content_key: "products.loading.desc", value_en: "Dock levelers and shelters for efficient material handling.", value_ar: "مسويات ومظلات الرصيف لمناولة المواد بكفاءة." },
  { content_key: "products.louvers", value_en: "Louvers & Steel Doors", value_ar: "الفتحات والأبواب الفولاذية" },
  { content_key: "products.louvers.desc", value_en: "Heavy-duty louvers and steel security doors for industrial applications.", value_ar: "فتحات وأبواب فولاذية للتطبيقات الصناعية." },
  { content_key: "services.title", value_en: "Expert Engineering Services", value_ar: "خدمات هندسية متخصصة" },
  { content_key: "services.desc", value_en: "We provide end-to-end industrial solutions from technical design to installation and ongoing support.", value_ar: "نقدم حلولاً صناعية شاملة من التصميم الفني إلى التركيب والدعم المستمر." },
  { content_key: "services.drawing", value_en: "Technical Drawing", value_ar: "الرسم الفني" },
  { content_key: "services.drawing.desc", value_en: "Precision CAD and engineering drawings tailored to your facility specifications.", value_ar: "رسومات CAD هندسية دقيقة مصممة وفقاً لمواصفات منشأتك." },
  { content_key: "services.install", value_en: "Installation", value_ar: "التركيب" },
  { content_key: "services.install.desc", value_en: "Professional installation services with certified technicians and quality assurance.", value_ar: "خدمات تركيب احترافية مع فنيين معتمدين وضمان الجودة." },
  { content_key: "services.maintenance", value_en: "Maintenance", value_ar: "الصيانة" },
  { content_key: "services.maintenance.desc", value_en: "Preventive and corrective maintenance programs to ensure optimal performance.", value_ar: "برامج صيانة وقائية وتصحيحية لضمان الأداء الأمثل." },
  { content_key: "services.consulting", value_en: "Consulting", value_ar: "الاستشارات" },
  { content_key: "services.consulting.desc", value_en: "Expert industrial consulting to optimize your operations and system design.", value_ar: "استشارات صناعية متخصصة لتحسين عملياتك وتصميم أنظمتك." },
  { content_key: "contact.title", value_en: "Let's Build Something Great", value_ar: "لنبني شيئاً رائعاً معاً" },
  { content_key: "contact.desc", value_en: "Ready to upgrade your industrial infrastructure? Send us a message and our team will respond within 24 hours.", value_ar: "هل أنت مستعد لتطوير بنيتك التحتية الصناعية؟ أرسل لنا رسالة وسيرد فريقنا خلال 24 ساعة." },
  { content_key: "footer.email", value_en: "info@mivora.com", value_ar: "info@mivora.com" },
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
      // Remove data URL prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "content" | "images">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, { value_en: string; value_ar: string }>>({});

  // Images state
  const [selectedFolder, setSelectedFolder] = useState(IMAGE_FOLDERS[0]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storedPassword = authenticated ? password : "";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("leads", "GET", storedPassword);
      setLeads(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [storedPassword]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `files?bucket=${selectedFolder.bucket}&folder=${selectedFolder.folder}`,
        "GET",
        storedPassword
      );
      // Filter out folder placeholders
      setFiles(data.filter((f: StorageFile) => f.name !== ".emptyFolderPlaceholder"));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [storedPassword, selectedFolder]);

  useEffect(() => {
    if (authenticated) {
      if (activeTab === "leads") fetchLeads();
      else if (activeTab === "content") fetchContent();
      else fetchFiles();
    }
  }, [authenticated, activeTab, fetchLeads, fetchContent, fetchFiles]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall("leads", "GET", password);
      setAuthenticated(true);
      toast.success("Logged in successfully");
    } catch {
      toast.error("Invalid password");
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await apiCall("leads", "DELETE", storedPassword, { id });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveContent = async (key: string) => {
    const edited = editedContent[key];
    if (!edited) return;
    try {
      await apiCall("content", "POST", storedPassword, {
        content_key: key,
        value_en: edited.value_en,
        value_ar: edited.value_ar,
      });
      toast.success(`Saved "${key}"`);
      fetchContent();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSeedContent = async () => {
    try {
      setLoading(true);
      await apiCall("seed", "POST", storedPassword, { entries: defaultContent });
      toast.success("Content seeded successfully");
      fetchContent();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEditedField = (key: string, field: "value_en" | "value_ar", value: string) => {
    setEditedContent((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleUploadFiles = async (fileList: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const base64 = await fileToBase64(file);
        const filePath = selectedFolder.folder
          ? `${selectedFolder.folder}/${file.name}`
          : file.name;
        await apiCall("upload", "POST", storedPassword, {
          bucket: selectedFolder.bucket,
          filePath,
          base64,
          contentType: file.type,
        });
      }
      toast.success(`Uploaded ${fileList.length} file(s)`);
      fetchFiles();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      const path = selectedFolder.folder
        ? `${selectedFolder.folder}/${fileName}`
        : fileName;
      await apiCall("files", "DELETE", storedPassword, {
        bucket: selectedFolder.bucket,
        paths: [path],
      });
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      toast.success("File deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getPublicUrl = (fileName: string) => {
    const path = selectedFolder.folder
      ? `${selectedFolder.folder}/${fileName}`
      : fileName;
    return `${STORAGE_BASE}/${selectedFolder.bucket}/${path}`;
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);

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
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded-xl"
            required
          />
          <Button type="submit" className="w-full gradient-accent text-accent-foreground rounded-xl border-0">
            Login
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Mivora Admin</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAuthenticated(false);
              setPassword("");
            }}
            className="rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => setActiveTab("leads")}
            className="rounded-xl"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Leads ({leads.length})
          </Button>
          <Button
            variant={activeTab === "content" ? "default" : "outline"}
            onClick={() => setActiveTab("content")}
            className="rounded-xl"
          >
            <FileText className="w-4 h-4 mr-2" />
            Site Content
          </Button>
          <Button
            variant={activeTab === "images" ? "default" : "outline"}
            onClick={() => setActiveTab("images")}
            className="rounded-xl"
          >
            <Image className="w-4 h-4 mr-2" />
            Files & Images
          </Button>
        </div>

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Contact Submissions</h2>
              <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            {leads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No leads yet</p>
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
                          {lead.company && (
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                              {lead.company}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{lead.message}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          {new Date(lead.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Site Content</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSeedContent} disabled={loading} className="rounded-xl">
                  <Database className="w-4 h-4 mr-2" />
                  Seed Defaults
                </Button>
                <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
            {content.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No content yet. Click "Seed Defaults" to populate with current website content.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-mono bg-secondary px-3 py-1 rounded-lg text-secondary-foreground">
                        {item.content_key}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleSaveContent(item.content_key)}
                        className="gradient-accent text-accent-foreground rounded-xl border-0"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">English</label>
                        {(editedContent[item.content_key]?.value_en?.length || 0) > 100 ? (
                          <Textarea
                            value={editedContent[item.content_key]?.value_en || ""}
                            onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)}
                            rows={3}
                            className="rounded-xl resize-none"
                          />
                        ) : (
                          <Input
                            value={editedContent[item.content_key]?.value_en || ""}
                            onChange={(e) => updateEditedField(item.content_key, "value_en", e.target.value)}
                            className="rounded-xl"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Arabic</label>
                        {(editedContent[item.content_key]?.value_ar?.length || 0) > 100 ? (
                          <Textarea
                            value={editedContent[item.content_key]?.value_ar || ""}
                            onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)}
                            rows={3}
                            className="rounded-xl resize-none"
                            dir="rtl"
                          />
                        ) : (
                          <Input
                            value={editedContent[item.content_key]?.value_ar || ""}
                            onChange={(e) => updateEditedField(item.content_key, "value_ar", e.target.value)}
                            className="rounded-xl"
                            dir="rtl"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Files & Images</h2>
                <div className="flex gap-1">
                  {IMAGE_FOLDERS.map((folder) => (
                    <Button
                      key={`${folder.bucket}-${folder.folder}`}
                      variant={selectedFolder === folder ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFolder(folder)}
                      className="rounded-xl text-xs"
                    >
                      {folder.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={selectedFolder.bucket === "pdfs" ? ".pdf" : "image/*,.pdf"}
                  onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl"
                >
                  <Upload className={`w-4 h-4 mr-2 ${uploading ? "animate-spin" : ""}`} />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Upload images to <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{selectedFolder.bucket}/{selectedFolder.folder}</span>.
              {selectedFolder.folder === "hero" && " Name files hero-1.jpg through hero-5.jpg for the homepage slider."}
              {selectedFolder.folder === "products" && " Name files product-fire.jpg, product-roller.jpg, etc. for product cards."}
            </p>

            {files.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No files in this folder yet. Upload some!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div key={file.id || file.name} className="bg-card border border-border rounded-2xl overflow-hidden group">
                    {isImage(file.name) ? (
                      <div className="aspect-video bg-muted">
                        <img
                          src={getPublicUrl(file.name)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <FileText className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-foreground truncate flex-1" title={file.name}>
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 h-7 w-7 p-0"
                      >
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
    </div>
  );
}
