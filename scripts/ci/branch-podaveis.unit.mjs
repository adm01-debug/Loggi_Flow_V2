// Teste do comando de poda (scripts/ci/branch-podaveis.mjs).
// O script nunca apaga nada; o que se prova aqui é que nenhuma branch indevida entra no
// bloco `git push origin --delete` e que toda dúvida vira "comando não gerado".
// Rodar: node --test scripts/ci/branch-podaveis.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  DIAS_MINIMOS, SEMPRE_FORA, executar, lerEquivalentes, lerPrsAbertas, lerProtegidas, motivoNomeInseguro,
  nomeVisivel, relatorio, relatorioIndisponivel, selecionarPodaveis,
} from './branch-podaveis.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'branch-podaveis.mjs');
const AGORA = Date.UTC(2026, 10, 9, 12, 0, 0);
const epochHa = (dias, segundos = 0) => Math.floor(AGORA / 1000) - dias * 86_400 - segundos;
const ANTIGA = epochHa(30);
const temporarios = [];
after(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

const selecionar = (equivalentes, extra = {}) => selecionarPodaveis({ equivalentes, prsAbertas: [], protegidas: [], agoraMs: AGORA, ...extra });
const comandos = (saida) => saida.split('\n').filter((l) => l.startsWith('git push origin --delete '));

// ------------------------------------------------------------------ nomes
test('nome seguro: os formatos reais de branch deste repo passam', () => {
  for (const nome of ['claude/fix-scripts-robustez-261109-2304', 'dependabot/npm_and_yarn/vite-7.0.0', 'dependabot/github_actions/actions/checkout-7', 'Github_Copilot/ajuste', 'a', 'v1.2.3', 'feat/x.y_z-1']) {
    assert.equal(motivoNomeInseguro(nome), null, nome);
  }
});

test('nome inseguro: tudo que o shell ou o git interpretaria é recusado', () => {
  const ruins = ['', '-rf', '--delete', '$(rm -rf .)', 'a;b', 'a b', 'a`id`', 'a|b', 'a&b', 'a>b', "a'b", 'a"b', 'a\\b', 'a\rb', 'a\nb', 'a\tb',
    'ação', 'a*b', 'a~1', 'a^', 'a:b', 'a?b', 'a[b', '.oculta', '/abs', 'a..b', 'a//b', 'a/', 'x.lock', 'a@{b}', 'a#b', 'a!b', 'a%b'];
  for (const nome of ruins) assert.notEqual(motivoNomeInseguro(nome), null, JSON.stringify(nome));
  for (const naoString of [undefined, null, 7, {}, ['a']]) assert.equal(motivoNomeInseguro(naoString), 'nome vazio');
});

test('nomeVisivel: nome recusado sai sem nada que vire markdown ou shell', () => {
  assert.equal(nomeVisivel('$(rm -rf .)`x`\n'), '%24(rm%20-rf%20.)%60x%60%0A');
});

// ------------------------------------------------------------------ seleção
test('seleção: branch equivalente, antiga, sem PR e sem proteção é elegível', () => {
  const r = selecionar([{ branch: 'claude/fix-x-261001-1200', commitEpoch: ANTIGA }]);
  assert.deepEqual(r.elegiveis, ['claude/fix-x-261001-1200']);
});

test('seleção: main, master, develop, contexto e HEAD nunca entram, mesmo antigas e sem proteção', () => {
  const fixas = ['main', 'master', 'develop', 'contexto', 'HEAD'];
  for (const b of fixas) assert.ok(SEMPRE_FORA.has(b), b);
  const r = selecionar(fixas.map((branch) => ({ branch, commitEpoch: ANTIGA })));
  assert.deepEqual(r.elegiveis, []);
  assert.deepEqual(r.fora.principal, fixas);
  assert.deepEqual(comandos(relatorio(r)), []);
});

test('seleção: branch protegida fica fora', () => {
  const r = selecionar([{ branch: 'release', commitEpoch: ANTIGA }, { branch: 'livre', commitEpoch: ANTIGA }], { protegidas: ['release'] });
  assert.deepEqual(r.elegiveis, ['livre']);
  assert.deepEqual(r.fora.protegidas, ['release']);
});

test('seleção: branch com PR aberta fica fora (inclusive PR de fork com o mesmo nome)', () => {
  const r = selecionar([{ branch: 'feat/a', commitEpoch: ANTIGA }, { branch: 'feat/b', commitEpoch: ANTIGA }], { prsAbertas: ['feat/a', 'feat/a'] });
  assert.deepEqual(r.elegiveis, ['feat/b']);
  assert.deepEqual(r.fora.comPr, ['feat/a']);
});

test(`seleção: o corte é MAIS de ${DIAS_MINIMOS} dias — exatamente ${DIAS_MINIMOS} dias ainda fica`, () => {
  const r = selecionar([
    { branch: 'exato', commitEpoch: epochHa(DIAS_MINIMOS) },
    { branch: 'um-segundo-a-mais', commitEpoch: epochHa(DIAS_MINIMOS, 1) },
    { branch: 'ontem', commitEpoch: epochHa(1) },
    { branch: 'futuro', commitEpoch: epochHa(-2) },
  ]);
  assert.deepEqual(r.elegiveis, ['um-segundo-a-mais']);
  assert.deepEqual(r.fora.recentes, ['exato', 'ontem', 'futuro']);
});

test('seleção: sem data confiável do último commit a branch fica', () => {
  const r = selecionar([Number.NaN, 0, -5, Infinity, undefined, null, ANTIGA * 1000].map((commitEpoch, i) => ({ branch: `b${i}`, commitEpoch })));
  assert.deepEqual(r.elegiveis, []);
  assert.equal(r.fora.recentes.length, 7);
});

test('seleção: nome inseguro é recusado e aparece codificado no relatório, nunca no comando', () => {
  const r = selecionar([{ branch: '$(curl x|sh)', commitEpoch: ANTIGA }, { branch: '-f', commitEpoch: ANTIGA }, { branch: 'ok', commitEpoch: ANTIGA }]);
  assert.deepEqual(r.elegiveis, ['ok']);
  const saida = relatorio(r);
  assert.deepEqual(comandos(saida), ['git push origin --delete ok']);
  assert.ok(!saida.includes('$(curl'));
  assert.match(saida, /nome recusado: `%24\(curl%20x%7Csh\)`/);
});

test('seleção: saída ordenada e idêntica em execução repetida', () => {
  const entrada = ['zeta', 'alfa', 'claude/b', 'claude/a'].map((branch) => ({ branch, commitEpoch: ANTIGA }));
  const a = selecionar(entrada);
  assert.deepEqual(a.elegiveis, ['alfa', 'claude/a', 'claude/b', 'zeta']);
  assert.deepEqual(selecionar([...entrada].reverse()).elegiveis, a.elegiveis);
});

test('seleção: lista vazia', () => {
  const r = selecionar([]);
  assert.deepEqual(r.elegiveis, []);
  assert.match(relatorio(r), /Nenhuma branch elegível para poda\./);
});

// ------------------------------------------------------------------ leitura das entradas
test('lerEquivalentes: TSV normal, CRLF, linha sem tab, epoch vazio e linhas em branco', () => {
  assert.deepEqual(lerEquivalentes(`a\t100\nb\t200\r\n\nsem-tab\nvazio\t\nlixo\tabc\n`), [
    { branch: 'a', commitEpoch: 100 },
    { branch: 'b', commitEpoch: 200 },
    { branch: 'sem-tab', commitEpoch: Number.NaN },
    { branch: 'vazio', commitEpoch: Number.NaN },
    { branch: 'lixo', commitEpoch: Number.NaN },
  ]);
  assert.deepEqual(lerEquivalentes(''), []);
});

test('lerEquivalentes: resto de CRLF no nome não gera comando', () => {
  const r = selecionar(lerEquivalentes('sem-tab\r\n'));
  assert.deepEqual(r.elegiveis, []);
});

test('lerPrsAbertas: devolve os heads; com baseRefName, a base também conta como em uso', () => {
  assert.deepEqual(lerPrsAbertas('[{"headRefName":"a"},{"headRefName":"b"}]', 500), ['a', 'b']);
  assert.deepEqual(lerPrsAbertas('[{"headRefName":"filha","baseRefName":"pilha"}]', 500), ['filha', 'pilha']);
  assert.deepEqual(lerPrsAbertas('[]', 500), []);
});

test('lerPrsAbertas: falha fechada — não é array, lista cheia, item sem headRefName, JSON inválido', () => {
  assert.throws(() => lerPrsAbertas('{"erro":"falha ao listar PRs abertas"}', 500), /não é um array/);
  assert.throws(() => lerPrsAbertas('null', 500), /não é um array/);
  assert.throws(() => lerPrsAbertas('[{"headRefName":"a"},{"headRefName":"b"}]', 2), /veio cheia \(2 >= limite 2\)/);
  assert.throws(() => lerPrsAbertas('[{"number":1}]', 500), /PR sem headRefName/);
  assert.throws(() => lerPrsAbertas('[null]', 500), /PR sem headRefName/);
  assert.throws(() => lerPrsAbertas('', 500));
  assert.throws(() => lerPrsAbertas('<html>', 500));
});

test('lerProtegidas: tira espaços, CRLF e linhas vazias', () => {
  assert.deepEqual(lerProtegidas('main\r\n  release \n\n'), ['main', 'release']);
  assert.deepEqual(lerProtegidas(''), []);
});

// ------------------------------------------------------------------ executar (leitor injetado)
const ARGS = ['--equivalentes', 'eq', '--prs', 'prs', '--protegidas', 'prot', '--limite-prs', '500'];
function leitor(arquivos) {
  return (p) => {
    if (!(p in arquivos)) throw new Error(`ENOENT: ${p}`);
    return arquivos[p];
  };
}
const BASE = { eq: `velha\t${ANTIGA}\ncontexto\t${ANTIGA}\nmaster\t${ANTIGA}\ncom-pr\t${ANTIGA}\nnova\t${epochHa(1)}\nprotegida\t${ANTIGA}\n`, prs: '[{"headRefName":"com-pr"}]', prot: 'main\nprotegida\n' };

test('executar: caminho feliz, como o workflow chama', () => {
  const { saida, aviso } = executar(ARGS, leitor(BASE), AGORA);
  assert.equal(aviso, undefined);
  assert.deepEqual(comandos(saida), ['git push origin --delete velha']);
  assert.match(saida, /^\n### Comando pronto para poda \(W98\)\n/);
  assert.match(saida, /1 branch\(es\) elegível\(is\):\n\n```sh\ngit push origin --delete velha\n```\n/);
  assert.match(saida, /- com PR aberta: 1\n/);
  assert.match(saida, /- com commit nos últimos 7 dias: 1\n/);
  assert.match(saida, /- protegidas: 1\n/);
  assert.match(saida, /- fixas do repositório: 2\n/);
  assert.ok(saida.endsWith('\n'));
});

test('executar: sem --limite-prs continua funcionando', () => {
  const { saida, aviso } = executar(ARGS.slice(0, 6), leitor(BASE), AGORA);
  assert.equal(aviso, undefined);
  assert.deepEqual(comandos(saida), ['git push origin --delete velha']);
});

test('executar: qualquer entrada ilegível = comando não gerado', () => {
  const casos = [
    [{ ...BASE, prs: '{"erro":"falha ao listar PRs abertas"}' }, /PRs abertas indisponíveis/],
    [{ ...BASE, prs: 'não é json' }, /PRs abertas indisponíveis/],
    [{ eq: BASE.eq, prs: BASE.prs }, /branches protegidas indisponíveis/],
    [{ eq: BASE.eq, prot: BASE.prot }, /PRs abertas indisponíveis/],
    [{ prs: BASE.prs, prot: BASE.prot }, /lista de patch-equivalentes ilegível/],
  ];
  for (const [arquivos, motivo] of casos) {
    const { saida, aviso } = executar(ARGS, leitor(arquivos), AGORA);
    assert.ok(aviso, String(motivo));
    assert.match(saida, motivo);
    assert.match(saida, /Comando não gerado: /);
    assert.deepEqual(comandos(saida), []);
  }
});

test('executar: lista de PRs cheia até o limite = comando não gerado', () => {
  const prs = JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ headRefName: `b${i}` })));
  const { saida, aviso } = executar(ARGS, leitor({ ...BASE, prs }), AGORA);
  assert.match(aviso, /veio cheia \(500 >= limite 500\)/);
  assert.deepEqual(comandos(saida), []);
});

