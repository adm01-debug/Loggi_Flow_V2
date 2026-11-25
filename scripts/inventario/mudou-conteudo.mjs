#!/usr/bin/env node
/**
 * O inventario mudou de verdade? Compara cada arquivo de inventario/estado/ com a versao do
 * HEAD depois de tirar so os carimbos de data (`medido_em`, `gerado_em`, em qualquer nivel).
 * Imprime `true` ou `false` (usado pelo inventario-estado-semanal.yml para decidir se abre PR).
 *
 * Uso: node scripts/inventario/mudou-conteudo.mjs [arquivo...]   (padrao: banco, rotas e edges)
 * Os arquivos padrao sao os da raiz do repo, de qualquer cwd; argumento relativo vale a partir do cwd.
 * Exit: 0 = imprimiu true/false; 2 = nao da para decidir (sem git, fora de repositorio, .json gerado
 * vazio/truncado) - nada sai no stdout, entao o passo da CI falha em vez de abrir PR no escuro.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const PADRAO = ['inventario/estado/banco.json', 'inventario/estado/rotas.json', 'inventario/estado/edges.json', 'inventario/estado/contagens.json'];
// `coletado_em` (etapa 257) e a data da coleta: muda todo dia, sozinha, e nao e conteudo novo.
const CARIMBOS = new Set(['medido_em', 'gerado_em', 'coletado_em']);
// Telemetria viva do cron/WhatsApp: muda quase toda semana so pela janela rolante de 7 dias, sem
// mudanca estrutural nenhuma. Fora desses nomes, nada muda: a lista de alertas, tabelas_orfas e o
// resto de `banco.json`/`rotas.json` continuam comparados normalmente.
const TELEMETRIA = new Set([
  'execucoes_24h', 'falhas_24h', 'execucoes_7d', 'falhas_7d', 'taxa_falha_7d_pct',
  'startup_timeout_7d', 'ultima_falha', 'duracao_max_s_7d', 'horas_paradas_7d',
  'mais_antigo', 'mais_de_7_dias', 'mensagens_7d', 'ultimo_health_check', 'atualizada_em',
]);
const IGNORADOS = new Set([...CARIMBOS, ...TELEMETRIA]);
// `historico.linhas`/`historico.bytes` tambem rolam todo dia com a retencao de 7 dias, mas o
// nome `linhas`/`bytes` e compartilhado com cada tabela em `tabelas[]`, onde a contagem real
// importa. So ignora dentro de `cron.historico`.
function limparHistoricoCron(historico) {
  if (!historico || typeof historico !== 'object') return historico;
  const { linhas, bytes, ...resto } = historico;
  return resto;
}

// A telemetria tambem vaza pro TEXTO de alertas[].detalhe, que a lista IGNORADOS (por nome de
// campo) nao alcanca. `cron_falhando` grava "nome (9.0% em 7d)" — a porcentagem rola toda semana
// mesmo sem o job sair da lista; `cron_parado` grava a lista de horas de `horas_paradas_7d`, que
// ja ignoramos na raiz pelo mesmo motivo. So normaliza o TEXTO; se um job entra ou sai da lista
// (`cron_falhando`) ou o alerta `cron_parado` aparece/desaparece, a mudanca de verdade continua
// sendo pega.
const PORCENTAGEM_7D = /\s*\([\d.]+%\s*em\s*7d\)\s*$/;
function normalizarAlerta(a) {
  if (!a || typeof a !== 'object' || !('tipo' in a) || !Array.isArray(a.detalhe)) return a;
  if (a.tipo === 'cron_falhando') {
    return { ...a, detalhe: a.detalhe.map((d) => (typeof d === 'string' ? d.replace(PORCENTAGEM_7D, '') : d)) };
  }
  if (a.tipo === 'cron_parado' || a.tipo === 'historico_cron_sem_limpeza') return { ...a, detalhe: [] };
  return a;
}

/** JSON canonico sem os carimbos de data e sem a telemetria viva. Texto que nao e JSON volta como esta. */
export function semCarimbos(texto) {
  if (texto === null) return null;
  let dado;
  try { dado = JSON.parse(texto); } catch { return texto; }
  const limpar = (v, chave) => {
    if (Array.isArray(v)) return v.map((x) => limpar(chave === 'alertas' ? normalizarAlerta(x) : x));
    if (v && typeof v === 'object') {
      const base = chave === 'historico' ? limparHistoricoCron(v) : v;
      return Object.fromEntries(
        Object.keys(base).filter((k) => !IGNORADOS.has(k)).sort().map((k) => [k, limpar(base[k], k)]),
      );
    }
    return v;
  };
  return JSON.stringify(limpar(dado));
}

/** true se algum arquivo mudou alem dos carimbos (arquivo novo ou apagado conta). */
export function mudou(arquivos, lerAntes, lerDepois) {
  return arquivos.some((f) => semCarimbos(lerAntes(f)) !== semCarimbos(lerDepois(f)));
}

/** Texto do arquivo; binario (UTF-8 invalido) vira base64, para dois binarios diferentes nunca empatarem. */
const comoTexto = (buf) => {
  const texto = buf.toString('utf8');
  return Buffer.from(texto, 'utf8').equals(buf) ? texto : `base64:${buf.toString('base64')}`;
};

// maxBuffer: o padrao (1 MB) estourava em inventario grande e a versao do HEAD virava "arquivo novo".
const git = (args) => execFileSync('git', args, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1024 ** 3 });

function cli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Uso: node scripts/inventario/mudou-conteudo.mjs [arquivo...]\n'
      + `Imprime true se algum arquivo mudou alem dos carimbos de data em relacao ao HEAD (padrao: ${PADRAO.join(', ')}).`);
    return;
  }
  const arquivos = argv.length > 0 ? argv.map((f) => path.resolve(f)) : PADRAO.map((f) => path.join(RAIZ, f));
  try {
    git(['rev-parse', '--is-inside-work-tree']);
  } catch (erro) {
    const motivo = String(erro.stderr ?? '').trim().split('\n')[0];
    throw new Error(erro.code === 'ENOENT'
      ? 'git nao encontrado no PATH: sem o HEAD nao da para saber se o inventario mudou.'
      : `git nao leu o repositorio em ${RAIZ}${motivo ? ` (${motivo})` : ''}: sem o HEAD nao da para saber se o inventario mudou.`);
  }
  const lerAntes = (abs) => {
    const relativo = path.relative(RAIZ, abs).split(path.sep).join('/');
    if (relativo.startsWith('../') || path.isAbsolute(relativo)) return null; // fora do repo: nunca esteve no HEAD
    let blob;
    try {
      // --verify --quiet sai 1 calado quando o caminho nao existe no HEAD (ou o repo ainda nao tem commit).
      blob = git(['rev-parse', '--verify', '--quiet', `HEAD:./${relativo}`]).toString().trim();
    } catch (erro) {
      if (erro.status === 1) return null;
      throw erro;
    }
    return comoTexto(git(['cat-file', 'blob', blob]));
  };
  const lerDepois = (abs) => {
    if (!fs.existsSync(abs)) return null;
    const texto = comoTexto(fs.readFileSync(abs));
    if (abs.endsWith('.json')) {
      try { JSON.parse(texto); } catch {
        throw new Error(`${path.relative(RAIZ, abs)} nao e JSON valido (vazio ou truncado?): o gerador falhou, nada a comparar.`);
      }
    }
    return texto;
  };
  console.log(String(mudou(arquivos, lerAntes, lerDepois)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    cli(process.argv.slice(2));
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(2);
  }
}
