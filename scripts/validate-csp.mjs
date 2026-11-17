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
  // wss: Supabase Realtime (`.channel(...)`); cartocdn/arcgisonline/s3: estilos, tiles e relevo do maplibre-gl.
  'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://*.cartocdn.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://*.supabase.co', 'https://*.cartocdn.com'],
  'worker-src': ["'self'", 'blob:'],
};

/** Keywords CSP ('self', 'unsafe-inline', ...) são case-sensitive; hosts e schemes não. */
const isKeyword = (token) => token.startsWith("'") || token === '*';
const tokenMatches = (actual, required) =>
  isKeyword(required) ? actual === required : actual.toLowerCase() === required.toLowerCase();

/** Decodifica as character references HTML que o parser do browser aplica ao atributo. */
const decodeEntities = (s) =>
  s
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');

let html;
try {
  html = readFileSync(INDEX, 'utf8');
} catch (err) {
  console.error(`❌ Não foi possível ler ${INDEX}: ${err.message}`);
  process.exit(1);
}
// Comentário HTML e corpo de <script> não viram elemento: uma meta CSP ali não protege nada e,
// se contasse, o gate passaria com a política real ausente (ou acusaria "duas metas" à toa).
html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
const cspContents = [];
// `>` dentro de valor entre aspas não fecha a tag; `\s` antes do nome evita casar `data-content=`.
for (const meta of html.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
  const tag = meta[0];
  const equiv = tag.match(/\shttp-equiv\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/i);
  if (!equiv) continue;
  if ((equiv[1] ?? equiv[2] ?? '').toLowerCase() !== 'content-security-policy') continue;
  const content = tag.match(/\scontent\s*=\s*(["'])([\s\S]*?)\1/i);
  cspContents.push(content ? decodeEntities(content[2]) : '');
}

if (cspContents.length === 0) {
  console.error('❌ CSP meta tag not found in index.html');
  process.exit(1);
}

if (cspContents.length > 1) {
  console.error('❌ Mais de uma meta CSP encontrada: o browser aplica todas ao mesmo tempo (vale a interseção) e este gate só valida uma. Deixe uma única meta CSP.');
  process.exit(1);
}

const errors = [];
const directives = new Map();
for (const d of cspContents[0].split(';')) {
  const [name, ...values] = d.trim().split(/\s+/);
  if (!name) continue;
  const key = name.toLowerCase();
  if (directives.has(key)) {
    errors.push(`  • diretiva duplicada "${key}": múltiplas ocorrências tornam a política inválida`);
    continue;
  }
  directives.set(key, values);
}

for (const [directive, required] of Object.entries(REQUIRED)) {
  const values = directives.get(directive) || [];
  for (const token of required) {
    if (!values.some((v) => tokenMatches(v, token))) {
      errors.push(`  • ${directive} está sem "${token}"`);
    }
  }
}

if (errors.length) {
  console.error('❌ Validação de CSP falhou:\n' + errors.join('\n'));
  process.exit(1);
}

console.log('✅ CSP validada: fontes, estilos, scripts, conexões, imagens e workers liberados.');
