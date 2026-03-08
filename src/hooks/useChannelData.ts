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
      const { data, error } = await supabase
        .from("trends")
        .select("*")
        .order("trend_score", { ascending: false })
        .limit(20);
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
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .order("trend_probability", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
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
