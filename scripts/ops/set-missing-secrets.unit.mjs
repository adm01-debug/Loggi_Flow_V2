// Teste de scripts/ops/set_missing_secrets.sh sem rede e sem CLI de verdade.
// Um `supabase` falso num PATH temporário grava o argv de cada chamada; o script roda em cada
// shell POSIX disponível (dash é o /bin/sh do Ubuntu da CI; bash é o /bin/sh do macOS).
// Rodar: node --test scripts/ops/set-missing-secrets.unit.mjs

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'ops', 'set_missing_secrets.sh');
const FUNCTIONS = path.join(RAIZ, 'supabase', 'functions');
const PROJ = 'jvfhclubfpxrtrrazrgr';
const TOKEN = 'sbp_falso-falso-falso';

const existe = (bin) => spawnSync('sh', ['-c', `command -v ${bin}`]).status === 0;
const SHELLS = ['dash', 'bash', 'sh'].filter(existe);

let tmp, bin;
before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets unit-')); // com espaço no caminho, de propósito
  bin = path.join(tmp, 'bin');
  fs.mkdirSync(bin);
  // argv separado por NUL (valor pode ter quebra de linha); uma chamada por arquivo.
  fs.writeFileSync(path.join(bin, 'supabase'), `#!/bin/sh
n=$(ls "$STUB_DIR" | wc -l)
for a in "$@"; do printf '%s\\0' "$a"; done > "$STUB_DIR/chamada-$n"
[ -n "\${SUPABASE_ACCESS_TOKEN:-}" ] && : > "$STUB_DIR/../com-token"
echo "Finished supabase secrets set."
exit "\${STUB_EXIT:-0}"
`, { mode: 0o755 });
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let serie = 0;
/** Roda o script. `arquivo` (texto) vira um --env-file temporário fora de qualquer repositório. */
function rodar(shell, args = [], { env = {}, arquivo, semCli = false, flagsShell = [] } = {}) {
  const dir = path.join(tmp, `caso ${++serie}`);
  const stub = path.join(dir, 'chamadas');
  fs.mkdirSync(stub, { recursive: true });
  const extras = [];
  if (arquivo !== undefined) {
    fs.writeFileSync(path.join(dir, 'valores.env'), arquivo);
    extras.push('--env-file', path.join(dir, 'valores.env'));
  }
  const r = spawnSync(shell, [...flagsShell, SCRIPT, ...extras, ...args], {
    cwd: dir,
    env: { PATH: `${semCli ? '' : `${bin}:`}/usr/bin:/bin`, HOME: dir, STUB_DIR: stub, ...env },
    encoding: 'utf8',
  });
  const chamadas = fs.readdirSync(stub).sort().map((f) => fs.readFileSync(path.join(stub, f), 'utf8').split('\0').slice(0, -1));
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, saida: r.stdout + r.stderr, chamadas, comToken: fs.existsSync(path.join(dir, 'com-token')), dir };
}
/** Pares NOME=valor que chegaram à CLI na única chamada esperada. */
function enviados(r) {
  assert.equal(r.chamadas.length, 1, `esperava 1 chamada à CLI, houve ${r.chamadas.length}\n${r.saida}`);
  const argv = r.chamadas[0];
  assert.deepEqual(argv.slice(0, 2), ['secrets', 'set']);
  assert.deepEqual(argv.slice(-2), ['--project-ref', PROJ]);
  assert.equal(argv[2], '--yes', 'precisa de --yes para rodar em CI sem TTY');
  return Object.fromEntries(argv.slice(3, -2).map((p) => [p.slice(0, p.indexOf('=')), p.slice(p.indexOf('=') + 1)]));
}
const nomesDoScript = () => spawnSync('sh', [SCRIPT, '--list'], { encoding: 'utf8' }).stdout.trim().split('\n');

