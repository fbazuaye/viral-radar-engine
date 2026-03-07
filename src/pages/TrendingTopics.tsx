import { TrendingUp, ExternalLink, Eye, ThumbsUp } from "lucide-react";

const topics = [
  { title: "AI Agents Building Apps", views: "2.4M", engagement: "8.2%", growth: "+340%", category: "Tech" },
  { title: "Sora Video Generation", views: "1.8M", engagement: "7.5%", growth: "+280%", category: "AI" },
  { title: "Side Hustle 2026", views: "3.1M", engagement: "6.1%", growth: "+190%", category: "Business" },
  { title: "Home Gym on a Budget", views: "1.2M", engagement: "9.3%", growth: "+150%", category: "Fitness" },
  { title: "No-Code SaaS Building", views: "890K", engagement: "7.8%", growth: "+220%", category: "Tech" },
  { title: "Minimalist Apartment Tour", views: "2.1M", engagement: "5.9%", growth: "+120%", category: "Lifestyle" },
];

const TrendingTopics = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        Viral Topic Finder
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Trending topics across YouTube right now</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {topics.map((t, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 hover:glow-primary transition-all group">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.category}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-display font-semibold text-card-foreground mb-3">{t.title}</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {t.views}</span>
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {t.engagement}</span>
            <span className="text-success font-medium">{t.growth}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TrendingTopics;
