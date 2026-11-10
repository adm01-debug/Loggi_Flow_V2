#!/usr/bin/env node
/**
 * Inventario do banco oficial -> inventario/estado/banco.json (fonte de consulta dos agentes).
 *
 * Tudo sai de comando: o SQL de leitura `scripts/inventario/banco.sql`, a lista de edge
 * functions publicadas e o uso de cada tabela no codigo (`.from('tabela')` em src/ e
 * supabase/functions/). Nada escrito a mao. Mesmo padrao do Promo_Gifts_V4.
 *
 * Dois jeitos de rodar:
 *   1) Com token (CI semanal / maquina com acesso):
 *        SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs
 *      Le pela Management API: POST /database/query/read-only (transacao so leitura) e
 *      GET /functions. Projeto fixo: jvfhclubfpxrtrrazrgr (SUPABASE_PROJECT_REF so troca
 *      para teste; qualquer outro valor exige INVENTARIO_PERMITIR_OUTRO_PROJETO=1).
 *   2) Sessao de agente sem token: rodar banco.sql no MCP oficial
 *      (SUPABASE LOGGI FLOW V2 - MCP, db_query), salvar a resposta num arquivo e
 *        node scripts/inventario/gerar-banco.mjs --entrada /caminho/resposta.json
 *      Aceita a resposta crua do MCP ({"rows":[{"inventario":{...}}]}) ou o objeto direto.
 *      Sem token, as edges publicadas ficam de fora (`edge_functions.publicadas: null`); para
 *      inclui-las, salve a resposta de GET /functions e passe `--functions /caminho/functions.json`.
 *
 * Antes de gravar, confere que a resposta e do banco oficial (tabelas x supabase/schema-manifest.json
 * ou, sem ele, src/integrations/supabase/types.ts; ledger x supabase/migrations/) e recusa saida
 * com cara de credencial (Bearer, JWT, sb_secret_).
 * Rede: timeout de INVENTARIO_API_TIMEOUT_MS (padrao 120000) por chamada; HTTP 429/5xx e queda de
 * conexao sao repetidos ate 3 tentativas (espera base INVENTARIO_API_ESPERA_MS, padrao 2000).
 * Exit: 0 = gravado; 2 = entrada invalida, consulta falhou ou saida com credencial (nada e gravado).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SQL_PATH = path.join(RAIZ, 'scripts/inventario/banco.sql');
const SAIDA = path.join(RAIZ, 'inventario/estado/banco.json');
const PASTAS_CODIGO = ['src', 'supabase/functions'];
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs)$/;
export const PROJETO_OFICIAL = 'jvfhclubfpxrtrrazrgr';
const API_OFICIAL = 'https://api.supabase.com';
const TENTATIVAS = 3;
const STATUS_REPETIVEL = new Set([429, 500, 502, 503, 504]);

// SUPABASE_API_URL so existe para o teste apontar um servidor local: qualquer outro host e
// recusado, para o token nunca ser enviado a um endereco que nao seja a API oficial.
function baseDaApi() {
  const bruta = (process.env.SUPABASE_API_URL || API_OFICIAL).trim().replace(/\/$/, '');
  if (bruta !== API_OFICIAL) {
    let host;
    try { host = new URL(bruta).hostname; } catch { throw new Error('SUPABASE_API_URL nao e uma URL valida.'); }
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) {
      throw new Error(`SUPABASE_API_URL aponta para ${host}: so a API oficial ou um servidor local de teste (127.0.0.1) recebem o token.`);
    }
  }
  return `${bruta}/v1/projects`;
}

// Limiares dos alertas: o que um agente precisa saber antes de mexer no sistema.
export const LIMIARES = {
  taxaFalhaCronPct: 5,
  historicoCronMaisDe7Dias: 50000,
};

/** Algo com cara de credencial no texto? (mesma regra do Promo_Gifts_V4) */
export const PARECE_CREDENCIAL = /Bearer\s+[A-Za-z0-9._-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_/;

/** Extrai o objeto do inventario da Management API, do MCP (resposta ou envelope tools/call) ou do objeto direto. */
export function extrairInventario(bruto) {
  let dado = bruto;
  if (typeof bruto === 'string') {
    if (!bruto.trim()) throw new Error('entrada vazia: a consulta do banco.sql nao devolveu nada (erro no psql/MCP?).');
    try { dado = JSON.parse(bruto.trim()); } catch (erro) { throw new Error(`entrada nao e JSON valido (${erro.message}).`); }
  }
  // Envelope cru de tools/call do MCP: { result: { content: [{ type: 'text', text: '<json>' }] } }.
  const conteudo = dado?.result?.content ?? dado?.content;
  if (Array.isArray(conteudo) && typeof conteudo[0]?.text === 'string') dado = JSON.parse(conteudo[0].text);
  if (dado && Array.isArray(dado.rows)) dado = dado.rows[0];
  if (Array.isArray(dado)) dado = dado[0];
  if (dado && dado.inventario) dado = dado.inventario;
  if (typeof dado === 'string') dado = JSON.parse(dado);
  const faltando = ['format_version', 'medido_em', 'resumo', 'tabelas', 'cron']
    .filter((chave) => !(dado && chave in dado));
  if (faltando.length) throw new Error(`entrada sem as chaves: ${faltando.join(', ')}`);
  if (dado.format_version !== 1) throw new Error(`format_version ${dado.format_version} desconhecido (esperado 1)`);
  if (!Array.isArray(dado.tabelas) || dado.tabelas.length === 0) throw new Error('entrada sem tabelas');
  const { cron } = dado;
  if (!Array.isArray(cron?.jobs) || !Array.isArray(cron.horas_paradas_7d) || !cron.historico || typeof cron.historico !== 'object') {
    throw new Error('entrada com `cron` incompleto (jobs, horas_paradas_7d, historico); rode o banco.sql atual.');
  }
  return dado;
}

function listarArquivos(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
    const p = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listarArquivos(p, acc);
    else if (EXTENSOES.test(entrada.name)) acc.push(p);
  }
  return acc;
}

