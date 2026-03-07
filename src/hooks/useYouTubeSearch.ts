import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YouTubeSearchResult {
  video_id: string;
  title: string;
  channel_name: string;
  channel_id: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  views_per_hour: number;
  engagement_rate: number;
  age_hours: number;
}

export interface YouTubeSearchResponse {
  query: string;
  total_results: number;
  aggregate: {
    total_views: number;
    total_likes: number;
    total_comments: number;
    avg_vph: number;
    avg_engagement: number;
  };
  results: YouTubeSearchResult[];
}

export const useYouTubeSearch = () => {
  const [data, setData] = useState<YouTubeSearchResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke("youtube-search", {
        body: { query, maxResults: 15 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as YouTubeSearchResponse;
    },
    onSuccess: (result) => setData(result),
  });

  return { ...mutation, data, search: mutation.mutate, clear: () => setData(null) };
};
