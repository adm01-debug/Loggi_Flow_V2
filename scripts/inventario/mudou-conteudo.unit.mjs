// Teste de scripts/inventario/mudou-conteudo.mjs: as funcoes puras (semCarimbos, mudou) e a CLI,
// rodada como subprocesso numa copia do script dentro de um repo git temporario (a CLI calcula a
// raiz a partir do proprio caminho). Offline, sem credencial; nada e escrito no repo.
// Rodar: node --test scripts/inventario/mudou-conteudo.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PADRAO, mudou, semCarimbos } from './mudou-conteudo.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mudou-conteudo.mjs');
const GIT = ['-c', 'user.name=teste', '-c', 'user.email=teste@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main'];
const temGit = spawnSync('git', ['--version']).status === 0;

const BANCO = {
  medido_em: '2026-11-01T00:00:00Z',
  resumo: { tabelas_public: 1 },
  tabelas: [{ nome: 'coletas', linhas: 10, bytes: 8192 }],
  cron: {
    historico: { linhas: 5, bytes: 9, mais_de_7_dias: 0, mais_antigo: 'a' },
    horas_paradas_7d: [{ hora: '2026-11-01T10:00Z' }],
    jobs: [{ nome: 'predict-delays-every-30min', agenda: '*/30 * * * *', execucoes_24h: 48, falhas_7d: 1, taxa_falha_7d_pct: 9, ultima_falha: 'x' }],
  },
  edge_functions: { publicadas: [{ slug: 'health', versao: 3, atualizada_em: '2026-11-01T00:00Z' }] },
  alertas: [
    { tipo: 'cron_falhando', detalhe: ['predict-delays-every-30min (9.0% em 7d)'] },
    { tipo: 'cron_parado', detalhe: ['2026-11-01T10:00Z'] },
    { tipo: 'tabela_sem_rls', detalhe: ['coletas'] },
  ],
};
const clonar = (o) => JSON.parse(JSON.stringify(o));

// ---------- funcoes puras ----------

test('semCarimbos: null (arquivo ausente) continua null e texto que nao e JSON volta como esta', () => {
  assert.equal(semCarimbos(null), null);
  assert.equal(semCarimbos('nao e json'), 'nao e json');
  assert.equal(semCarimbos(''), '');
});

test('semCarimbos: tira medido_em/gerado_em em qualquer nivel e ordena as chaves', () => {
  const a = semCarimbos('{"b":1,"gerado_em":"x","a":{"medido_em":"y","z":[{"gerado_em":"w","k":2}]}}');
  assert.equal(a, '{"a":{"z":[{"k":2}]},"b":1}');
  assert.equal(a, semCarimbos('{\r\n  "a": {"z": [{"k": 2, "gerado_em": "outro"}]},\r\n  "b": 1\r\n}\r\n'));
});

test('semCarimbos: telemetria viva do cron e das edges nao conta como mudanca', () => {
  const depois = clonar(BANCO);
  depois.medido_em = '2026-11-08T00:00:00Z';
  depois.cron.historico = { linhas: 999, bytes: 1, mais_de_7_dias: 7, mais_antigo: 'b' };
  depois.cron.horas_paradas_7d = [];
  depois.cron.jobs[0] = { ...depois.cron.jobs[0], execucoes_24h: 1, falhas_7d: 30, taxa_falha_7d_pct: 55.5, ultima_falha: 'y' };
  depois.edge_functions.publicadas[0].atualizada_em = '2026-11-07T00:00Z';
  depois.alertas[0].detalhe = ['predict-delays-every-30min (55.5% em 7d)'];
  depois.alertas[1].detalhe = ['2026-11-07T03:00Z', '2026-11-07T04:00Z'];
  assert.equal(semCarimbos(JSON.stringify(depois)), semCarimbos(JSON.stringify(BANCO)));
});

