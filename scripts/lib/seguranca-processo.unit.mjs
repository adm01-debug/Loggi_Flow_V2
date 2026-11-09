// Teste das utilidades compartilhadas (scripts/lib/seguranca-processo.mjs), usadas por
// scripts/ci e scripts/db-audit. Tudo em pasta temporária; nenhum binário de verdade é executado.
// Rodar: node --test scripts/lib/seguranca-processo.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as lib from './seguranca-processo.mjs';

const { RAIZ_REPO, RAIZES_PERMITIDAS, estaDentro, executadoDiretamente, resolverCaminhoPermitido, resolverExecutavel } = lib;
const ESTE_ARQUIVO = fileURLToPath(import.meta.url);
const temporarios = [];
after(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

function pasta(prefixo = 'seg-proc-') {
  // realpath: em alguns sistemas o tmpdir é um link (/tmp -> /private/tmp) e as
  // comparações abaixo são com o caminho já resolvido.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefixo)));
  temporarios.push(dir);
  return dir;
}
function executavel(dir, nome, modo = 0o755) {
  fs.mkdirSync(dir, { recursive: true });
  const arquivo = path.join(dir, nome);
  fs.writeFileSync(arquivo, '#!/bin/sh\nexit 0\n', { mode: modo });
  return arquivo;
}
function comPath(valor, fn) {
  const original = process.env.PATH;
  process.env.PATH = valor;
  try { return fn(); } finally { process.env.PATH = original; }
}

// ------------------------------------------------------------------ contrato
test('exports: os que os importadores usam continuam existindo', () => {
  for (const nome of ['RAIZ_REPO', 'RAIZES_PERMITIDAS', 'resolverExecutavel', 'estaDentro', 'resolverCaminhoPermitido', 'executadoDiretamente']) {
    assert.ok(nome in lib, nome);
  }
  assert.equal(RAIZ_REPO, path.resolve(path.dirname(ESTE_ARQUIVO), '..', '..'));
  assert.ok(fs.existsSync(path.join(RAIZ_REPO, 'package.json')));
  assert.deepEqual(RAIZES_PERMITIDAS, [RAIZ_REPO, path.resolve(os.tmpdir()), path.resolve('/tmp')]);
});

// ------------------------------------------------------------------ resolverExecutavel
test('resolverExecutavel: devolve o primeiro do PATH, na ordem do shell', () => {
  const dir = pasta();
  const primeiro = executavel(path.join(dir, 'a'), 'gh');
  executavel(path.join(dir, 'b'), 'gh');
  assert.equal(comPath(`${path.join(dir, 'a')}:${path.join(dir, 'b')}`, () => resolverExecutavel('gh')), primeiro);
});

test('resolverExecutavel: segue para o próximo diretório quando o primeiro não tem o comando', () => {
  const dir = pasta();
  fs.mkdirSync(path.join(dir, 'vazio'));
  const achado = executavel(path.join(dir, 'b'), 'gh');
  assert.equal(comPath(`${path.join(dir, 'vazio')}:${path.join(dir, 'nao-existe')}:${path.join(dir, 'b')}`, () => resolverExecutavel('gh')), achado);
});

test('resolverExecutavel: arquivo sem bit de execução é pulado', () => {
  const dir = pasta();
  executavel(path.join(dir, 'a'), 'gh', 0o644);
  const achado = executavel(path.join(dir, 'b'), 'gh');
  assert.equal(comPath(`${path.join(dir, 'a')}:${path.join(dir, 'b')}`, () => resolverExecutavel('gh')), achado);
});

test('resolverExecutavel: diretório com o nome do comando é pulado, como no shell', () => {
  const dir = pasta();
  fs.mkdirSync(path.join(dir, 'a', 'gh'), { recursive: true });
  const achado = executavel(path.join(dir, 'b'), 'gh');
  assert.equal(comPath(`${path.join(dir, 'a')}:${path.join(dir, 'b')}`, () => resolverExecutavel('gh')), achado);
  assert.throws(() => comPath(path.join(dir, 'a'), () => resolverExecutavel('gh')), /comando nao encontrado no PATH: gh/);
});

test('resolverExecutavel: link para executável vale, e devolve o caminho do PATH (preserva o shim)', () => {
  const dir = pasta();
  const real = executavel(path.join(dir, 'real'), 'gh-de-verdade');
  fs.mkdirSync(path.join(dir, 'shim'));
  fs.symlinkSync(real, path.join(dir, 'shim', 'gh'));
  assert.equal(comPath(path.join(dir, 'shim'), () => resolverExecutavel('gh')), path.join(dir, 'shim', 'gh'));
});

test('resolverExecutavel: link quebrado é pulado', () => {
  const dir = pasta();
  fs.mkdirSync(path.join(dir, 'a'));
  fs.symlinkSync(path.join(dir, 'sumiu'), path.join(dir, 'a', 'gh'));
  assert.throws(() => comPath(path.join(dir, 'a'), () => resolverExecutavel('gh')), /comando nao encontrado/);
});

test('resolverExecutavel: comando ausente, PATH vazio ou indefinido lançam', () => {
  const dir = pasta();
  assert.throws(() => comPath(dir, () => resolverExecutavel('gh')), /comando nao encontrado no PATH: gh/);
  assert.throws(() => comPath('', () => resolverExecutavel('gh')), /comando nao encontrado/);
  const original = process.env.PATH;
  delete process.env.PATH;
  try { assert.throws(() => resolverExecutavel('gh'), /comando nao encontrado/); } finally { process.env.PATH = original; }
});

test('resolverExecutavel: nome vazio não devolve o diretório do PATH', () => {
  const dir = pasta();
  executavel(dir, 'gh');
  assert.throws(() => comPath(dir, () => resolverExecutavel('')), /comando nao encontrado/);
});

test('resolverExecutavel: entrada relativa no PATH ainda devolve caminho absoluto', () => {
  const dir = pasta();
  const achado = executavel(path.join(dir, 'bin'), 'gh');
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const resolvido = comPath('bin', () => resolverExecutavel('gh'));
    assert.ok(path.isAbsolute(resolvido));
    assert.equal(resolvido, achado);
  } finally { process.chdir(cwd); }
});

