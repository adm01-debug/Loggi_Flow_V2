/**
 * Etapa 011: o bypass de assinatura em modo de teste nao pode ser ligado por engano
 * em producao. Antes bastava ALLOW_TEST_MODE=true no ambiente (mais o header
 * `x-test-mode: true`) para qualquer pessoa na internet pular o HMAC e gravar de verdade.
 *
 * Agora o bypass exige as tres condicoes e recusa explicitamente o projeto de producao,
 * qualquer que seja o valor da variavel de ambiente.
 */
const PRODUCTION_PROJECT_REF = "jvfhclubfpxrtrrazrgr";

export interface TestModeInput {
  allowTestMode: string | undefined;
  supabaseUrl: string | undefined;
  testModeHeader: string | null;
}

export function resolveTestMode(input: TestModeInput): boolean {
  if (input.allowTestMode !== "true") return false;
  const url = (input.supabaseUrl ?? "").toLowerCase();
  if (url.includes(PRODUCTION_PROJECT_REF)) return false;
  return input.testModeHeader === "true";
}

export function isTestModeRequest(req: Request): boolean {
  return resolveTestMode({
    allowTestMode: Deno.env.get("ALLOW_TEST_MODE"),
    supabaseUrl: Deno.env.get("SUPABASE_URL"),
    testModeHeader: req.headers.get("x-test-mode"),
  });
}
