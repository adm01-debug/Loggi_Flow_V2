// Teste do SLA de code scanning (scripts/ci/sla-code-scanning.mjs).
// A conta é pura (avaliarSla); o CLI roda como subprocesso lendo o JSON do stdin, do jeito
// que o branch-hygiene-audit.yml chama.
// Rodar: node --test scripts/ci/sla-code-scanning.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SLA_DIAS, avaliarSla, nivel, relatorio } from './sla-code-scanning.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sla-code-scanning.mjs');
const AGORA = Date.UTC(2026, 10, 9, 12, 0, 0);
const DIA = 86_400_000;
const ha = (dias, msExtra = 0) => new Date(AGORA - dias * DIA - msExtra).toISOString();
const alerta = (number, dias, rule = { id: 'js/sql-injection', security_severity_level: 'high' }, caminho = 'src/a.ts') => ({
  number, created_at: ha(dias), rule, most_recent_instance: { location: { path: caminho } },
});
const temporarios = [];
after(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

function cli(entrada, { script = SCRIPT, cwd } = {}) {
  return spawnSync(process.execPath, [script], { input: entrada, encoding: 'utf8', cwd, env: { PATH: '' } });
}

// ------------------------------------------------------------------ nivel
test('nivel: security_severity_level manda, em qualquer caixa', () => {
  for (const s of ['low', 'medium', 'high', 'critical']) {
    assert.equal(nivel({ rule: { security_severity_level: s } }), s);
    assert.equal(nivel({ rule: { security_severity_level: s.toUpperCase(), severity: 'note' } }), s);
  }
});

test('nivel: regra sem severidade de segurança — error conta como alto, o resto como baixo', () => {
  assert.equal(nivel({ rule: { severity: 'error' } }), 'high');
  assert.equal(nivel({ rule: { severity: 'warning' } }), 'low');
  assert.equal(nivel({ rule: { severity: 'note' } }), 'low');
  assert.equal(nivel({ rule: { security_severity_level: null, severity: 'error' } }), 'high');
  for (const vazio of [{}, { rule: null }, null, undefined]) assert.equal(nivel(vazio), 'low');
});

// ------------------------------------------------------------------ avaliarSla
test('sla: high/critical vencem depois de 14 dias completos; medium/low depois de 30', () => {
  assert.deepEqual(SLA_DIAS, { alto: 14, baixo: 30 });
  const sev = (s) => ({ id: 'r', security_severity_level: s });
  const dentro = [alerta(1, 14, sev('high')), alerta(2, 14, sev('critical')), alerta(3, 30, sev('medium')), alerta(4, 30, sev('low')), alerta(5, 0, sev('critical'))];
  assert.deepEqual(avaliarSla(dentro, AGORA), { total: 5, violacoes: [] });
  const fora = [alerta(1, 15, sev('high')), alerta(2, 15, sev('critical')), alerta(3, 31, sev('medium')), alerta(4, 31, sev('low'))];
  assert.deepEqual(avaliarSla(fora, AGORA).violacoes, [
    'HIGH (15d > 14d) — #1: r em src/a.ts',
    'CRITICAL (15d > 14d) — #2: r em src/a.ts',
    'MEDIUM (31d > 30d) — #3: r em src/a.ts',
    'LOW (31d > 30d) — #4: r em src/a.ts',
  ]);
});

test('sla: a fronteira é em dias inteiros — 14d23h59 ainda está no prazo, 15d00h00 não', () => {
  const quase = { ...alerta(1, 14), created_at: ha(14, DIA - 60_000) };
  const passou = { ...alerta(2, 14), created_at: ha(15) };
  assert.deepEqual(avaliarSla([quase], AGORA).violacoes, []);
  assert.equal(avaliarSla([passou], AGORA).violacoes.length, 1);
});

test('sla: medium com 20 dias não vence; high com 20 dias vence', () => {
  assert.deepEqual(avaliarSla([alerta(1, 20, { id: 'r', security_severity_level: 'medium' })], AGORA).violacoes, []);
  assert.equal(avaliarSla([alerta(1, 20)], AGORA).violacoes.length, 1);
});

test('sla: fuso do created_at não muda a conta (mesmo instante, offsets diferentes)', () => {
  const utc = { ...alerta(1, 0), created_at: '2026-10-25T12:00:00Z' };
  const brt = { ...alerta(1, 0), created_at: '2026-10-25T09:00:00-03:00' };
  assert.deepEqual(avaliarSla([utc], AGORA), avaliarSla([brt], AGORA));
  assert.equal(avaliarSla([utc], AGORA).violacoes[0], 'HIGH (15d > 14d) — #1: js/sql-injection em src/a.ts');
});

test('sla: created_at no futuro (relógio adiantado) não é violação', () => {
  assert.deepEqual(avaliarSla([alerta(1, -3)], AGORA).violacoes, []);
});

test('sla: created_at ausente ou inválido conta como violação (idade desconhecida)', () => {
  for (const created_at of [undefined, null, '', 'lixo', {}]) {
    const r = avaliarSla([{ number: 9, created_at, rule: { id: 'r', security_severity_level: 'critical' } }], AGORA);
    assert.deepEqual(r.violacoes, ['CRITICAL (idade desconhecida: created_at inválido) — #9: r em ?'], String(created_at));
  }
});

test('sla: entrada nula ou sem campos não derruba o relatório', () => {
  const r = avaliarSla([null, {}, alerta(3, 1)], AGORA);
  assert.equal(r.total, 3);
  assert.deepEqual(r.violacoes, [
    'LOW (idade desconhecida: created_at inválido) — #?: ? em ?',
    'LOW (idade desconhecida: created_at inválido) — #?: ? em ?',
  ]);
});

test('sla: lista vazia e lista grande (250 alertas, mais de uma página da API)', () => {
  assert.deepEqual(avaliarSla([], AGORA), { total: 0, violacoes: [] });
  const muitos = Array.from({ length: 250 }, (_, i) => alerta(i + 1, i % 2 ? 40 : 1));
  const r = avaliarSla(muitos, AGORA);
  assert.equal(r.total, 250);
  assert.equal(r.violacoes.length, 125);
});

test('sla: quebra de linha e crase no caminho ou na regra não saem do lugar', () => {
  const r = avaliarSla([alerta(1, 40, { id: 'js/x\n::error::falso', security_severity_level: 'high' }, 'a\r\n::add-mask::x```b')], AGORA);
  assert.equal(r.violacoes.length, 1);
  assert.ok(!/[\r\n`]/.test(r.violacoes[0]), r.violacoes[0]);
  assert.match(r.violacoes[0], /^HIGH \(40d > 14d\) — #1: js\/x ::error::falso em a ::add-mask::x'''b$/);
});

// ------------------------------------------------------------------ relatorio
test('relatório: sem violação', () => {
  assert.equal(
    relatorio({ total: 2, violacoes: [] }),
    '\n### 🔒 Code Scanning — SLA (W83)\n\nSLA: high/critical → 14d · medium/low → 30d\n\nAlertas abertos: 2\n\n✅ Nenhuma violação de SLA.\n',
  );
});

test('relatório: com violação, uma por linha dentro do bloco', () => {
  const texto = relatorio({ total: 3, violacoes: ['A', 'B'] });
  assert.match(texto, /Alertas abertos: 3\n\n⚠️ \*\*Violações de SLA:\*\*\n```\nA\nB\n```\n$/);
});

// ------------------------------------------------------------------ CLI
test('cli: lista vazia — exit 0 e relatório verde', () => {
  const r = cli('[]');
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
  assert.match(r.stdout, /Alertas abertos: 0\n\n✅ Nenhuma violação de SLA\.\n$/);
});

test('cli: alertas dentro do prazo — exit 0', () => {
  const r = cli(JSON.stringify([{ number: 1, created_at: new Date().toISOString(), rule: { id: 'r', security_severity_level: 'critical' } }]));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Alertas abertos: 1/);
});

test('cli: violação — exit 1, relatório no stdout e ::error:: no stderr', () => {
  const r = cli(JSON.stringify([{ number: 7, created_at: '2020-01-01T00:00:00Z', rule: { id: 'js/x', security_severity_level: 'high' }, most_recent_instance: { location: { path: 'src/a.ts' } } }]));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /⚠️ \*\*Violações de SLA:\*\*\n```\nHIGH \(\d+d > 14d\) — #7: js\/x em src\/a\.ts\n```\n$/);
  assert.match(r.stderr, /^::error::W83: SLA vencido — HIGH \(\d+d > 14d\) — #7: js\/x em src\/a\.ts\n$/);
});

test('cli: caminho com quebra de linha não injeta comando do Actions; % é escapado na anotação', () => {
  const r = cli(JSON.stringify([{ number: 7, created_at: '2020-01-01T00:00:00Z', rule: { id: 'r' }, most_recent_instance: { location: { path: '100%\n::error::injetado' } } }]));
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n').filter((l) => l.startsWith('::')).length, 1);
  assert.match(r.stderr, /em 100%25 ::error::injetado\n$/);
});

test('cli: code scanning não habilitado (403/404 da API vira objeto com message) — exit 0 e aviso', () => {
  const corpos = [
    '{"message":"Advanced Security must be enabled for this repository to use code scanning.","status":"403"}',
    '{"message":"no analysis found","status":"404"}',
    '{"message":"Resource not accessible by integration","status":"403"}',
    '{"message":"falha ao consultar a API de code scanning"}',
  ];
  for (const corpo of corpos) {
    const r = cli(corpo);
    assert.equal(r.status, 0, corpo);
    assert.equal(r.stderr, '::warning::W83: a API não devolveu uma lista de alertas\n');
    assert.match(r.stdout, /^\n### ⚠️ Code Scanning — SLA \(W83\)\n\nNão foi possível consultar os alertas/);
    assert.ok(r.stdout.includes(`Resposta: ${JSON.parse(corpo).message}`), r.stdout);
  }
});

test('cli: stdin vazio, JSON inválido, null (jq add sem páginas) e HTML — exit 0 e aviso, nunca relatório verde', () => {
  for (const corpo of ['', '   \n', '{', 'null', '<html>502 Bad Gateway</html>', '"texto"', '42']) {
    const r = cli(corpo);
    assert.equal(r.status, 0, corpo);
    assert.match(r.stderr, /::warning::W83/);
    assert.match(r.stdout, /Não foi possível consultar os alertas/);
    assert.ok(!r.stdout.includes('✅'), corpo);
  }
});

test('cli: JSON terminado em CRLF continua lido', () => {
  const r = cli('[]\r\n');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Alertas abertos: 0/);
});

test('cli: duas execuções com a mesma entrada dão a mesma saída', () => {
  const entrada = JSON.stringify([{ number: 1, created_at: '2020-01-01T00:00:00Z', rule: { id: 'r', security_severity_level: 'low' } }]);
  const a = cli(entrada);
  const b = cli(entrada);
  assert.deepEqual([a.status, a.stdout, a.stderr], [b.status, b.stdout, b.stderr]);
});

test('cli: roda por link simbólico e de outro cwd', () => {
  const pastaLink = fs.mkdtempSync(path.join(os.tmpdir(), 'sla link ação '));
  temporarios.push(pastaLink);
  fs.symlinkSync(path.resolve(path.dirname(SCRIPT), '..'), path.join(pastaLink, 'scripts'));
  for (const opcoes of [{ cwd: os.tmpdir() }, { script: path.join(pastaLink, 'scripts', 'ci', 'sla-code-scanning.mjs') }]) {
    const r = cli('[]', opcoes);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Alertas abertos: 0/);
  }
});