test('executar: --limite-prs inválido não desliga a checagem de lista cheia', () => {
  const prs = JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ headRefName: `b${i}` })));
  for (const limite of ['abc', '0', '-1', '1.5', '', 'NaN', 'Infinity']) {
    const { saida, aviso } = executar([...ARGS.slice(0, 7), limite], leitor({ ...BASE, prs }), AGORA);
    assert.match(aviso ?? '', /--limite-prs inválido/, JSON.stringify(limite));
    assert.deepEqual(comandos(saida), [], JSON.stringify(limite));
  }
});

test('executar: argumentos faltando ou malformados = comando não gerado', () => {
  for (const argv of [[], ['--equivalentes', 'eq'], ['--equivalentes', 'eq', '--prs', 'prs'], ['eq', 'prs', 'prot'], ['--equivalentes'], [...ARGS, '--sobrando']]) {
    const { saida, aviso } = executar(argv, leitor(BASE), AGORA);
    assert.ok(aviso, argv.join(' '));
    assert.deepEqual(comandos(saida), []);
  }
});

test('relatorioIndisponivel: explica o motivo e não traz comando', () => {
  const saida = relatorioIndisponivel('motivo X');
  assert.match(saida, /Comando não gerado: motivo X\./);
  assert.deepEqual(comandos(saida), []);
});

