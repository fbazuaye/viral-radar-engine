import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

/** Subscribe to realtime changes and auto-invalidate the given query key */
const useRealtimeSub = (table: string, queryKey: string[]) => {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, qc, ...queryKey]);
};

export const useChannel = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useRealtimeSub("channels", ["channel", userId ?? ""]);

  return useQuery({
    queryKey: ["channel", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("user_id", userId!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useVideos = (channelDbId?: string) => {
  useRealtimeSub("videos", ["videos", channelDbId ?? ""]);

  return useQuery({
    queryKey: ["videos", channelDbId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("channel_id", channelDbId!)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!channelDbId,
  });
};

export const useTrends = () => {
  useRealtimeSub("trends", ["trends"]);

  return useQuery({
    queryKey: ["trends"],
    queryFn: async () => {
      // Get the latest batch timestamp
      const { data: latest } = await supabase
        .from("trends")
        .select("scanned_at")
        .order("scanned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) return [];

      const { data, error } = await supabase
        .from("trends")
        .select("*")
        .eq("scanned_at", latest.scanned_at)
        .order("trend_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const usePredictions = () => {
  useRealtimeSub("predictions", ["predictions"]);

  return useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      // Get the latest batch timestamp
      const { data: latest } = await supabase
        .from("predictions")
        .select("scanned_at")
        .order("scanned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) return [];

      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("scanned_at", latest.scanned_at)
        .order("trend_probability", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useScanHistory = () => {
  useRealtimeSub("predictions", ["scan-history"]);

  return useQuery({
    queryKey: ["scan-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .order("scanned_at", { ascending: false });
      if (error) throw error;

      // Group by scanned_at
      const groups: Record<string, typeof data> = {};
      for (const row of data || []) {
        const key = (row as any).scanned_at ?? row.created_at;
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      }

      return Object.entries(groups)
        .map(([scannedAt, items]) => ({ scannedAt, items: items.sort((a, b) => Number(b.trend_probability) - Number(a.trend_probability)) }))
        .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
    },
  });
};

export const useCompetitors = () => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["competitors", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .eq("user_id", session!.user.id)
        .order("subscriber_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user?.id,
  });
};

export const useKeywords = () => {
  return useQuery({
    queryKey: ["keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .order("search_volume", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
};
