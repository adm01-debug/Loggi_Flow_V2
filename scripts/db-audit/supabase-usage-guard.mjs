#!/usr/bin/env node
/**
 * Guard de acoplamento codigo <-> banco.
 *
 * Varre src/ e supabase/functions/ procurando .from('x') e .rpc('y') feitos no
 * cliente Supabase PRINCIPAL e falha se o alvo nao existir em
 * supabase/schema-catalog.json.
 *
 * Roda OFFLINE. Nao precisa de credencial de banco, entao funciona em PR de fork.
 *
 * Chamadas em outros clientes (storage.from() etc.) sao ignoradas - sao outros
 * bancos/buckets.
 *
 * Violacoes ja conhecidas ficam em known-violations.json (padrao ratchet):
 * o CI passa com elas, mas falha se aparecer UMA nova. Entradas do baseline que
 * deixarem de existir tambem falham, para o arquivo nao apodrecer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSqlComments } from './sql-lexer.mjs';

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, 'supabase/schema-catalog.json');
const BASELINE = path.join(ROOT, 'scripts/db-audit/known-violations.json');
const SCAN_DIRS = ['src', 'supabase/functions'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

// Receptores que NAO sao o banco principal deste projeto.
const NON_MAIN = /(externalSupabase|getExternalSupabase\(\)|clientesSupabase|getClientesSupabase\(\)|extClient|externalClient|storage|Array)\s*\??\.?\s*$/;

const COMENTARIO = String.raw`(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*)`;
const SCHEMA_RE = new RegExp(
  String.raw`\.schema\(\s*${COMENTARIO}?\s*['"\`]([a-zA-Z0-9_]+)['"\`]\s*\)\s*(?:${COMENTARIO}\s*)*$`,
);

export function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (EXTS.has(path.extname(e.name))) acc.push(p);
  }
  return acc;
}

export function scan() {
  const found = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(dir)) {
      const src = fs.readFileSync(file, 'utf8');
      for (const [kind, re] of [
        ['from', /\.from\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g],
        ['rpc', /\.rpc\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g],
      ]) {
        let m;
        while ((m = re.exec(src))) {
          const before = src.slice(Math.max(0, m.index - 150), m.index);
          if (NON_MAIN.test(before)) continue;
          const schemaMatch = before.match(SCHEMA_RE);
          found.push({
            kind,
            schema: (schemaMatch ? schemaMatch[1] : 'public').toLowerCase(),
            name: m[1],
            file: file.split(path.sep).join('/'),
            line: src.slice(0, m.index).split('\n').length,
          });
        }
      }
    }
  }
  return found;
}

const MULTIWORD_TYPE_START = new Set([
  'timestamp', 'time', 'double', 'character', 'bit', 'national', 'interval',
]);

function splitArgs(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

const TYPE_ALIASES = new Map([
  ['int', 'integer'], ['int2', 'smallint'], ['int4', 'integer'], ['int8', 'bigint'],
  ['serial', 'integer'], ['smallserial', 'smallint'], ['bigserial', 'bigint'],
  ['bool', 'boolean'], ['decimal', 'numeric'], ['float4', 'real'],
  ['float8', 'double precision'], ['varchar', 'character varying'],
  ['char', 'character'], ['timestamptz', 'timestamp with time zone'],
  ['timestamp', 'timestamp without time zone'],
  ['timetz', 'time with time zone'], ['time', 'time without time zone'],
]);

function canonTipo(t) {
  const ehArray = /\[\s*\]$/.test(t);
  const base = t.replace(/\s*\[\s*\]\s*$/, '');
  const semTypmod = base.replace(/\s*\([\s\S]*\)$/, '').trim();
  return (TYPE_ALIASES.get(semTypmod) || semTypmod) + (ehArray ? '[]' : '');
}

function normArgs(argsText) {
  return splitArgs(argsText)
    .map((raw) => {
      if (/^\s*out\s/i.test(raw)) return null;
      let t = raw.replace(/\s+default\b[\s\S]*$/i, '').trim();
      t = t.replace(/^(?:in|inout|variadic)\s+/i, '');
      const words = t.split(/\s+/).filter(Boolean);
      if (words.length > 1 && !MULTIWORD_TYPE_START.has(words[0].toLowerCase())) words.shift();
      return canonTipo(words.join(' ').toLowerCase());
    })
    .filter((t) => t !== null)
    .join(',');
}

function addSignature(map, key, sig) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(sig);
}

function dropSignature(map, key, sig) {
  const set = map.get(key);
  if (!set) return;
  if (set.size === 0) {
    map.delete(key);
    return;
  }
  set.delete(sig);
  if (set.size === 0) map.delete(key);
}

function projectSchemaFromForwardMigrations(catalog) {
  const cutoff = String(catalog.generated_at || '').replace(/\D/g, '').slice(0, 8);
  const functions = new Map();
  for (const n of catalog.functions) functions.set('public.' + n, new Set());
  for (const raw of catalog.function_signatures || []) {
    const m = /^([A-Za-z0-9_]+)\((.*)\)->/s.exec(String(raw));
    if (!m) continue;
    addSignature(functions, 'public.' + m[1], normArgs(m[2]));
  }
  const relations = new Set([...catalog.tables, ...catalog.views].map((n) => 'public.' + n));
  const migrationsDir = path.join(ROOT, 'supabase/migrations');
  if (!/^\d{8}$/.test(cutoff) || !fs.existsSync(migrationsDir)) return { functions, relations };

  for (const filename of fs.readdirSync(migrationsDir).filter((name) => /^\d{14}_.+\.sql$/.test(name)).sort()) {
    if (filename.slice(0, 8) < cutoff) continue;
    const rawSql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
    const sql = stripSqlComments(rawSql);
    const ops = [];
    const qual = (schema, name) => schema.toLowerCase() + '.' + name;
    const alvo = (schema, name) => qual(schema || 'public', name);
    for (const m of sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi)) {
      ops.push({ at: m.index, kind: 'rel', op: 'add', name: alvo(m[1], m[2]) });
    }
    for (const m of sql.matchAll(/DROP\s+(?:MATERIALIZED\s+)?VIEW(?:\s+IF\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi)) {
      ops.push({ at: m.index, kind: 'rel', op: 'del', name: alvo(m[1], m[2]) });
    }
    for (const m of sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi)) {
      ops.push({ at: m.index, kind: 'rel', op: 'add', name: alvo(m[1], m[2]) });
    }
    for (const m of sql.matchAll(/DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi)) {
      ops.push({ at: m.index, kind: 'rel', op: 'del', name: alvo(m[1], m[2]) });
    }
    for (const m of sql.matchAll(/ALTER\s+(?:MATERIALIZED\s+VIEW|TABLE|VIEW)(?:\s+IF\s+EXISTS)?\s+(?:ONLY\s+)?(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+RENAME\s+TO\s+([a-zA-Z0-9_]+)/gi)) {
      ops.push({ at: m.index, kind: 'rel', op: 'del', name: alvo(m[1], m[2]) });
      ops.push({ at: m.index + 1, kind: 'rel', op: 'add', name: alvo(m[1], m[3]) });
    }
    for (const m of sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|ROUTINE|PROCEDURE)\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi)) {
      ops.push({ at: m.index, kind: 'fn', op: 'add', name: alvo(m[1], m[2]), sig: normArgs(m[3]) });
    }
    for (const m of sql.matchAll(/DROP\s+(?:FUNCTION|ROUTINE|PROCEDURE)(?:\s+IF\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi)) {
      ops.push({ at: m.index, kind: 'fn', op: 'del', name: alvo(m[1], m[2]), sig: normArgs(m[3]) });
    }
    ops.sort((a, b) => a.at - b.at);
    for (const change of ops) {
      if (change.kind === 'fn') {
        if (change.op === 'add') addSignature(functions, change.name, change.sig);
        else dropSignature(functions, change.name, change.sig);
      } else if (change.op === 'add') {
        relations.add(change.name);
      } else {
        relations.delete(change.name);
      }
    }
  }
  return { functions, relations };
}

function main() {
  if (!fs.existsSync(CATALOG)) {
    console.error('ERRO: ' + CATALOG + ' nao encontrado. Regenere com scripts/db-audit/catalog.sql.');
    process.exit(2);
  }
  const cat = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const projected = projectSchemaFromForwardMigrations(cat);
  const relations = projected.relations;
  const functions = projected.functions;
  const baseline = fs.existsSync(BASELINE)
    ? new Set(JSON.parse(fs.readFileSync(BASELINE, 'utf8')).known)
    : new Set();

  const violations = scan().filter((h) => {
    const alvo = h.schema + '.' + h.name;
    return h.kind === 'from' ? !relations.has(alvo) : !functions.has(alvo);
  });

  const seen = new Set();
  const novas = [];
  for (const v of violations) {
    const alvo = v.schema === 'public' ? v.name : v.schema + '.' + v.name;
    const key = v.kind + ':' + alvo + ':' + v.file;
    seen.add(key);
    if (!baseline.has(key)) novas.push({ ...v, key });
  }
  const obsoletas = [...baseline].filter((k) => !seen.has(k));

  console.log(
    'Catalogo: ' + cat.tables.length + ' tabelas, ' + cat.views.length +
    ' views, ' + cat.functions.length + ' funcoes, ' +
    (cat.trigger_functions || []).length + ' trigger functions (excluidas do guard .rpc())' +
    ' (gerado em ' + cat.generated_at +
    '); projecao forward-only: ' + projected.relations.size + ' relacoes, ' +
    projected.functions.size + ' funcoes',
  );
  console.log(
    'Violacoes totais: ' + violations.length +
    ' | no baseline: ' + (violations.length - novas.length) +
    ' | novas: ' + novas.length,
  );

  if (novas.length) {
    console.error('\nNOVAS violacoes - alvo nao existe no banco principal:');
    for (const v of novas) {
      console.error('  ' + v.file + ':' + v.line + '  .' + v.kind + "('" + v.name + "')");
    }
    console.error('\nSe for intencional (outro cliente Supabase), use um receptor reconhecido.');
    console.error('Se for divida tecnica conhecida, adicione a chave em scripts/db-audit/known-violations.json:');
    for (const v of [...new Set(novas.map((n) => n.key))]) console.error('  "' + v + '",');
  }
  const pruneObsolete = process.argv.includes('--prune-obsolete');
  if (obsoletas.length) {
    const mensagem = `\nEntradas obsoletas no baseline (${obsoletas.length}): a violacao sumiu; serao podadas automaticamente pelo types-sync.`;
    console.warn(mensagem);
    for (const k of obsoletas) console.warn('  ' + k);
    if (pruneObsolete && fs.existsSync(BASELINE)) {
      const atual = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
      const podado = { ...atual, known: atual.known.filter((k) => !obsoletas.includes(k)) };
      fs.writeFileSync(BASELINE, JSON.stringify(podado, null, 2) + '\n');
      console.log(`known-violations.json podado: ${obsoletas.length} entrada(s) removida(s).`);
    }
  }

  if (novas.length) process.exit(1);
  console.log('OK: nenhuma violacao nova' + (obsoletas.length ? ` (${obsoletas.length} obsoleta(s) podada(s))` : '') + '.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