test('resolverExecutavel: entradas vazias no PATH são ignoradas (não vira "diretório atual")', () => {
  const dir = pasta();
  const achado = executavel(path.join(dir, 'b'), 'gh');
  executavel(dir, 'gh');
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    assert.equal(comPath(`::${path.join(dir, 'b')}:`, () => resolverExecutavel('gh')), achado);
  } finally { process.chdir(cwd); }
});

test('resolverExecutavel: nome com espaço e acento', () => {
  const dir = pasta('seg proc ação ');
  const achado = executavel(dir, 'meu comando');
  assert.equal(comPath(dir, () => resolverExecutavel('meu comando')), achado);
});

// ------------------------------------------------------------------ estaDentro
test('estaDentro: a própria raiz e descendentes contam; irmã com prefixo igual, pai e fora não', () => {
  assert.equal(estaDentro('/a/b', '/a/b'), true);
  assert.equal(estaDentro('/a/b', '/a/b/c/d.json'), true);
  assert.equal(estaDentro('/a/b', '/a/b/..oculto'), true);
  assert.equal(estaDentro('/a/b', '/a/bc'), false);
  assert.equal(estaDentro('/a/b', '/a'), false);
  assert.equal(estaDentro('/a/b', '/a/c'), false);
  assert.equal(estaDentro('/a/b', '/'), false);
  assert.equal(estaDentro('/a/b', '/a/b/../c'), false);
});

// ------------------------------------------------------------------ resolverCaminhoPermitido
test('caminho permitido: dentro do repositório e do diretório temporário, existente ou não', () => {
  assert.equal(resolverCaminhoPermitido(path.join(RAIZ_REPO, 'package.json'), 't'), path.join(RAIZ_REPO, 'package.json'));
  assert.equal(resolverCaminhoPermitido(path.join(RAIZ_REPO, 'nao', 'existe.json'), 't'), path.join(RAIZ_REPO, 'nao', 'existe.json'));
  const dir = pasta();
  assert.equal(resolverCaminhoPermitido(path.join(dir, 'novo', 'arquivo.json'), 't'), path.join(dir, 'novo', 'arquivo.json'));
  assert.equal(resolverCaminhoPermitido(dir, 't'), dir);
});