test('semCarimbos: mudanca de verdade continua aparecendo', async (t) => {
  const base = semCarimbos(JSON.stringify(BANCO));
  const casos = {
    'linhas de uma tabela (fora de cron.historico)': (d) => { d.tabelas[0].linhas = 11; },
    'tabela nova': (d) => { d.tabelas.push({ nome: 'entregas', linhas: 0, bytes: 0 }); },
    'job entra na lista de cron_falhando': (d) => { d.alertas[0].detalhe.push('outro-job (7.0% em 7d)'); },
    'alerta cron_parado some': (d) => { d.alertas.splice(1, 1); },
    'agenda de um job': (d) => { d.cron.jobs[0].agenda = '0 * * * *'; },
    'versao de uma edge publicada': (d) => { d.edge_functions.publicadas[0].versao = 4; },
    'detalhe de outro alerta': (d) => { d.alertas[2].detalhe = ['coletas', 'entregas']; },
  };
  for (const [nome, mexer] of Object.entries(casos)) {
    await t.test(nome, () => {
      const d = clonar(BANCO);
      mexer(d);
      assert.notEqual(semCarimbos(JSON.stringify(d)), base);
    });
  }
});

test('mudou: arquivo novo, apagado, igual e ausente dos dois lados', () => {
  const antes = { a: '{"x":1,"gerado_em":"1"}', b: '{"y":1}', c: null, d: null };
  const depois = { a: '{"gerado_em":"2","x":1}', b: null, c: '{"z":1}', d: null };
  const ler = (lado) => (f) => lado[f];
  assert.equal(mudou(['a'], ler(antes), ler(depois)), false);
  assert.equal(mudou(['b'], ler(antes), ler(depois)), true, 'apagado conta');
  assert.equal(mudou(['c'], ler(antes), ler(depois)), true, 'novo conta');
  assert.equal(mudou(['d'], ler(antes), ler(depois)), false, 'ausente dos dois lados nao e mudanca');
  assert.equal(mudou(['a', 'd', 'c'], ler(antes), ler(depois)), true);
  assert.equal(mudou([], ler(antes), ler(depois)), false);
});

test('PADRAO: os arquivos que o workflow commita', () => {
  assert.deepEqual(PADRAO, ['inventario/estado/banco.json', 'inventario/estado/rotas.json', 'inventario/estado/edges.json', 'inventario/estado/contagens.json']);
});

// ---------- CLI ----------

/** Repo temporario com uma copia do script em scripts/inventario/ e os tres inventarios commitados. */
function repo(t, { commit = true, init = true } = {}) {
  const raiz = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'inv mudou é (1) [x] ')));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  fs.mkdirSync(path.join(raiz, 'scripts/inventario'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'inventario/estado'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'sub'));
  fs.copyFileSync(SCRIPT, path.join(raiz, 'scripts/inventario/mudou-conteudo.mjs'));
  const git = (...args) => {
    const r = spawnSync('git', [...GIT, ...args], { cwd: raiz, encoding: 'utf8' });
    assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  };
  const escrever = (rel, conteudo) => {
    fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), conteudo);
  };
  const rodar = (args = [], opcoes = {}) => {
    const r = spawnSync(process.execPath, [path.join(raiz, 'scripts/inventario/mudou-conteudo.mjs'), ...args], { cwd: raiz, encoding: 'utf8', ...opcoes });
    return { status: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() };
  };
  if (init) git('init', '-q', '.');
  escrever('inventario/estado/banco.json', `${JSON.stringify(BANCO, null, 2)}\n`);
  escrever('inventario/estado/rotas.json', `${JSON.stringify({ format_version: 1, resumo: { urls: 1 } }, null, 2)}\n`);
  escrever('inventario/estado/edges.json', `${JSON.stringify({ gerado_em: '2026-11-01T00:00:00.000Z', total: 1, edge_functions: { health: { linhas: 9 } } })}\n`);
  escrever('inventario/estado/contagens.json', `${JSON.stringify({ coletado_em: '2026-11-01', gerado_em: '2026-11-01T00:00:00.000Z', edges: 1, migrations_no_repo: 259, rotas_no_app: 61, paridade_com_o_banco: 'nao medida' }, null, 2)}\n`);
  if (init && commit) { git('add', '-A'); git('commit', '-qm', 'base'); }
  return { raiz, git, escrever, rodar };
}

test('contagens.json (etapa 257): so a data da coleta muda -> false; numero novo -> true', { skip: !temGit }, (t) => {
  const r = repo(t);
  const rel = 'inventario/estado/contagens.json';
  const ler = () => JSON.parse(fs.readFileSync(path.join(r.raiz, rel), 'utf8'));
  const c = ler();
  c.coletado_em = '2099-01-01';
  c.gerado_em = '2099-01-01T00:00:00.000Z';
  r.escrever(rel, `${JSON.stringify(c, null, 2)}\n`);
  assert.equal(r.rodar().stdout, 'false');
  c.migrations_no_repo += 1;
  r.escrever(rel, `${JSON.stringify(c, null, 2)}\n`);
  assert.equal(r.rodar().stdout, 'true');
});

