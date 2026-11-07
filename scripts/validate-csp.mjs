#!/usr/bin/env node
/**
 * Valida a meta CSP em index.html contra domínios de fontes/estilos necessários.
 * Falha o build se style-src não permitir fonts.googleapis.com ou font-src não permitir fonts.gstatic.com.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = resolve(__dirname, '..', 'index.html');

const REQUIRED = {
  'style-src': ['https://fonts.googleapis.com', "'self'", "'unsafe-inline'"],
  'font-src': ['https://fonts.gstatic.com', "'self'"],
  'script-src': ["'self'"],
  'connect-src': ["'self'", 'https://*.supabase.co'],
};

const html = readFileSync(INDEX, 'utf8');
const matches = [...html.matchAll(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content=(["'])([\s\S]*?)\1/gi)];

if (matches.length === 0) {
  console.error('❌ CSP meta tag not found in index.html');
  process.exit(1);
}

if (matches.length > 1) {
  console.error('❌ Mais de uma meta CSP encontrada: o browser ignora todas as políticas quando há múltiplas metas CSP.');
  process.exit(1);
}

const directives = new Map();
for (const d of matches[0][2].split(';')) {
  const [name, ...values] = d.trim().split(/\s+/);
  if (!name) continue;
  if (!directives.has(name)) directives.set(name, values);
}

const errors = [];
for (const [directive, required] of Object.entries(REQUIRED)) {
  const values = directives.get(directive) || [];
  for (const token of required) {
    if (!values.includes(token)) {
      errors.push(`  • ${directive} está sem "${token}"`);
    }
  }
}

if (errors.length) {
  console.error('❌ Validação de CSP falhou:\n' + errors.join('\n'));
  process.exit(1);
}

console.log('✅ CSP validada: fonts.googleapis.com e fonts.gstatic.com liberados.');
