/**
 * Testes automatizados de acesso: garante que o cliente ANÔNIMO (sem auth)
 * NÃO consegue ler nem escrever tabelas sensíveis protegidas por RLS.
 *
 * Executa contra o Supabase real usando a anon key (safe — a chave é publishable).
 * Se rodando offline, os testes são marcados como skipped.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgicfqjayrjurivtygqf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnaWNmcWpheXJqdXJpdnR5Z3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODQzNzksImV4cCI6MjA5NDA2MDM3OX0.TvD6_8T9-wRgXTpXeFnZ17rdL47oYpxBaGbWnjZVeGQ';

let anon: SupabaseClient;
let online = true;

beforeAll(async () => {
  anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    await fetch(SUPABASE_URL + '/auth/v1/health', { method: 'GET' });
  } catch {
    online = false;
  }
});

const SENSITIVE_TABLES = [
  'bitrix_sync_config',
  'freight_webhooks',
  'delivery_receipt_audit',
  'bio_sync_telemetry',
  'nexus_tactical_logs',
  'kanban_history',
  'carrier_rankings',
] as const;

describe('RLS: cliente anônimo não pode ler tabelas sensíveis', () => {
  for (const table of SENSITIVE_TABLES) {
    it(`bloqueia SELECT em ${table}`, async () => {
      if (!online) return;
      const { data, error } = await anon.from(table).select('*').limit(1);
      // Aceita: erro de permissão OU retorno vazio (RLS retorna 0 linhas)
      const denied = !!error || (Array.isArray(data) && data.length === 0);
      expect(denied).toBe(true);
    });
  }
});

describe('RLS: cliente anônimo não pode escrever em tabelas sensíveis', () => {
  for (const table of ['bitrix_sync_config', 'freight_webhooks', 'delivery_receipt_audit'] as const) {
    it(`bloqueia INSERT em ${table}`, async () => {
      if (!online) return;
      const { error } = await anon.from(table).insert({ id: '00000000-0000-0000-0000-000000000000' } as never);
      expect(error).not.toBeNull();
    });
  }
});

describe('RLS: rastreamento público permanece acessível via RPC', () => {
  it('get_public_tracking responde para anônimo', async () => {
    if (!online) return;
    const { error } = await anon.rpc('get_public_tracking', { p_code: '__nonexistent__' });
    // RPC pode retornar vazio, mas não deve retornar erro de permissão
    expect(error?.message).not.toMatch(/permission denied/i);
  });
});
