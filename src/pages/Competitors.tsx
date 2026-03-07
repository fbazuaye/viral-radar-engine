import { Users, TrendingUp, Eye, Play } from "lucide-react";

const competitors = [
  { name: "TechMaster Pro", subs: "2.1M", growth: "+5.2%", avgViews: "340K", topVideo: "AI Tools You NEED in 2026" },
  { name: "Creator Academy", subs: "890K", growth: "+8.1%", avgViews: "120K", topVideo: "How I Grew to 1M Subs in 6 Months" },
  { name: "Digital Nomad Life", subs: "1.4M", growth: "+3.8%", avgViews: "210K", topVideo: "I Moved to Bali and Tripled My Income" },
  { name: "Code & Coffee", subs: "560K", growth: "+12.3%", avgViews: "95K", topVideo: "Build a SaaS in a Weekend with AI" },
];

const Competitors = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        Competitor Tracker
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Monitor trending channels and top performing competitor videos</p>
    </div>

    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Channel</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Subscribers</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Growth</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Avg Views</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Top Video</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {competitors.map((c, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{c.name[0]}</div>
                    <span className="font-medium text-card-foreground text-sm">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {c.subs}</td>
                <td className="px-4 py-3 text-sm text-success font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {c.growth}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {c.avgViews}</td>
                <td className="px-4 py-3 text-sm text-card-foreground flex items-center gap-1"><Play className="h-3 w-3 text-primary" /> {c.topVideo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Competitors;