/**
 * Uso de cada tabela no codigo de producao (testes fora): `.from('tabela')` do cliente
 * Supabase (sem `storage.from`, que e bucket) e acesso direto ao PostgREST `/rest/v1/tabela`.
 * Limite conhecido: `.from(variavel)` nao e resolvido.
 */
export function contarUsoNoCodigo(raiz, nomes) {
  const uso = Object.fromEntries(nomes.map((n) => [n, { src: 0, edges: 0 }]));
  const reFrom = /(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_]+)['"`]/g;
  const reRest = /\/rest\/v1\/([A-Za-z0-9_]+)/g;
  for (const pasta of PASTAS_CODIGO) {
    const chave = pasta === 'src' ? 'src' : 'edges';
    for (const arquivo of listarArquivos(path.join(raiz, pasta))) {
      if (/(\.test\.|\.spec\.|__tests__)/.test(arquivo)) continue;
      const texto = fs.readFileSync(arquivo, 'utf8');
      for (const m of texto.matchAll(reFrom)) if (!m[1] && uso[m[2]]) uso[m[2]][chave] += 1;
      for (const m of texto.matchAll(reRest)) if (m[1] !== 'rpc' && uso[m[1]]) uso[m[1]][chave] += 1;
    }
  }
  return uso;
}

/**
 * A resposta e mesmo do banco oficial? Confere contra supabase/schema-manifest.json (foto da
 * producao mantida pelo types-sync) ou, enquanto ele nao existe no repo, contra as tabelas de
 * src/integrations/supabase/types.ts - fontes independentes do arquivo de entrada: pelo menos 90%
 * das tabelas da referencia tem de estar na resposta, e vice-versa. Particao fica fora da conta dos
 * dois lados (nasce e morre todo mes pelo cron, sem ninguem regerar a referencia). Com `versoesRepo` (versoes dos
 * .sql de supabase/migrations/) confere tambem o ledger: um banco irmao com quase as mesmas tabelas
 * passa no criterio das tabelas, mas nao tem as migrations recentes.
 */
