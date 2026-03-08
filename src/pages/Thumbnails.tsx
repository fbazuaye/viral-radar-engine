import { useState } from "react";
import { Image, Sparkles, Palette, Type, Layers, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ThumbnailConcept {
  style: string;
  desc: string;
  colors: string;
  textOverlay: string;
  imageUrl?: string;
}

const defaultConcepts: ThumbnailConcept[] = [
  { style: "Split Comparison", desc: "Before/After with bold dividing line, shocked face on one side", colors: "Red + Yellow", textOverlay: "SHOCKING RESULTS" },
  { style: "Minimalist Focus", desc: "Clean background, single product in center, large bold text", colors: "Black + White + Accent", textOverlay: "The ONE Tool" },
  { style: "Reaction Style", desc: "Expressive face close-up with glowing overlay and emoji", colors: "Purple gradient", textOverlay: "I CAN'T BELIEVE THIS" },
  { style: "Data Visualization", desc: "Chart/graph background with highlighted metric and arrow", colors: "Dark blue + Green", textOverlay: "+500% GROWTH" },
];

const Thumbnails = () => {
  const [topic, setTopic] = useState("");
  const [concepts, setConcepts] = useState<ThumbnailConcept[]>(defaultConcepts);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

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
        toast.success("Thumbnail concepts generated!");
        queryClient.invalidateQueries({ queryKey: ["token-balance"] });
      } else {
        throw new Error("No concepts returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate thumbnails");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (concept: ThumbnailConcept) => {
    if (!concept.imageUrl) return;
    try {
      const res = await fetch(concept.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${concept.style.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Thumbnail downloaded!");
    } catch {
      toast.error("Failed to download thumbnail");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Image className="h-6 w-6 text-primary" />
          Thumbnail Idea Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated thumbnail concepts with images for maximum CTR</p>
      </div>

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
              <Skeleton className="h-40 w-full rounded-lg mb-4" />
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
              <div className="relative group h-40 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center mb-4 overflow-hidden">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.style} className="w-full h-full object-cover" />
                ) : (
                  <Layers className="h-8 w-8 text-muted-foreground/40" />
                )}
                {c.imageUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => handleDownload(c)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
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
    </div>
  );
};

export default Thumbnails;
