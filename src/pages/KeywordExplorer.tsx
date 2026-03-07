import { Search, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockResults = [
  { keyword: "ai video editing", volume: 135000, competition: 32, trend: "+45%", related: ["ai video editor free", "best ai video tools", "ai editing 2026"] },
  { keyword: "youtube shorts monetization", volume: 89000, competition: 58, trend: "+28%", related: ["shorts fund 2026", "shorts revenue", "how to monetize shorts"] },
  { keyword: "faceless youtube channel", volume: 210000, competition: 71, trend: "+62%", related: ["faceless channel ideas", "automation youtube", "ai faceless videos"] },
];

const KeywordExplorer = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Keyword Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Discover high-demand, low-competition keywords</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a keyword or topic..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button className="gradient-primary text-primary-foreground">Analyze</Button>
      </div>

      <div className="space-y-4">
        {mockResults.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-card-foreground">{r.keyword}</h3>
              <span className="text-sm text-success font-medium">{r.trend}</span>
            </div>
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Volume: <span className="text-card-foreground font-medium">{r.volume.toLocaleString()}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Competition: <span className={`font-medium ${r.competition < 40 ? "text-success" : r.competition < 65 ? "text-warning" : "text-destructive"}`}>{r.competition}/100</span></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.related.map((rel, j) => (
                <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                  {rel} <ArrowRight className="h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordExplorer;
