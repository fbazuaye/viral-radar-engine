import { useState, useRef } from "react";
import { Image, Sparkles, Palette, Type, Layers, Loader2, Download, History, ChevronDown, ChevronUp, Monitor, Instagram, Twitter, X, Upload, SlidersHorizontal, ImagePlus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsightsHistory } from "@/hooks/useInsightsHistory";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThumbnailConcept {
  style: string;
  desc: string;
  colors: string;
  textOverlay: string;
  imageUrl?: string;
}

const platformExports = [
  { label: "YouTube (1280×720)", width: 1280, height: 720, icon: Monitor },
  { label: "Instagram (1080×1080)", width: 1080, height: 1080, icon: Instagram },
  { label: "Twitter/X (1600×900)", width: 1600, height: 900, icon: Twitter },
];

const defaultConcepts: ThumbnailConcept[] = [
  { style: "Split Comparison", desc: "Before/After with bold dividing line, shocked face on one side", colors: "Red + Yellow", textOverlay: "SHOCKING RESULTS" },
  { style: "Minimalist Focus", desc: "Clean background, single product in center, large bold text", colors: "Black + White + Accent", textOverlay: "The ONE Tool" },
  { style: "Reaction Style", desc: "Expressive face close-up with glowing overlay and emoji", colors: "Purple gradient", textOverlay: "I CAN'T BELIEVE THIS" },
  { style: "Data Visualization", desc: "Chart/graph background with highlighted metric and arrow", colors: "Dark blue + Green", textOverlay: "+500% GROWTH" },
];

