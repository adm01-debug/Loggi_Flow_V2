// Testes de scripts/audit-gate.mjs (`npm run security-scan`; jobs de segurança do CI).
// `npm` é um stub que devolve o JSON/exit code do cenário — nada vai ao registry.
// Rodar: node --test scripts/gates/audit-gate.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, escreve, stub, roda, limpa } from './helpers.mjs';

const SCRIPT = 'audit-gate.mjs';
const root = fixture(SCRIPT);
after(() => limpa(root));
stub(root, 'npm', `[ -n "$NPM_SLEEP" ] && exec sleep "$NPM_SLEEP"
[ "$1 $2" = "audit --json" ] || { echo "stub npm: chamada inesperada: $*" >&2; exit 99; }
[ -n "$NPM_ERR" ] && echo "$NPM_ERR" >&2
cat "$NPM_OUT"
exit "\${NPM_EXIT:-0}"`);

function audit(saida, exit = 0, env = {}) {
  const arq = escreve(root, 'npm-out.txt', typeof saida === 'string' ? saida : JSON.stringify(saida, null, 2));
  return roda(root, SCRIPT, { env: { NPM_OUT: arq, NPM_EXIT: String(exit), ...env } });
}
const vuln = (name, severity, extra = {}) => ({ name, severity, isDirect: true, via: [], effects: [], range: '*', nodes: [`node_modules/${name}`], fixAvailable: false, ...extra });
const relatorio = (...vulns) => ({ auditReportVersion: 2, vulnerabilities: Object.fromEntries(vulns.map((v) => [v.name, v])), metadata: {} });

const passa = (nome, saida, exit, re = /Sem critical\/high fora da allowlist/) => test(`passa: ${nome}`, () => {
  const r = audit(saida, exit);
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stdout, re);
});
const falha = (nome, saida, exit, re) => test(`falha: ${nome}`, () => {
  const r = audit(saida, exit);
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, re);
  assert.doesNotMatch(r.stdout, /✅/);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'não deve despejar stack trace');
});

passa('nenhuma vulnerabilidade', relatorio(), 0);
passa('só low/moderate/info (npm audit sai 1)', relatorio(vuln('a', 'low'), vuln('b', 'moderate'), vuln('c', 'info')), 1);
passa('high em pacote da allowlist (xlsx)', relatorio(vuln('xlsx', 'high')), 1, /allowlist ativa: xlsx/);
passa('critical em pacote da allowlist (vite)', relatorio(vuln('vite', 'critical')), 1, /allowlist ativa: vite/);
passa('resposta real do npm 10 sem vulnerabilidades', { auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }, dependencies: { prod: 2, dev: 0, optional: 0, peer: 0, peerOptional: 0, total: 1 } } }, 0);

falha('high fora da allowlist', relatorio(vuln('foo', 'high')), 1, /- foo \(high\)/);
falha('critical fora da allowlist', relatorio(vuln('foo', 'critical')), 1, /- foo \(critical\)/);
falha('allowlist não cobre o vizinho', relatorio(vuln('vite', 'high'), vuln('xlsx', 'high'), vuln('bar', 'critical'), vuln('baz', 'moderate')), 1, /- bar \(critical\)/);
falha('saída vazia com exit 0', '', 0, /não produziu JSON/);
falha('saída vazia com exit 1', '', 1, /não produziu JSON/);
falha('saída que não é JSON', 'npm ERR! network timeout', 1, /não produziu JSON/);
falha('JSON truncado', '{"auditReportVersion":2,"vulnerabilities":{"foo":{"name":"foo","sev', 1, /não produziu JSON/);
falha('aviso antes do JSON', 'npm warn config algo\n{"auditReportVersion":2,"vulnerabilities":{}}', 0, /não produziu JSON/);
falha('erro com code/summary (ENOLOCK)', { error: { code: 'ENOLOCK', summary: 'This command requires an existing lockfile.' } }, 1, /ENOLOCK This command requires an existing lockfile/);
falha('erro real de rede do npm 10 (motivo só em `message`)', { message: 'request to https://registry.npmjs.org/-/npm/v1/security/audits/quick failed, reason: connect ECONNREFUSED', error: { summary: '', detail: '' } }, 1, /ECONNREFUSED/);
falha('erro HTTP do registry (npm 10)', { message: '503 Service Unavailable - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick', method: 'POST', statusCode: 503, error: { summary: '', detail: '' } }, 1, /503 Service Unavailable/);
falha('JSON {} — audit não rodou', {}, 0, /vulnerabilities/);
falha('JSON null', 'null', 0, /vulnerabilities/);
falha('JSON array', '[]', 0, /vulnerabilities/);
falha('JSON string', '"ok"', 0, /vulnerabilities/);
falha('JSON número', '0', 0, /vulnerabilities/);
falha('vulnerabilities: null', { auditReportVersion: 2, vulnerabilities: null }, 0, /vulnerabilities/);
falha('vulnerabilities em array', { auditReportVersion: 2, vulnerabilities: [] }, 0, /vulnerabilities/);
falha('corpo de erro sem campo error', { message: '503 Service Unavailable', statusCode: 503 }, 1, /503 Service Unavailable/);
falha('formato antigo do npm 6 (advisories)', { actions: [], advisories: { 1: { module_name: 'foo', severity: 'high' } }, metadata: { vulnerabilities: { high: 1 } } }, 1, /vulnerabilities/);

test('falha: npm fora do PATH', () => {
  const r = roda(root, SCRIPT, { env: { NPM_OUT: '/nao/existe', NPM_EXIT: '127' } });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /não produziu JSON/);
});

test('falha: npm audit travado é interrompido pelo timeout', () => {
  const inicio = Date.now();
  const r = audit(relatorio(), 0, { NPM_SLEEP: '20', AUDIT_TIMEOUT_MS: '400' });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /não produziu JSON/);
  assert.match(r.stderr, /0\.4s/);
  assert.ok(Date.now() - inicio < 10_000, 'não pode esperar o npm travado');
});

test('avisa quando uma entrada da allowlist não tem mais vulnerabilidade', () => {
  const r = audit(relatorio(vuln('xlsx', 'high')), 1);
  assert.equal(r.status, 0, r.saida);
  assert.match(r.stderr, /vite/);
  assert.doesNotMatch(r.stderr, /xlsx/);
});

test('sem aviso de allowlist quando todas as entradas ainda cobrem algo', () => {
  const r = audit(relatorio(vuln('xlsx', 'high'), vuln('vite', 'high')), 1);
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.stderr, '');
});
