/**
 * SSRF-safe fetch helper (Sprint C #2 — Segurança).
 *
 * Bloqueia:
 *  - Esquemas != https/http
 *  - Hosts privados / loopback / link-local / metadata cloud (169.254.169.254)
 *  - Hosts fora de allow-list (quando fornecida)
 *
 * Uso:
 *   await safeFetch(url, { timeout: 8000, allowedHosts: ["api.mapbox.com"] });
 */

import { fetchWithTimeout } from "./fetch-with-timeout.ts";
import { withCircuitBreaker } from "./circuitBreaker.ts";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "metadata.google.internal",
]);

// Prefixos IPv4 privados/reservados
const BLOCKED_IPV4_PREFIXES = [
  "10.",
  "127.",
  "169.254.", // link-local + AWS/GCP metadata
  "192.168.",
  "0.",
];

function isBlockedIPv4(host: string): boolean {
  // 172.16.0.0/12
  const m = host.match(/^172\.(\d{1,3})\./);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return BLOCKED_IPV4_PREFIXES.some((p) => host.startsWith(p));
}

function isBlockedIPv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    h === "::1" ||
    h === "::" ||
    h.startsWith("fc") || // unique local
    h.startsWith("fd") ||
    h.startsWith("fe80") // link-local
  );
}

export class SSRFBlockedError extends Error {
  constructor(reason: string, url: string) {
    super(`SSRF blocked: ${reason} (${url})`);
    this.name = "SSRFBlockedError";
  }
}

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  allowedHosts?: string[]; // exact hostnames or suffix matches (".mapbox.com")
  circuitBreakerName?: string | null; // default: hostname; null desativa breaker
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {},
): Promise<Response> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SSRFBlockedError("invalid URL", url);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new SSRFBlockedError(`scheme ${parsed.protocol}`, url);
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new SSRFBlockedError(`host ${host}`, url);
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && isBlockedIPv4(host)) {
    throw new SSRFBlockedError(`private IPv4 ${host}`, url);
  }
  if (host.includes(":") && isBlockedIPv6(host)) {
    throw new SSRFBlockedError(`private IPv6 ${host}`, url);
  }

  if (options.allowedHosts && options.allowedHosts.length > 0) {
    const ok = options.allowedHosts.some((allowed) => {
      const a = allowed.toLowerCase();
      return (
        host === a ||
        (a.startsWith(".") && host.endsWith(a)) ||
        host.endsWith(`.${a}`)
      );
    });
    if (!ok) {
      throw new SSRFBlockedError(`host ${host} not in allow-list`, url);
    }
  }

  const { timeout, allowedHosts: _al, circuitBreakerName, ...rest } = options;
  const breakerKey = circuitBreakerName ?? host;

  const doFetch = () =>
    fetchWithTimeout(url, { ...rest, timeout: timeout ?? 10_000 });

  return withCircuitBreaker(breakerKey, doFetch);
}
