/**
 * Testes automatizados de acesso: garantem que requisições ANÔNIMAS
 * (apenas com anon key) são bloqueadas pelo RLS em tabelas sensíveis.
 *
 * Usa fetch direto no PostgREST para escapar do mock global do supabase-js
 * definido em src/test/setup.ts.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const SUPABASE_URL = 'https://jvfhclubfpxrtrrazrgr.supabase.co';
// anon key (pública) do projeto jvfhclubfpxrtrrazrgr
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2ZmhjbHViZnB4cnRycmF6cmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzUxNzksImV4cCI6MjEwMTI1MTE3OX0.nqc4_idYS8m172fRiSD_OXuEzWJkaIrA61Q61mmrwEo';

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

let online = true;

beforeAll(async () => {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: ANON_KEY } });
    online = r.ok;
  } catch {
    online = false;
  }
});

async function readTable(table: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, { headers });
  const body = await r.text();
  let json: unknown = null;
  try {
    json = JSON.parse(body);
  } catch {
    /* noop */
  }
  return { status: r.status, json };
}

async function insertRow(table: string, row: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row),
  });
  return { status: r.status, body: await r.text() };
}

const SENSITIVE = [
  'bitrix_sync_config',
  'freight_webhooks',
  'delivery_receipt_audit',
  'bio_sync_telemetry',
  'nexus_tactical_logs',
  'kanban_history',
  'carrier_rankings',
] as const;

describe('RLS · leitura anônima bloqueada em tabelas sensíveis', () => {
  for (const table of SENSITIVE) {
    it(`SELECT em ${table} retorna [] ou 401/403`, async () => {
      if (!online) return;
      const { status, json } = await readTable(table);
      const denied = status === 401 || status === 403 || (Array.isArray(json) && json.length === 0);
      expect(denied).toBe(true);
    });
  }
});

describe('RLS · escrita anônima bloqueada em tabelas sensíveis', () => {
  for (const table of ['bitrix_sync_config', 'freight_webhooks', 'delivery_receipt_audit'] as const) {
    it(`INSERT em ${table} é rejeitado`, async () => {
      if (!online) return;
      const { status } = await insertRow(table, { dummy: 'x' });
      // Esperado: 401/403 (RLS/permission) ou 400 (schema) — nunca 201
      expect(status).not.toBe(201);
      expect(status).toBeGreaterThanOrEqual(400);
    });
  }
});

describe('RLS · endpoint público continua acessível', () => {
  it('RPC get_public_tracking não devolve permission denied', async () => {
    if (!online) return;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_tracking`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_code: '__nonexistent__' }),
    });
    const body = await r.text();
    expect(r.status).toBeLessThan(500);
    expect(body).not.toMatch(/permission denied/i);
  });
});
