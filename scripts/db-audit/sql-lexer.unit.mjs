// Teste do lexer SQL (sql-lexer.mjs) com SQL adversario: o que esta dentro de comentario,
// string ou corpo dollar-quoted tem de sumir de stripSqlComments(); o que e SQL de verdade
// tem de ficar. Os casos foram conferidos contra o scanner real do PostgreSQL (libpg_query).
// Offline. Rodar da raiz: node --test scripts/db-audit/sql-lexer.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sqlTokens, stripSqlComments } from './sql-lexer.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// [nome, sql, trechos que precisam sobrar, trechos que precisam sumir]
const CASOS = [
  ['DROP dentro de string', "INSERT INTO t VALUES ('DROP TABLE falso; -- nao');\nDROP TABLE real;", ['DROP TABLE real'], ['falso', 'nao']],
  ['DROP em comentario de linha', '-- DROP TABLE falso;\nCREATE TABLE real(i int);', ['CREATE TABLE real'], ['falso']],
  ['DROP em comentario de bloco', '/* DROP TABLE falso; */ CREATE TABLE real(i int);', ['CREATE TABLE real'], ['falso']],
  ['bloco aninhado', '/* a /* DROP TABLE falso1; */ ainda comentario DROP TABLE falso2; */ SELECT real;', ['SELECT real'], ['falso1', 'falso2', 'ainda']],
  ['bloco aninhado 3 niveis', '/* /* /* x */ */ DROP TABLE falso; */DROP TABLE real;', ['DROP TABLE real'], ['falso']],
  ['dollar-quote $$', "DO $$ BEGIN EXECUTE 'DROP TABLE falso'; END $$;\nDROP TABLE real;", ['DO', 'DROP TABLE real'], ['falso', 'BEGIN']],
  ['dollar-quote com tag', 'CREATE FUNCTION f() RETURNS void AS $fn$ BEGIN DROP TABLE falso; END $fn$ LANGUAGE plpgsql;', ['CREATE FUNCTION f()', 'LANGUAGE plpgsql'], ['falso']],
  ['dollar-quotes com tags aninhadas', 'DO $outer$ BEGIN EXECUTE $inner$ DROP TABLE falso; $inner$; END $outer$; DROP VIEW real;', ['DROP VIEW real'], ['falso', 'inner']],
  ['$$ dentro de corpo com outra tag', "DO $a$ select '$$', $b$ falso $b$ $a$; SELECT $1, $2, real;", ['SELECT $1, $2, real'], ['falso']],
  ['tag que e prefixo de outra', 'DO $a$ $ab$ falso $a$; DROP TABLE real;', ['DROP TABLE real'], ['falso']],
  ['tag com acento', 'DO $ação$ falso $ação$; DROP TABLE real;', ['DROP TABLE real'], ['falso']],
  ["E'...' com aspa escapada", "SELECT E'it\\'s; DROP TABLE falso; --', 'b';\nDROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ["E'...' terminando em barra dupla", "SELECT E'fim\\\\'; DROP TABLE real; --falso", ['DROP TABLE real'], ['falso', 'fim']],
  ["e'...' minusculo", "SELECT e'a\\'falso' ; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['barra em string normal nao escapa', "SELECT 'c:\\'; DROP TABLE real; --falso", ['DROP TABLE real'], ['falso']],
  ["E separado da aspa nao e E''", "SELECT E 'a\\'; DROP TABLE real; --falso", ['DROP TABLE real'], ['falso']],
  ['aspa dobrada em string', "SELECT 'it''s; DROP TABLE falso;' ; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['string continuada em outra linha', "SELECT 'a'\n  'b; DROP TABLE falso' ; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['comentario logo apos string', "SELECT 'a' -- 'falso\n, 'c'; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['/* dentro de string', "SELECT '/* falso', 1; DROP TABLE real; /* 'falso2 */", ['DROP TABLE real'], ['falso']],
  ['-- dentro de string', "SELECT '-- falso' , 2; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['aspas dentro de comentario de bloco', '/* it\'s "falso" $$ */ DROP TABLE real;', ['DROP TABLE real'], ['falso']],
  ['aspas e comentario dentro de dollar', "DO $$ BEGIN RAISE NOTICE 'it''s'; /* ' */ falso; END $$; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['aspa simples dentro de identificador', 'SELECT "it\'s" FROM t; DROP TABLE real;', ['DROP TABLE real', "it's"], []],
  ['comentario dentro de identificador', 'SELECT "a -- b", "c /* d */" FROM t; DROP TABLE real;', ['a -- b', 'c /* d */', 'DROP TABLE real'], []],
  ['identificador com aspas dobradas', 'SELECT "a""b" FROM "T"; DROP TABLE real;', ['a"b', 'FROM T', 'DROP TABLE real'], []],
  ['$ no meio de identificador', 'SELECT foo$bar$baz, a$$ FROM t$1; DROP TABLE real;', ['foo$bar$baz', 'a$$', 't$1', 'DROP TABLE real'], []],
  ['parametros posicionais', "SELECT $1::text, $2 || '$3 falso'; DROP TABLE real;", ['$1::text', '$2 ||', 'DROP TABLE real'], ['falso']],
  ["U&'...' e U&\"...\"", "SELECT U&'d\\0061falso', U&\"d\\0061t\" ; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ["B'..' X'..' N'..'", "SELECT B'1010', X'1F', N'falso'; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['operadores JSON', "SELECT a->>'falso', a#>>'{falso}', a @> '{\"falso\":1}'::jsonb; DROP TABLE real;", ['a->>', 'a#>>', 'a @>', '::jsonb', 'DROP TABLE real'], ['falso']],
  ['5--3 e comentario', 'SELECT 5--3 falso\n+1;', ['SELECT 5', '+1'], ['falso', '3']],
  ['comentario no EOF sem quebra de linha', 'SELECT real -- falso', ['SELECT real'], ['falso']],
  ['CRLF', "-- falso1\r\nDROP TABLE real;\r\n/* x\r\n falso2 */\r\nSELECT 'a\r\nfalso3';\r\n", ['DROP TABLE real', 'SELECT'], ['falso', '\r']],
  ['CR sozinho', '-- falso\rDROP TABLE real;\r', ['DROP TABLE real'], ['falso', '\r']],
  ['BOM no inicio', '\uFEFF-- falso\nDROP TABLE real;', ['DROP TABLE real'], ['falso', '\uFEFF']],
  ['unicode', '-- ação é ñ 日本語 😀 falso\nSELECT \'ação 😀 falso\', "coluna_é" FROM "Tabela 😀"; DROP TABLE real;', ['coluna_é', 'Tabela 😀', 'DROP TABLE real'], ['falso']],
  ['COMMENT ON com DDL no texto', "COMMENT ON TABLE public.a IS 'DROP TABLE falso; cuidado';", ['COMMENT ON TABLE public.a IS'], ['falso']],
  ['valor multilinha com cara de comentario', "INSERT INTO t(v) VALUES ('linha1\n-- falso1\n/* falso2 */');SELECT real;", ['SELECT real'], ['falso']],
  ['standard_conforming_strings = off', "SET standard_conforming_strings = off;\nSELECT 'a\\'; DROP TABLE falso; --';\nDROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['standard_conforming_strings off e on de volta', "SET standard_conforming_strings TO off; SELECT 'a\\'falso1'; SET standard_conforming_strings TO on; SELECT 'c\\'; DROP TABLE real; --falso2", ['DROP TABLE real'], ['falso']],
  ['SET LOCAL vale so ate o COMMIT', "BEGIN; SET LOCAL standard_conforming_strings = off; SELECT 'a\\'falso1'; COMMIT; SELECT 'c\\'; DROP TABLE real; --falso2", ['DROP TABLE real'], ['falso']],
  ['set_config de standard_conforming_strings', "SELECT set_config('standard_conforming_strings','off',false); SELECT 'a\\'falso'; DROP TABLE real;", ['DROP TABLE real'], ['falso']],
  ['RESET ALL volta ao padrao', "SET standard_conforming_strings=off; RESET ALL; SELECT 'a\\'; DROP TABLE real; --falso", ['DROP TABLE real'], ['falso']],
];

for (const [nome, sql, sobram, somem] of CASOS) {
  test('strip: ' + nome, () => {
    const limpo = stripSqlComments(sql);
    for (const trecho of sobram) assert.ok(limpo.includes(trecho), `deveria sobrar ${JSON.stringify(trecho)} em ${JSON.stringify(limpo)}`);
    for (const trecho of somem) assert.ok(!limpo.includes(trecho), `deveria sumir ${JSON.stringify(trecho)} de ${JSON.stringify(limpo)}`);
  });
}

test('strip: comentario vira espaco e nao cola os tokens vizinhos', () => {
  assert.equal(stripSqlComments('DROP/* x */TABLE a'), 'DROP TABLE a');
  assert.equal(stripSqlComments('DROP--x\nTABLE a'), 'DROP \nTABLE a');
});

test('strip: construcoes nao terminadas ficam opacas ate o fim (nao vazam DDL)', () => {
  for (const sql of [
    "SELECT 'abc; DROP TABLE falso;",
    '/* abc DROP TABLE falso;',
    '/* a /* b */ DROP TABLE falso;',
    'DO $$ BEGIN DROP TABLE falso;',
    "SELECT E'abc\\'; DROP TABLE falso;",
  ]) {
    assert.ok(!stripSqlComments(sql).includes('falso'), sql);
  }
});

test('entradas vazias', () => {
  for (const vazio of ['', '  \n\t\n', '-- nada\n/* nada */', '\uFEFF']) {
    assert.equal(stripSqlComments(vazio).trim(), '', JSON.stringify(vazio));
    assert.deepEqual(sqlTokens(vazio), []);
  }
});

test('sqlTokens: palavras em minusculas, literais e identificadores preservados, sem comentarios', () => {
  assert.deepEqual(
    sqlTokens('SELECT "Col A", \'Texto -- x\' FROM T1 -- fim\n/* b */ WHERE a>=1;'),
    ['select', '"Col A"', ',', "'Texto -- x'", 'from', 't1', 'where', 'a', '>', '=', '1', ';'],
  );
  assert.deepEqual(sqlTokens('DO $x$ Corpo; $x$;'), ['do', '$x$ Corpo; $x$', ';']);
  assert.deepEqual(sqlTokens("SELECT E'a\\'b', $1"), ['select', 'e', "'a\\'b'", ',', '$1']);
  assert.deepEqual(sqlTokens('a;b;;c'), ['a', ';', 'b', ';', ';', 'c']);
});

test('sqlTokens: CRLF, LF e BOM dao os mesmos tokens', () => {
  const lf = "-- c\nCREATE TABLE a (\n  i int -- x\n);\nSELECT 'l1\nl2';\n";
  const crlf = lf.replace(/\n/g, '\r\n');
  assert.deepEqual(sqlTokens(crlf), sqlTokens(lf));
  assert.deepEqual(sqlTokens('\uFEFF' + lf), sqlTokens(lf));
});

test('migrations reais: o lexer nao lanca e nao sobra delimitador de comentario ou string', { skip: !fs.existsSync(path.join(RAIZ, 'supabase/migrations')) }, () => {
  const dir = path.join(RAIZ, 'supabase/migrations');
  const arquivos = fs.readdirSync(dir).filter((n) => n.endsWith('.sql'));
  assert.ok(arquivos.length > 0);
  for (const nome of arquivos) {
    const sql = fs.readFileSync(path.join(dir, nome), 'utf8');
    let resto = stripSqlComments(sql);
    // Identificador entre aspas e devolvido sem as aspas e pode conter qualquer coisa
    // (nome de policy e texto livre): tira o conteudo deles antes de procurar sobras.
    for (const token of sqlTokens(sql)) {
      if (token.startsWith('"')) resto = resto.split(token.slice(1, -1).replace(/""/g, '"')).join(' ');
    }
    const sobra = resto.match(/--|\/\*|\*\/|'|\$\$/);
    assert.equal(sobra, null, `${nome}: sobrou ${sobra && sobra[0]}`);
  }
});
