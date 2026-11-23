/**
 * Nome de canal de tempo real unico por assinatura.
 *
 * O supabase-js reusa o canal pelo "topic": quando duas assinaturas usam o
 * mesmo nome, a segunda faz `.on()` depois do `.subscribe()` e deixa de
 * receber eventos em silencio (achado R-09). Contador de modulo + timestamp
 * em base 36 basta para diferenciar instancias e medicoes sucessivas, e nao
 * depende de `crypto` (que nao existe em todo ambiente de teste).
 */
let channelSeq = 0;

export function uniqueChannelName(base: string): string {
  channelSeq += 1;
  return `${base}-${Date.now().toString(36)}-${channelSeq}`;
}
