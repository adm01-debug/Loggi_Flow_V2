/**
 * Clima real via OpenWeather (3.24/3.25) — substitui o rótulo fixo nas
 * functions de IA usando a mesma fonte da function get-weather-data.
 * Sem OPENWEATHER_API_KEY configurada, retorna estado honesto (available:false),
 * sem derrubar as functions chamadoras.
 */

import { safeFetch } from "./safeFetch.ts";
import { log } from "./logger.ts";
import { isSecretConfigured } from "./secretConfig.ts";

const OPENWEATHER_HOST = "api.openweathermap.org";

export interface WeatherSnapshot {
  available: boolean;
  condition?: string;
  tempC?: number;
  humidity?: number;
  rainLast1hMm?: number;
  windMps?: number;
  summary: string;
  fetchedAt: string;
}

/** Normaliza a resposta /data/2.5/weather para o snapshot usado no prompt de IA. */
function toSnapshot(data: any): WeatherSnapshot {
  const main = data?.main ?? {};
  const wind = data?.wind ?? {};
  const rain = data?.rain ?? {};
  const weather = Array.isArray(data?.weather) ? data.weather[0] : undefined;
  const rain1h = Number(rain["1h"] ?? rain["3h"] ?? 0) || 0;
  const condition = weather?.description ?? "Dado não disponível";

  const severities: Array<[string, string]> = [
    ["thunderstorm", "TEMPESTADE"],
    ["snow", "NEVE"],
    ["rain", "CHUVA"],
    ["drizzle", "CHUVA FRACA"],
  ];
  const alert = severities.find(([key]) =>
    (weather?.main ?? "").toLowerCase().includes(key),
  );

  let summary = `Clima atual: ${condition}, ${Math.round(main.temp ?? 0)}°C, umidade ${main.humidity ?? 0}%`;
  if (rain1h > 0) summary += `, chuva ${rain1h.toFixed(1)}mm na última hora`;
  if (alert) summary += ` — ${alert[1]} nas imediações da rota`;

  return {
    available: true,
    condition,
    tempC: main.temp != null ? Math.round(main.temp) : undefined,
    humidity: main.humidity,
    rainLast1hMm: rain1h,
    windMps: wind.speed,
    summary,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Busca clima atual de uma coordenada. NUNCA lança: em falha de rede/API retorna
 * estado honesto available:false com o motivo, preservando a disponibilidade da
 * function chamadora.
 */
export async function getWeather(
  lat: number,
  lon: number,
): Promise<WeatherSnapshot> {
  const key = Deno.env.get("OPENWEATHER_API_KEY");
  if (!isSecretConfigured(key)) {
    return {
      available: false,
      summary: "Clima não avaliado (OPENWEATHER_API_KEY ausente)",
      fetchedAt: new Date().toISOString(),
    };
  }

  const url =
    `https://${OPENWEATHER_HOST}/data/2.5/weather?lat=${lat}&lon=${lon}` +
    `&appid=${encodeURIComponent(key)}&units=metric&lang=pt_br`;

  try {
    const res = await safeFetch(url, {
      timeout: 8000,
      allowedHosts: [OPENWEATHER_HOST],
    });
    if (!res.ok) {
      log.warn("OpenWeather responded with error", {
        status: res.status,
        lat,
        lon,
      });
      return {
        available: false,
        summary: `Clima não avaliado (OpenWeather ${res.status})`,
        fetchedAt: new Date().toISOString(),
      };
    }
    return toSnapshot(await res.json());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("OpenWeather request failed", { error: msg, lat, lon });
    return {
      available: false,
      summary: "Clima não avaliado (falha na consulta externa)",
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Busca clima de um conjunto de coordenadas únicas (com limite de requisições),
 * agregando em: resumo geral + mapa lat,lng -> snapshot.
 */
export async function getWeatherForRoutes(
  coords: Array<{ lat: number; lon: number }>,
  maxRequests = 10,
): Promise<{
  summary: string;
  byCoord: Map<string, WeatherSnapshot>;
  analyzedCount: number;
}> {
  const byCoord = new Map<string, WeatherSnapshot>();
  // Requisições paralelas; ordena por determinismo no resumo.
  for (let i = 0; i < Math.min(coords.length, maxRequests); i++) {
    const c = coords[i];
    const key = `${c.lat},${c.lon}`;
    byCoord.set(key, await getWeather(c.lat, c.lon));
  }

  const available = [...byCoord.values()].filter((s) => s.available);
  const summary =
    available.length === 0
      ? (byCoord.values().next().value?.summary ??
        "Sem coordenadas geocodificadas nas rotas ativas")
      : available
          .map((s) => s.summary)
          .slice(0, 3)
          .join(" | ");

  return { summary, byCoord, analyzedCount: available.length };
}
