import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useInsightsHistory = (type: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["insights-history", type, session?.user?.id],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insights")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });
};
