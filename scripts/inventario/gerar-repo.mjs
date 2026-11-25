#!/usr/bin/env node
// Inventario gerado do lado do repositorio (sem acesso ao banco):
//  - edge functions: linhas do index.ts, segredos lidos (Deno.env.get no index.ts e nos arquivos locais que ele
//    importa, _shared/ incluso) e quem as invoca (src, migrations, outras edges, e2e, CI)
//  - contagens: edges, migrations do repo e rotas do App.tsx, com a data da coleta (etapa 257)
//  - tabelas: para cada nome recebido em stdin (uma por linha), quantos .from('tabela') ha em src/ e supabase/functions/
// Uso: node scripts/inventario/gerar-repo.mjs            -> escreve inventario/estado/edges.json
//      node scripts/inventario/gerar-repo.mjs < tabelas.txt -> tambem escreve inventario/estado/tabelas-uso.json
// Fora de terminal o stdin e lido ate o fim: sem lista de tabelas, rode com `< /dev/null` (como a CI faz).
// Precisa do ripgrep (rg) no PATH; sem ele falha (exit 1) em vez de gravar um inventario vazio.
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { isatty } from 'node:tty';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Uso: node scripts/inventario/gerar-repo.mjs < /dev/null      grava inventario/estado/edges.json\n'
    + '     node scripts/inventario/gerar-repo.mjs < tabelas.txt    grava tambem inventario/estado/tabelas-uso.json (um nome de tabela por linha)');
  process.exit(0);
}

// fileURLToPath, nao URL.pathname: este vem percent-encoded e quebra em pasta com espaco ou acento.
const RAIZ = join(fileURLToPath(new URL('../../', import.meta.url)), '/');
const FDIR = join(RAIZ, 'supabase/functions');
const OUT = join(RAIZ, 'inventario/estado');
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Limites de um nome de edge/tabela (letras, digitos, `_` e `-`), sem lookaround (o rg padrao nao tem).
const INICIO = '(^|[^A-Za-z0-9_-])';
const FIM = '([^A-Za-z0-9_-]|$)';
function executarRg(args) {
  try {
    return execFileSync('rg', args, { encoding: 'utf8' });
  } catch (erro) {
    // O ripgrep usa exit 1 para "nenhum resultado"; isso não é falha da busca.
    if (erro?.status === 1) return '';
    if (erro?.code === 'ENOENT') {
      throw new Error('ripgrep (rg) não encontrado; o inventário não pode ser gerado com segurança.', { cause: erro });
    }
    const status = Number.isInteger(erro?.status) ? erro.status : 'desconhecido';
    throw new Error(`ripgrep (rg) falhou com exit ${status}; o inventário não foi gerado.`, { cause: erro });
  }
}
// Pasta que nao existe faz o rg sair com exit 2 mesmo com --no-messages; some ela antes.
const existentes = (paths) => paths.map((p) => join(RAIZ, p)).filter((p) => existsSync(p));
function rgCount(pattern, paths) {
  const onde = existentes(paths);
  if (onde.length === 0) return 0;
  const out = executarRg(['-c', '--no-messages', '-e', pattern, '--', ...onde]);
  return out.split('\n').filter(Boolean).reduce((n, l) => n + Number(l.slice(l.lastIndexOf(':') + 1)), 0);
}
function rgFiles(pattern, paths) {
  const onde = existentes(paths);
  if (onde.length === 0) return [];
  return executarRg(['-l', '--no-messages', '-e', pattern, '--', ...onde])
    .split('\n').filter(Boolean).map((f) => f.slice(RAIZ.length));
}

/** Segredos (Deno.env.get) do arquivo e dos arquivos locais que ele importa (./x.ts, ../_shared/y.ts), sem teste. */
function segredosDe(arquivo, vistos = new Set(), envs = new Set()) {
  if (vistos.has(arquivo) || !existsSync(arquivo) || /_test\.|\.test\.|\.spec\./.test(arquivo)) return envs;
  vistos.add(arquivo);
  const code = readFileSync(arquivo, 'utf8');
  for (const m of code.matchAll(/Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g)) envs.add(m[1]);
  for (const m of code.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) segredosDe(resolve(dirname(arquivo), m[1]), vistos, envs);
  return envs;
}

const edges = readdirSync(FDIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join(FDIR, d.name, 'index.ts')))
  .map((d) => d.name).sort();

