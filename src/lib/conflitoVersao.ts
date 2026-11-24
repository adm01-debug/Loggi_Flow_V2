/**
 * O PostgREST nao devolve erro quando o filtro de um UPDATE nao casa: zero
 * linhas afetadas chega igual a sucesso. Quem usa travamento otimista
 * (`.eq("version", version)`) precisa conferir o `count` antes de qualquer
 * efeito colateral — historico, toast de sucesso, callback para a tela.
 */
export const MENSAGEM_CONFLITO_VERSAO =
  "Conflito de versão — registro alterado por outro usuário, por favor recarregue";

/**
 * Sem informacao de `count` (null) nao ha o que decidir: o update nao pediu
 * `{ count: "exact" }` e a checagem e do chamador. Zero lancado.
 */
export function assertAtualizou(count: number | null | undefined): void {
  if (count === 0) throw new Error(MENSAGEM_CONFLITO_VERSAO);
}
