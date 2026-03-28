import { AlignLeft, Sparkles, Loader2, History, Copy, Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useInsightsHistory } from "@/hooks/useInsightsHistory";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const DescriptionGenerator = () => {
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [description, setDescription] = useState("");
  const [refineInstruction, setRefineInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const { data: history = [] } = useInsightsHistory("description");
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setDescription("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: { title: title.trim(), script: script.trim() || undefined },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setDescription(data.description || "");
      queryClient.invalidateQueries({ queryKey: ["insights-history", "description"] });
      queryClient.invalidateQueries({ queryKey: ["search-history"] });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate description", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim() || !description) return;
    setRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          title: title.trim(),
          script: script.trim() || undefined,
          refineInstruction: refineInstruction.trim(),
          currentDescription: description,
        },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setDescription(data.description || "");
      setRefineInstruction("");
      queryClient.invalidateQueries({ queryKey: ["insights-history", "description"] });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
      toast({ title: "Refined!", description: "Description updated with your instructions" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to refine description", variant: "destructive" });
    } finally {
      setRefining(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    toast({ title: "Copied!", description: "Description copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFromHistory = (item: any) => {
    const data = item.output_data as any;
    setDescription(data.description || "");
    setTitle(item.input_text || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <AlignLeft className="h-6 w-6 text-primary" />
          Video Description Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create SEO-optimized YouTube descriptions with keywords, timestamps & hashtags
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Video Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleGenerate()}
            placeholder="Enter your video title..."
            className="w-full h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Script <span className="text-muted-foreground font-normal">(optional — paste for best results)</span>
          </label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your video script here for a more detailed, keyword-rich description with timestamps..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>
        <Button onClick={handleGenerate} disabled={loading || !title.trim()} className="gradient-primary text-primary-foreground gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Create Video Description
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {description && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-card-foreground">📝 Generated Description</h3>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 whitespace-pre-wrap font-sans leading-relaxed">
            {description}
          </pre>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${description.length < 800 ? "text-yellow-500" : description.length > 5000 ? "text-destructive" : "text-primary"}`}>
              {description.length.toLocaleString()} characters
            </span>
            <span className="text-muted-foreground">
              YouTube recommended: 800–5,000 chars
              {description.length < 800 && " · ⚠ Too short"}
              {description.length > 5000 && " · ⚠ Too long"}
              {description.length >= 800 && description.length <= 5000 && " · ✓ Good length"}
            </span>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-sm font-medium text-foreground block">Refine this description</label>
            <textarea
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="e.g. Make it shorter, add more hashtags, focus on SEO keywords, change the tone to casual..."
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            <Button
              onClick={handleRefine}
              disabled={refining || !refineInstruction.trim()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refine Description
            </Button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Past Descriptions
          </h2>
          <div className="space-y-2">
            {history.map((item) => {
              const isExpanded = expandedHistory === item.id;
              const data = item.output_data as any;
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-card-foreground truncate">{item.input_text || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
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
                  {isExpanded && data?.description && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <pre className="text-xs text-card-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap font-sans">
                        {data.description}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DescriptionGenerator;
