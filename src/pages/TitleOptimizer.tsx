import { Type, Sparkles, Copy, Check, Loader2, History, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useInsightsHistory } from "@/hooks/useInsightsHistory";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface OptimizedTitle {
  title: string;
  score: number;
  reason: string;
}

const TitleOptimizer = () => {
  const [title, setTitle] = useState("");
  const [results, setResults] = useState<OptimizedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const { data: history = [] } = useInsightsHistory("title");
  const queryClient = useQueryClient();

  const handleOptimize = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-title", {
        body: { title: title.trim() },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setResults(data.titles || []);
      queryClient.invalidateQueries({ queryKey: ["insights-history", "title"] });
      queryClient.invalidateQueries({ queryKey: ["search-history"] });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to optimize title", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadFromHistory = (item: any) => {
    const data = item.output_data as any;
    setResults(data.titles || data || []);
    setTitle(item.input_text || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Type className="h-6 w-6 text-primary" />
          Video Title Optimizer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Paste a title and get AI-optimized variations</p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleOptimize()}
          placeholder="Enter your video title..."
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={handleOptimize} disabled={loading || !title.trim()} className="gradient-primary text-primary-foreground gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Optimize
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((o, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-card-foreground">{o.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{o.reason}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-display font-bold text-primary">{o.score}/100</span>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(o.title, i)}>
                  {copied === i ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Past Optimizations
          </h2>
          <div className="space-y-2">
            {history.map((item) => {
              const isExpanded = expandedHistory === item.id;
              const data = item.output_data as any;
              const titles: OptimizedTitle[] = data?.titles || (Array.isArray(data) ? data : []);
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-card-foreground truncate">{item.input_text || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })} · {titles.length} variations
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
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      {titles.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs gap-3">
                          <span className="text-card-foreground truncate">{t.title}</span>
                          <span className="text-primary font-bold shrink-0">{t.score}/100</span>
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
    </div>
  );
};

export default TitleOptimizer;
