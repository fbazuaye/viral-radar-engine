import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", views: 12400, subs: 84 },
  { day: "Tue", views: 15200, subs: 102 },
  { day: "Wed", views: 18300, subs: 95 },
  { day: "Thu", views: 14100, subs: 110 },
  { day: "Fri", views: 22500, subs: 148 },
  { day: "Sat", views: 28900, subs: 192 },
  { day: "Sun", views: 25600, subs: 164 },
];

export const EngagementChart = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <h3 className="font-display font-semibold text-card-foreground mb-4">Weekly Performance</h3>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="subsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" opacity={0.3} />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
          <Tooltip
            contentStyle={{
              background: "hsl(224, 25%, 10%)",
              border: "1px solid hsl(224, 20%, 16%)",
              borderRadius: "8px",
              color: "hsl(220, 14%, 92%)",
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="views" stroke="hsl(262, 83%, 58%)" fill="url(#viewsGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="subs" stroke="hsl(168, 76%, 42%)" fill="url(#subsGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
