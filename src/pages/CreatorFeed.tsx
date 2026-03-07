import { Rss, CheckCircle2, Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const feedItems = [
  { type: "task", icon: CheckCircle2, title: "Optimize your latest video description", desc: "Add 3-5 relevant keywords to boost discoverability", priority: "high" },
  { type: "insight", icon: TrendingUp, title: "Your niche is trending upward", desc: "Tech review content saw a 23% engagement increase this week", priority: "medium" },
  { type: "idea", icon: Lightbulb, title: "New video idea based on your audience", desc: "Your subscribers are searching for 'budget AI tools' — consider a roundup video", priority: "medium" },
  { type: "alert", icon: AlertCircle, title: "Competitor uploaded a viral video", desc: "TechMaster Pro's latest video hit 500K views in 12 hours", priority: "high" },
  { type: "task", icon: CheckCircle2, title: "Update your channel banner", desc: "Your banner hasn't been updated in 90 days — refresh it for better conversion", priority: "low" },
];

const CreatorFeed = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Rss className="h-6 w-6 text-primary" />
        Creator Feed
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Daily AI-powered recommendations and optimization tasks</p>
    </div>

    <div className="space-y-3">
      {feedItems.map((item, i) => (
        <div key={i} className={cn(
          "rounded-xl border bg-card p-4 flex items-start gap-4 transition-all hover:shadow-md",
          item.priority === "high" ? "border-destructive/30" : "border-border"
        )}>
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
            item.type === "task" && "bg-primary/10",
            item.type === "insight" && "bg-accent/10",
            item.type === "idea" && "bg-warning/10",
            item.type === "alert" && "bg-destructive/10",
          )}>
            <item.icon className={cn(
              "h-4 w-4",
              item.type === "task" && "text-primary",
              item.type === "insight" && "text-accent",
              item.type === "idea" && "text-warning",
              item.type === "alert" && "text-destructive",
            )} />
          </div>
          <div>
            <h3 className="font-medium text-card-foreground text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CreatorFeed;
