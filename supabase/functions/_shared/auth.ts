// Helpers de autenticação in-code para functions públicas (verify_jwt=false).
// FAIL-CLOSED: env ausente ou claims ambíguas ⇒ acesso negado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthClaims {
  sub?: string;
  role?: string;
  [key: string]: unknown;
}

export type AuthResult =
  | { ok: true; claims: AuthClaims }
  | { ok: false; status: 401 };

// Comparação constant-time (mesmo padrão de webhookSignature.ts).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Valida o Bearer do header Authorization via auth.getClaims (padrão secure-store).
 * Aceita apenas role 'authenticated' (com sub) ou 'service_role' — o anon key é
 * um JWT válido com role 'anon' e precisa ser rejeitado.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401 };
  }
  const token = authHeader.replace("Bearer ", "");

  // getClaims valida tokens HS256 (caso das API keys legadas) via getUser, que
  // recusa o service_role key por não ter sub — por isso a comparação direta.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && timingSafeEqual(token, serviceKey)) {
    return { ok: true, claims: { role: "service_role" } };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getClaims(token);
  const claims = data?.claims as AuthClaims | undefined;
  if (error || !claims) {
    return { ok: false, status: 401 };
  }
  if (claims.role !== "authenticated" && claims.role !== "service_role") {
    return { ok: false, status: 401 };
  }
  if (claims.role === "authenticated" && !claims.sub) {
    return { ok: false, status: 401 };
  }
  return { ok: true, claims };
}

/**
 * Verifica se o usuário autenticado tem pelo menos um dos papéis indicados.
 * Consulta via RPC `has_role` (padrão ADR-0014 / user_roles).
 * FAIL-CLOSED: sem sessão → 401; papel insuficiente → 403.
 * service_role bypassa a verificação (chamador interno confiável).
 */
export async function requireRole(
  req: Request,
  roles: string[],
): Promise<{ ok: true; claims: AuthClaims } | { ok: false; status: 401 | 403 }> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth;

  // service_role está autorizado a tudo
  if (auth.claims.role === "service_role") return auth;

  const sub = auth.claims.sub;
  if (!sub) return { ok: false, status: 401 };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  for (const role of roles) {
    const { data } = await supabase.rpc("has_role", { _role: role, _user_id: sub });
    if (data === true) return auth;
  }

  return { ok: false, status: 403 };
}

/**
 * Compara o header `x-internal-secret` com INTERNAL_FN_SECRET em tempo
 * constante. FAIL-CLOSED: env ausente ⇒ false.
 */
export function requireInternalSecret(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_FN_SECRET");
  if (!secret) return false;
  const header = req.headers.get("x-internal-secret") || "";
  if (!header) return false;
  return timingSafeEqual(header, secret);
}
