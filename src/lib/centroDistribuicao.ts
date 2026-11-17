/**
 * Origem das rotas desenhadas no mapa.
 *
 * A tabela `entregas` nao possui campo de origem (ver
 * src/integrations/supabase/types.ts, Row de `entregas`): so ha
 * `endereco_entrega`, `latitude` e `longitude`, todos do destino.
 * A linha tracejada do mapa sai, portanto, do centro de distribuicao
 * de onde a operacao despacha, configurado por ambiente.
 */

export interface CoordenadaCD {
  lat: number;
  lng: number;
}

/** Centro de Sao Paulo: usado quando o ambiente nao define o CD. */
export const CD_PADRAO: CoordenadaCD = { lat: -23.5505, lng: -46.6333 };

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

function numeroValido(bruto: string | undefined, min: number, max: number): number | null {
  if (bruto === undefined || bruto === null) return null;
  const texto = String(bruto).trim();
  if (texto === "") return null;
  const valor = Number(texto);
  if (!Number.isFinite(valor)) return null;
  if (valor < min || valor > max) return null;
  return valor;
}

/**
 * Resolve o CD a partir das variaveis de ambiente. Valor ausente,
 * nao numerico ou fora da faixa geografica cai no padrao — nunca
 * gera coordenada invalida para o Mapbox.
 */
export function resolverCentroDistribuicao(
  latBruta?: string,
  lngBruta?: string,
): CoordenadaCD {
  const lat = numeroValido(latBruta, LAT_MIN, LAT_MAX);
  const lng = numeroValido(lngBruta, LNG_MIN, LNG_MAX);
  if (lat === null || lng === null) return CD_PADRAO;
  return { lat, lng };
}

export const CENTRO_DISTRIBUICAO = resolverCentroDistribuicao(
  import.meta.env.VITE_CD_ORIGEM_LAT as string | undefined,
  import.meta.env.VITE_CD_ORIGEM_LNG as string | undefined,
);
