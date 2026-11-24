import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { log } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Geocodificacao por OpenStreetMap (Nominatim) com apoio do ViaCEP e fallback Photon.
 * Substitui a API do Mapbox apos a revogacao do token herdado do Lovable.
 * Mesma base de dados (OSM), sem token e sem limite de faturamento.
 */

// A politica do Nominatim exige um User-Agent identificavel.
const USER_AGENT = "LoggiFlowV2/1.0 (logistica; github.com/adm01-debug/Loggi_Flow_V2)";

const ALLOWED_HOSTS = [
  "nominatim.openstreetmap.org",
  "photon.komoot.io",
  "viacep.com.br",
];

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodeHit {
  coordinates: Coordinates;
  placeName: string;
  confidence: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Consulta o Nominatim (OpenStreetMap). */
async function viaNominatim(address: string): Promise<GeocodeHit | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}` +
    `&format=jsonv2&countrycodes=br&limit=1&addressdetails=1`;

  const res = await safeFetch(url, {
    timeout: 8000,
    allowedHosts: ALLOWED_HOSTS,
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
  });

  if (!res.ok) {
    log.error("Nominatim respondeu", res.status);
    return null;
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const hit = data[0];
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    coordinates: { lat, lng },
    placeName: hit.display_name ?? address,
    confidence: typeof hit.importance === "number" ? hit.importance : 0.5,
  };
}

/** Normaliza o endereco a partir do CEP usando a base dos Correios (ViaCEP). */
async function enderecoViaCep(address: string): Promise<string | null> {
  const match = address.match(/\b(\d{5})-?(\d{3})\b/);
  if (!match) return null;

  const cep = `${match[1]}${match[2]}`;
  const res = await safeFetch(`https://viacep.com.br/ws/${cep}/json/`, {
    timeout: 6000,
    allowedHosts: ALLOWED_HOSTS,
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.erro || !data.logradouro) return null;

  return [data.logradouro, data.bairro, data.localidade, data.uf, "Brasil"]
    .filter(Boolean)
    .join(", ");
}

/** Fallback: Photon (Komoot), tambem sobre dados OSM, restrito ao bounding box do Brasil. */
async function viaPhoton(address: string): Promise<GeocodeHit | null> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1` +
    `&bbox=-74.0,-34.0,-34.0,5.3`;

  const res = await safeFetch(url, {
    timeout: 8000,
    allowedHosts: ALLOWED_HOSTS,
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data?.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const p = feature.properties ?? {};
  const placeName = [p.name, p.street, p.housenumber, p.city, p.postcode]
    .filter(Boolean)
    .join(", ");

  return {
    coordinates: { lat, lng },
    placeName: placeName || address,
    confidence: 0.4,
  };
}

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, "Content-Type": "application/json" },
    });

  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return json({ error: "Address is required" }, 400);
    }

    log.info(`Geocoding address: ${address}`);

    // 1) Endereco como veio
    let hit = await viaNominatim(address);

    // 2) Endereco normalizado pelo CEP (base dos Correios)
    if (!hit) {
      const normalizado = await enderecoViaCep(address);
      if (normalizado && normalizado !== address) {
        // A politica de uso do Nominatim pede no maximo 1 consulta por segundo.
        await sleep(1100);
        hit = await viaNominatim(normalizado);
      }
    }

    // 3) Fallback em outro servidor OSM
    if (!hit) {
      hit = await viaPhoton(address);
    }

    if (!hit) {
      log.info("No results found for address:", address);
      return json({ coordinates: null, message: "Address not found" });
    }

    log.info(
      `Geocoded: ${address} -> ${hit.coordinates.lat}, ${hit.coordinates.lng}`,
    );

    return json({
      coordinates: hit.coordinates,
      placeName: hit.placeName,
      confidence: hit.confidence,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("Geocoding error:", errorMessage);
    return json({ error: errorMessage }, 500);
  }
});