export const LEDGER_TOLERANCIA = { versoesRecentes: 20, registrosPct: 10 };
export function conferirOrigem(dado, tabelasManifesto, versoesRepo = null, fonte = 'o manifesto') {
  const maes = [...new Set(dado.tabelas.map((t) => t.particao_de).filter(Boolean))];
  const ehParticao = (nome) => maes.some((mae) => nome.startsWith(`${mae}_`));
  const resposta = new Set(dado.tabelas.filter((t) => !t.particao_de).map((t) => t.nome));
  const manifesto = new Set(tabelasManifesto.filter((nome) => !ehParticao(nome)));
  const comuns = [...manifesto].filter((t) => resposta.has(t)).length;
  const cobreManifesto = manifesto.size ? comuns / manifesto.size : 0;
  const cobreResposta = resposta.size ? comuns / resposta.size : 0;
  if (cobreManifesto < 0.9 || cobreResposta < 0.9) {
    throw new Error(`a resposta nao parece ser do banco oficial: ${comuns} tabelas em comum com ${fonte} `
      + `(${Math.round(cobreManifesto * 100)}% da referencia, ${Math.round(cobreResposta * 100)}% da resposta). `
      + 'Confira se o MCP usado e o SUPABASE LOGGI FLOW V2 - MCP.');
  }
  const origem = { tabelas_em_comum_com_manifesto: comuns, tabelas_no_manifesto: manifesto.size };
  if (!versoesRepo?.length) return origem;
  const { ledger_versao_max: max, ledger_registros: registros } = dado.resumo ?? {};
  if (!max || !Number.isFinite(registros)) {
    throw new Error('a resposta nao traz resumo.ledger_versao_max/ledger_registros; rode o banco.sql atual.');
  }
  const recentes = [...versoesRepo].sort().reverse();
  const limite = recentes[Math.min(LEDGER_TOLERANCIA.versoesRecentes, recentes.length) - 1];
  const difPct = Math.abs(registros - versoesRepo.length) * 100 / versoesRepo.length;
  if (String(max) < limite || difPct > LEDGER_TOLERANCIA.registrosPct) {
    throw new Error(`a resposta nao parece ser do banco oficial: ledger com ${registros} registros e maior versao ${max}; `
      + `o repo tem ${versoesRepo.length} migrations e a ${LEDGER_TOLERANCIA.versoesRecentes}a mais recente e ${limite}. `
      + 'Confira se o MCP usado e o SUPABASE LOGGI FLOW V2 - MCP.');
  }
  return { ...origem, ledger_registros: registros, migrations_no_repo: versoesRepo.length };
}

/** Versoes (prefixo numerico) dos .sql de supabase/migrations/ (sem _foreign/ e _superseded/). */
export const versoesDoRepo = (raiz) => fs.readdirSync(path.join(raiz, 'supabase/migrations'))
  .filter((f) => /^\d+_.*\.sql$/.test(f)).map((f) => f.split('_')[0]);

/**
 * Tabelas do public segundo o repo: o manifesto do types-sync quando existe; senao o `Tables` do
 * schema public em src/integrations/supabase/types.ts (gerado do banco oficial). Sem nenhum dos dois
 * nao ha como conferir a origem, e o inventario nao e gravado.
 */
export function tabelasDeReferencia(raiz) {
  const manifesto = path.join(raiz, 'supabase/schema-manifest.json');
  if (fs.existsSync(manifesto)) {
    const nomes = Object.keys(JSON.parse(fs.readFileSync(manifesto, 'utf8')).rls ?? {})
      .map((k) => k.replace(/^"(.*)"$/, '$1').replace(/""/g, '"')); // chave vem de format('%I')
    return { fonte: 'supabase/schema-manifest.json', tabelas: nomes };
  }
  const types = path.join(raiz, 'src/integrations/supabase/types.ts');
  if (fs.existsSync(types)) {
    const linhas = fs.readFileSync(types, 'utf8').split(/\r?\n/);
    const iPublic = linhas.findIndex((l) => /^\s*public: \{\s*$/.test(l));
    const iTables = iPublic === -1 ? -1 : linhas.findIndex((l, i) => i > iPublic && /^\s*Tables: \{\s*$/.test(l));
    const nomes = [];
    if (iTables !== -1) {
      // Tabela = chave um nivel abaixo de `Tables: {`; o bloco acaba na `}` com o recuo do proprio Tables.
      const recuo = linhas[iTables].match(/^\s*/)[0].length;
      const reTabela = new RegExp(`^\\s{${recuo + 2}}(?:"([^"]+)"|([A-Za-z_$][\\w$]*)): \\{\\s*$`);
      const reFim = new RegExp(`^\\s{0,${recuo}}\\}`);
      for (let i = iTables + 1; i < linhas.length && !reFim.test(linhas[i]); i += 1) {
        const m = reTabela.exec(linhas[i]);
        if (m) nomes.push(m[1] ?? m[2]);
      }
    }
    if (nomes.length > 0) return { fonte: 'src/integrations/supabase/types.ts', tabelas: nomes };
  }
  throw new Error('sem referencia para conferir a origem: nem supabase/schema-manifest.json nem as tabelas '
    + 'de src/integrations/supabase/types.ts foram encontradas.');
}

/** Edge functions do repo (pastas com index.ts, sem _shared). */
export function edgesNoRepo(raiz) {
  const dir = path.join(raiz, 'supabase/functions');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(dir, d.name, 'index.ts')))
    .map((d) => d.name).sort();
}

