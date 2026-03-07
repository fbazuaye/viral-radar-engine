import { FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockScript = {
  hook: "What if I told you there's an AI tool that can edit your entire YouTube video in under 5 minutes? Today I'm going to test the top 5 AI video editors and reveal which one actually delivers.",
  sections: [
    { title: "Introduction (0:00 - 0:45)", content: "Start with the bold claim. Show a split-screen of manual vs AI editing speed. Hook viewers with the promise of saving 10+ hours per week." },
    { title: "Tool #1: CapCut AI (0:45 - 3:00)", content: "Demo the auto-edit feature. Show before/after. Rate on speed, quality, and ease of use." },
    { title: "Tool #2: Descript (3:00 - 5:15)", content: "Focus on the text-based editing. Highlight the filler word removal. Show the AI voice clone feature." },
    { title: "Conclusion & Rankings (8:00 - 9:30)", content: "Reveal the final ranking. Give the 'best overall' and 'best budget' picks. Strong CTA to subscribe." },
  ],
};

const ScriptGenerator = () => {
  const [topic, setTopic] = useState("");

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
          placeholder="Enter your video topic..."
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <Button className="gradient-primary text-primary-foreground gap-2">
          <Sparkles className="h-4 w-4" /> Generate Script
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-card-foreground mb-2">🎯 Hook</h3>
          <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{mockScript.hook}</p>
        </div>
        <div className="space-y-3">
          {mockScript.sections.map((s, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-4">
              <h4 className="text-sm font-medium text-card-foreground">{s.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
