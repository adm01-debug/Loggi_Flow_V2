/**
 * Guard dos segredos de integracao. Em producao varios segredos chegaram no valor
 * literal `PLACEHOLDER_NEEDS_SETUP` - o mesmo que `scripts/ops/set_missing_secrets.sh`
 * recusa. A variavel existia, entao o guard `if (!valor)` passava, a chamada ao parceiro
 * falhava e o painel exibia erro interno generico, sem dizer que faltava credencial.
 * Aqui o placeholder conta como nao configurado, para o erro apontar a causa.
 */
export const PLACEHOLDER_NEEDS_SETUP = "PLACEHOLDER_NEEDS_SETUP";

/** Vazio, so' espacos, `<entre_sinais>` ou contendo "placeholder": nao e' valor real. */
export function isSecretConfigured(value: string | null | undefined): boolean {
  const raw = String(value ?? "").trim();
  if (raw === "") return false;
  if (raw.startsWith("<") && raw.endsWith(">")) return false;
  if (raw.toLowerCase().includes("placeholder")) return false;
  return true;
}
