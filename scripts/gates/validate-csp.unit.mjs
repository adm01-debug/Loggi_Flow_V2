// Testes de scripts/validate-csp.mjs (gate do `prebuild`: se passar errado, a CSP quebrada vai para
// produção; se falhar errado, derruba o deploy).
// Rodar: node --test scripts/gates/validate-csp.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ_REPO, fixture, escreve, roda, limpa } from './helpers.mjs';

const SCRIPT = 'validate-csp.mjs';
const root = fixture(SCRIPT);
after(() => limpa(root));

const BOA = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cartocdn.com https://*.sentry.io",
  "img-src 'self' data: blob: https://*.supabase.co https://*.cartocdn.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "worker-src 'self' blob:",
].join('; ');
const meta = (csp, equiv = 'Content-Security-Policy') => `<meta http-equiv="${equiv}" content="${csp}">`;
const pagina = (cabeca) => `<!doctype html><html><head>${cabeca}</head><body></body></html>`;
const valida = (html) => { escreve(root, 'index.html', html); return roda(root, SCRIPT); };

const passa = (nome, html) => test(`passa: ${nome}`, () => {
  const r = valida(html);
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, /CSP validada/);
});
const falha = (nome, html, re) => test(`falha: ${nome}`, () => {
  const r = valida(html);
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, re);
});

passa('política completa', pagina(meta(BOA)));
passa('atributos em ordem trocada', pagina(`<meta content="${BOA}" http-equiv="Content-Security-Policy">`));
passa('tag e política quebradas em várias linhas', pagina(`<meta\n  http-equiv="Content-Security-Policy"\n  content="${BOA.replaceAll('; ', ';\n    ')}"\n/>`));
passa('CRLF', pagina(`<meta\r\n http-equiv="Content-Security-Policy"\r\n content="${BOA}">\r\n`));
passa('aspas simples no atributo com &#39; nos keywords', pagina(`<meta http-equiv='Content-Security-Policy' content='${BOA.replaceAll("'", '&#39;')}'>`));
passa('aspas simples no atributo com &apos; nos keywords', pagina(`<meta http-equiv='Content-Security-Policy' content='${BOA.replaceAll("'", '&apos;')}'>`));
passa('http-equiv sem aspas e tudo em maiúsculas', pagina(`<META HTTP-EQUIV=Content-Security-Policy CONTENT="${BOA}">`));
passa('host em caixa diferente', pagina(meta(BOA.replace('fonts.googleapis.com', 'Fonts.GoogleAPIs.com'))));
passa('nome de diretiva em maiúsculas', pagina(meta(BOA.replace('font-src', 'FONT-SRC'))));
passa('";" sobrando no fim da política', pagina(meta(`${BOA};`)));
passa('BOM no início do arquivo', `\uFEFF${pagina(meta(BOA))}`);
passa('meta CSP comentada ao lado da meta real', pagina(`<!-- ${meta("default-src *")} -->${meta(BOA)}`));
passa('outro atributo terminado em "content" antes do content', pagina(`<meta http-equiv="Content-Security-Policy" data-content="x" content="${BOA}">`));
passa('">" dentro do valor do atributo', pagina(meta(`${BOA} report-uri /csp?a>b`)));

falha('sem meta CSP', pagina('<meta charset="utf-8">'), /CSP meta tag not found/);
falha('index.html vazio', '', /CSP meta tag not found/);
falha('só Content-Security-Policy-Report-Only', pagina(meta(BOA, 'Content-Security-Policy-Report-Only')), /CSP meta tag not found/);
falha('meta CSP só dentro de comentário HTML', pagina(`<!-- ${meta(BOA)} -->`), /CSP meta tag not found/);
falha('meta CSP só dentro de string de <script>', pagina(`<script>const m = '${meta(BOA).replaceAll("'", "\\'")}';</script>`), /CSP meta tag not found/);
falha('duas metas CSP', pagina(meta(BOA) + meta(BOA)), /Mais de uma meta CSP/);
falha('meta sem atributo content', pagina('<meta http-equiv="Content-Security-Policy">'), /style-src está sem/);
falha('content vazio', pagina(meta('')), /worker-src está sem "blob:"/);
falha('diretiva duplicada', pagina(meta(`${BOA}; script-src 'self'`)), /diretiva duplicada "script-src"/);
falha("keyword em caixa errada ('SELF')", pagina(meta(BOA.replaceAll("'self'", "'SELF'"))), /script-src está sem "'self'"/);
falha('wildcard do Supabase trocado por um projeto fixo', pagina(meta(BOA.replaceAll('https://*.supabase.co', 'https://jvfhclubfpxrtrrazrgr.supabase.co'))), /connect-src está sem "https:\/\/\*\.supabase\.co"/);

for (const [diretiva, token] of [
  ['style-src', 'https://fonts.googleapis.com'],
  ['style-src', "'unsafe-inline'"],
  ['font-src', 'https://fonts.gstatic.com'],
  ['connect-src', 'https://*.supabase.co'],
  ['connect-src', 'wss://*.supabase.co'],
  ['connect-src', 'https://*.cartocdn.com'],
  ['img-src', 'data:'],
  ['img-src', 'blob:'],
  ['img-src', 'https://*.cartocdn.com'],
  ['worker-src', 'blob:'],
]) {
  const semToken = BOA.split('; ').map((d) => (d.startsWith(`${diretiva} `) ? d.split(' ').filter((t) => t !== token).join(' ') : d)).join('; ');
  const escapado = token.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  falha(`${diretiva} sem ${token}`, pagina(meta(semToken)), new RegExp(`${diretiva} está sem "${escapado}"`));
}

for (const diretiva of ['style-src', 'font-src', 'script-src', 'connect-src', 'img-src', 'worker-src']) {
  const semDiretiva = BOA.split('; ').filter((d) => !d.startsWith(`${diretiva} `)).join('; ');
  falha(`diretiva ${diretiva} ausente`, pagina(meta(semDiretiva)), new RegExp(`${diretiva} está sem`));
}

test('falha: index.html ausente — mensagem clara, sem stack trace', () => {
  fs.rmSync(path.join(root, 'index.html'), { force: true });
  const r = roda(root, SCRIPT);
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /index\.html/);
  assert.doesNotMatch(r.stderr, /\n\s+at /);
});

test('lista todos os problemas de uma vez', () => {
  const r = valida(pagina(meta("default-src 'self'")));
  assert.equal(r.status, 1);
  assert.ok(r.stderr.split('\n').filter((l) => l.includes('está sem')).length >= 10, r.stderr);
});

test('independe do cwd', () => {
  escreve(root, 'index.html', pagina(meta(BOA)));
  assert.equal(roda(root, SCRIPT, { cwd: path.join(root, 'bin') }).status, 0);
});

test('index.html real do repo passa (é o que o prebuild do Vercel roda)', () => {
  const r = spawnSync(process.execPath, [path.join(RAIZ_REPO, 'scripts', SCRIPT)], { cwd: RAIZ_REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
