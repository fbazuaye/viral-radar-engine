import { Lightbulb, Sparkles, Bookmark, Loader2, History, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useInsightsHistory } from "@/hooks/useInsightsHistory";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface VideoIdea {
  title: string;
  category: string;
  difficulty: string;
}

const IdeaGenerator = () => {
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const { data: history = [] } = useInsightsHistory("idea");
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setIdeas([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: { niche: niche.trim() },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setIdeas(data.ideas || []);
      queryClient.invalidateQueries({ queryKey: ["insights-history", "idea"] });
      queryClient.invalidateQueries({ queryKey: ["search-history"] });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate ideas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: any) => {
    const data = item.output_data as any;
    setIdeas(data.ideas || []);
    setNiche(item.input_text || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          Video Idea Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generate viral video ideas based on your niche</p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="Enter your niche or keyword (e.g., tech reviews, cooking)..."
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={handleGenerate} disabled={loading || !niche.trim()} className="gradient-primary text-primary-foreground gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 group hover:glow-primary transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{idea.category}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
              </div>
              <h3 className="font-display font-semibold text-card-foreground mb-2">{idea.title}</h3>
              <span className="text-xs text-muted-foreground">Difficulty: {idea.difficulty}</span>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Past Ideas
          </h2>
          <div className="space-y-2">
            {history.map((item) => {
              const isExpanded = expandedHistory === item.id;
              const data = item.output_data as any;
              const itemIdeas: VideoIdea[] = data?.ideas || [];
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-card-foreground truncate">{item.input_text || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })} · {itemIdeas.length} ideas
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
                      {itemIdeas.map((idea, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">{idea.category}</span>
                          <span className="text-card-foreground truncate">{idea.title}</span>
                          <span className="text-muted-foreground shrink-0">{idea.difficulty}</span>
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

export default IdeaGenerator;
