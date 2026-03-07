import { Target, TrendingUp, Eye, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const gaps = [
  { topic: "AI Podcast Editing Tools", demand: 82000, competition: 15, opportunity: 95, desc: "High search demand with very few quality videos" },
  { topic: "YouTube Studio Mobile Tips", demand: 64000, competition: 28, opportunity: 84, desc: "Underserved mobile-first creator audience" },
  { topic: "Newsletter to YouTube Pipeline", demand: 31000, competition: 8, opportunity: 92, desc: "Cross-platform content strategy barely covered" },
  { topic: "B2B YouTube Marketing", demand: 48000, competition: 22, opportunity: 78, desc: "Growing business demand with limited creator coverage" },
  { topic: "YouTube Community Tab Strategy", demand: 55000, competition: 19, opportunity: 86, desc: "Most creators ignore this engagement goldmine" },
];

const ContentGaps = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        Content Gap Finder
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Identify underserved topics with high audience demand</p>
    </div>

    <div className="space-y-3">
      {gaps.map((g, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 hover:glow-primary transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-display font-semibold text-card-foreground">{g.topic}</h3>
              <p className="text-sm text-muted-foreground mt-1">{g.desc}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Demand: {g.demand.toLocaleString()}/mo</span>
                <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Competition: <span className={cn(g.competition < 25 ? "text-success" : "text-warning")}>{g.competition}/100</span></span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-display font-bold text-success">{g.opportunity}</div>
              <div className="text-xs text-muted-foreground">opportunity</div>
            </div>
          </div>
          {/* Opportunity bar */}
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full gradient-accent" style={{ width: `${g.opportunity}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ContentGaps;
