#!/usr/bin/env node
/**
 * Gate 3 do types-sync — remocoes destrutivas.
 *
 * Compara os OBJETOS do catalogo antigo x novo (`supabase/schema-catalog.json`,
 * gerado por `scripts/db-audit/catalog.sql`) e bloqueia SO a remocao de um objeto
 * (tabela/view/funcao/enum) que ainda tem consumidor no codigo do app. A deteccao de
 * consumidor reaproveita o `supabase-usage-guard.mjs` (mesmo scan de `.from()`/`.rpc()`,
 * mesmos receptores ignorados).
 *
 * Roda OFFLINE, sem credencial de banco. Contrato de saida:
 *   0 = nenhuma remocao consumida (o workflow pode propor/atualizar o PR)
 *   1 = remocao de objeto ainda consumido (bloqueia)
 *   2 = erro de entrada (catalogo ausente ou invalido)
 *
 * Uso:
 *   node scripts/db-audit/check-remocoes-destrutivas.mjs [catalogo-antigo.json] [catalogo-novo.json]
 *   (padroes: supabase/schema-catalog.json  /tmp/catalog.new.json)
 */
import fs from 'node:fs';
import path from 'node:path';
import { scan, walk } from './supabase-usage-guard.mjs';

const ROOT = process.cwd();
const ANTIGO = process.argv[2] || path.join(ROOT, 'supabase/schema-catalog.json');
const NOVO = process.argv[3] || '/tmp/catalog.new.json';
const TYPES_GERADO = 'src/integrations/supabase/types.ts';

function ler(arquivo) {
  if (!fs.existsSync(arquivo)) {
    console.error('ERRO: catalogo nao encontrado: ' + arquivo);
    process.exit(2);
  }
  try {
    const catalogo = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    if (!catalogo || typeof catalogo !== 'object' || Array.isArray(catalogo)) {
      throw new Error('a raiz precisa ser um objeto JSON');
    }
    for (const secao of ['tables', 'views', 'functions', 'enums']) {
      const nomes = catalogo[secao];
      if (nomes !== undefined && !(Array.isArray(nomes) && nomes.every((n) => typeof n === 'string'))) {
        throw new Error('secao [' + secao + '] precisa ser lista de nomes');
      }
    }
    return catalogo;
  } catch (error) {
    console.error('ERRO: catalogo invalido (' + arquivo + '): ' + error.message);
    process.exit(2);
  }
}

function objetos(catalogo) {
  const publicos = (nomes) => new Set((nomes || []).map((n) => 'public.' + n));
  return {
    relacoes: new Set([...publicos(catalogo.tables), ...publicos(catalogo.views)]),
    funcoes: publicos(catalogo.functions),
    enums: publicos(catalogo.enums),
  };
}

function enumsCitados(removidos) {
  const citados = new Map();
  if (removidos.size === 0) return citados;
  // O types.ts gerado lista todo enum do banco: nao e consumidor, e o proprio sync o regenera.
  const arquivos = [...walk('src'), ...walk('supabase/functions')]
    .filter((arquivo) => arquivo.split(path.sep).join('/') !== TYPES_GERADO);
  for (const arquivo of arquivos) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    for (const alvo of removidos) {
      const nome = alvo.slice('public.'.length).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp('\\b' + nome + '\\b').test(texto)) {
        if (!citados.has(alvo)) citados.set(alvo, []);
        citados.get(alvo).push(arquivo.split(path.sep).join('/'));
      }
    }
  }
  return citados;
}

function main() {
  const antigo = objetos(ler(ANTIGO));
  const novo = objetos(ler(NOVO));

  const removidas = [
    ['tabela/view', 'relacao', [...antigo.relacoes].filter((n) => !novo.relacoes.has(n)).sort()],
    ['funcao', 'funcao', [...antigo.funcoes].filter((n) => !novo.funcoes.has(n)).sort()],
    ['enum', 'enum', [...antigo.enums].filter((n) => !novo.enums.has(n)).sort()],
  ];

  const consumidores = scan();
  const callSites = (alvo, kind) => consumidores.filter(
    (c) => c.kind === kind && c.schema + '.' + c.name === alvo,
  );
  const enums = enumsCitados(new Set(removidas[2][2]));

  console.log('Gate 3 — remocoes destrutivas (objetos, nao linhas)');
  console.log('  catalogo antigo: ' + ANTIGO);
  console.log('  catalogo novo:   ' + NOVO);

  const destrutivas = [];
  for (const [rotulo, classe, alvos] of removidas) {
    if (alvos.length === 0) continue;
    console.log('Remocoes de ' + rotulo + ' (' + alvos.length + '):');
    for (const alvo of alvos) {
      const consumidoresDoAlvo = classe === 'enum'
        ? (enums.get(alvo) || []).map((arquivo) => arquivo)
        : callSites(alvo, classe === 'funcao' ? 'rpc' : 'from')
          .map((c) => c.file + ':' + c.line);
      const pontos = [...new Set(consumidoresDoAlvo)];
      console.log('  - ' + alvo + (pontos.length ? '  <- consumido em ' + pontos.join(', ') : '  (sem call-site)'));
      if (pontos.length) destrutivas.push({ rotulo, alvo, pontos });
    }
  }

  const total = removidas.reduce((soma, [, , alvos]) => soma + alvos.length, 0);
  if (total === 0) {
    console.log('OK: nenhum objeto do catalogo foi removido pelo sync.');
    return;
  }
  if (destrutivas.length === 0) {
    console.log('OK: houve remocao, mas nenhum objeto removido tem consumidor no codigo.');
    return;
  }

  console.error('');
  console.error('BLOQUEADO — remocao destrutiva (objeto do banco ainda consumido pelo codigo):');
  for (const d of destrutivas) {
    for (const ponto of d.pontos) console.error('  ' + d.rotulo + ' ' + d.alvo + ' <- ' + ponto);
  }
  console.error('');
  console.error('Se a remocao for intencional, remova o consumidor no mesmo PR. Nao ha atalho');
  console.error('por contagem de linhas: o gate olha o objeto e os call-sites.');
  process.exit(1);
}

main();