/** Edges publicadas (resposta de GET /functions) x repo. `publicadas` null = nao consultado. */
export function compararEdges(publicadasApi, noRepo) {
  if (!publicadasApi) return { publicadas: null, no_repo: noRepo.length, publicadas_sem_codigo_no_repo: null, no_repo_sem_deploy: null };
  if (!Array.isArray(publicadasApi) || publicadasApi.some((f) => typeof f?.slug !== 'string')) {
    throw new Error('lista de edge functions invalida: esperado o array de GET /functions (cada item com `slug`).');
  }
  const publicadas = publicadasApi.map((f) => ({
    slug: f.slug,
    versao: f.version,
    status: f.status,
    verify_jwt: f.verify_jwt,
    atualizada_em: Number.isFinite(new Date(f.updated_at ?? NaN).getTime()) ? new Date(f.updated_at).toISOString().slice(0, 16) + 'Z' : null,
  })).sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)); // sem localeCompare: ordem igual em qualquer locale
  const slugs = new Set(publicadas.map((f) => f.slug));
  return {
    publicadas,
    no_repo: noRepo.length,
    publicadas_sem_codigo_no_repo: [...slugs].filter((s) => !noRepo.includes(s)).sort(),
    no_repo_sem_deploy: noRepo.filter((s) => !slugs.has(s)),
  };
}

/** Ordena chaves recursivamente: o diff entre execucoes fica so no que mudou. */
function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, ordenar(valor[k])]));
  }
  return valor;
}

/**
 * A agenda do pg_cron roda ao menos uma vez por dia? 'N seconds', ou dia do mes, mes e dia da semana
 * cobrindo tudo: `*`, `*\/1` ou a faixa inteira (1-31, 1-12, 0-6/0-7).
 */
const CAMPO_TODO = [/^(\*|\*\/1|1-31)$/, /^(\*|\*\/1|1-12)$/, /^(\*|\*\/1|0-6|0-7|1-7)$/];
export function rodaTodoDia(agenda) {
  const a = String(agenda ?? '').trim();
  if (/^\d+\s+seconds?$/i.test(a)) return true;
  const campos = a.split(/\s+/);
  return campos.length === 5 && CAMPO_TODO.every((re, i) => re.test(campos[i + 2]));
}

/** Junta banco + codigo + edges e calcula orfas e alertas. Funcao pura (testada em gerar-banco.unit.mjs). */
export function montarInventario(dado, uso, edges = compararEdges(null, [])) {
  const tabelas = dado.tabelas.map((t) => ({ ...t, uso_no_codigo: uso[t.nome] ?? { src: 0, edges: 0 } }));
  // Particao nao e orfa: ninguem faz .from('audit_logs_y2027m01'), e a do mes que vem nasce vazia.
  const orfas = tabelas
    .filter((t) => !t.particao_de && t.linhas === 0 && !t.citada_no_banco && t.uso_no_codigo.src + t.uso_no_codigo.edges === 0)
    .map((t) => t.nome);

  const alertas = [];
  const semRls = tabelas.filter((t) => !t.rls).map((t) => t.nome);
  if (semRls.length) alertas.push({ tipo: 'tabela_sem_rls', detalhe: semRls });
  // RLS ligado sem nenhuma policy nega tudo pra authenticated/anon (service_role sempre passa por
  // cima, rolbypassrls). Pode ser de proposito (tabela so-interna), mas hoje fica invisivel: nem
  // tabela_sem_rls (tem RLS) nem nenhum outro alerta aponta.
  const rlsSemPolicy = tabelas.filter((t) => t.rls && t.policies === 0).map((t) => t.nome);
  if (rlsSemPolicy.length) alertas.push({ tipo: 'rls_sem_policy', detalhe: rlsSemPolicy });
  const cronRuim = dado.cron.jobs
    .filter((j) => j.ativo && j.taxa_falha_7d_pct >= LIMIARES.taxaFalhaCronPct)
    .map((j) => `${j.nome} (${j.taxa_falha_7d_pct}% em 7d)`);
  if (cronRuim.length) alertas.push({ tipo: 'cron_falhando', detalhe: cronRuim });
  const mudos = dado.cron.jobs.filter((j) => j.ativo && j.execucoes_24h === 0 && rodaTodoDia(j.agenda)).map((j) => j.nome);
  if (mudos.length) alertas.push({ tipo: 'cron_sem_execucao', detalhe: mudos });
  if (dado.cron.horas_paradas_7d.length) {
    alertas.push({ tipo: 'cron_parado', detalhe: dado.cron.horas_paradas_7d.map((h) => h.hora) });
  }
  if (dado.cron.historico.mais_de_7_dias > LIMIARES.historicoCronMaisDe7Dias) {
    alertas.push({ tipo: 'historico_cron_sem_limpeza', detalhe: [`${dado.cron.historico.mais_de_7_dias} linhas com mais de 7 dias`] });
  }
  if (edges.no_repo_sem_deploy?.length) alertas.push({ tipo: 'edge_sem_deploy', detalhe: edges.no_repo_sem_deploy });
  if (edges.publicadas_sem_codigo_no_repo?.length) {
    alertas.push({ tipo: 'edge_publicada_sem_codigo', detalhe: edges.publicadas_sem_codigo_no_repo });
  }

  return ordenar({
    ...dado,
    fonte: 'scripts/inventario/banco.sql + GET /functions + .from() em src/ e supabase/functions/ (scripts/inventario/gerar-banco.mjs)',
    tabelas,
    tabelas_orfas: {
      criterio: '0 linhas + nao citada em funcao/view do banco + nenhum .from() em src/ ou supabase/functions/ (particao nao conta)',
      lista: orfas,
    },
    edge_functions: edges,
    alertas,
  });
}

