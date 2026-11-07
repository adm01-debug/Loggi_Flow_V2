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
const match = html.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content="([^"]+)"/i);

if (!match) {
  console.error('❌ CSP meta tag not found in index.html');
  process.exit(1);
}

const directives = Object.fromEntries(
  match[1]
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [name, ...values] = d.split(/\s+/);
      return [name, values];
    }),
);

const errors = [];
for (const [directive, required] of Object.entries(REQUIRED)) {
  const values = directives[directive] || [];
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
