import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cargo: string | null;
}

export const authService = {
  async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  },

  async fetchRoles(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
    return data.map((r: { role: string }) => r.role);
  },

  async updateStreak(userId: string): Promise<void> {
    // P18: o RPC update_user_streak estava retornando 403 (permissão negada
    // para o role anon). Como o debounce de 1x/dia já é feito no
    // useAuth via localStorage, basta atualizar o last_activity_date em
    // user_levels (schema em uso pelo useGamification.ts). Se a linha
    // não existir para este user, ignora silenciosamente.
    try {
      const today = new Date().toISOString().slice(0, 10);
      await supabase
        .from("user_levels")
        .update({ last_activity_date: today })
        .eq("user_id", userId);
    } catch (err) {
      console.error("Error updating streak:", err);
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
