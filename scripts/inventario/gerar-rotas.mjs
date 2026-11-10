#!/usr/bin/env node
/**
 * Inventario das rotas do front -> inventario/estado/rotas.json (fonte de consulta dos agentes).
 *
 * Le o codigo, nao documentacao:
 *  - URLs:  src/App.tsx (as <Route> dentro de <Routes>: path, pagina, ProtectedRoute/requiredRole,
 *           Navigate, rota aninhada, `index` e `*`; rota comentada nao conta)
 *  - Menu:  src/components/layout/AppSidebar.tsx (itens `{ title, url }`: rotulo, lista e grupo)
 *  - Para cada URL com pagina (`telas`): segue os imports a partir do arquivo da pagina (mesma
 *    pasta, src/hooks/, src/services/, src/lib/, src/features/, src/utils/ e ate MAX_SALTOS_FEATURE
 *    saltos em src/components/) e lista hooks, edge functions invocadas, RPCs, tabelas (.from e /rest/v1) e
 *    buckets de storage (storage.from).
 *  - `problemas`: item de menu sem rota, rota protegida sem item de menu, URL sem arquivo, arquivo
 *    de src/pages/ que nenhuma rota alcanca e import local que nao resolve.
 *
 * Uso:
 *   node scripts/inventario/gerar-rotas.mjs           grava inventario/estado/rotas.json
 *   node scripts/inventario/gerar-rotas.mjs --check   exit 1 se o arquivo commitado esta desatualizado
 * Saida deterministica (sem data, ordenacao sem locale): o mesmo codigo gera o mesmo arquivo.
 * Exit: 0 = gravado/em dia; 1 = --check desatualizado; 2 = nao deu para gerar (arquivo de rotas ou
 * de menu ausente/irreconhecivel, argumento desconhecido) - nada e gravado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/rotas.json';
const ARQUIVO_ROTAS = 'src/App.tsx';
const ARQUIVO_MENU = 'src/components/layout/AppSidebar.tsx';
const PASTA_PAGINAS = 'src/pages';
const EXTENSOES = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();
// Ordem por unidade de codigo: `localeCompare` muda com o locale da maquina (cs: "/h" antes de "/ch").
const ordem = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Resolve um especificador de import para um arquivo do repo (ou null se externo/inexistente). */
export function resolverImport(raiz, deArquivoAbs, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(deArquivoAbs), especificador);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (fs.existsSync(base + ext)) return base + ext;
  return undefined; // local, mas nao existe
}

/** Imports de um arquivo: [{ especificador, nomes[] }] (estaticos e import() dinamico). */
export function extrairImports(texto) {
  const out = [];
  for (const m of texto.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const nomes = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b(?!\s*as\b)/g)].map((x) => x[1])
      .filter((n) => !['type', 'as', 'default'].includes(n));
    out.push({ especificador: m[3], nomes });
  }
  for (const m of texto.matchAll(/(?:import|export)\s*(?:\*\s*from\s*)?['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  return out;
}

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` (ou `export const`) de nivel de modulo no texto.
 * So resolve o caso mais comum do repo: identificador passado direto pra `.from`/`fromTable`/
 * `storage.from`/`rpc`/`invoke` que e, no mesmo arquivo, uma constante de string.
 * Nao resolve parametro de funcao nem ternario. Coluna zero sozinha nao basta: conta
 * profundidade de `{`/`}` linha a linha e so aceita o `const` quando a profundidade, ANTES
 * de processar a linha, e zero (nivel de modulo de verdade).
 */
function constantesDeString(texto) {
  const mapa = new Map();
  let profundidade = 0;
  for (const linha of texto.split('\n')) {
    if (profundidade === 0) {
      const m = linha.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[^=]+)?=\s*['"`]([A-Za-z0-9_.-]+)['"`]\s*[;,]?\s*$/);
      if (m) mapa.set(m[1], m[2]);
    }
    for (const ch of linha) {
      if (ch === '{') profundidade++;
      else if (ch === '}') profundidade--;
    }
  }
  return mapa;
}

