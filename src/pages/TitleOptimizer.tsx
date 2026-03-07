import { Type, Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockOptimized = [
  { title: "I Tested 5 AI Video Editors — Only ONE Was Worth It", score: 94, reason: "Curiosity gap + number + emotional hook" },
  { title: "Stop Using Premiere Pro — These AI Tools Are 10x Faster", score: 91, reason: "Contrarian take + specific benefit" },
  { title: "The AI Video Editor That's Replacing Entire Teams", score: 88, reason: "Bold claim + social proof implication" },
];

const TitleOptimizer = () => {
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

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
          placeholder="Enter your video title..."
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <Button className="gradient-primary text-primary-foreground gap-2">
          <Sparkles className="h-4 w-4" /> Optimize
        </Button>
      </div>

      <div className="space-y-3">
        {mockOptimized.map((o, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-card-foreground">{o.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{o.reason}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-display font-bold text-primary">{o.score}/100</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(o.title, i)}>
                {copied === i ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TitleOptimizer;
