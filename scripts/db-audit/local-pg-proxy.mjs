// scripts/db-audit/local-pg-proxy.mjs <diretorio-temporario-0700>
//
// Escreve a config de um pgbouncer LOCAL (bind 127.0.0.1) que repassa para o
// DESTINO_URL real, com TLS verify-full + CA Supabase pinada no trecho
// pgbouncer->producao. A credencial real fica apenas no arquivo pgbouncer.ini
// (modo 0600, dentro de um diretorio 0700); o --db-url que o chamador (gen-
// types.sh) passa ao `supabase` CLI usa uma credencial descartavel que nunca
// aponta pra producao.
//
// Motivo: `supabase gen types typescript --db-url` (CLI 2.116.0) nao usa
// libpq/PGPASSFILE como os outros scripts deste diretorio — ele sobe um
// container Docker (ghcr.io/supabase/postgres-meta) que recebe a --db-url em
// texto puro e conecta a ela diretamente, usando a rede do host. Sem esse
// proxy, a credencial de producao fica visivel via /proc a qualquer processo
// irmao no mesmo job (ex.: uma dependencia comprometida instalada por `bun
// install` mais adiante no mesmo workflow).
//
// Imprime no stdout, sozinha, a porta local escolhida.
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { resolverCaminhoPermitido } from '../lib/seguranca-processo.mjs';
import { parseConnection } from './psql-environment.mjs';
import { endurecerDestinoTls, SUPABASE_CA_PATH } from './database-identity.mjs';

// S8707: o diretorio do proxy vem do argumento; nunca entra cru num fs.*.
// A guarda vive no modulo compartilhado (scripts/lib/seguranca-processo.mjs):
// resolve e exige que fique dentro do repositorio ou do diretorio temporario do
// sistema (gen-types.sh passa um `mktemp -d`). Fail-closed: fora da raiz
// encerra com exit 2 (mesmo codigo do uso invalido) antes de qualquer socket.
const proxyDirArg = process.argv[2];
if (!proxyDirArg) {
  console.error('uso: local-pg-proxy.mjs <diretorio-temporario-0700>');
  process.exit(2);
}
let proxyDir;
try {
  proxyDir = resolverCaminhoPermitido(proxyDirArg, 'diretorio do proxy');
} catch (erro) {
  console.error('ERRO: ' + erro.message);
  process.exit(2);
}

const destino = process.env.DESTINO_URL;
if (!destino) {
  console.error('Erro: DESTINO_URL nao definida no ambiente.');
  process.exit(1);
}

const tls = endurecerDestinoTls(destino);
if (tls.erros.length) {
  for (const erro of tls.erros) console.error('ERRO: ' + erro);
  process.exit(1);
}

let fields;
let password;
try {
  ({ fields, password } = parseConnection(tls.connectionString));
} catch {
  console.error('ERRO: DESTINO_URL com parametros de conexao invalidos ou nao suportados (detalhes omitidos).');
  process.exit(1);
}

function escapeIniValue(value) {
  // Formato "connstring" da secao [databases] do pgbouncer.ini: NAO e
  // libpq-style apesar do que a doc do pgbouncer sugere. Verificado contra o
  // parser real (pgbouncer 1.22.0, src/loader.c) por leitura de codigo-fonte E
  // teste empirico ponta a ponta:
  //   - barra invertida (\) NAO tem nenhum significado especial.
  //   - espaco fora de aspas termina o valor (delimitador); dentro de
  //     aspas simples, passa liso.
  //   - aspa simples (') e o UNICO caractere que precisa de tratamento:
  //     dentro de um valor entre aspas simples, uma aspa simples literal
  //     e representada dobrando-a ('' -> '), estilo string SQL.
  if (/[\s']/.test(value)) {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return value;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const port = await freePort();
const caPath = path.resolve(SUPABASE_CA_PATH);

const iniLines = [
  '[databases]',
  `proxydb = host=${escapeIniValue(fields.PGHOST)} port=${escapeIniValue(fields.PGPORT)} ` +
    `dbname=${escapeIniValue(fields.PGDATABASE)} user=${escapeIniValue(fields.PGUSER)} ` +
    `password=${escapeIniValue(password)}`,
  '',
  '[pgbouncer]',
  'listen_addr = 127.0.0.1',
  `listen_port = ${port}`,
  'unix_socket_dir =',
  'auth_type = trust',
  `auth_file = ${path.join(proxyDir, 'userlist.txt')}`,
  `logfile = ${path.join(proxyDir, 'pgbouncer.log')}`,
  `pidfile = ${path.join(proxyDir, 'pgbouncer.pid')}`,
  'pool_mode = session',
  'max_client_conn = 10',
  'default_pool_size = 5',
  // O default do pgbouncer e 15s. Sob saturacao transitoria do banco, o
  // handshake demora e o pgbouncer desistia antes do cliente postgres-meta.
  // 60s da folga para o handshake completar em vez de abortar.
  'server_connect_timeout = 60',
  'server_tls_sslmode = verify-full',
  `server_tls_ca_file = ${caPath}`,
  '',
].join('\n');

try {
  fs.writeFileSync(path.join(proxyDir, 'userlist.txt'), '"proxy" "unused"\n', { mode: 0o600 });
  fs.writeFileSync(path.join(proxyDir, 'pgbouncer.ini'), iniLines, { mode: 0o600 });
} catch (erro) {
  console.error('ERRO: nao foi possivel gravar a config do proxy em ' + proxyDir + ' (' + erro.code + ').');
  process.exit(1);
}

console.log(String(port));