/**
 * Chamadas ao Supabase num texto: tabelas (`.from` do cliente, `fromTable` de
 * src/lib/supabaseHelpers.ts e `/rest/v1/<tabela>`), buckets (`storage.from`), RPCs (`.rpc`) e
 * edges (`functions.invoke`, `invokeEdge`, `/functions/v1/<edge>`).
 */
export function extrairChamadas(texto) {
  const pegar = (re) => [...texto.matchAll(re)].map((m) => m[1]);
  const consts = constantesDeString(texto);
  const tabelas = [];
  const buckets = [];
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) (m[1] ? buckets : tabelas).push(m[2]);
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[2])) (m[1] ? buckets : tabelas).push(consts.get(m[2]));
  }
  // `fromTable('x')` / `fromTable(CONST)` — atalho tipado de src/lib/supabaseHelpers.ts, sempre tabela.
  for (const m of texto.matchAll(/\bfromTable\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) tabelas.push(m[1]);
  for (const m of texto.matchAll(/\bfromTable\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[1])) tabelas.push(consts.get(m[1]));
  }
  tabelas.push(...pegar(/\/rest\/v1\/([A-Za-z0-9_]+)/g).filter((t) => t !== 'rpc'));
  return {
    tabelas,
    buckets,
    // `.rpc('x')` e o apelido `const rpc = supabase.rpc.bind(...)` + `rpc('x')`.
    rpcs: [...pegar(/(?:\.|\b)rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g), ...pegar(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/g)],
    // `functions.invoke` (inclusive quebrado em linha) e o atalho `invokeEdge<T>(...)` de
    // src/lib/invokeEdge.ts; `invoke('evolution-api/connect')` conta como a edge `evolution-api`.
    edges: [
      ...pegar(/(?:functions\s*\.\s*invoke|\binvokeEdge)(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)(?:\/[^'"`]*)?['"`]/g),
      ...pegar(/['"`][^'"`\n]*\/functions\/v1\/([A-Za-z0-9_-]+)/g),
    ],
  };
}

const ehTeste = (p) => /(\.test\.|\.spec\.|__tests__|\.stories\.)/.test(p);

/**
 * Fecho de imports a partir do arquivo da tela. Segue sem limite a pasta da feature da tela,
 * src/hooks/, src/services/, src/lib/, src/features/ e src/utils/; componentes de OUTRA feature em
 * src/components/ entram ate MAX_SALTOS_FEATURE saltos. Fica de fora so o kit de UI
 * (src/components/ui/) e teste. Import local que nao resolve vira problema.
 */
// 3 no Loggi: pagina -> MainLayout -> Header -> RealtimeStatus (que invoca edge). Com 2 as edges
// chamadas pelo layout ficavam de fora; de 3 em diante o resultado nao muda mais (medido em 2026-11).
export const MAX_SALTOS_FEATURE = 3;
export function fechoDaTela(raiz, arquivoTelaAbs, lidos = null) {
  const pastaFeature = path.dirname(arquivoTelaAbs);
  const dentro = (abs, rel_) => abs.startsWith(path.join(raiz, rel_) + path.sep);
  const livre = (abs) => abs.startsWith(pastaFeature + path.sep) || ['src/hooks', 'src/services', 'src/lib', 'src/features', 'src/utils'].some((d) => dentro(abs, d));
  const outraFeature = (abs) => dentro(abs, 'src/components') && !dentro(abs, 'src/components/ui');
  const saltosVistos = new Map(); // arquivo -> menor numero de saltos com que foi visitado
  const hooks = new Map();
  const quebrados = new Set();
  const chamadas = { tabelas: [], buckets: [], rpcs: [], edges: [] };
  const fila = [[arquivoTelaAbs, 0]];
  while (fila.length) {
    const [atual, saltos] = fila.shift();
    if (saltosVistos.has(atual) && saltosVistos.get(atual) <= saltos) continue;
    const primeiraVez = !saltosVistos.has(atual);
    saltosVistos.set(atual, saltos);
    const texto = fs.readFileSync(atual, 'utf8');
    lidos?.add(atual);
    if (primeiraVez) {
      const c = extrairChamadas(texto);
      for (const k of Object.keys(chamadas)) chamadas[k].push(...c[k]);
    }
    for (const imp of extrairImports(texto)) {
      const alvo = resolverImport(raiz, atual, imp.especificador);
      if (alvo === undefined && !/\.(css|scss|svg|png|jpe?g|webp|gif|json)(\?.*)?$|\?/.test(imp.especificador)) {
        quebrados.add(`${rel(raiz, atual)} -> ${imp.especificador}`);
      }
      if (!alvo || ehTeste(alvo)) continue;
      for (const nome of imp.nomes) if (/^use[A-Z]/.test(nome) && !hooks.has(nome)) hooks.set(nome, rel(raiz, alvo));
      if (livre(alvo)) fila.push([alvo, saltos]);
      else if (outraFeature(alvo) && saltos < MAX_SALTOS_FEATURE) fila.push([alvo, saltos + 1]);
    }
  }
  return {
    arquivos_lidos: saltosVistos.size,
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => ordem(a.nome, b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

// Tira comentario de bloco (inclui o do JSX, entre chaves) e linha so de `//`: rota comentada nao e rota.
// O bloco so conta quando o `/*` vem depois de espaco ou de `{ ( ; ,`: o de `path="/docs/*"` nao abre comentario.
const semComentarios = (texto) => texto.replace(/(^|[\s{(;,])\/\*[\s\S]*?\*\//g, '$1').replace(/^[ \t]*\/\/.*$/gm, '');

/** Atributos de primeiro nivel de uma tag JSX: nome -> texto cru do valor (`true` se nao tem valor). */
function atributos(attrs) {
  const mapa = new Map();
  let i = 0;
  while (i < attrs.length) {
    const nome = /^[A-Za-z_][\w-]*/.exec(attrs.slice(i));
    if (!nome) {
      // `{...spread}` ou sobra: pula o bloco inteiro para nao ler atributo de dentro dele.
      i = attrs[i] === '{' ? fimDasChaves(attrs, i) + 1 : i + 1;
      continue;
    }
    i += nome[0].length;
    if (attrs[i] !== '=') { mapa.set(nome[0], true); continue; }
    i += 1;
    const abre = attrs[i];
    const fim = abre === '{' ? fimDasChaves(attrs, i) : attrs.indexOf(abre, i + 1);
    const ate = fim === -1 ? attrs.length : fim + 1;
    mapa.set(nome[0], attrs.slice(i, ate));
    i = ate;
  }
  return mapa;
}

/** Indice da `}` que fecha a `{` em `inicio` (ou o fim do texto, se nao fechar). */
function fimDasChaves(texto, inicio) {
  let nivel = 0;
  for (let i = inicio; i < texto.length; i += 1) {
    if (texto[i] === '{') nivel += 1;
    else if (texto[i] === '}') {
      nivel -= 1;
      if (nivel === 0) return i;
    }
  }
  return texto.length - 1;
}

/** Literal de um atributo (`"x"`, `'x'`, `{"x"}`, `{'x'}`); expressao volta crua, para nao sumir do inventario. */
function literal(valor) {
  if (typeof valor !== 'string') return null;
  const m = /^\{?\s*(["'`])([^"'`]*)\1\s*\}?$/.exec(valor);
  return m ? m[2] : valor;
}

/**
 * Tags <Route> de um JSX, em ordem, cada uma com os atributos da tag de abertura e o pai (rota
 * aninhada). Conta chaves e aspas para achar o fim da tag: o `/>` de `element={<Pagina />}` nao
 * fecha a <Route>.
 */
function tagsRoute(texto) {
  const tags = [];
  const pilha = [];
  const re = /<Route(?=[\s/>])|<\/Route\s*>/g;
  for (let m = re.exec(texto); m; m = re.exec(texto)) {
    if (m[0].startsWith('</')) { pilha.pop(); continue; }
    const inicio = m.index + m[0].length;
    let i = inicio;
    let aspas = null;
    for (; i < texto.length; i += 1) {
      const ch = texto[i];
      if (aspas) { if (ch === aspas) aspas = null; }
      else if (ch === '"' || ch === "'") aspas = ch;
      else if (ch === '{') i = fimDasChaves(texto, i);
      else if (ch === '>') break;
    }
    const fechada = texto[i - 1] === '/';
    const tag = { attrs: atributos(texto.slice(inicio, fechada ? i - 1 : i)), pai: pilha[pilha.length - 1] ?? null };
    tags.push(tag);
    if (!fechada) pilha.push(tag);
    re.lastIndex = i + 1;
  }
  return tags;
}

const ENVOLTORIOS = ['ProtectedRoute', 'Navigate', 'Route', 'Suspense', 'ErrorBoundary'];

/** URLs do react-router em src/App.tsx. */
export function lerUrls(raiz) {
  const texto = semComentarios(ler(raiz, ARQUIVO_ROTAS));
  const abs = path.join(raiz, ARQUIVO_ROTAS);
  const lazy = Object.fromEntries([...texto.matchAll(/const\s+(\w+)\s*=\s*lazy\w*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map((m) => [m[1], m[2]]));
  const estaticos = Object.fromEntries(extrairImports(texto).flatMap((imp) => imp.nomes.map((n) => [n, imp.especificador])));
  const inicio = texto.search(/<Routes[\s>]/);
  const fim = texto.lastIndexOf('</Routes>');
  if (inicio === -1 || fim === -1) throw new Error(`${ARQUIVO_ROTAS} nao tem <Routes>...</Routes>: as rotas mudaram de arquivo? Ajuste ARQUIVO_ROTAS.`);

  const resolvidas = new Map(); // tag -> { caminho, protegida, papeis } (heranca das rotas aninhadas)
  const urls = [];
  for (const tag of tagsRoute(texto.slice(inicio, fim))) {
    const pai = tag.pai ? resolvidas.get(tag.pai) : { caminho: '', protegida: false, papeis: [] };
    const proprio = literal(tag.attrs.get('path'));
    const conteudo = [tag.attrs.get('element'), tag.attrs.get('Component')].filter((v) => typeof v === 'string').join(' ');
    let caminho = pai.caminho;
    if (proprio !== null) {
      if (proprio.startsWith('/') || (pai.caminho === '' && proprio === '*')) caminho = proprio;
      else caminho = `${pai.caminho.replace(/\/$/, '')}/${proprio}`;
    }
    const papeisProprios = [
      ...(((conteudo.match(/requiredRoles=\{\[([^\]]*)\]\}/) || [])[1] || '').match(/['"]([^'"]+)['"]/g)?.map((s) => s.slice(1, -1)) ?? []),
      ...[...conteudo.matchAll(/requiredRole=\{?\s*["']([^"']+)["']/g)].map((m) => m[1]),
    ];
    const atual = {
      caminho,
      protegida: pai.protegida || conteudo.includes('<ProtectedRoute'),
      papeis: papeisProprios.length ? papeisProprios : pai.papeis,
    };
    resolvidas.set(tag, atual);
    if (proprio === null && !tag.attrs.has('index')) continue; // rota de layout, sem URL propria
    const nomes = [...conteudo.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]);
    if (tag.attrs.has('Component')) nomes.push(...(conteudo.match(/\{\s*([A-Z]\w*)\s*\}/) || []).slice(1));
    const componente = nomes.find((n) => lazy[n]) ?? nomes.find((n) => !ENVOLTORIOS.includes(n)) ?? null;
    const origem = componente ? (lazy[componente] ?? estaticos[componente]) : null;
    const alvo = origem ? resolverImport(raiz, abs, origem) : null;
    urls.push({
      caminho: atual.caminho || '/',
      componente,
      arquivo: alvo ? rel(raiz, alvo) : null,
      protegida: atual.protegida,
      papeis: atual.papeis,
      redireciona: (conteudo.match(/<Navigate\s+to=\{?\s*["']([^"']+)["']/) || [])[1] ?? null,
    });
  }
  if (urls.length === 0) throw new Error(`${ARQUIVO_ROTAS}: nenhuma <Route> com path dentro de <Routes>.`);
  return urls.sort((a, b) => ordem(a.caminho, b.caminho));
}

/** Itens `{ title, url }` do menu lateral: url -> [{ rotulo, secao (nome da lista), grupo (titulo da secao) }]. */
export function lerMenu(raiz) {
  const texto = semComentarios(ler(raiz, ARQUIVO_MENU));
  const listas = [...texto.matchAll(/const\s+(\w+)\s*(?::[^=]+)?=\s*\[/g)].map((m) => ({ nome: m[1], pos: m.index }));
  const grupos = [...texto.matchAll(/\btitle:\s*(["'`])((?:(?!\1).)+)\1\s*,\s*icon:\s*[\w.]+\s*,\s*items:/g)].map((m) => ({ titulo: m[2], pos: m.index }));
  const menu = {};
  for (const m of texto.matchAll(/\{[^{}]*\}/g)) {
    const url = (m[0].match(/\burl:\s*(["'`])((?:(?!\1).)+)\1/) || [])[2];
    const rotulo = (m[0].match(/\btitle:\s*(["'`])((?:(?!\1).)+)\1/) || [])[2];
    if (!url || !rotulo) continue;
    const lista = listas.filter((l) => l.pos < m.index).pop() ?? null;
    const grupo = grupos.filter((g) => g.pos < m.index && (!lista || g.pos > lista.pos)).pop()?.titulo ?? null;
    (menu[url] ??= []).push({ rotulo, secao: lista?.nome ?? null, grupo });
  }
  // Link fixo fora das listas (ex.: o rodape "Configuracoes"): `to="/x"` literal no proprio menu.
  for (const m of texto.matchAll(/\bto=\{?\s*(["'])(\/[^"']*)\1/g)) menu[m[2]] ??= [{ rotulo: null, secao: null, grupo: null }];
  if (Object.keys(menu).length === 0) throw new Error(`${ARQUIVO_MENU}: nenhum item { title, url } encontrado: o menu mudou de formato? Ajuste lerMenu.`);
  return menu;
}

/** A URL de um item de menu casa com o caminho da rota? (`:param` e `*` casam com qualquer trecho) */
export function casaRota(caminho, url) {
  if (caminho === url) return true;
  if (caminho === '*' || !/[:*]/.test(caminho)) return false; // o "*" solto e a pagina 404, nao destino de menu
  const re = caminho.split('/').map((s) => (s === '*' ? '.*' : s.startsWith(':') ? '[^/]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/');
  return new RegExp(`^${re}$`).test(url);
}

/** Arquivos .tsx de src/pages/ (sem teste), relativos a raiz. */
function listarPaginas(raiz, dir = path.join(raiz, PASTA_PAGINAS), acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listarPaginas(raiz, p, acc);
    else if (/\.(tsx|jsx)$/.test(entrada.name) && !ehTeste(p)) acc.push(rel(raiz, p));
  }
  return acc.sort(ordem);
}

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  const urls = lerUrls(raiz);
  const menu = lerMenu(raiz);
  const lidos = new Set();
  const telas = urls.filter((u) => u.arquivo).map((u) => ({
    id: u.caminho,
    componente: u.componente,
    arquivo: u.arquivo,
    menu: Object.keys(menu).filter((url) => casaRota(u.caminho, url)).sort(ordem).flatMap((url) => menu[url]),
    ...fechoDaTela(raiz, path.join(raiz, u.arquivo), lidos),
  })).sort((a, b) => ordem(a.id, b.id));

  const hooks = {};
  for (const t of telas) for (const h of t.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, telas: [] };
    hooks[h.nome].telas.push(t.id);
  }

  const paginas = listarPaginas(raiz);
  const alcancados = new Set([...lidos].map((abs) => rel(raiz, abs)));
  const problemas = [
    ...Object.keys(menu).filter((url) => !urls.some((u) => u.caminho !== '*' && casaRota(u.caminho, url))).sort(ordem)
      .map((url) => ({ tipo: 'menu_sem_rota', id: url, detalhe: `item "${menu[url][0].rotulo ?? url}" do menu aponta para URL sem <Route> em ${ARQUIVO_ROTAS} (cai na rota "*")` })),
    ...unico(urls.filter((u) => u.protegida && u.arquivo && !/[:*]/.test(u.caminho) && !Object.keys(menu).includes(u.caminho)).map((u) => u.caminho))
      .map((caminho) => ({ tipo: 'rota_sem_menu', id: caminho, detalhe: `sem item em ${ARQUIVO_MENU}: so se chega por link direto` })),
    ...urls.filter((u) => !u.arquivo && !u.redireciona).map((u) => ({ tipo: 'url_sem_arquivo', id: u.caminho, detalhe: `${u.componente ?? 'elemento'} nao resolve para um arquivo a partir de ${ARQUIVO_ROTAS}` })),
    ...paginas.filter((p) => !alcancados.has(p)).map((p) => ({ tipo: 'pagina_sem_rota', id: p, detalhe: `arquivo em ${PASTA_PAGINAS}/ que nenhuma rota importa (direto ou por outra pagina)` })),
    ...telas.flatMap((t) => t.imports_quebrados.map((q) => ({ tipo: 'import_quebrado', id: t.id, detalhe: q }))),
  ];

  return {
    format_version: 1,
    fonte: `scripts/inventario/gerar-rotas.mjs (le ${ARQUIVO_ROTAS}, ${ARQUIVO_MENU} e os imports de cada pagina)`,
    resumo: {
      urls: urls.length,
      telas: telas.length,
      itens_de_menu: Object.values(menu).reduce((n, itens) => n + itens.length, 0),
      hooks_distintos: Object.keys(hooks).length,
      arquivos_em_pages: paginas.length,
      problemas: problemas.length,
    },
    urls,
    telas,
    hooks: Object.fromEntries(Object.keys(hooks).sort().map((k) => [k, { arquivo: hooks[k].arquivo, telas: unico(hooks[k].telas) }])),
    problemas,
  };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

const AJUDA = `Uso: node scripts/inventario/gerar-rotas.mjs [--check]
  (sem argumento)  grava ${SAIDA_REL}
  --check          exit 1 se ${SAIDA_REL} esta desatualizado (nao grava)
  -h, --help       esta ajuda`;

function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) { console.log(AJUDA); return; }
  const estranho = argv.find((a) => a !== '--check');
  if (estranho !== undefined) throw new Error(`argumento desconhecido: ${estranho}\n${AJUDA}`);
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarRotas(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-rotas.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.urls} URLs, ${r.telas} telas, ${r.itens_de_menu} itens de menu, ${r.hooks_distintos} hooks, ${r.problemas} problemas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (erro) {
    // ENOENT aqui e arquivo de rotas/menu que mudou de lugar: falha fechada, nunca "pulei".
    console.error(`ERRO: ${erro.code === 'ENOENT' ? `arquivo esperado nao existe: ${erro.path}` : erro.message}`);
    process.exit(2);
  }
}
