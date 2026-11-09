// Teste de psql-environment.mjs (transporte da credencial para o psql via PGPASSFILE) e de
// local-pg-proxy.mjs (config do pgbouncer local usado pelo gen-types.sh).
// Offline: nao abre conexao; confere o ambiente e os arquivos que o psql/pgbouncer receberiam.
// Rodar da raiz: node --test scripts/db-audit/psql-environment.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { parseConnection, withPsqlEnvironment } from './psql-environment.mjs';
import { SUPABASE_CA_PATH } from './database-identity.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const SENHA = "S3nh@ c/ esp:ecial\\ 'x é";
const url = (senha = SENHA, resto = '') => `postgresql://postgres.abc:${encodeURIComponent(senha)}@db.exemplo.com:6543/postgres${resto}`;
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'db-audit-psql-'));

test('parseConnection: campos, porta padrao e senha decodificada', () => {
  const { fields, password } = parseConnection(url());
  assert.deepEqual(fields, {
    PGHOST: 'db.exemplo.com',
    PGPORT: '6543',
    PGUSER: 'postgres.abc',
    PGDATABASE: 'postgres',
    PGCONNECT_TIMEOUT: '10',
  });
  assert.equal(password, SENHA);
  assert.equal(parseConnection('postgres://u:p@h/db').fields.PGPORT, '5432');
  assert.equal(parseConnection('postgresql://u:p@[::1]:5433/db').fields.PGHOST, '::1');
  assert.equal(parseConnection('postgresql://u:p@ss@h/db').password, 'p@ss');
  assert.equal(parseConnection('postgresql://u@h/db').password, '');
});

test('parseConnection: parametros de query conhecidos viram variaveis PG*', () => {
  const { fields } = parseConnection(url(SENHA, '?sslmode=verify-full&sslrootcert=certs%2Fca.crt&connect_timeout=3&application_name=x%20y&options=-c%20a%3Db'));
  assert.equal(fields.PGSSLMODE, 'verify-full');
  assert.equal(fields.PGSSLROOTCERT, 'certs/ca.crt');
  assert.equal(fields.PGCONNECT_TIMEOUT, '3');
  assert.equal(fields.PGAPPNAME, 'x y');
  assert.equal(fields.PGOPTIONS, '-c a=b');
});

test('parseConnection: recusa o que desviaria host, usuario ou senha, sem ecoar a URL', () => {
  const ruins = [
    '',
    undefined,
    null,
    'nao-e-url',
    'http://u:p@h/db',
    'postgresql://u:p@h/',
    'postgresql://h/db',
    'postgresql://u:p@h/db#frag',
    'postgresql://u:p@h/db?host=evil',
    'postgresql://u:p@h/db?hostaddr=1.2.3.4',
    'postgresql://u:p@h/db?user=outro',
    'postgresql://u:p@h/db?password=x',
    'postgresql://u:p@h/db?dbname=outro',
    'postgresql://u:p@h/db?service=x',
    'postgresql://u:p@h/db?passfile=/tmp/x',
    'postgresql://u:p@h/db?sslmode=require&sslmode=disable',
    'postgresql://u:p@h/db?SSLMODE=disable',
    'postgresql://u:p%ZZ@h/db',
    'postgresql://u:p%0Ax@h/db',
    'postgresql://u%0D:p@h/db',
    'postgresql://u:p@h/db?options=a%0Ab',
    'postgresql://u:p@h:99999/db',
    'postgresql://u:p@h1,h2/db',
  ];
  for (const ruim of ruins) {
    assert.throws(
      () => parseConnection(ruim),
      (erro) => erro.message === 'Invalid or unsupported PostgreSQL connection parameters (details omitted)',
      String(ruim),
    );
  }
});