function projeto() {
  const ref = (process.env.SUPABASE_PROJECT_REF || PROJETO_OFICIAL).trim();
  if (ref !== PROJETO_OFICIAL && process.env.INVENTARIO_PERMITIR_OUTRO_PROJETO !== '1') {
    throw new Error(`SUPABASE_PROJECT_REF=${ref} nao e o banco oficial (${PROJETO_OFICIAL}).`);
  }
  return ref;
}

const DICA_HTTP = {
  401: 'token recusado: confira/renove o SUPABASE_ACCESS_TOKEN',
  403: 'token sem acesso a este projeto',
  404: 'projeto ou rota nao encontrados: confira o project ref',
};

const esperar = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
const numeroDoEnv = (nome, padrao) => {
  const n = Number(process.env[nome]);
  return process.env[nome]?.trim() && Number.isFinite(n) && n >= 0 ? n : padrao;
};

async function chamarApi(caminho, init = {}) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const url = `${baseDaApi()}/${encodeURIComponent(projeto())}${caminho}`;
  const timeoutMs = numeroDoEnv('INVENTARIO_API_TIMEOUT_MS', 120_000) || 120_000;
  const esperaMs = numeroDoEnv('INVENTARIO_API_ESPERA_MS', 2_000);
  for (let tentativa = 1; ; tentativa += 1) {
    let res;
    try {
      res = await fetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (erro) {
      if (erro.name === 'TimeoutError' || erro.name === 'AbortError') {
        throw new Error(`Management API ${caminho} nao respondeu em ${timeoutMs} ms (timeout).`);
      }
      // Erro de rede (DNS, conexao recusada/derrubada): repete; a mensagem do fetch ("fetch failed") nao diz nada.
      if (tentativa < TENTATIVAS) { await esperar(esperaMs * tentativa); continue; }
      const causa = erro.cause?.code ?? erro.cause?.message ?? erro.message;
      throw new Error(`Management API ${caminho} inacessivel apos ${TENTATIVAS} tentativas (${causa}).`);
    }
    if (STATUS_REPETIVEL.has(res.status) && tentativa < TENTATIVAS) { await esperar(esperaMs * tentativa); continue; }
    // Nunca repassa o corpo do erro: pode ecoar cabecalho ou parte da consulta.
    if (!res.ok) {
      const dica = DICA_HTTP[res.status] ?? (STATUS_REPETIVEL.has(res.status) ? `apos ${TENTATIVAS} tentativas` : null);
      const erro = new Error(`Management API ${caminho} respondeu HTTP ${res.status}${dica ? ` (${dica})` : ''}`);
      erro.status = res.status;
      throw erro;
    }
    try {
      return await res.json();
    } catch {
      throw new Error(`Management API ${caminho} respondeu HTTP ${res.status} com corpo que nao e JSON.`);
    }
  }
}

const consultar = (query) => chamarApi('/database/query/read-only', { method: 'POST', body: JSON.stringify({ query }) });

