/* eslint-disable no-empty, no-useless-escape */
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

export interface ValidateLoginResult {
  allowed: boolean;
  reason?: string;
  lockout_ends_at?: string;
  remaining_seconds?: number;
  failure_count?: number;
}

export async function validateLoginIP(email: string, ipAddress: string | null): Promise<ValidateLoginResult> {
  try {
    const { data, error } = await supabase.functions.invoke("validate-login", {
      body: { email, ip_address: ipAddress, user_agent: navigator.userAgent },
    });
    if (error) return { allowed: true };
    return data as ValidateLoginResult;
  } catch {
    return { allowed: true };
  }
}

export async function logLoginAttempt(email: string, ipAddress: string | null, success: boolean, failureReason?: string): Promise<void> {
  try {
    await supabase.functions.invoke("log-login-attempt", {
      body: { email, ip_address: ipAddress, user_agent: navigator.userAgent, success, failure_reason: failureReason },
    });
  } catch {}
}

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Senha deve conter pelo menos um caractere especial"),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});
