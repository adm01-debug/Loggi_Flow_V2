/**
 * Etapa 008 (achado S-04, docs/qa/04-PLANO.md:355): o ambiente do Melhor Envio e decisao do servidor,
 * nunca do corpo da requisicao.
 *
 * Antes o `index.ts` lia `useSandbox` do corpo e o front mandava `true` por padrao
 * (src/hooks/logistics/useMelhorEnvio.tsx), entao etiqueta, carrinho e rastreamento falavam com o
 * sandbox sem ninguem ter escolhido isso.
 *
 * Regra: producao, sempre, exceto com `MELHOR_ENVIO_SANDBOX=true` **e** fora do projeto de producao -
 * a mesma trava de `_shared/testMode.ts` (etapa 011), para ambiente de teste nunca bater na conta real.
 */
export const PRODUCTION_PROJECT_REF = "jvfhclubfpxrtrrazrgr";

export type MelhorEnvioAmbiente = "producao" | "sandbox";

export interface AmbienteEntrada {
  sandbox?: string | null;
  supabaseUrl?: string | null;
}

export function resolveMelhorEnvioAmbiente(entrada: AmbienteEntrada): MelhorEnvioAmbiente {
  if (String(entrada.sandbox ?? "").trim().toLowerCase() !== "true") return "producao";
  if (String(entrada.supabaseUrl ?? "").toLowerCase().includes(PRODUCTION_PROJECT_REF)) {
    return "producao";
  }
  return "sandbox";
}
