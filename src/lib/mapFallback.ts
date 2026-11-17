/**
 * Deslocamento estavel para marcador de entrega sem coordenada geocodificada.
 *
 * O mapa cai no centro do estado quando a entrega ainda nao tem lat/lng no
 * banco. Sem deslocamento, todas as entregas do mesmo estado empilham no
 * mesmo ponto. O deslocamento precisa ser **deterministico**: com
 * `Math.random()` o pino mudava de lugar a cada refetch da query, dando a
 * impressao de que a carga estava se movendo.
 */

/** Amplitude maxima do deslocamento, em graus (~16 km). */
export const RAIO_DISPERSAO_GRAUS = 0.3;

/** Hash estavel (FNV-1a 32 bits) de uma string qualquer. */
export function hashEstavel(valor: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < valor.length; i++) {
    h ^= valor.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Converte o hash em fracao no intervalo [0, 1). */
function fracao(valor: string): number {
  return hashEstavel(valor) / 0x100000000;
}

/**
 * Espalha o marcador ao redor do centro do estado de forma estavel:
 * a mesma entrega cai sempre no mesmo ponto.
 */
export function deslocamentoEstavel(
  coords: { lat: number; lng: number },
  semente: string,
): { lat: number; lng: number } {
  return {
    lat: coords.lat + (fracao(`${semente}:lat`) - 0.5) * RAIO_DISPERSAO_GRAUS,
    lng: coords.lng + (fracao(`${semente}:lng`) - 0.5) * RAIO_DISPERSAO_GRAUS,
  };
}
