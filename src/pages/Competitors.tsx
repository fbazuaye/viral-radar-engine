import { useState } from "react";
import { Users, TrendingUp, Eye, Play, Loader2, Plus, Trash2, Search } from "lucide-react";
import { useCompetitors } from "@/hooks/useChannelData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formatCount = (n: number | null | undefined): string => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const Competitors = () => {
  const { session } = useAuth();
  const { data: competitors = [], isLoading } = useCompetitors();
  const queryClient = useQueryClient();
  const [channelInput, setChannelInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim() || !session) return;

    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("add-competitor", {
        body: { channelInput: channelInput.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Competitor added", description: data.competitor?.channel_name || "Channel tracked successfully" });
      setChannelInput("");
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
    } catch (err: any) {
      toast({ title: "Failed to add competitor", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("competitors").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast({ title: "Competitor removed" });
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Competitor Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor trending channels and top performing competitor videos</p>
      </div>

      {/* Add Competitor Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="YouTube channel URL, @handle, or name"
            className="pl-9"
            disabled={adding}
          />
        </div>
        <Button type="submit" disabled={adding || !channelInput.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Add
        </Button>
      </form>

      {!competitors.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No competitors tracked yet. Add a channel above to start monitoring.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Channel</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Subscribers</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Avg Views</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Top Video</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Top Video Views</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {competitors.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{c.channel_name[0]}</div>
                        <span className="font-medium text-card-foreground text-sm">{c.channel_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {formatCount(c.subscriber_count)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatCount(c.avg_views)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground">
                      <span className="flex items-center gap-1"><Play className="h-3 w-3 text-primary" /> {c.top_video_title || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatCount(c.top_video_views)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                      >
                        {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Competitors;
