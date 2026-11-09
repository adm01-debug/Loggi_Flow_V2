// Teste de lote-pendente.mjs (classificacao "apply pendente" do types-sync).
// O classificador real (check-migration-drift.mjs) nao foi portado para este repositorio;
// aqui ele e substituido por um duble numa copia do script em pasta temporaria. Offline.
// Rodar da raiz: node --test scripts/db-audit/lote-pendente.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

function ambiente(duble) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-audit-lote-'));
  fs.copyFileSync(path.join(AQUI, 'lote-pendente.mjs'), path.join(dir, 'lote-pendente.mjs'));
  if (duble !== undefined) fs.writeFileSync(path.join(dir, 'check-migration-drift.mjs'), duble);
  const resumo = path.join(dir, 'summary.md');
  const rodar = (env = {}, args = []) => {
    const base = { ...process.env };
    delete base.DESTINO_URL;
    delete base.GITHUB_STEP_SUMMARY;
    const r = spawnSync(process.execPath, [path.join(dir, 'lote-pendente.mjs'), ...args], {
      encoding: 'utf8',
      env: { ...base, GITHUB_STEP_SUMMARY: resumo, ...env },
    });
    const texto = fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '';
    fs.rmSync(resumo, { force: true });
    return { status: r.status, saida: r.stdout + r.stderr, resumo: texto };
  };
  return { rodar, limpar: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const DESTINO = { DESTINO_URL: 'postgresql://u:segredo@db.exemplo/postgres' };

test('sem DESTINO_URL sai 0 sem chamar o classificador', () => {
  const amb = ambiente('process.exit(1);');
  try {
    const r = amb.rodar();
    assert.equal(r.status, 0, r.saida);
    assert.match(r.resumo, /sem drift/);
    assert.match(r.resumo, /DESTINO_URL nao definido/);
  } finally {
    amb.limpar();
  }
});

test('classificador ausente: sai 3 e o resumo nao afirma drift', () => {
  const amb = ambiente();
  try {
    const r = amb.rodar(DESTINO);
    assert.equal(r.status, 3, r.saida);
    assert.match(r.saida, /check-migration-drift\.mjs ausente/);
    assert.match(r.resumo, /nao classificado/);
    assert.ok(!/drift real/.test(r.resumo), r.resumo);
    assert.ok(!(r.saida + r.resumo).includes('segredo'));
  } finally {
    amb.limpar();
  }
});

test('repassa o codigo do classificador e escreve o resumo correspondente', () => {
  for (const [codigo, padrao] of [[0, /sem drift/], [2, /apply aguardado/], [1, /drift real detectado/]]) {
    const amb = ambiente(`process.exit(${codigo});`);
    try {
      const r = amb.rodar(DESTINO);
      assert.equal(r.status, codigo, r.saida);
      assert.match(r.resumo, padrao);
    } finally {
      amb.limpar();
    }
  }
});

test('chama o classificador com --classificar e repassa os argumentos extras', () => {
  const amb = ambiente("console.log('ARGS=' + process.argv.slice(2).join(','));");
  try {
    const r = amb.rodar(DESTINO, ['--', '--json']);
    assert.equal(r.status, 0, r.saida);
    assert.match(r.saida, /ARGS=--classificar,--,--json/);
  } finally {
    amb.limpar();
  }
});

test('classificador morto por sinal nao vira "drift real"', () => {
  const amb = ambiente("process.kill(process.pid, 'SIGKILL');");
  try {
    const r = amb.rodar(DESTINO);
    assert.equal(r.status, 3, r.saida);
    assert.match(r.resumo, /nao classificado/);
  } finally {
    amb.limpar();
  }
});

test('GITHUB_STEP_SUMMARY ausente ou invalido nao muda o codigo de saida', () => {
  const amb = ambiente('process.exit(2);');
  try {
    assert.equal(amb.rodar({ ...DESTINO, GITHUB_STEP_SUMMARY: '' }).status, 2);
    assert.equal(amb.rodar({ ...DESTINO, GITHUB_STEP_SUMMARY: '/nao/existe/resumo.md' }).status, 2);
  } finally {
    amb.limpar();
  }
});
