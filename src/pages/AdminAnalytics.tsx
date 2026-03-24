import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdminUsers";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Globe, Monitor, Eye, Users, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay } from "date-fns";

interface Visit {
  id: string;
  page_path: string;
  country: string | null;
  city: string | null;
  device_type: string;
  browser: string;
  referrer: string | null;
  session_id: string;
  created_at: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(200 70% 50%)",
];

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchVisits = async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from("site_visits")
        .select("*")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(1000) as { data: Visit[] | null };
      setVisits(data || []);
      setLoading(false);
    };
    fetchVisits();
  }, [isAdmin]);

  if (adminLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const sevenDaysAgo = subDays(now, 7).getTime();

  const todayVisits = visits.filter(v => new Date(v.created_at).getTime() >= todayStart);
  const weekVisits = visits.filter(v => new Date(v.created_at).getTime() >= sevenDaysAgo);
  const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
  const uniqueCountries = new Set(visits.filter(v => v.country).map(v => v.country)).size;

  // Country breakdown
  const countryMap = new Map<string, number>();
  visits.forEach(v => {
    const c = v.country || "Unknown";
    countryMap.set(c, (countryMap.get(c) || 0) + 1);
  });
  const countryData = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Top pages
  const pageMap = new Map<string, number>();
  visits.forEach(v => {
    pageMap.set(v.page_path, (pageMap.get(v.page_path) || 0) + 1);
  });
  const pageData = Array.from(pageMap.entries())
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Daily visits (last 30 days)
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const day = format(subDays(now, i), "MMM dd");
    dailyMap.set(day, 0);
  }
  visits.forEach(v => {
    const day = format(new Date(v.created_at), "MMM dd");
    if (dailyMap.has(day)) dailyMap.set(day, dailyMap.get(day)! + 1);
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, visits]) => ({ date, visits }));

  // Device breakdown
  const deviceMap = new Map<string, number>();
  visits.forEach(v => {
    deviceMap.set(v.device_type, (deviceMap.get(v.device_type) || 0) + 1);
  });
  const deviceData = Array.from(deviceMap.entries()).map(([name, value]) => ({ name, value }));

  // Browser breakdown
  const browserMap = new Map<string, number>();
  visits.forEach(v => {
    browserMap.set(v.browser, (browserMap.get(v.browser) || 0) + 1);
  });
  const browserData = Array.from(browserMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Site Analytics</h1>
        <Badge variant="secondary" className="text-xs">Last 30 days</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{visits.length}</p>
                <p className="text-xs text-muted-foreground">Total visits (30d)</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
              <span>{todayVisits.length} today</span>
              <span>·</span>
              <span>{weekVisits.length} this week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueSessions}</p>
                <p className="text-xs text-muted-foreground">Unique sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueCountries}</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{deviceData.length}</p>
                <p className="text-xs text-muted-foreground">Device types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Over Time */}
      <Card>
        <CardHeader><CardTitle className="text-base">Traffic Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="page" type="category" fontSize={11} width={120} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device & Browser */}
        <Card>
          <CardHeader><CardTitle className="text-base">Devices & Browsers</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2 text-center">Devices</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                      {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 text-center">Browsers</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={browserData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                      {browserData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country Breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Visitor Countries</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Country</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Visits</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {countryData.map(({ country, count }) => (
                  <tr key={country} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{country}</td>
                    <td className="py-2 text-right text-foreground font-mono">{count}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {((count / visits.length) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Visits */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Visits</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Page</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Country</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Device</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Browser</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 50).map((v) => (
                  <tr key={v.id} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground whitespace-nowrap">
                      {format(new Date(v.created_at), "MMM dd HH:mm")}
                    </td>
                    <td className="py-2 text-foreground font-mono text-xs">{v.page_path}</td>
                    <td className="py-2 text-foreground">{v.country || "—"}</td>
                    <td className="py-2 text-foreground capitalize">{v.device_type}</td>
                    <td className="py-2 text-foreground">{v.browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
