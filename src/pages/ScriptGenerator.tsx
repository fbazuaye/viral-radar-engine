import { FileText, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";

interface ScriptSection {
  title: string;
  content: string;
}

interface ScriptResult {
  hook: string;
  sections: ScriptSection[];
}

const ScriptGenerator = () => {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState<ScriptResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setScript(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: { topic: topic.trim() },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setScript({ hook: data.hook, sections: data.sections || [] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate script", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Script Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Create video outlines and full scripts with AI</p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="Enter your video topic..."
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="gradient-primary text-primary-foreground gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Script
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {script && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-card-foreground mb-2">🎯 Hook</h3>
            <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{script.hook}</p>
          </div>
          <div className="space-y-3">
            {script.sections.map((s, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-4">
                <h4 className="text-sm font-medium text-card-foreground">{s.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;
