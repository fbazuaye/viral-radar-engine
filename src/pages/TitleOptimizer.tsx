import { Type, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";

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

  const handleOptimize = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-title", {
        body: { title: title.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.titles || []);
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
    </div>
  );
};

export default TitleOptimizer;