test('relatório: a regra impressa cita as branches fixas deste repo', () => {
  const saida = relatorio(selecionar([]));
  for (const b of ['main', 'master', 'develop', 'contexto']) assert.ok(saida.includes(`\`${b}\``), b);
  assert.match(saida, /\*\*Nada é apagado automaticamente\*\*/);
});

// ------------------------------------------------------------------ CLI
function pastaComEntradas(prefixo = 'podaveis-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  temporarios.push(dir);
  const velha = Math.floor(Date.now() / 1000) - 30 * 86_400;
  fs.writeFileSync(path.join(dir, 'eq.tsv'), `claude/velha\t${velha}\ncontexto\t${velha}\nmaster\t${velha}\n`);
  fs.writeFileSync(path.join(dir, 'prs.json'), '[]');
  fs.writeFileSync(path.join(dir, 'prot.txt'), 'main\n');
  return dir;
}
function cli(args, { cwd, script = SCRIPT } = {}) {
  // PATH vazio de propósito: o script não pode depender de git/gh para escrever o comando.
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd, env: { PATH: '' } });
}
const argsDe = (dir) => ['--equivalentes', path.join(dir, 'eq.tsv'), '--prs', path.join(dir, 'prs.json'), '--protegidas', path.join(dir, 'prot.txt'), '--limite-prs', '500'];