/** O banco.sql falhou (HTTP 400): diz o que falta no banco, sem nunca repassar o corpo do erro. */
async function diagnosticarConsulta() {
  try {
    const linhas = await consultar("SELECT to_regclass('cron.job') IS NOT NULL AS \"cron.job\", "
      + "to_regclass('cron.job_run_details') IS NOT NULL AS \"cron.job_run_details\", "
      + "to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS \"supabase_migrations.schema_migrations\"");
    const faltando = Object.entries(linhas?.[0] ?? {}).filter(([, existe]) => existe === false).map(([nome]) => nome);
    return faltando.length
      ? `o banco nao tem ${faltando.join(', ')} (pg_cron/ledger ausentes: nao e o banco oficial?)`
      : 'os objetos que o banco.sql le existem; rode scripts/inventario/banco.sql no SQL Editor para ver o erro';
  } catch {
    return 'nem a consulta de diagnostico passou; rode scripts/inventario/banco.sql no SQL Editor para ver o erro';
  }
}

const AJUDA = `Uso:
  SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs
      le o banco oficial pela Management API (somente leitura) e grava inventario/estado/banco.json
  node scripts/inventario/gerar-banco.mjs --entrada <resposta.json> [--functions <functions.json>]
      usa a resposta do scripts/inventario/banco.sql salva em arquivo (MCP oficial ou psql -At)
  -h, --help   esta ajuda
Exit: 0 = gravado; 2 = entrada invalida, consulta falhou ou saida com credencial.`;

function lerArgs(argv) {
  const args = { entrada: null, functions: null, ajuda: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.ajuda = true;
    else if (a === '--entrada' || a === '--functions') {
      const valor = argv[i + 1];
      if (!valor || valor.startsWith('--')) {
        throw new Error(a === '--entrada'
          ? '--entrada exige o caminho do arquivo com a resposta do banco.sql'
          : '--functions exige o caminho do arquivo com a resposta de GET /functions');
      }
      args[a.slice(2)] = valor;
      i += 1;
    } else throw new Error(`argumento desconhecido: ${a} (veja --help)`);
  }
  if (args.functions && !args.entrada) throw new Error('--functions so vale junto de --entrada (com token as edges vem da API).');
  return args;
}

async function main(argv) {
  const args = lerArgs(argv);
  if (args.ajuda) { console.log(AJUDA); return; }
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  let bruto;
  let publicadasApi = null;
  if (args.entrada) {
    bruto = fs.readFileSync(args.entrada, 'utf8');
    if (args.functions) {
      try { publicadasApi = JSON.parse(fs.readFileSync(args.functions, 'utf8')); } catch (erro) { throw new Error(`--functions: ${erro.message}`); }
    }
  } else {
    if (!token) throw new Error('sem --entrada e sem SUPABASE_ACCESS_TOKEN: nada para ler (veja o cabecalho do script).');
    try {
      bruto = await consultar(fs.readFileSync(SQL_PATH, 'utf8'));
    } catch (erro) {
      if (erro.status !== 400) throw erro;
      throw new Error(`${erro.message}: ${await diagnosticarConsulta()}.`);
    }
  }
  if (!publicadasApi && token) publicadasApi = await chamarApi('/functions');

  const dado = extrairInventario(bruto);
  const referencia = tabelasDeReferencia(RAIZ);
  conferirOrigem(dado, referencia.tabelas, versoesDoRepo(RAIZ), referencia.fonte);
  const uso = contarUsoNoCodigo(RAIZ, dado.tabelas.map((t) => t.nome));
  const inventario = montarInventario(dado, uso, compararEdges(publicadasApi, edgesNoRepo(RAIZ)));
  const texto = JSON.stringify(inventario, null, 2) + '\n';
  if (PARECE_CREDENCIAL.test(texto)) {
    throw new Error('a saida tem algo com cara de credencial; nada foi gravado. Revise banco.sql.');
  }
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, texto);
  const ed = inventario.edge_functions;
  console.log(`banco.json: ${inventario.tabelas.length} tabelas, ${inventario.cron.jobs.length} cron jobs, `
    + `${inventario.tabelas_orfas.lista.length} orfas, ${inventario.alertas.length} alertas, `
    + `edges ${ed.publicadas ? `${ed.publicadas.length} publicadas/${ed.no_repo} no repo` : `${ed.no_repo} no repo (publicadas nao consultadas)`} `
    + `(medido_em ${inventario.medido_em}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`ERRO: ${error.message}`);
    process.exit(2);
  });
}