test('CLI: sem mudanca imprime false; so carimbo, ordem de chaves, CRLF e telemetria tambem', { skip: !temGit }, (t) => {
  const r = repo(t);
  assert.deepEqual(r.rodar(), { status: 0, stdout: 'false', stderr: '' });
  r.escrever('inventario/estado/edges.json', '{"edge_functions":{"health":{"linhas":9}},"total":1,"gerado_em":"2099-01-01T00:00:00.000Z"}');
  r.escrever('inventario/estado/rotas.json', '{\r\n  "resumo": {"urls": 1},\r\n  "format_version": 1\r\n}\r\n');
  const banco = clonar(BANCO);
  banco.medido_em = '2099-01-01T00:00:00Z';
  banco.cron.jobs[0].execucoes_24h = 0;
  banco.cron.historico.linhas = 123456;
  r.escrever('inventario/estado/banco.json', JSON.stringify(banco));
  assert.deepEqual(r.rodar(), { status: 0, stdout: 'false', stderr: '' });
});

test('CLI: mudanca real, arquivo removido e arquivo novo imprimem true', { skip: !temGit }, async (t) => {
  await t.test('conteudo', () => {
    const r = repo(t);
    const banco = clonar(BANCO);
    banco.tabelas.push({ nome: 'entregas', linhas: 0, bytes: 0 });
    r.escrever('inventario/estado/banco.json', JSON.stringify(banco));
    assert.deepEqual(r.rodar(), { status: 0, stdout: 'true', stderr: '' });
  });
  await t.test('removido', () => {
    const r = repo(t);
    fs.rmSync(path.join(r.raiz, 'inventario/estado/rotas.json'));
    assert.equal(r.rodar().stdout, 'true');
  });
  await t.test('novo (ainda fora do HEAD)', () => {
    const r = repo(t);
    r.escrever('inventario/estado/novo.json', '{"a":1}');
    assert.equal(r.rodar(['inventario/estado/novo.json']).stdout, 'true');
    assert.equal(r.rodar(['inventario/estado/nao-existe.json']).stdout, 'false', 'ausente dos dois lados');
  });
  await t.test('repo ainda sem commit: tudo e novo', () => {
    const r = repo(t, { commit: false });
    assert.deepEqual(r.rodar(), { status: 0, stdout: 'true', stderr: '' });
  });
});

test('CLI: o resultado nao depende do cwd (antes: true de subpasta, false de fora do repo)', { skip: !temGit }, (t) => {
  const r = repo(t);
  assert.equal(r.rodar([], { cwd: path.join(r.raiz, 'sub') }).stdout, 'false', 'subpasta, sem mudanca');
  assert.equal(r.rodar([], { cwd: os.tmpdir() }).stdout, 'false', 'fora do repo, sem mudanca');
  const banco = clonar(BANCO);
  banco.resumo.tabelas_public = 2;
  r.escrever('inventario/estado/banco.json', JSON.stringify(banco));
  assert.equal(r.rodar([], { cwd: path.join(r.raiz, 'sub') }).stdout, 'true', 'subpasta, com mudanca');
  assert.equal(r.rodar([], { cwd: os.tmpdir() }).stdout, 'true', 'fora do repo, com mudanca');
  assert.equal(r.rodar(['../inventario/estado/banco.json'], { cwd: path.join(r.raiz, 'sub') }).stdout, 'true', 'argumento relativo ao cwd');
  assert.equal(r.rodar(['../inventario/estado/edges.json'], { cwd: path.join(r.raiz, 'sub') }).stdout, 'false');
});

test('CLI: .json gerado vazio ou truncado falha fechado (exit 2, stdout vazio) em vez de dizer true', { skip: !temGit }, (t) => {
  for (const conteudo of ['', '{"gerado_em": "x", "tot']) {
    const r = repo(t);
    r.escrever('inventario/estado/edges.json', conteudo);
    const saida = r.rodar();
    assert.equal(saida.status, 2);
    assert.equal(saida.stdout, '', 'nada no stdout: o `valor=$(...)` do workflow falha com bash -e');
    assert.match(saida.stderr, /edges\.json nao e JSON valido/);
  }
});

