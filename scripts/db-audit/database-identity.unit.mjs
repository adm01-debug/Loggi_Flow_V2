// Teste de database-identity.mjs: identidade versionada, CA pinada e validacao da DESTINO_URL.
// Offline, sem credencial. Rodar da raiz: node --test scripts/db-audit/database-identity.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUPABASE_CA_PATH,
  carregarIdentidadeEsperada,
  endurecerDestinoTls,
  extrairProjectRef,
  sha256,
  validarDestino,
  validarIdentidadeDoArtefato,
  validarSupabaseCa,
} from './database-identity.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const REF_OFICIAL = 'jvfhclubfpxrtrrazrgr';
const identidade = () => carregarIdentidadeEsperada(path.join(AQUI, 'database-identity.json'));
const direta = (ref, resto = '/postgres') => `postgresql://postgres:pw@db.${ref}.supabase.co:5432${resto}`;

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'db-identity-'));
}

test('identidade versionada aponta para o projeto oficial do Loggi', () => {
  const id = identidade();
  assert.equal(id.project_ref_sha256, sha256(REF_OFICIAL));
  assert.equal(id.database, 'postgres');
  assert.equal(id.schema, 'public');
  assert.equal(id.server_major, 17);
  const config = fs.readFileSync(path.join(RAIZ, 'supabase/config.toml'), 'utf8');
  assert.match(config, new RegExp(`^project_id = "${REF_OFICIAL}"`, 'm'));
});

test('identidade versionada nao e a de outro projeto conhecido', () => {
  const id = identidade();
  for (const ref of ['hgicfqjayrjurivtygqf', 'uwbpzfcysppwikfpnzok']) {
    assert.notEqual(id.project_ref_sha256, sha256(ref));
  }
});

test('CA pinada confere com o arquivo versionado', () => {
  assert.deepEqual(validarSupabaseCa(path.join(RAIZ, SUPABASE_CA_PATH)), []);
});