describe('catálogo de nomes', () => {
  test('é exatamente o que supabase/functions lê (Deno.env.get + verifyWebhookHmac)', () => {
    // Injetados pela plataforma, e a chave que liga modo de teste nos webhooks: fora de propósito.
    const FORA = new Set(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ALLOW_TEST_MODE']);
    const lidos = new Map();
    const varrer = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { varrer(p); continue; }
        if (!e.name.endsWith('.ts') || /(_test|\.test)\.ts$/.test(e.name)) continue;
        const src = fs.readFileSync(p, 'utf8');
        for (const m of src.matchAll(/Deno\.env\.get\(\s*["']([A-Z0-9_]+)["']\s*\)|verifyWebhookHmac\([^)]*?["']([A-Z0-9_]+)["']\s*\)/g)) {
          const nome = m[1] ?? m[2];
          if (!FORA.has(nome)) lidos.set(nome, path.relative(RAIZ, p));
        }
      }
    };
    varrer(FUNCTIONS);
    const noScript = nomesDoScript();
    const faltando = [...lidos.keys()].filter((n) => !noScript.includes(n)).map((n) => `${n} (lido em ${lidos.get(n)})`);
    const sobrando = noScript.filter((n) => !lidos.has(n));
    assert.deepEqual({ faltando, sobrando }, { faltando: [], sobrando: [] });
    assert.ok(noScript.length >= 20);
  });
  test('sem nome repetido e nenhum com prefixo SUPABASE_ (a CLI recusa)', () => {
    const nomes = nomesDoScript();
    assert.equal(new Set(nomes).size, nomes.length);
    assert.deepEqual(nomes.filter((n) => n.startsWith('SUPABASE_')), []);
  });
  test('o arquivo versionado não carrega valor: nenhuma atribuição literal de secret', () => {
    const src = fs.readFileSync(SCRIPT, 'utf8');
    for (const n of nomesDoScript()) assert.ok(!new RegExp(`^\\s*${n}=`, 'm').test(src), `${n}= aparece no script`);
    assert.ok(!/supabase secrets set[^\n]*"</.test(src));
  });
});

for (const shell of SHELLS) {
  describe(`set_missing_secrets.sh em ${shell}`, { concurrency: true }, () => {
    test('sintaxe aceita pelo shell (-n)', () => {
      assert.equal(spawnSync(shell, ['-n', SCRIPT]).status, 0);
    });

    test('sem argumento e sem valor nenhum: dry-run, não chama a CLI, lista tudo como faltando', () => {
      const r = rodar(shell);
      assert.equal(r.status, 0, r.saida);
      assert.equal(r.chamadas.length, 0);
      assert.match(r.stdout, /Dry-run: nada foi enviado/);
      for (const n of nomesDoScript()) assert.match(r.stdout, new RegExp(`- ${n}\\b`));
    });

    test('dry-run com valores: mostra só os nomes, nunca o valor, e não chama a CLI', () => {
      const r = rodar(shell, [], { arquivo: 'RESEND_API_KEY=re_zzzzzzzzzz\nGOOGLE_API_KEY=gg_yyyyyyyyyy\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 0, r.saida);
      assert.equal(r.chamadas.length, 0);
      assert.match(r.stdout, /\+ RESEND_API_KEY/);
      assert.match(r.stdout, /\+ GOOGLE_API_KEY/);
      assert.ok(!/zzzzzzzzzz|yyyyyyyyyy/.test(r.saida));
      assert.ok(!r.saida.includes(TOKEN));
    });

    test('--apply sem SUPABASE_ACCESS_TOKEN: falha e não chama a CLI', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\n' });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /SUPABASE_ACCESS_TOKEN/);
      assert.equal(r.chamadas.length, 0);
    });

    test('--apply com SUPABASE_ACCESS_TOKEN vazio: falha', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\n', env: { SUPABASE_ACCESS_TOKEN: '' } });
      assert.equal(r.status, 1);
      assert.equal(r.chamadas.length, 0);
    });

    test('--apply sem a CLI no PATH: falha com mensagem', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN }, semCli: true });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /supabase/);
    });

    test('--apply: uma chamada só, com o token no ambiente, --project-ref certo e só o que tem valor', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\nMELHOR_ENVIO_TOKEN=tok\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { MELHOR_ENVIO_TOKEN: 'tok', RESEND_API_KEY: 're_abc' });
      assert.ok(r.comToken);
      assert.match(r.stdout, /Done: 2 secret\(s\) enviados/);
      assert.ok(!/re_abc/.test(r.saida));
    });

    test('valor com espaço, aspas, $, =, crase, $( ), *, \\, # e acento chega intacto', () => {
      const valores = {
        RODONAVES_PASSWORD: 'se nha com espaço',
        LALAMOVE_API_SECRET: 'a"b\'c',
        OPENAI_API_KEY: 'sk-$HOME-${PATH}-$(id)-`id`',
        BITRIX24_WEBHOOK_URL: 'https://x.bitrix24.com.br/rest/1/abc=def==/?a=1&b=2',
        RESEND_API_KEY: '* ? [a] ~ ! ; | > < \\n \\\\ #nao-e-comentario',
        EVOLUTION_API_KEY: '--parece-flag',
        CARRIER_WEBHOOK_SECRET: 'çãõ-ünïcödé',
        NEXUS_WEBHOOK_SECRET: '<nao fecha',
        GOOGLE_API_KEY: 'fecha sem abrir>',
      };
      const r = rodar(shell, ['--apply'], { arquivo: Object.entries(valores).map(([k, v]) => `${k}=${v}`).join('\n'), env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), valores);
      for (const v of Object.values(valores)) assert.ok(!r.saida.includes(v), `valor na saída: ${v}`);
    });

    test('mesmos valores vindos do ambiente (sem --env-file), inclusive com quebra de linha', () => {
      const valores = { RODONAVES_PASSWORD: 'duas\nlinhas', OPENAI_API_KEY: 'sk-$HOME "x" \'y\' =z', FIELD_ENCRYPTION_KEY: 'k'.repeat(64) };
      const r = rodar(shell, ['--apply'], { env: { SUPABASE_ACCESS_TOKEN: TOKEN, NAO_E_SECRET: 'fica de fora', ...valores } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), valores);
      assert.match(r.stdout, /variaveis de ambiente/);
    });

    test('com --env-file o ambiente é ignorado: chave pessoal exportada no shell não vai junto', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN, OPENAI_API_KEY: 'sk-chave-pessoal-do-dev' } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { RESEND_API_KEY: 're_abc' });
    });

    test('placeholder nunca chega à CLI (os literais da versão antiga, PLACEHOLDER_NEEDS_SETUP, vazio, só espaços)', () => {
      const antigos = ['<usuario_portal_rodonaves>', '<senha_portal_rodonaves>', '<cnpj_sem_mascara>', '<token_melhor_envio>', '<lalamove_api_key>',
        '<lalamove_api_secret>', '<sk-...>', '<pk.eyJ1Ijo...>', '<openweather_key>', '<re_...>', '<aticket_key>',
        '<https://hooks.slack.com/services/...>', '<https://promobrindes.bitrix24.com.br/rest/1/...>', '<https://...upstash.io>', '<AX...>', '<hex_64_chars>'];
      const nomes = nomesDoScript();
      const linhas = antigos.map((v, i) => `${nomes[i]}=${v}`);
      linhas.push(`${nomes[16]}=PLACEHOLDER_NEEDS_SETUP`, `${nomes[17]}=placeholder`, `${nomes[18]}=`, `${nomes[19]}=   `, `${nomes[20]}="<entre aspas>"`, `${nomes[21]}=valor-real`);
      const r = rodar(shell, ['--apply'], { arquivo: linhas.join('\n'), env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { [nomes[21]]: 'valor-real' });
      for (let i = 0; i <= 20; i++) assert.match(r.stdout, new RegExp(`! ${nomes[i]}\\b`), `${nomes[i]} devia aparecer como ignorado`);
    });

    test('placeholder vindo do ambiente também fica de fora', () => {
      const r = rodar(shell, ['--apply'], { env: { SUPABASE_ACCESS_TOKEN: TOKEN, MELHOR_ENVIO_TOKEN: '<token_melhor_envio>', RESEND_API_KEY: 're_ok' } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { RESEND_API_KEY: 're_ok' });
    });

    test('--apply sem nenhum valor real: sai com 1 e não chama a CLI', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=<re_...>\nOPENAI_API_KEY=\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /nenhum secret/);
      assert.equal(r.chamadas.length, 0);
    });

    test('falha da CLI: propaga o código, avisa e não diz "Done"', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN, STUB_EXIT: '7' } });
      assert.equal(r.status, 7);
      assert.match(r.stderr, /falhou \(codigo 7\)/);
      assert.ok(!/Done/.test(r.stdout));
      assert.ok(!/re_abc/.test(r.saida));
    });

    test('com xtrace ligado por fora (sh -x) o valor continua sem aparecer', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_nnnnnnnnnnnn\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN }, flagsShell: ['-x'] });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { RESEND_API_KEY: 're_nnnnnnnnnnnn' });
      assert.ok(!r.saida.includes('nnnnnnnnnnnn'), r.saida);
      assert.ok(!r.saida.includes(TOKEN));
    });

    test('arquivo: comentário, linha vazia, export, aspas simples/duplas, espaços, CRLF e última linha sem \\n', () => {
      const arquivo = '# comentario\r\n\r\n  # outro\r\nexport RESEND_API_KEY="re com espaço"\r\nOPENAI_API_KEY=\'sk-$nao-expande\'\r\n  MELHOR_ENVIO_TOKEN =  tok-sem-aspas  \r\nGOOGLE_API_KEY=a#b c';
      const r = rodar(shell, ['--apply'], { arquivo, env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { RESEND_API_KEY: 're com espaço', OPENAI_API_KEY: 'sk-$nao-expande', MELHOR_ENVIO_TOKEN: 'tok-sem-aspas', GOOGLE_API_KEY: 'a#b c' });
    });

    test('nome que não é secret esperado (erro de digitação): recusa tudo, cita a linha e não o valor', () => {
      const r = rodar(shell, ['--apply'], { arquivo: 'RESEND_API_KEY=re_abc\nRESEND_APIKEY=valor-do-typo\n', env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 2);
      assert.match(r.stderr, /linha 2: RESEND_APIKEY/);
      assert.ok(!r.saida.includes('valor-do-typo'));
      assert.equal(r.chamadas.length, 0);
    });

    for (const [caso, arquivo, padrao] of [
      ['nome repetido', 'RESEND_API_KEY=a\nRESEND_API_KEY=b\n', /linha 2: RESEND_API_KEY aparece mais de uma vez/],
      ['linha sem =', 'RESEND_API_KEY=a\nisto-nao-e-atribuicao-segredo\n', /linha 2: esperado NOME=valor/],
      ['nome inválido', 'resend_api_key=a\n', /linha 1: nome de variavel invalido/],
      ['tentativa de injeção no nome', 'X;touch INJETADO=a\n', /linha 1: nome de variavel invalido/],
    ]) {
      test(`arquivo com ${caso}: sai com 2 sem ecoar o conteúdo`, () => {
        const r = rodar(shell, ['--apply'], { arquivo, env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
        assert.equal(r.status, 2, r.saida);
        assert.match(r.stderr, padrao);
        assert.ok(!r.saida.includes('segredo'));
        assert.equal(r.chamadas.length, 0);
        assert.ok(!fs.existsSync(path.join(r.dir, 'INJETADO')));
      });
    }

    test('conteúdo do arquivo nunca é executado ($(...) e crase ficam literais, nada é criado)', () => {
      const r = rodar(shell, [], { arquivo: 'RESEND_API_KEY=$(touch EXECUTOU)\nOPENAI_API_KEY=`touch EXECUTOU`\n' });
      assert.equal(r.status, 0, r.saida);
      assert.ok(!fs.existsSync(path.join(r.dir, 'EXECUTOU')));
    });

    test('FIELD_ENCRYPTION_KEY com menos de 32 caracteres: recusa (as functions falhariam fechado)', () => {
      const r = rodar(shell, ['--apply'], { arquivo: `FIELD_ENCRYPTION_KEY=${'a'.repeat(31)}\nRESEND_API_KEY=re_abc\n`, env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /menos de 32/);
      assert.equal(r.chamadas.length, 0);
    });

    test('FIELD_ENCRYPTION_KEY válida: envia e avisa do risco de trocar chave em uso', () => {
      const chave = 'f'.repeat(64);
      const r = rodar(shell, ['--apply'], { arquivo: `FIELD_ENCRYPTION_KEY=${chave}\n`, env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 0, r.saida);
      assert.deepEqual(enviados(r), { FIELD_ENCRYPTION_KEY: chave });
      assert.match(r.stderr, /ATENCAO/);
      assert.ok(!r.saida.includes(chave));
    });

    for (const [caso, args, padrao] of [
      ['argumento desconhecido', ['--aplicar'], /argumento desconhecido/],
      ['--env-file sem caminho', ['--env-file'], /precisa do caminho/],
      ['arquivo inexistente', ['--env-file', '/nao/existe.env'], /nao encontrado/],
    ]) {
      test(`${caso}: sai com 2 e não chama a CLI`, () => {
        const r = rodar(shell, args, { env: { SUPABASE_ACCESS_TOKEN: TOKEN, RESEND_API_KEY: 're_abc' } });
        assert.equal(r.status, 2, r.saida);
        assert.match(r.stderr, padrao);
        assert.equal(r.chamadas.length, 0);
      });
    }

    test('--env-file=CAMINHO (com espaço no caminho) funciona como --env-file CAMINHO', () => {
      const base = rodar(shell, [], { arquivo: 'RESEND_API_KEY=re_abc\n' });
      const r = spawnSync(shell, [SCRIPT, `--env-file=${path.join(base.dir, 'valores.env')}`], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /\+ RESEND_API_KEY/);
    });

    test('--help sai com 0; --list devolve só nomes; --modelo gera arquivo que o próprio script aceita', () => {
      assert.equal(rodar(shell, ['--help']).status, 0);
      const lista = rodar(shell, ['--list']);
      assert.equal(lista.status, 0);
      assert.ok(lista.stdout.trim().split('\n').every((l) => /^[A-Z][A-Z0-9_]*$/.test(l)));
      const modelo = rodar(shell, ['--modelo']);
      assert.equal(modelo.status, 0);
      assert.ok(nomesDoScript().every((n) => new RegExp(`^${n}=$`, 'm').test(modelo.stdout)));
      const r = rodar(shell, ['--apply'], { arquivo: modelo.stdout, env: { SUPABASE_ACCESS_TOKEN: TOKEN } });
      assert.equal(r.status, 1); // modelo vazio: nada a enviar
      assert.equal(r.chamadas.length, 0);
    });

    test('arquivo de segredos dentro de repositório git e não ignorado: recusa; ignorado: aceita', () => {
      const repo = fs.mkdtempSync(path.join(tmp, 'repo-'));
      assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
      fs.writeFileSync(path.join(repo, 'segredos.env'), 'RESEND_API_KEY=re_abc\n');
      const exec = () => spawnSync(shell, [SCRIPT, '--env-file', path.join(repo, 'segredos.env')], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
      let r = exec();
      assert.equal(r.status, 2, r.stdout + r.stderr);
      assert.match(r.stderr, /dentro de um repositorio git/);
      fs.writeFileSync(path.join(repo, '.gitignore'), 'segredos.env\n');
      r = exec();
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /\+ RESEND_API_KEY/);
    });
  });
}
