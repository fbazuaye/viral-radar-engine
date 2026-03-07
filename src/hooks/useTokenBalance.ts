import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTokenBalance = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["token-balance", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("token_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};