test('caminho permitido: relativo é resolvido contra o cwd', () => {
  const dir = pasta();
  const cwd = process.cwd();
  process.chdir(dir);
  try { assert.equal(resolverCaminhoPermitido('saida.json', 't'), path.join(dir, 'saida.json')); } finally { process.chdir(cwd); }
});

test('caminho permitido: fora das raízes lança, com o rótulo e o valor na mensagem', () => {
  for (const fora of ['/etc/passwd', '/', '/var/lib/x.json', '/etc/../etc/hosts']) {
    assert.throws(() => resolverCaminhoPermitido(fora, 'catalogo fresco'), (e) => e.message === `caminho de catalogo fresco fora das raizes permitidas (repositorio ou diretorio temporario): ${fora}`, fora);
  }
});

test('caminho permitido: `..` que sai e volta para dentro é aceito pelo destino final', () => {
  const dir = pasta();
  assert.equal(resolverCaminhoPermitido(path.join(dir, 'a', '..', 'b.json'), 't'), path.join(dir, 'b.json'));
});

test('caminho permitido: link existente apontando para fora é recusado', () => {
  const dir = pasta();
  fs.symlinkSync('/etc', path.join(dir, 'link'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'link', 'passwd'), 't'), /fora das raizes permitidas/);
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'link', 'ainda-nao-existe.json'), 't'), /fora das raizes permitidas/);
});

test('caminho permitido: link PENDENTE (alvo ainda não existe) apontando para fora é recusado', () => {
  const dir = pasta();
  fs.symlinkSync('/var/fora-das-raizes/novo.json', path.join(dir, 'pendente'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'pendente'), 't'), /fora das raizes permitidas/);
  fs.symlinkSync('/var/fora-das-raizes', path.join(dir, 'pasta-pendente'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'pasta-pendente', 'sub', 'novo.json'), 't'), /fora das raizes permitidas/);
  fs.symlinkSync('../../../../../../../../var/fora/novo.json', path.join(dir, 'relativo'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'relativo'), 't'), /fora das raizes permitidas/);
});

test('caminho permitido: link pendente apontando para dentro devolve o alvo', () => {
  const dir = pasta();
  fs.symlinkSync(path.join(dir, 'destino', 'novo.json'), path.join(dir, 'absoluto'));
  assert.equal(resolverCaminhoPermitido(path.join(dir, 'absoluto'), 't'), path.join(dir, 'destino', 'novo.json'));
  fs.symlinkSync('destino/outro.json', path.join(dir, 'relativo'));
  assert.equal(resolverCaminhoPermitido(path.join(dir, 'relativo'), 't'), path.join(dir, 'destino', 'outro.json'));
});

test('caminho permitido: cadeia de links pendentes é seguida até o fim', () => {
  const dir = pasta();
  fs.symlinkSync(path.join(dir, 'b'), path.join(dir, 'a'));
  fs.symlinkSync('/var/fora-das-raizes/x', path.join(dir, 'b'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'a'), 't'), /fora das raizes permitidas/);
});

test('caminho permitido: laço de links lança em vez de girar para sempre', () => {
  const dir = pasta();
  fs.symlinkSync(path.join(dir, 'b'), path.join(dir, 'a'));
  fs.symlinkSync(path.join(dir, 'a'), path.join(dir, 'b'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'a'), 't'), /cadeia de links simbolicos longa demais/);
});

