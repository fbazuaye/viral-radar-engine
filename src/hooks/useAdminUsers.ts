import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useIsAdmin = () => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["is-admin", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!session?.user?.id,
  });
};

export interface AdminUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  youtube_channel_id: string | null;
  created_at: string;
  balance: number;
  email?: string;
}

export const useAdminUsers = () => {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, subscription_tier, youtube_channel_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: balances } = await supabase
        .from("token_balances")
        .select("user_id, balance");

      const balanceMap = new Map((balances || []).map((b) => [b.user_id, b.balance]));

      return (profiles || []).map((p) => ({
        ...p,
        balance: balanceMap.get(p.user_id) ?? 0,
      }));
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user_id,
      updates,
    }: {
      user_id: string;
      updates: {
        display_name?: string;
        subscription_tier?: string;
        youtube_channel_id?: string;
        avatar_url?: string;
      };
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Profile updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdateTokens = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user_id,
      balance,
    }: {
      user_id: string;
      balance: number;
    }) => {
      const { error } = await supabase
        .from("token_balances")
        .update({ balance })
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Token balance updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