test('withPsqlEnvironment: senha so no PGPASSFILE (0600 em dir 0700), nunca no ambiente', () => {
  const raiz = tmp();
  try {
    let visto;
    const retorno = withPsqlEnvironment(url(), (env) => {
      const arquivo = env.PGPASSFILE;
      visto = {
        env,
        conteudo: fs.readFileSync(arquivo, 'utf8'),
        modoArquivo: fs.statSync(arquivo).mode & 0o777,
        modoDir: fs.statSync(path.dirname(arquivo)).mode & 0o777,
        dir: path.dirname(arquivo),
      };
      return 'resultado';
    }, { baseEnv: { PATH: '/usr/bin', HOME: '/x' }, tempRoot: raiz });

    assert.equal(retorno, 'resultado');
    assert.equal(visto.modoArquivo, 0o600);
    assert.equal(visto.modoDir, 0o700);
    assert.equal(path.dirname(visto.dir), raiz);
    // formato pgpass: host:porta:db:usuario:senha, com ":" e "\" escapados
    assert.equal(visto.conteudo, "db.exemplo.com:6543:postgres:postgres.abc:S3nh@ c/ esp\\:ecial\\\\ 'x é\n");
    for (const [chave, valor] of Object.entries(visto.env)) {
      assert.ok(!String(valor).includes(SENHA), chave);
      assert.ok(!String(valor).includes(encodeURIComponent(SENHA)), chave);
    }
    assert.equal(visto.env.PGHOST, 'db.exemplo.com');
    assert.equal(visto.env.PATH, '/usr/bin');
    assert.deepEqual(fs.readdirSync(raiz), [], 'diretorio temporario removido ao sair');
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('withPsqlEnvironment: variaveis PG* e DESTINO_URL herdadas nao chegam ao filho', () => {
  const raiz = tmp();
  try {
    const env = withPsqlEnvironment(url(SENHA, '?sslmode=verify-full'), (e) => ({ ...e }), {
      tempRoot: raiz,
      baseEnv: {
        PATH: '/usr/bin',
        PGHOST: 'evil.example',
        PGPASSWORD: 'vazada',
        PGOPTIONS: '-c statement_timeout=1',
        PGSERVICE: 'x',
        PGSSLMODE: 'disable',
        DESTINO_URL: url(),
        OUTRA: 'fica',
      },
    });
    assert.equal(env.PGHOST, 'db.exemplo.com');
    assert.equal(env.PGSSLMODE, 'verify-full');
    assert.equal(env.OUTRA, 'fica');
    for (const chave of ['PGPASSWORD', 'PGOPTIONS', 'PGSERVICE', 'DESTINO_URL']) assert.ok(!(chave in env), chave);
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('withPsqlEnvironment: limpa o diretorio temporario mesmo quando o callback lanca', () => {
  const raiz = tmp();
  try {
    assert.throws(() => withPsqlEnvironment(url(), () => { throw new Error('boom'); }, { tempRoot: raiz, baseEnv: {} }), /boom/);
    assert.deepEqual(fs.readdirSync(raiz), []);
    assert.throws(() => withPsqlEnvironment('postgresql://u:p@h/db?host=x', () => 'nunca', { tempRoot: raiz, baseEnv: {} }), /Invalid or unsupported/);
    assert.deepEqual(fs.readdirSync(raiz), []);
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('withPsqlEnvironment: retry so com PSQL_CONNECT_RETRIES e so para falha de transporte', () => {
  const raiz = tmp();
  const falha = (stderr) => Object.assign(new Error('x'), { stderr });
  const contar = (baseEnv, erro) => {
    let chamadas = 0;
    try {
      withPsqlEnvironment(url(), () => { chamadas += 1; throw erro; }, { tempRoot: raiz, baseEnv });
    } catch {
      // esperado
    }
    return chamadas;
  };
  const original = process.stderr.write;
  const avisos = [];
  process.stderr.write = (texto) => { avisos.push(String(texto)); return true; };
  try {
    const retry = { PSQL_CONNECT_RETRIES: '2', PSQL_CONNECT_RETRY_DELAY_MS: '0' };
    assert.equal(contar({}, falha('psql: error: connection refused')), 1, 'sem a variavel nao repete');
    assert.equal(contar(retry, falha('psql: error: connection to server failed: Connection refused')), 3);
    assert.equal(contar(retry, falha('SSL SYSCALL error: EOF detected')), 3);
    assert.equal(contar(retry, Object.assign(new Error('x'), { transporte: true })), 3);
    assert.equal(contar(retry, falha('FATAL:  password authentication failed for user "x"')), 1, 'auth nao repete');
    assert.equal(contar(retry, falha('ERROR:  syntax error at or near "x"')), 1, 'erro de SQL nao repete');
    assert.equal(contar({ PSQL_CONNECT_RETRIES: '99', PSQL_CONNECT_RETRY_DELAY_MS: '0' }, falha('connection reset')), 6, 'teto de 5 repeticoes');
    assert.equal(contar({ PSQL_CONNECT_RETRIES: 'abc' }, falha('connection reset')), 1);
    assert.ok(avisos.length > 0);
    for (const aviso of avisos) {
      assert.match(aviso, /^aviso: falha de transporte ao falar com o banco; nova tentativa \d\/\d\n$/);
      assert.ok(!aviso.includes('exemplo.com'));
    }
    assert.deepEqual(fs.readdirSync(raiz), []);
  } finally {
    process.stderr.write = original;
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- local-pg-proxy.mjs

const DESTINO_PROXY = `postgresql://postgres.abc:${encodeURIComponent(SENHA)}@db.exemplo.com:6543/postgres`;

function proxy(dirArg, env = {}) {
  const base = { ...process.env };
  delete base.DESTINO_URL;
  const r = spawnSync(process.execPath, [path.join(AQUI, 'local-pg-proxy.mjs'), ...(dirArg === undefined ? [] : [dirArg])], {
    cwd: RAIZ,
    encoding: 'utf8',
    env: { ...base, ...env },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

test('local-pg-proxy: escreve config 0600 so-loopback com verify-full e CA pinada; stdout e so a porta', () => {
  const dir = tmp();
  try {
    const r = proxy(dir, { DESTINO_URL: DESTINO_PROXY });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^\d+\n$/);
    const porta = Number(r.stdout);
    assert.ok(porta > 1023 && porta < 65536);
    assert.deepEqual(fs.readdirSync(dir).sort(), ['pgbouncer.ini', 'userlist.txt']);
    for (const nome of ['pgbouncer.ini', 'userlist.txt']) {
      assert.equal(fs.statSync(path.join(dir, nome)).mode & 0o777, 0o600, nome);
    }
    const ini = fs.readFileSync(path.join(dir, 'pgbouncer.ini'), 'utf8');
    // aspa simples dobrada dentro de valor entre aspas; barra invertida literal
    assert.ok(ini.includes("proxydb = host=db.exemplo.com port=6543 dbname=postgres user=postgres.abc password='S3nh@ c/ esp:ecial\\ ''x é'\n"), ini.replace(SENHA, '<senha>'));
    assert.match(ini, /^listen_addr = 127\.0\.0\.1$/m);
    assert.match(ini, new RegExp(`^listen_port = ${porta}$`, 'm'));
    assert.match(ini, /^unix_socket_dir =$/m);
    assert.match(ini, /^server_tls_sslmode = verify-full$/m);
    assert.ok(ini.includes('server_tls_ca_file = ' + path.join(RAIZ, SUPABASE_CA_PATH) + '\n'));
    assert.ok(ini.includes('auth_file = ' + path.join(fs.realpathSync(dir), 'userlist.txt') + '\n'));
    assert.equal(fs.readFileSync(path.join(dir, 'userlist.txt'), 'utf8'), '"proxy" "unused"\n');
    assert.ok(!(r.stdout + r.stderr).includes(SENHA));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('local-pg-proxy: senha sem espaco nem aspa vai sem aspas', () => {
  const dir = tmp();
  try {
    const r = proxy(dir, { DESTINO_URL: 'postgresql://u:a%5Cb%3Dc%23d@h/db' });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(fs.readFileSync(path.join(dir, 'pgbouncer.ini'), 'utf8').includes('user=u password=a\\b=c#d\n'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('local-pg-proxy: uso invalido e diretorio fora das raizes saem 2 sem criar arquivo', () => {
  assert.equal(proxy(undefined, { DESTINO_URL: DESTINO_PROXY }).status, 2);
  const r = proxy('/etc/proxy-nao-pode', { DESTINO_URL: DESTINO_PROXY });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /fora das raizes permitidas/);
  assert.ok(!fs.existsSync('/etc/proxy-nao-pode'));
});

test('local-pg-proxy: DESTINO_URL ausente, com downgrade de TLS ou invalida sai 1 com mensagem limpa', () => {
  const dir = tmp();
  try {
    const casos = [
      [{}, /DESTINO_URL nao definida/],
      [{ DESTINO_URL: DESTINO_PROXY + '?sslmode=require' }, /tenta reduzir sslmode/],
      [{ DESTINO_URL: DESTINO_PROXY + '?sslrootcert=/tmp/outra.crt' }, /tenta substituir a CA/],
      [{ DESTINO_URL: 'nao-e-url' }, /DESTINO_URL invalida/],
      [{ DESTINO_URL: DESTINO_PROXY + '?host=evil.example' }, /parametros de conexao invalidos/],
      [{ DESTINO_URL: 'postgresql://u:p%ZZ@h/db' }, /parametros de conexao invalidos/],
    ];
    for (const [env, padrao] of casos) {
      const r = proxy(dir, env);
      assert.equal(r.status, 1, JSON.stringify(Object.keys(env)) + r.stderr);
      assert.match(r.stderr, padrao);
      assert.equal(r.stdout, '');
      assert.ok(!/\n\s+at /.test(r.stderr), 'sem stack trace: ' + r.stderr);
      assert.ok(!r.stderr.includes(SENHA));
      assert.deepEqual(fs.readdirSync(dir), []);
    }
    const ausente = proxy(path.join(dir, 'nao-existe'), { DESTINO_URL: DESTINO_PROXY });
    assert.equal(ausente.status, 1);
    assert.match(ausente.stderr, /nao foi possivel gravar a config do proxy/);
    assert.ok(!/\n\s+at /.test(ausente.stderr));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
