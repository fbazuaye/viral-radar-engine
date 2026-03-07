import { Lightbulb, Sparkles, Bookmark, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VideoIdea {
  title: string;
  category: string;
  difficulty: string;
}

const IdeaGenerator = () => {
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setIdeas([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: { niche: niche.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIdeas(data.ideas || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate ideas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
    </div>
  );
};

export default IdeaGenerator;