test('CLI: sem git ou fora de repositorio falha fechado (antes: true/false no chute)', { skip: !temGit }, async (t) => {
  await t.test('git fora do PATH', () => {
    const r = repo(t);
    // O node e chamado pelo caminho absoluto; um PATH vazio de binarios tira so o git.
    const saida = r.rodar([], { env: { ...process.env, PATH: path.join(r.raiz, 'sem-binarios') } });
    assert.equal(saida.status, 2);
    assert.equal(saida.stdout, '');
    assert.match(saida.stderr, /git nao encontrado no PATH/);
  });
  await t.test('pasta que nao e repositorio', () => {
    const r = repo(t, { init: false });
    // GIT_CEILING_DIRECTORIES: o tmpdir pode estar dentro de outro repo; a busca nao pode subir.
    const saida = r.rodar([], { env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(r.raiz) } });
    assert.equal(saida.status, 2);
    assert.equal(saida.stdout, '');
    assert.match(saida.stderr, /git nao leu o repositorio/);
  });
});

test('CLI: inventario com mais de 1 MB no HEAD (antes o maxBuffer estourava e virava true)', { skip: !temGit }, (t) => {
  const r = repo(t);
  const grande = { gerado_em: 'a', telas: Array.from({ length: 9000 }, (_, i) => ({ id: `/rota-${i}`, hooks: ['useA', 'useB', 'useC'], tabelas: ['t1', 't2', 't3'], arquivo: `src/pages/Pagina${i}.tsx` })) };
  r.escrever('inventario/estado/rotas.json', `${JSON.stringify(grande, null, 2)}\n`);
  assert.ok(fs.statSync(path.join(r.raiz, 'inventario/estado/rotas.json')).size > 1024 * 1024);
  r.git('add', '-A');
  r.git('commit', '-qm', 'grande');
  r.escrever('inventario/estado/rotas.json', `${JSON.stringify({ ...grande, gerado_em: 'b' }, null, 2)}\n`);
  assert.deepEqual(r.rodar(), { status: 0, stdout: 'false', stderr: '' });
  grande.telas.pop();
  r.escrever('inventario/estado/rotas.json', `${JSON.stringify(grande, null, 2)}\n`);
  assert.equal(r.rodar().stdout, 'true');
});

test('CLI: binario compara byte a byte; nome com espaco, acento, parenteses e colchetes sobrevive', { skip: !temGit }, (t) => {
  const r = repo(t);
  const bin = Buffer.from(Array.from({ length: 3000 }, (_, i) => (i * 7 + 3) % 256));
  bin[10] = 0xff;
  const estranho = 'inventario/estado/pasta ação (1) [x]/arq é.json';
  r.escrever('inventario/estado/bin.dat', bin);
  r.escrever(estranho, '{"a":1,"gerado_em":"x"}');
  r.escrever('nota.txt', 'texto\n');
  r.git('add', '-A');
  r.git('commit', '-qm', 'extras');
  assert.equal(r.rodar(['inventario/estado/bin.dat']).stdout, 'false');
  bin[10] = 0xfe; // outro byte invalido em UTF-8: como texto os dois viravam o mesmo U+FFFD
  r.escrever('inventario/estado/bin.dat', bin);
  assert.equal(r.rodar(['inventario/estado/bin.dat']).stdout, 'true');
  r.escrever(estranho, '{"gerado_em":"y","a":1}');
  assert.equal(r.rodar([estranho]).stdout, 'false');
  r.escrever(estranho, '{"gerado_em":"y","a":2}');
  assert.equal(r.rodar([estranho]).stdout, 'true');
  r.escrever('nota.txt', 'texto\r\n');
  assert.equal(r.rodar(['nota.txt']).stdout, 'true', 'fora de JSON a comparacao e literal');
});

test('CLI: --help nao compara nada', (t) => {
  const r = repo(t, { init: false });
  const saida = r.rodar(['--help']);
  assert.equal(saida.status, 0);
  assert.match(saida.stdout, /^Uso: node scripts\/inventario\/mudou-conteudo\.mjs/);
});
