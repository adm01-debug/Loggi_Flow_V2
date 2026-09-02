/**
 * Testes de segurança de integrações:
 * - freight_webhooks e bitrix_sync_config: leitura/escrita anônima devem ser bloqueadas por RLS.
 * - Endpoints de webhook públicos (rodonaves-webhook, lalamove-webhook, carrier-webhook-receiver)
 *   devem rejeitar payloads inválidos e não vazarem dados sensíveis.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const SUPABASE_URL = 'https://jvfhclubfpxrtrrazrgr.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnaWNmcWpheXJqdXJpdnR5Z3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODQzNzksImV4cCI6MjA5NDA2MDM3OX0.TvD6_8T9-wRgXTpXeFnZ17rdL47oYpxBaGbWnjZVeGQ';

const restHeaders = {
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

describe('Integração: freight_webhooks — RLS', () => {
  it('SELECT anônimo é vazio (secret_key protegido)', async () => {
    if (!online) return;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/freight_webhooks?select=id,secret_key&limit=1`, {
      headers: restHeaders,
    });
    const body = await r.text();
    // Não pode vazar o secret_key em nenhuma hipótese
    expect(body).not.toMatch(/secret_key["']\s*:\s*["'][^"']+["']/);
    if (r.ok) {
      const parsed = JSON.parse(body);
      expect(Array.isArray(parsed) ? parsed.length : 0).toBe(0);
    }
  });

  it('INSERT anônimo é rejeitado', async () => {
    if (!online) return;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/freight_webhooks`, {
      method: 'POST',
      headers: restHeaders,
      body: JSON.stringify({ url: 'https://evil.example.com', secret_key: 'x' }),
    });
    expect(r.status).not.toBe(201);
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Integração: bitrix_sync_config — RLS', () => {
  it('SELECT anônimo não vaza webhook_url', async () => {
    if (!online) return;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bitrix_sync_config?select=*&limit=1`, {
      headers: restHeaders,
    });
    const body = await r.text();
    expect(body).not.toMatch(/https?:\/\/[^"']*bitrix/i);
    if (r.ok) {
      const parsed = JSON.parse(body);
      expect(Array.isArray(parsed) ? parsed.length : 0).toBe(0);
    }
  });

  it('UPDATE anônimo é rejeitado', async () => {
    if (!online) return;
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/bitrix_sync_config?id=eq.00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: restHeaders,
        body: JSON.stringify({ webhook_url: 'https://evil.example.com' }),
      },
    );
    // 200 com 0 linhas = ok (RLS filtrou); 401/403/404 = ok. 200 com linhas afetadas = falha.
    expect([401, 403, 404, 200, 204]).toContain(r.status);
    if (r.status === 200) {
      const text = await r.text();
      expect(text === '' || text === '[]').toBe(true);
    }
  });
});

describe('Integração: chamadas simuladas de webhook público', () => {
  const endpoints = [
    'rodonaves-webhook',
    'lalamove-webhook',
    'carrier-webhook-receiver',
    'nexus-webhook-receiver',
  ];

  for (const fn of endpoints) {
    it(`${fn} rejeita payload inválido sem 5xx`, async () => {
      if (!online) return;
      const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: 'POST',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: '__fuzz__' }),
      });
      // 400/401/403/422 são respostas seguras; 5xx indica bug
      expect(r.status).toBeLessThan(500);
      const text = await r.text();
      // Nunca deve retornar service key/senhas em stack traces
      expect(text).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE_KEY|password/i);
    });
  }
});