test('CA adulterada ou ausente e recusada', () => {
  const dir = tmp();
  try {
    const original = fs.readFileSync(path.join(RAIZ, SUPABASE_CA_PATH), 'utf8');
    const adulterada = path.join(dir, 'ca.crt');
    fs.writeFileSync(adulterada, original + '\n');
    assert.deepEqual(validarSupabaseCa(adulterada), ['CA Supabase versionada diverge do fingerprint pinado']);
    fs.writeFileSync(adulterada, 'nao e um certificado');
    assert.deepEqual(validarSupabaseCa(adulterada), ['CA Supabase versionada ausente ou invalida']);
    assert.deepEqual(validarSupabaseCa(path.join(dir, 'nao-existe.crt')), ['CA Supabase versionada ausente ou invalida']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('extrairProjectRef: host direto, pooler e formas recusadas', () => {
  assert.equal(extrairProjectRef(direta(REF_OFICIAL)), REF_OFICIAL);
  assert.equal(extrairProjectRef(direta(REF_OFICIAL.toUpperCase()).replace('db.', 'DB.')), REF_OFICIAL);
  assert.equal(
    extrairProjectRef(`postgres://postgres.${REF_OFICIAL}:p%40w@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`),
    REF_OFICIAL,
  );
  for (const url of [
    '',
    null,
    undefined,
    'nao-e-url',
    `https://db.${REF_OFICIAL}.supabase.co/postgres`,
    `postgresql://postgres:pw@db.${REF_OFICIAL}.supabase.co.evil.com/postgres`,
    `postgresql://postgres.${REF_OFICIAL}:pw@evilpooler.supabase.com/postgres`,
    `postgresql://postgres.${REF_OFICIAL}:pw@pooler.supabase.com.evil.com/postgres`,
    'postgresql://postgres:pw@db.curto.supabase.co/postgres',
    `postgresql://postgres:pw@127.0.0.1/postgres`,
    `postgresql://postgres%ZZ.${REF_OFICIAL}:pw@x.pooler.supabase.com/postgres`,
  ]) {
    assert.equal(extrairProjectRef(url), null, String(url));
  }
});

test('validarDestino: aceita so o projeto e o database da identidade', () => {
  const id = identidade();
  assert.deepEqual(validarDestino(direta(REF_OFICIAL), id), []);
  assert.deepEqual(
    validarDestino(`postgresql://postgres.${REF_OFICIAL}:pw@aws-1-us-east-2.pooler.supabase.com:5432/postgres`, id),
    [],
  );
  assert.deepEqual(validarDestino(direta('hgicfqjayrjurivtygqf'), id), [
    'DESTINO_URL aponta para outro projeto (fingerprint divergente)',
  ]);
  assert.deepEqual(validarDestino(direta(REF_OFICIAL, '/outro'), id), [
    'database da DESTINO_URL diverge da identidade versionada',
  ]);
  assert.deepEqual(validarDestino('', id), ['DESTINO_URL ausente; nao foi possivel provar a identidade do banco']);
  assert.deepEqual(validarDestino(undefined, id), ['DESTINO_URL ausente; nao foi possivel provar a identidade do banco']);
  assert.deepEqual(validarDestino('::::', id), ['DESTINO_URL invalida; credencial nao exibida']);
  assert.deepEqual(validarDestino('postgresql://u:pw@127.0.0.1/postgres', id), [
    'DESTINO_URL nao identifica um projeto Supabase Cloud suportado',
  ]);
});

test('mensagens de erro nunca carregam a credencial', () => {
  const id = identidade();
  const segredo = 'S3gr3d0-Sup3r';
  const urls = [
    `postgresql://postgres:${segredo}@db.hgicfqjayrjurivtygqf.supabase.co/outro`,
    `postgresql://postgres:${segredo}@db.${REF_OFICIAL}.supabase.co/postgres?sslmode=disable`,
    `postgresql://postgres:${segredo}@db.${REF_OFICIAL}.supabase.co/postgres?sslrootcert=/tmp/x.crt`,
    `http://postgres:${segredo}@exemplo.com/x`,
  ];
  for (const url of urls) {
    const mensagens = [...validarDestino(url, id), ...endurecerDestinoTls(url).erros].join('\n');
    assert.ok(!mensagens.includes(segredo), mensagens);
  }
});

test('endurecerDestinoTls: fixa verify-full e a CA pinada, sem aceitar downgrade', () => {
  const ok = endurecerDestinoTls(direta(REF_OFICIAL));
  assert.deepEqual(ok.erros, []);
  const url = new URL(ok.connectionString);
  assert.equal(url.searchParams.get('sslmode'), 'verify-full');
  assert.equal(url.searchParams.get('sslrootcert'), SUPABASE_CA_PATH);
  assert.equal(url.password, 'pw');

  // idempotente: a URL ja endurecida passa de novo e nao muda
  assert.equal(endurecerDestinoTls(ok.connectionString).connectionString, ok.connectionString);

  for (const sslmode of ['disable', 'allow', 'prefer', 'require', 'verify-ca', '']) {
    const r = endurecerDestinoTls(direta(REF_OFICIAL, `/postgres?sslmode=${sslmode}`));
    assert.equal(r.connectionString, null, sslmode);
    assert.deepEqual(r.erros, ['DESTINO_URL tenta reduzir sslmode; apenas verify-full e permitido']);
  }
  for (const ca of ['/etc/ssl/x.crt', 'system', '']) {
    const r = endurecerDestinoTls(direta(REF_OFICIAL, `/postgres?sslrootcert=${encodeURIComponent(ca)}`));
    assert.equal(r.connectionString, null, ca);
    assert.deepEqual(r.erros, ['DESTINO_URL tenta substituir a CA Supabase pinada; sslrootcert divergente']);
  }
  // sslmode repetido: sobra um unico, verify-full
  const repetido = endurecerDestinoTls(direta(REF_OFICIAL, '/postgres?sslmode=verify-full&sslmode=disable'));
  assert.deepEqual(new URL(repetido.connectionString).searchParams.getAll('sslmode'), ['verify-full']);

  assert.equal(endurecerDestinoTls('').connectionString, null);
  assert.equal(endurecerDestinoTls('::::').connectionString, null);
});

test('carregarIdentidadeEsperada: rejeita arquivo ausente, JSON invalido e campos fora do contrato', () => {
  const dir = tmp();
  try {
    const arquivo = path.join(dir, 'id.json');
    const valida = {
      format_version: 1,
      connection_provider: 'supabase-cloud',
      project_ref_sha256: sha256('x'),
      database: 'postgres',
      schema: 'public',
      server_major: 17,
    };
    const grava = (valor) => fs.writeFileSync(arquivo, typeof valor === 'string' ? valor : JSON.stringify(valor));

    grava(valida);
    assert.deepEqual(carregarIdentidadeEsperada(arquivo), valida);

    assert.throws(() => carregarIdentidadeEsperada(path.join(dir, 'nao.json')), /identidade versionada invalida/);
    for (const [ruim, padrao] of [
      ['{', /identidade versionada invalida/],
      ['[]', /raiz precisa ser um objeto/],
      ['null', /raiz precisa ser um objeto/],
      [{ ...valida, format_version: 2 }, /format_version precisa ser 1/],
      [{ ...valida, connection_provider: 'outro' }, /connection_provider/],
      [{ ...valida, project_ref_sha256: REF_OFICIAL }, /project_ref_sha256/],
      [{ ...valida, database: '' }, /database precisa/],
      [{ ...valida, schema: 1 }, /schema precisa/],
      [{ ...valida, server_major: '17' }, /server_major/],
      [{ ...valida, server_major: 9 }, /server_major/],
    ]) {
      grava(ruim);
      assert.throws(() => carregarIdentidadeEsperada(arquivo), padrao, JSON.stringify(ruim));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validarIdentidadeDoArtefato: compara database, schema e versao maior', () => {
  const esperada = { database: 'postgres', schema: 'public', server_major: 17 };
  assert.deepEqual(validarIdentidadeDoArtefato({ ...esperada }, esperada, 'x'), []);
  assert.deepEqual(validarIdentidadeDoArtefato(null, esperada, 'catalogo'), ['identidade ausente ou invalida no catalogo']);
  assert.deepEqual(validarIdentidadeDoArtefato([], esperada, 'catalogo'), ['identidade ausente ou invalida no catalogo']);
  const erros = validarIdentidadeDoArtefato({ database: 'outro', schema: 'public', server_major: '17' }, esperada, 'x');
  assert.equal(erros.length, 2);
  assert.match(erros[0], /database esperado="postgres" obtido="outro"/);
  assert.match(erros[1], /server_major esperado=17 obtido="17"/);
});
