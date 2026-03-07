import { useState } from "react";
import { Youtube, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYouTubeSync } from "@/hooks/useYouTubeSync";
import { toast } from "sonner";

export const ConnectChannel = () => {
  const [input, setInput] = useState("");
  const sync = useYouTubeSync();

  const handleSync = () => {
    if (!input.trim()) return;
    sync.mutate(input.trim(), {
      onSuccess: (data) => {
        toast.success(`Synced ${data.channel.channel_name} — ${data.videosInserted} videos imported`);
        setInput("");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Sync failed");
      },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Youtube className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-card-foreground">Connect YouTube Channel</h3>
          <p className="text-xs text-muted-foreground">Enter your channel URL, handle (@name), or channel ID</p>
        </div>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@MrBeast or UCX6OQ3DkcsbYNE6H8uQQuVA"
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => e.key === "Enter" && handleSync()}
          disabled={sync.isPending}
        />
        <Button onClick={handleSync} disabled={sync.isPending || !input.trim()}>
          {sync.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : sync.isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            "Sync"
          )}
        </Button>
      </div>
    </div>
  );
};