const inventario = {};
for (const f of edges) {
  const q = esc(f);
  const code = readFileSync(join(FDIR, f, 'index.ts'), 'utf8');
  const envs = [...segredosDe(join(FDIR, f, 'index.ts'))].sort();
  // `\b` nao serve de fim de nome: "health" casava com "health-check" (o `-` e fronteira de palavra).
  const url = `functions/v1/${q}${FIM}`;
  const src = rgFiles(`(functions\\.invoke\\(\\s*['"\`]${q}['"\`]|${url}|['"\`]${q}['"\`]\\s*[,)])`, ['src']);
  const migrations = rgFiles(url, ['supabase/migrations']);
  const outrasEdges = rgFiles(`${url}|['"\`]${q}['"\`]`, ['supabase/functions']).filter((p) => !p.startsWith(`supabase/functions/${f}/`));
  const e2e = rgFiles(`${INICIO}${q}${FIM}`, ['tests/e2e']);
  const ci = rgFiles(`${INICIO}${q}${FIM}`, ['.github/workflows', 'supabase/config.toml']);
  inventario[f] = {
    linhas: code.split('\n').length,
    segredos_lidos: envs,
    chamada_em: { src: src.length, migrations: migrations.length, outras_edges: outrasEdges.length, e2e: e2e.length, ci_config: ci.length },
    sem_chamador: src.length + migrations.length + outrasEdges.length === 0,
  };
}
const semChamador = Object.entries(inventario).filter(([, v]) => v.sem_chamador).map(([k]) => k);
writeFileSync(join(OUT, 'edges.json'), JSON.stringify({ gerado_em: new Date().toISOString(), total: edges.length, sem_chamador_no_repo: semChamador, edge_functions: inventario }) + '\n');
console.log(`edges: ${edges.length} | sem chamador no repo (src/migrations/edges): ${semChamador.length}`);

// Etapa 257: os numeros que `docs/prod-readiness.md` e o `AGENTS.md` citam, numa fonte so e datada.
// `edges` e `migrations` sao do repositorio; a paridade com o banco (functions publicadas e migrations
// aplicadas) exigiria SUPABASE_ACCESS_TOKEN/SUPABASE_DB_URL e por isso nao e medida aqui.
const contarSql = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.sql')).length : 0);
let rotasNoApp = null;
try {
  rotasNoApp = JSON.parse(readFileSync(join(OUT, 'rotas.json'), 'utf8'))?.resumo?.urls ?? null;
} catch {
  rotasNoApp = null; // sem gerar-rotas.mjs antes: null, nao zero (zero seria uma medida falsa)
}
const coletadoEm = new Date();
const migrationsNoRepo = contarSql(join(RAIZ, 'supabase/migrations'));
writeFileSync(join(OUT, 'contagens.json'), `${JSON.stringify({
  coletado_em: coletadoEm.toISOString().slice(0, 10),
  gerado_em: coletadoEm.toISOString(),
  edges: edges.length,
  migrations_no_repo: migrationsNoRepo,
  rotas_no_app: rotasNoApp,
  paridade_com_o_banco: 'nao medida aqui: exigiria SUPABASE_ACCESS_TOKEN (functions publicadas) e SUPABASE_DB_URL (migrations aplicadas)',
}, null, 2)}\n`);
console.log(`contagens: edges ${edges.length} | migrations ${migrationsNoRepo} | rotas ${rotasNoApp ?? 'n/d'}`);

// isatty(0), nao process.stdin.isTTY: tocar em process.stdin poe o pipe em modo nao-bloqueante e o
// readFileSync(0) estoura EAGAIN quando o produtor ainda nao escreveu.
if (!isatty(0)) {
  let entrada = '';
  try {
    entrada = readFileSync(0, 'utf8');
  } catch (erro) {
    if (!['EAGAIN', 'EOF', 'EBADF'].includes(erro?.code)) throw erro;
    console.error(`aviso: stdin indisponivel (${erro.code}); tabelas-uso.json nao foi gerado. Sem lista de tabelas, use < /dev/null.`);
  }
  // Um nome por linha (como o cabecalho promete): dividir por qualquer espaco partia "Tabela Estranha" em duas.
  const nomes = entrada.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (nomes.length > 0) {
    const uso = {};
    for (const t of nomes) {
      const q = esc(t);
      uso[t] = {
        from_src: rgCount(`\\.from\\(\\s*['"\`]${q}['"\`]`, ['src']),
        from_edges: rgCount(`\\.from\\(\\s*['"\`]${q}['"\`]`, ['supabase/functions']),
        em_types_ts: rgCount(`^\\s+${q}: \\{`, ['src/integrations/supabase/types.ts']) > 0,
      };
    }
    const semFrom = Object.entries(uso).filter(([, v]) => v.from_src + v.from_edges === 0).map(([k]) => k);
    writeFileSync(join(OUT, 'tabelas-uso.json'), JSON.stringify({ gerado_em: new Date().toISOString(), total: nomes.length, sem_from_em_src_nem_edges: semFrom, tabelas: uso }) + '\n');
    console.log(`tabelas: ${nomes.length} | sem .from() em src nem edges: ${semFrom.length}`);
  }
}