const resizeAndDownload = async (imageUrl: string, width: number, height: number, fileName: string) => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const img = await createImageBitmap(blob);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const scale = Math.max(width / img.width, height / img.height);
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    const offsetX = (width - scaledW) / 2;
    const offsetY = (height - scaledH) / 2;
    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

    canvas.toBlob((outputBlob) => {
      if (!outputBlob) return;
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded at ${width}×${height}!`);
    }, "image/png");
  } catch {
    toast.error("Failed to download thumbnail");
  }
};

const Thumbnails = () => {
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate");
  const [topic, setTopic] = useState("");
  const [concepts, setConcepts] = useState<ThumbnailConcept[]>(defaultConcepts);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const queryClient = useQueryClient();
  const { data: history = [] } = useInsightsHistory("thumbnail");

  // Edit state
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a video topic");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnails", {
        body: { topic: topic.trim() },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.concepts?.length) {
        setConcepts(data.concepts);
        setHasGenerated(true);
        toast.success("Thumbnail concepts generated!");
        queryClient.invalidateQueries({ queryKey: ["token-balance"] });
        queryClient.invalidateQueries({ queryKey: ["insights-history", "thumbnail"] });
        queryClient.invalidateQueries({ queryKey: ["search-history"] });
      } else {
        throw new Error("No concepts returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate thumbnails");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditImageBase64(reader.result as string);
      setEditedImageUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyEdit = async () => {
    if (!editImageBase64) {
      toast.error("Please upload an image first");
      return;
    }
    if (!editPrompt.trim()) {
      toast.error("Please describe the edit you want");
      return;
    }
    setEditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnails", {
        body: { editImage: editImageBase64, editPrompt: editPrompt.trim() },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.editedImageUrl) {
        setEditedImageUrl(data.editedImageUrl);
        toast.success("Thumbnail edited successfully!");
        queryClient.invalidateQueries({ queryKey: ["token-balance"] });
      } else {
        throw new Error("No edited image returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to edit thumbnail");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDownloadEdited = () => {
    if (!editedImageUrl) return;
    const a = document.createElement("a");
    a.href = editedImageUrl;
    a.download = `edited-thumbnail-${Date.now()}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started!");
  };

  const clearEditUpload = () => {
    setEditImageBase64(null);
    setEditedImageUrl(null);
    setEditPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadFromHistory = (item: any) => {
    const data = item.output_data as ThumbnailConcept[];
    if (Array.isArray(data)) {
      setConcepts(data);
      setHasGenerated(true);
      setTopic(item.input_text || "");
      setActiveTab("generate");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Image className="h-6 w-6 text-primary" />
          Thumbnails
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Create eye-catching thumbnails with AI or edit your own.</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-border bg-card overflow-hidden w-fit">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "bg-primary/10 text-primary border-r border-border"
              : "text-muted-foreground hover:text-foreground border-r border-border"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "edit"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* === GENERATE TAB === */}
      {activeTab === "generate" && (
        <>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
              placeholder="Describe your video topic..."
              className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={handleGenerate} disabled={loading} className="gradient-primary text-primary-foreground gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating images..." : "Generate"}
            </Button>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <Skeleton className="aspect-video w-full rounded-lg mb-4" />
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {concepts.map((c, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="relative group aspect-video rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center mb-4 overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.style} className="w-full h-full object-contain cursor-pointer" onClick={() => setPreviewImage({ url: c.imageUrl!, title: c.style })} />
                    ) : (
                      <Layers className="h-8 w-8 text-muted-foreground/40" />
                    )}
                    {c.imageUrl && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setPreviewImage({ url: c.imageUrl!, title: c.style })}>
                          <Image className="h-4 w-4" />
                          Preview
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="secondary" className="gap-1.5">
                              <Download className="h-4 w-4" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            {platformExports.map((p) => {
                              const Icon = p.icon;
                              return (
                                <DropdownMenuItem
                                  key={p.label}
                                  onClick={() =>
                                    resizeAndDownload(
                                      c.imageUrl!,
                                      p.width,
                                      p.height,
                                      `thumbnail-${c.style.toLowerCase().replace(/\s+/g, "-")}-${p.width}x${p.height}.png`
                                    )
                                  }
                                >
                                  <Icon className="h-4 w-4 mr-2" />
                                  {p.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-card-foreground mb-2">{c.style}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Palette className="h-3 w-3" /> {c.colors}</span>
                    <span className="flex items-center gap-1"><Type className="h-3 w-3" /> "{c.textOverlay}"</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === EDIT TAB === */}
      {activeTab === "edit" && (
        <div className="space-y-6">
          {/* Upload area */}
          {!editImageBase64 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ImagePlus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Upload a thumbnail to edit</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Original image preview */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Original Image</h3>
                  <Button variant="ghost" size="sm" onClick={clearEditUpload} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted/50 border border-border/50">
                  <img
                    src={editImageBase64}
                    alt="Original thumbnail"
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={() => setPreviewImage({ url: editImageBase64!, title: "Original Image" })}
                  />
                </div>
              </div>

              {/* Edit prompt */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !editLoading && handleApplyEdit()}
                  placeholder="Describe the edit... e.g. 'Add bold text SUBSCRIBE', 'make colors more vibrant'"
                  className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                />
                <Button onClick={handleApplyEdit} disabled={editLoading} className="gradient-primary text-primary-foreground gap-2">
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
                  {editLoading ? "Editing..." : "Apply Edit"}
                </Button>
              </div>

              {/* Loading skeleton */}
              {editLoading && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <Skeleton className="aspect-video w-full rounded-lg" />
                </div>
              )}

              {/* Edited result */}
              {editedImageUrl && !editLoading && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground">Edited Result</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {platformExports.map((p) => {
                          const Icon = p.icon;
                          return (
                            <DropdownMenuItem
                              key={p.label}
                              onClick={() => resizeAndDownload(editedImageUrl!, p.width, p.height, `edited-thumbnail-${p.width}x${p.height}.png`)}
                              className="gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              {p.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted/50 border border-border/50">
                    <img
                      src={editedImageUrl}
                      alt="Edited thumbnail"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setPreviewImage({ url: editedImageUrl!, title: "Edited Thumbnail" })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History (only on generate tab) */}
      {activeTab === "generate" && history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Past Thumbnails
          </h2>
          <div className="space-y-2">
            {history.map((item) => {
              const isExpanded = expandedHistory === item.id;
              const data = item.output_data as any[];
              const preview = Array.isArray(data) ? data[0]?.imageUrl : null;
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {preview && (
                        <img src={preview} alt="" className="h-9 w-16 rounded object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{item.input_text || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })} · {Array.isArray(data) ? data.length : 0} concepts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadFromHistory(item);
                        }}
                      >
                        Load
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && Array.isArray(data) && (
                    <div className="px-4 pb-4 border-t border-border pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {data.map((c: any, i: number) => (
                        <div key={i} className="space-y-1">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.style} className="w-full aspect-video rounded object-contain cursor-pointer" onClick={() => setPreviewImage({ url: c.imageUrl, title: c.style })} />
                          ) : (
                            <div className="w-full aspect-video rounded bg-muted/30 flex items-center justify-center">
                              <Layers className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground truncate">{c.style}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-2 bg-background/95 backdrop-blur-sm border-border">
          {previewImage && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              <p className="text-sm font-medium text-card-foreground">{previewImage.title}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Thumbnails;