test('cli: como no workflow — markdown no stdout, exit 0, nada no stderr', () => {
  const r = cli(argsDe(pastaComEntradas()));
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
  assert.deepEqual(comandos(r.stdout), ['git push origin --delete claude/velha']);
});

test('cli: arquivo de protegidas ausente (o workflow o apaga quando a API falha) — exit 0, aviso, sem comando', () => {
  const dir = pastaComEntradas();
  fs.rmSync(path.join(dir, 'prot.txt'));
  const r = cli(argsDe(dir));
  assert.equal(r.status, 0);
  assert.match(r.stderr, /^::warning::W98: comando de poda não gerado — /);
  assert.match(r.stdout, /Comando não gerado: branches protegidas indisponíveis/);
  assert.deepEqual(comandos(r.stdout), []);
});

test('cli: sem argumentos — exit 0, aviso, sem comando', () => {
  const r = cli([]);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /falta --equivalentes/);
  assert.deepEqual(comandos(r.stdout), []);
});

test('cli: --help mostra o uso e não gera relatório', () => {
  for (const flag of ['--help', '-h']) {
    const r = cli([flag]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /^Uso: node scripts\/ci\/branch-podaveis\.mjs /);
    assert.ok(!r.stdout.includes('Comando pronto para poda'));
    assert.equal(r.stderr, '');
  }
});

test('cli: duas execuções com a mesma entrada dão a mesma saída', () => {
  const dir = pastaComEntradas();
  assert.equal(cli(argsDe(dir)).stdout, cli(argsDe(dir)).stdout);
});

test('cli: roda por link simbólico, de outro cwd e com entradas em caminho com espaço e acento', () => {
  const dir = pastaComEntradas('podáveis com espaço ');
  const pastaLink = fs.mkdtempSync(path.join(os.tmpdir(), 'podaveis-link-'));
  temporarios.push(pastaLink);
  fs.symlinkSync(path.resolve(path.dirname(SCRIPT), '..'), path.join(pastaLink, 'scripts'));
  for (const opcoes of [{ cwd: os.tmpdir() }, { script: path.join(pastaLink, 'scripts', 'ci', 'branch-podaveis.mjs') }]) {
    const r = cli(argsDe(dir), opcoes);
    assert.equal(r.status, 0);
    assert.deepEqual(comandos(r.stdout), ['git push origin --delete claude/velha']);
  }
});
