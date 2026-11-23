import { supabase } from "@/integrations/supabase/client";

/**
 * P9 — Padroniza acesso a `documents` (bucket privado) via URL assinada.
 * TTL default 1h. Nunca use `getPublicUrl` neste bucket.
 */
export async function getSignedDocumentUrl(
  path: string,
  ttlSeconds = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, ttlSeconds);
  if (error) {
    console.error("[storageService] signed URL failed:", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function getSignedAvatarUrl(
  path: string,
  ttlSeconds = 60 * 60 * 24 * 365,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, ttlSeconds);
  if (error) return null;
  return data.signedUrl;
}