test('caminho permitido: raízes informadas pelo chamador substituem o padrão', () => {
  const dir = pasta();
  const dentro = path.join(dir, 'dentro');
  fs.mkdirSync(dentro);
  assert.equal(resolverCaminhoPermitido(path.join(dentro, 'x'), 't', [dentro]), path.join(dentro, 'x'));
  assert.throws(() => resolverCaminhoPermitido(path.join(dir, 'x'), 't', [dentro]), /fora das raizes permitidas/);
  assert.throws(() => resolverCaminhoPermitido(path.join(RAIZ_REPO, 'package.json'), 't', [dentro]), /fora das raizes permitidas/);
  assert.throws(() => resolverCaminhoPermitido(path.join(dentro, 'x'), 't', []), /fora das raizes permitidas/);
  assert.throws(() => resolverCaminhoPermitido(`${dentro}-vizinha/x`, 't', [dentro]), /fora das raizes permitidas/);
  assert.throws(() => resolverCaminhoPermitido(path.join(dentro, '..', 'x'), 't', [dentro]), /fora das raizes permitidas/);
});

test('caminho permitido: raiz que é link vale pelo caminho real', () => {
  const dir = pasta();
  fs.mkdirSync(path.join(dir, 'real'));
  fs.symlinkSync(path.join(dir, 'real'), path.join(dir, 'atalho'));
  assert.equal(resolverCaminhoPermitido(path.join(dir, 'atalho', 'x.json'), 't', [path.join(dir, 'atalho')]), path.join(dir, 'real', 'x.json'));
  assert.equal(resolverCaminhoPermitido(path.join(dir, 'real', 'x.json'), 't', [path.join(dir, 'atalho')]), path.join(dir, 'real', 'x.json'));
});

test('caminho permitido: valor que não é string lança (falha fechada)', () => {
  for (const valor of [undefined, null, 7, {}]) assert.throws(() => resolverCaminhoPermitido(valor, 't'));
});

test('caminho permitido: nome com espaço, acento e aspas', () => {
  const dir = pasta('seg proc "ação" ');
  const alvo = path.join(dir, 'relatório final.json');
  assert.equal(resolverCaminhoPermitido(alvo, 't'), alvo);
});

// ------------------------------------------------------------------ executadoDiretamente
test('executadoDiretamente: falso para módulo importado, argv[1] vazio ou inexistente', () => {
  assert.equal(executadoDiretamente(pathToFileURL(path.join(RAIZ_REPO, 'scripts', 'lib', 'seguranca-processo.mjs')).href), false);
  assert.equal(executadoDiretamente(import.meta.url, ''), false);
  assert.equal(executadoDiretamente(import.meta.url, '/caminho/que/nao/existe.mjs'), false);
  assert.equal(executadoDiretamente(import.meta.url, ESTE_ARQUIVO), true);
});

test('executadoDiretamente: verdadeiro quando o script é o ponto de entrada — direto, por link e em caminho com espaço e acento', () => {
  const dir = pasta('seg proc entrada ação ');
  fs.mkdirSync(path.join(dir, 'lib'));
  fs.copyFileSync(path.join(RAIZ_REPO, 'scripts', 'lib', 'seguranca-processo.mjs'), path.join(dir, 'lib', 'seguranca-processo.mjs'));
  const principal = path.join(dir, 'principal.mjs');
  fs.writeFileSync(principal, "import { executadoDiretamente } from './lib/seguranca-processo.mjs';\nconsole.log(executadoDiretamente(import.meta.url) ? 'direto' : 'importado');\n");
  fs.writeFileSync(path.join(dir, 'quem-importa.mjs'), "import './principal.mjs';\n");
  fs.symlinkSync(dir, `${dir}-link`);
  temporarios.push(`${dir}-link`);
  const rodar = (script, cwd = dir) => spawnSync(process.execPath, [script], { encoding: 'utf8', cwd, env: { PATH: '' } }).stdout.trim();
  assert.equal(rodar(principal), 'direto');
  assert.equal(rodar('principal.mjs'), 'direto');
  assert.equal(rodar(path.join(`${dir}-link`, 'principal.mjs')), 'direto');
  assert.equal(rodar(principal, os.tmpdir()), 'direto');
  assert.equal(rodar(path.join(dir, 'quem-importa.mjs')), 'importado');
});
