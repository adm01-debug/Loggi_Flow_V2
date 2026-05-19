import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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
    return data.map((r: any) => r.role);
  },

  async updateStreak(userId: string): Promise<void> {
    try {
      await supabase.rpc("update_user_streak", { p_user_id: userId });
    } catch (err) {
      console.error("Error updating streak:", err);
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
};
