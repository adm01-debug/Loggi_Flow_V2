// Teste do gerador de contexto (scripts/ai-context/gerar.mjs).
// Monta um repositório sintético em pasta temporária cobrindo os casos que o gerador precisa
// entender (rotas aninhadas, lazy, menu, hooks, edge functions, migrations em ordem,
// barrel re-export, backend HTTP, Python, nested tsconfig) e confere a saída.
// Rodar: node --test scripts/ai-context/gerar.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const GERADOR = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'gerar.mjs');
const w = (root, rel, text) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-ia-'));
  w(root, 'package.json', JSON.stringify({ name: 'fixture', version: '1.0.0', scripts: { dev: 'vite', test: 'vitest run', audit: 'node scripts/audit.mjs' }, dependencies: { react: '18', 'react-router-dom': '6', '@supabase/supabase-js': '2', express: '4', stripe: '14' }, devDependencies: { vitest: '1', typescript: '5', vite: '5' } }));
  w(root, 'tsconfig.json', JSON.stringify({ compilerOptions: { strict: true, paths: { '@/*': ['./src/*'] } } }));
  w(root, '.env.example', 'VITE_SUPABASE_URL=\nVITE_API_KEY=\n');
  w(root, 'README.md', '# Fixture\n');
  w(root, 'src/main.tsx', `import { QueryClientProvider } from '@tanstack/react-query';\nimport { AppRoutes } from '@/routes/AppRoutes';\nexport const Root = () => <QueryClientProvider><AppRoutes/></QueryClientProvider>;`);
  w(root, 'src/routes/AppRoutes.tsx', `import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Login from '@/pages/Login';
import { lazy } from 'react';
const Admin = lazy(() => import('@/pages/admin/Admin'));
export function AppRoutes() {
  return (<Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/app" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
      <Route index element={<Home />} />
      <Route path="contacts/:id" element={<ContactPage />} />
    </Route>
    <Route path="/admin" element={<Admin />} />
    <Route {...{ path: '/access-denied' }} element={<Login />} />
    <Route path="/old" element={<Navigate to="/app" />} />
  </Routes>);
}
import { Shell } from '@/components/layout/Shell';
import { Home } from '@/components/home/Home';
import { ContactPage } from '@/components/contacts/ContactPage';`);
  w(root, 'src/components/auth/ProtectedRoute.tsx', `export const ProtectedRoute = ({ children }) => <>{children}</>;`);
  w(root, 'src/components/layout/Shell.tsx', `import { Outlet } from 'react-router-dom';\nexport const Shell = () => <div><Outlet/></div>;`);
  w(root, 'src/pages/ViewRouter.tsx', `import * as Views from '@/pages/lazyViews';\nconst VIEW_MAP = { home: Views.HomeLazy };\nconst SPECIAL_VIEWS = {\n  'achievements': (props) => (\n    <Boundary><Views.AchievementsLazy userId={props.userId} /></Boundary>\n  ),\n};\nexport const ViewRouter = ({ v }) => SPECIAL_VIEWS[v] ? SPECIAL_VIEWS[v]({}) : null;`);
  w(root, 'src/pages/lazyViews.ts', `import { lazy } from 'react';\nexport const HomeLazy = lazy(() => import('@/components/home/Home').then(m => ({ default: m.Home })));\nexport const AchievementsLazy = lazy(() => import('@/components/achievements/Achievements'));`);
  w(root, 'src/components/achievements/Achievements.tsx', `export default function Achievements() { return <ol/>; }`);
  w(root, 'src/components/layout/sidebarNav.ts', `const STAFF: string[] = ['admin', 'supervisor'];\nexport const sidebarGroups = [{ title: 'Principal', items: [{ id: 'home', label: 'Início', path: '/app' }, { id: 'contacts', label: 'Contatos', path: '/app/contacts/:id', roles: ['admin'] }, { id: 'staff', label: 'Equipe', path: '/admin', roles: STAFF }, { id: 'x', label: 'Externo', path: '/login', roles: EXTERNAL }, { id: 'ghost', label: 'Fantasma', path: '/nada' }] }];`);
  w(root, 'src/components/home/Home.tsx', `import { useContacts } from '@/hooks/useContacts';\nexport const Home = () => { const c = useContacts(); return <div>{c.length}</div>; };`);
  w(root, 'src/components/contacts/ContactPage.tsx', `import { Card } from '@/components/ui';\nimport { useContacts } from '@/hooks/useContacts';\nexport const ContactPage = () => { useContacts(); return <Card/>; };`);
  w(root, 'src/components/ui/index.ts', `export { Card } from './Card';\nexport * from './Button';`);
  w(root, 'src/components/ui/Card.tsx', `export const Card = () => <div/>;`);
  w(root, 'src/components/ui/Button.tsx', `export const Button = () => <button/>;`);
  w(root, 'src/components/ui/Unused.tsx', `export const Unused = () => <i/>;`);
  w(root, 'src/pages/Login.tsx', `export default function Login() { return <form/>; }`);
  w(root, 'src/pages/admin/Admin.tsx', `import { supabase } from '@/lib/supabase';\nexport const Admin = () => { const role = 'admin'; if (role === 'admin') supabase.rpc('is_admin'); return <div/>; };`);
  w(root, 'src/hooks/useContacts.ts', `import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
export function useContacts() { return useQuery(['c'], async () => { const { data } = await supabase.from('contacts').select('*'); await supabase.functions.invoke('send-email', { body: {} }); return data; }); }`);
  w(root, 'src/lib/supabase.ts', `import { createClient } from '@supabase/supabase-js';\nexport const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_ANON);\nconst flag = isFeatureEnabled('novo-inbox');`);
  w(root, 'src/hooks/__tests__/useContacts.test.ts', `import { useContacts } from '../useContacts';\nit('x', () => {}); test('y', () => {});`);
  w(root, 'server/api.ts', `import express from 'express';\nconst app = express();\napp.get('/health', (req, res) => res.send('ok'));\napp.post('/webhook/stripe', handler);`);
  w(root, 'backend/app.py', `from fastapi import FastAPI\nimport os\nfrom . import models\napp = FastAPI()\n@app.get('/items')\ndef items():\n    return os.environ.get('DB_URL')\n`);
  w(root, 'backend/models.py', `from sqlalchemy.orm import DeclarativeBase\nclass Base(DeclarativeBase):\n    pass\nclass Item(Base):\n    pass\n`);
  w(root, 'supabase/config.toml', `project_id = "x"\n\n[functions.stripe-webhook]\nverify_jwt = false\n`);
  w(root, 'supabase/functions/send-email/index.ts', `const key = Deno.env.get('RESEND_API_KEY');\nDeno.serve(async (req) => { if (req.method === 'POST') { await supabase.from('emails').insert({}); } return fetch('https://api.resend.com/x'); });`);
  w(root, 'supabase/functions/stripe-webhook/index.ts', `Deno.serve(async (req) => { await supabase.from('payments').insert({}); return new Response('ok'); });`);
  w(root, 'supabase/functions/orphan-fn/index.ts', `Deno.serve(() => new Response('x'));`);
  w(root, 'supabase/migrations/001_init.sql', `create table public.contacts (id uuid primary key default gen_random_uuid(), name text not null, email text, "createdAt" timestamptz default now(), lat double precision, created2 timestamp with time zone);
alter table public.contacts enable row level security;
create policy "contacts_select" on public.contacts for select to authenticated using (true);
create index contacts_email_idx on public.contacts (email);
create table public.legacy (id int);
create table public.emails (id uuid primary key, contact_id uuid references public.contacts(id));
create or replace function public.is_admin(uid uuid) returns boolean language sql as $$ select true; $$;
create type public.app_role as enum ('admin', 'agent');
insert into storage.buckets (id, name) values ('avatars', 'avatars');
select cron.schedule('nightly', '0 3 * * *', $$ select net.http_post('https://x.supabase.co/functions/v1/send-email') $$);`);
  w(root, 'supabase/migrations/002_evolve.sql', `alter table public.contacts add column phone text, drop column email;
drop policy if exists "contacts_select" on public.contacts;
create policy "contacts_select" on public.contacts for select to authenticated using (auth.uid() = id);
create policy "contacts_insert" on public.contacts for insert to authenticated with check (true);
drop table public.legacy;
create table public.payments (id uuid primary key, amount numeric);
create trigger trg_pay after insert on public.payments for each row execute function public.is_admin();
alter table public.contacts alter column phone set not null, alter column phone set default 'n/a';
do $$ begin
  drop policy if exists "contacts_insert" on public.contacts;
  create policy "contacts_insert" on public.contacts for insert to service_role with check (true);
  execute format('create policy %I on public.payments for select using (true)', 'dyn');
end $$;`);
  w(root, 'src/integrations/supabase/types.ts', `export type Database = {\n  public: {\n    Tables: {\n      contacts: {\n        Row: {\n          id: string\n          name: string\n          phone: string | null\n          extra_col: string\n        }\n        Insert: { id?: string }\n      }\n    }\n  }\n}`);
  w(root, 'scripts/audit.mjs', `// Audita o banco.\nconsole.log(process.env.DB_URL);`);
  w(root, 'scripts/orphan.sh', `#!/bin/sh\necho x`);
  w(root, '.github/workflows/ci.yml', `name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm run test\n      - run: node scripts/audit.mjs\n        env:\n          T: \${{ secrets.DB_TOKEN }}\n`);
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'feat: fixture'], { cwd: root });
  return root;
}

const root = fixture();
const out = path.join(root, 'inventario/ia');
execFileSync(process.execPath, [GERADOR, '--quiet'], { cwd: root });
const J = (f) => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8'));
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('gera todos os arquivos e sem erros de seção', () => {
  for (const f of ['INDEX.md', 'manifest.json', 'rotas.json', 'modulos.json', 'componentes.json', 'hooks.json', 'edge-functions.json', 'banco.json', 'ferramentas.json', 'scripts.json', 'testes.json', 'logica.json', 'grafo.json', 'grafo-arestas.json', 'convencoes.json', 'baseline.json', 'grafo-graphify.json']) assert.ok(fs.existsSync(path.join(out, f)), f);
  assert.deepEqual(J('manifest.json').erros, []);
  assert.equal(J('manifest.json').commit.length, 40);
});

test('rotas: aninhamento, index, lazy, proteção herdada e fecho transitivo', () => {
  const r = J('rotas.json'); const by = Object.fromEntries(r.urls.filter((u) => !u.indice).map((u) => [u.caminho, u]));
  assert.equal(by['/login'].arquivo, 'src/pages/Login.tsx');
  assert.equal(by['/app'].arquivo, 'src/components/layout/Shell.tsx');
  assert.equal(by['/app'].protegida, true);
  assert.equal(by['/app/contacts/:id'].arquivo, 'src/components/contacts/ContactPage.tsx');
  assert.equal(by['/app/contacts/:id'].pai, '/app');
  assert.equal(by['/app/contacts/:id'].protegida, true, 'filha herda proteção do pai');
  assert.ok(r.urls.some((u) => u.indice && u.caminho === '/app' && u.arquivo === 'src/components/home/Home.tsx'), 'rota index');
  assert.equal(by['/admin'].lazy, true);
  assert.equal(by['/admin'].arquivo, 'src/pages/admin/Admin.tsx');
  assert.deepEqual(by['/app/contacts/:id'].tabelas, ['contacts']);
  assert.deepEqual(by['/app/contacts/:id'].edges, ['send-email']);
  assert.deepEqual(by['/app/contacts/:id'].hooks_locais, ['useContacts']);
  assert.deepEqual(by['/admin'].papeis, ['admin']);
  assert.equal(by['/access-denied'].arquivo, 'src/pages/Login.tsx', 'path via spread');
  assert.equal(by['/old'].tipo, 'redirect'); assert.equal(by['/old'].redireciona, '/app');
  const vistas = Object.fromEntries(r.vistas.map((v) => [v.id, v]));
  assert.equal(vistas.home.arquivo, 'src/components/home/Home.tsx');
  assert.equal(vistas.achievements.arquivo, 'src/components/achievements/Achievements.tsx', 'SPECIAL_VIEWS com função');
});

test('rotas HTTP de backend (express) e Python (FastAPI)', () => {
  const r = J('rotas.json');
  assert.ok(r.rotas_http_backend.some((x) => x.metodo === 'GET' && x.caminho === '/health' && x.arquivo === 'server/api.ts'));
  assert.ok(r.rotas_http_backend.some((x) => x.metodo === 'GET' && x.caminho === '/items' && x.arquivo === 'backend/app.py'));
});

test('menu: resolve destino, grupo, papéis e aponta item sem destino', () => {
  const r = J('rotas.json'); const m = Object.fromEntries(r.menu.map((x) => [x.rotulo, x]));
  assert.equal(m['Início'].resolve_para, 'src/components/layout/Shell.tsx');
  assert.equal(m['Início'].grupo, 'Principal');
  assert.deepEqual(m['Contatos'].papeis, ['admin']);
  assert.deepEqual(J('baseline.json').alertas.menu_sem_destino, ['Fantasma -> /nada']);
  assert.deepEqual(m['Equipe'].papeis, ['admin', 'supervisor'], 'roles por constante');
  assert.equal(m['Externo'].papeis_nao_resolvidos, 'EXTERNAL');
});

test('módulos: menu → módulo → hooks → edges → tabelas', () => {
  const mod = J('modulos.json').modulos.find((x) => x.modulo === 'components/contacts');
  assert.deepEqual(mod.itens_menu, ['Contatos']);
  assert.deepEqual(mod.hooks_locais, ['useContacts']);
  assert.deepEqual(mod.edges, ['send-email']);
  assert.deepEqual(mod.tabelas, ['contacts']);
  assert.ok(mod.depende_de_modulos.includes('hooks/useContacts.ts') || mod.depende_de_modulos.includes('hooks'));
  assert.ok(mod.depende_de_modulos.includes('components/ui'));
});

test('barrel re-export não gera órfão; componente sem uso é órfão', () => {
  const co = J('componentes.json'); const by = Object.fromEntries(co.componentes.map((x) => [x.arquivo, x]));
  assert.equal(by['src/components/ui/Card.tsx'].orfao, false, 'reexportado pelo index.ts');
  assert.equal(by['src/components/ui/Button.tsx'].orfao, false, 'export * from');
  assert.equal(by['src/components/ui/Unused.tsx'].orfao, true);
  assert.ok(J('componentes.json').componentes.some((x) => x.arquivo === 'src/pages/Login.tsx' && x.export_default === 'Login'));
});

test('hooks: tabelas/edges e cobertura por teste', () => {
  const h = J('hooks.json').hooks.find((x) => x.arquivo === 'src/hooks/useContacts.ts');
  assert.deepEqual(h.hooks_exportados, ['useContacts']);
  assert.deepEqual(h.tabelas, ['contacts']);
  assert.equal(h.usado_por, 2);
  assert.equal(h.coberto_por_testes, 1);
  assert.equal(J('testes.json').arquivos[0].casos, 2);
});

test('edge functions: verify_jwt, env, quem chama, cron e órfãs', () => {
  const e = J('edge-functions.json'); const by = Object.fromEntries(e.edges.map((x) => [x.nome, x]));
  assert.equal(by['send-email'].verify_jwt, true);
  assert.deepEqual(by['send-email'].env, ['RESEND_API_KEY']);
  assert.deepEqual(by['send-email'].metodos, ['POST']);
  assert.deepEqual(by['send-email'].chamada_pelo_front, ['src/hooks/useContacts.ts']);
  assert.equal(by['send-email'].chamada_por_sql_ou_cron, true);
  assert.deepEqual(by['send-email'].hosts_externos, ['api.resend.com']);
  assert.equal(by['stripe-webhook'].verify_jwt, false);
  assert.equal(by['stripe-webhook'].orfa, false, 'webhook sem jwt não é órfã');
  assert.equal(by['orphan-fn'].orfa, true);
});

test('banco: migrations em ordem (add/drop coluna, drop+create policy, drop table), cron, buckets, drift', () => {
  const b = J('banco.json'); const t = b.tabelas.contacts;
  assert.deepEqual(Object.keys(t.colunas), ['created2', 'createdAt', 'id', 'lat', 'name', 'phone'], 'email removida, phone adicionada');
  assert.equal(t.colunas.lat.tipo, 'double precision');
  assert.equal(t.colunas.created2.tipo, 'timestamp with time zone');
  assert.equal(t.colunas.phone.nn, true, 'SET NOT NULL aplicado');
  assert.equal(t.colunas.phone.default, "'n/a'");
  assert.equal(t.policies.find((p) => p.nome === 'contacts_insert').para, 'service_role', 'policy recriada dentro de DO $$');
  assert.equal(b.avisos.length, 1, 'DDL dinâmico sinalizado');
  assert.equal(t.colunas.name.nn, true);
  assert.equal(t.rls, true);
  assert.deepEqual(t.policies.map((p) => p.nome + ':' + p.comando), ['contacts_insert:insert', 'contacts_select:select']);
  assert.deepEqual(t.indices.map((i) => i.nome), ['contacts_email_idx']);
  assert.equal(b.tabelas.legacy, undefined, 'drop table');
  assert.deepEqual(b.tabelas.emails.fks, ['contact_id->contacts']);
  assert.deepEqual(b.tabelas.payments.triggers, ['trg_pay']);
  assert.equal(b.tabelas.payments.sem_rls, true);
  assert.deepEqual(b.funcoes, ['is_admin']);
  assert.deepEqual(b.enums.app_role, ['admin', 'agent']);
  assert.deepEqual(b.cron_jobs, [{ nome: 'nightly', agenda: '0 3 * * *', migration: '001_init.sql', chama_edge: 'send-email' }]);
  assert.ok(b.buckets.some((x) => x.nome === 'avatars' && x.criado_em_sql));
  assert.deepEqual(t.drift, { so_na_migration: ['createdAt', 'lat', 'created2'], so_no_types: ['extra_col'] });
  assert.deepEqual(b.rpcs_usadas_no_codigo, [{ nome: 'is_admin', definida: true, usada_em: 1 }]);
});

test('ferramentas: env, workflows, scripts, integrações, permissões, flags, providers', () => {
  const f = J('ferramentas.json');
  assert.deepEqual(f.env.usadas_mas_nao_declaradas, ['VITE_ANON']);
  assert.equal(f.workflows[0].nome, 'CI');
  assert.deepEqual(f.workflows[0].gatilhos, ['pull_request', 'push']);
  assert.deepEqual(f.workflows[0].secrets, ['DB_TOKEN']);
  assert.deepEqual(f.workflows[0].scripts_usados, ['scripts/audit.mjs']);
  const s = Object.fromEntries(J('scripts.json').scripts.map((x) => [x.arquivo, x]));
  assert.deepEqual(s['scripts/audit.mjs'].npm_scripts, ['audit']);
  assert.equal(s['scripts/audit.mjs'].orfao, false);
  assert.equal(s['scripts/orphan.sh'].orfao, true);
  assert.ok(f.integracoes.sdks.some((x) => x.servico === 'Stripe'));
  assert.ok(f.integracoes.webhooks_recebidos.includes('stripe-webhook'));
  assert.ok(f.integracoes.webhooks_recebidos.includes('POST /webhook/stripe'));
  assert.deepEqual(f.permissoes.papeis_no_codigo, [{ papel: 'admin', ocorrencias: 2 }]);
  assert.deepEqual(f.feature_flags.flags, [{ flag: 'novo-inbox', arquivos: 1 }]);
  assert.ok(f.providers.providers.includes('QueryClientProvider'));
  assert.equal(f.stack.framework, 'React');
  assert.deepEqual(f.stack.backend_http, ['express', 'fastapi']);
});

test('grafo, convenções e determinismo', () => {
  const g = J('grafo.json');
  assert.ok(g.hubs[0].arquivo === 'src/lib/supabase.ts' || g.hubs[0].arquivo === 'src/hooks/useContacts.ts');
  assert.equal(g.ciclos.total, 0);
  const c = J('convencoes.json');
  assert.equal(c.alias_imports['(raiz)']['@/'], 'src/');
  assert.equal(c.typescript.strict, true);
  assert.match(c.nomenclatura.componentes, /^PascalCase/);
  const antes = fs.readFileSync(path.join(out, 'rotas.json'), 'utf8');
  execFileSync(process.execPath, [GERADOR, '--quiet'], { cwd: root });
  assert.equal(fs.readFileSync(path.join(out, 'rotas.json'), 'utf8'), antes, 'saída determinística');
  const l = J('logica.json'); assert.ok(l.arquivos.some((x) => x.arquivo === 'backend/models.py' && x.exports.includes('Item')));
});

test('INDEX.md: rodapé de publicação é genérico por padrão e segue ai-context.config.json → publicacao', () => {
  const idx = fs.readFileSync(path.join(out, 'INDEX.md'), 'utf8');
  assert.match(idx, /Publicado pelo workflow de contexto do repositório/);
  assert.doesNotMatch(idx, /contexto-ia/, 'nome de branch/workflow de um repo específico não pode estar fixo no gerador');
  w(root, 'ai-context.config.json', JSON.stringify({ publicacao: 'Publicado na branch `xyz` pelo workflow `xyz.yml`.' }));
  execFileSync(process.execPath, [GERADOR, '--quiet'], { cwd: root });
  assert.match(fs.readFileSync(path.join(out, 'INDEX.md'), 'utf8'), /Publicado na branch `xyz` pelo workflow `xyz.yml`\./);
  fs.rmSync(path.join(root, 'ai-context.config.json'));
});

function isolatedFixture(t, prepare) {
  const fixtureRoot = fixture();
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  prepare(fixtureRoot);
  execFileSync(process.execPath, [GERADOR, '--quiet'], { cwd: fixtureRoot });
  return (name) => JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'inventario/ia', name), 'utf8'));
}

test('git: histórico preserva data, assunto e barras verticais sem executar shell', (t) => {
  const read = isolatedFixture(t, (dir) => {
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--allow-empty', '-q', '-m', 'fix: assunto | literal'], { cwd: dir });
  });
  const commits = read('baseline.json').git.ultimos_commits;
  assert.equal(commits.length, 2);
  assert.equal(commits[0].assunto, 'fix: assunto | literal');
  assert.match(commits[0].sha, /^[a-f0-9]{7,40}$/);
  assert.match(commits[0].data, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(commits[1].assunto, 'feat: fixture');
});

test('banco: arquivos _foreign e _superseded não alteram a reconstrução vigente', (t) => {
  const read = isolatedFixture(t, (dir) => {
    w(dir, 'supabase/migrations/_foreign/singu/001_foreign.sql', `create table public.foreign_only (id int);
select cron.schedule('archived-job', '* * * * *', $$ select net.http_post('https://x.supabase.co/functions/v1/orphan-fn') $$);`);
    w(dir, 'supabase/migrations/_superseded/000_old.sql', `alter table public.contacts add column archived_only text;
create table public.legacy (id int);
create or replace function public.archived_fn() returns boolean language sql as $$ select true $$;
create policy "archived_policy" on public.contacts for select using (true);`);
  });
  const banco = read('banco.json');
  assert.equal(banco.migrations, 2);
  assert.equal(banco.tabelas.foreign_only, undefined);
  assert.equal(banco.tabelas.legacy, undefined);
  assert.equal(banco.tabelas.contacts.colunas.archived_only, undefined);
  assert.ok(!banco.tabelas.contacts.policies.some((p) => p.nome === 'archived_policy'));
  assert.deepEqual(banco.funcoes, ['is_admin']);
  assert.deepEqual(banco.cron_jobs.map((c) => c.nome), ['nightly']);
  const orphan = read('edge-functions.json').edges.find((e) => e.nome === 'orphan-fn');
  assert.equal(orphan.chamada_por_sql_ou_cron, false);
  assert.equal(orphan.orfa, true);
});

test('alertas de aplicação ignoram testes, stories e tooling, preservando seus inventários', (t) => {
  const read = isolatedFixture(t, (dir) => {
    const sample = `supabase.from('ghost_table').select('*'); supabase.rpc('ghost_rpc');
supabase.functions.invoke('ghost-edge'); supabase.functions.invoke('orphan-fn');`;
    for (const file of ['src/__tests__/calls.test.ts', 'src/components/Demo.stories.tsx', 'supabase/functions/send-email/sample.test.ts',
      'scripts/check.mjs', 'tools/check.mjs', '.github/scripts/check.mjs', 'docs/example.ts', 'packages/demo/scripts/check.mjs']) w(dir, file, sample);
    w(dir, 'worker/job.ts', `supabase.from('runtime_table').select('*'); supabase.rpc('runtime_rpc');
supabase.functions.invoke('runtime-missing'); supabase.functions.invoke('runtime-fn');`);
    w(dir, 'supabase/functions/runtime-fn/index.ts', `Deno.serve(() => new Response('ok'));`);
  });
  const baseline = read('baseline.json');
  assert.deepEqual(baseline.alertas.tabelas_usadas_sem_definicao, ['runtime_table']);
  assert.deepEqual(baseline.alertas.rpcs_sem_definicao, ['runtime_rpc']);
  assert.deepEqual(baseline.alertas.edges_chamadas_sem_pasta, ['runtime-missing']);
  const edges = Object.fromEntries(read('edge-functions.json').edges.map((e) => [e.nome, e]));
  assert.equal(edges['orphan-fn'].orfa, true);
  assert.deepEqual(edges['orphan-fn'].chamada_pelo_front, []);
  assert.deepEqual(edges['orphan-fn'].chamada_por_edges, []);
  assert.equal(edges['runtime-fn'].orfa, false);
  assert.deepEqual(edges['runtime-fn'].chamada_pelo_front, ['worker/job.ts']);
  assert.ok(read('scripts.json').scripts.some((s) => s.arquivo === 'scripts/check.mjs'));
  assert.ok(read('testes.json').arquivos.some((s) => s.arquivo === 'src/__tests__/calls.test.ts'));
});

test('alertas respeitam srcDirs explícito quando uma pasta de ferramentas contém a aplicação', (t) => {
  const read = isolatedFixture(t, (dir) => {
    w(dir, 'ai-context.config.json', JSON.stringify({ srcDirs: ['tools'] }));
    w(dir, 'tools/app.ts', `supabase.from('tools_runtime').select('*'); supabase.rpc('tools_rpc'); supabase.functions.invoke('tools-edge');`);
  });
  const alerts = read('baseline.json').alertas;
  assert.ok(alerts.tabelas_usadas_sem_definicao.includes('tools_runtime'));
  assert.ok(alerts.rpcs_sem_definicao.includes('tools_rpc'));
  assert.ok(alerts.edges_chamadas_sem_pasta.includes('tools-edge'));
});

test('diretórios de fixtures permanecem no inventário de testes sem criar alertas de aplicação', (t) => {
  const fixtureFiles = ['src/fixtures/calls.ts', 'src/components/__fixtures__/calls.ts',
    'supabase/functions/send-email/fixtures/calls.ts', 'packages/demo/src/__fixtures__/calls.ts'];
  const read = isolatedFixture(t, (dir) => {
    const sample = `supabase.from('fixture_table').select('*'); supabase.rpc('fixture_rpc');
supabase.functions.invoke('fixture-edge'); supabase.functions.invoke('orphan-fn');`;
    for (const file of fixtureFiles) w(dir, file, sample);
    w(dir, 'src/fixtures-dashboard.ts', `supabase.from('dashboard_table').select('*');
supabase.rpc('dashboard_rpc'); supabase.functions.invoke('dashboard-edge');`);
  });
  const alerts = read('baseline.json').alertas;
  assert.deepEqual(alerts.tabelas_usadas_sem_definicao, ['dashboard_table']);
  assert.deepEqual(alerts.rpcs_sem_definicao, ['dashboard_rpc']);
  assert.deepEqual(alerts.edges_chamadas_sem_pasta, ['dashboard-edge']);
  const files = new Set(read('testes.json').arquivos.map((entry) => entry.arquivo));
  for (const file of fixtureFiles) assert.ok(files.has(file), file);
  assert.ok(!files.has('src/fixtures-dashboard.ts'));
  const orphan = read('edge-functions.json').edges.find((edge) => edge.nome === 'orphan-fn');
  assert.equal(orphan.orfa, true);
  assert.deepEqual(orphan.chamada_pelo_front, []);
  assert.deepEqual(orphan.chamada_por_edges, []);
});

// ---------------------------------------------------------------------------------------------
// Regressões achadas auditando a saída sobre o repositório real (cada teste = fixture mínima).
// ---------------------------------------------------------------------------------------------
const PKG_MIN = JSON.stringify({ name: 'm', scripts: { 'graph:update': 'graphify update .' }, dependencies: { react: '18', 'react-router-dom': '6', '@supabase/supabase-js': '2' } });
const TS_MIN = JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } });
function mini(t, files, { args = [], env = {}, antes, limpar } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-ia-mini-'));
  t.after(() => { if (limpar) limpar(dir); fs.rmSync(dir, { recursive: true, force: true }); });
  for (const [rel, text] of Object.entries({ 'package.json': PKG_MIN, 'tsconfig.json': TS_MIN, ...files })) if (text !== null) w(dir, rel, text);
  if (antes) antes(dir);
  execFileSync(process.execPath, [GERADOR, '--quiet', ...args], { cwd: dir, env: { ...process.env, ...env } });
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, 'inventario/ia', name), 'utf8'));
  read.dir = dir;
  return read;
}
const cli = (cwd, args, env = {}) => { try { return { status: 0, stdout: execFileSync(process.execPath, [GERADOR, ...args], { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }).toString(), stderr: '' }; } catch (e) { return { status: e.status, stdout: String(e.stdout || ''), stderr: String(e.stderr || '') }; } };
const pagina = (nome) => `export default function ${nome}() { return <div/>; }`;

test('rotas: a tela não se protege pelo próprio nome; guarda sozinho (com ou sem path) protege os filhos', (t) => {
  const read = mini(t, {
    'src/pages/Auth.tsx': pagina('Auth'), 'src/pages/Home.tsx': pagina('Home'), 'src/pages/AdminPanel.tsx': pagina('AdminPanel'), 'src/pages/Conta.tsx': pagina('Conta'), 'src/pages/Perfil.tsx': pagina('Perfil'),
    'src/components/ProtectedRoute.tsx': 'export const ProtectedRoute = ({ children }) => <>{children}</>;',
    'src/App.tsx': `import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
const Auth = lazy(() => import('./pages/Auth'));
const Home = lazy(() => import('./pages/Home'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Conta = lazy(() => import('./pages/Conta'));
const Perfil = lazy(() => import('./pages/Perfil'));
export const App = () => (<Routes>
  <Route path="/auth" element={<Auth />} />
  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
  <Route path="/admin" element={<AdminPanel />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/conta" element={<Conta />} />
  </Route>
  <Route path="/area" element={<ProtectedRoute />}>
    <Route path="perfil" element={<Perfil />} />
  </Route>
  <Route path="*" element={<Auth />} />
</Routes>);`,
  });
  const by = Object.fromEntries(read('rotas.json').urls.map((u) => [u.caminho, u]));
  assert.equal(by['/auth'].protegida, false, 'página de login <Auth/> é pública');
  assert.equal(by['/auth'].arquivo, 'src/pages/Auth.tsx');
  assert.equal(by['/'].protegida, true);
  assert.equal(by['/admin'].protegida, false, 'sem wrapper não há guarda na rota');
  assert.equal(by['/conta'].protegida, true, 'filha de layout-guarda sem path');
  assert.equal(by['/area'].protegida, true, 'guarda sozinho como element');
  assert.equal(by['/area/perfil'].protegida, true);
  assert.equal(by['/*'].protegida, false, 'catch-all "*" sai normalizado como "/*"');
  assert.deepEqual(read('ferramentas.json').permissoes.rotas_publicas, ['/*', '/admin', '/auth']);
});

test('fixtures de teste e scripts de ferramenta não viram fatos da aplicação', (t) => {
  const isca = `const s = \`app.get('/falsa', h); export function useFalso() {} const f = useFeatureFlag('flag-falsa');
if (user.role === 'papel_falso') {} fetch('https://host-falso.example.net/x'); supabase.channel('canal-falso'); supabase.storage.from('bucket-falso');
export const users = pgTable('tabela_drizzle_falsa', { id: uuid('id') });\n@Entity('tabela_typeorm_falsa')\nexport class U {}\`;`;
  const read = mini(t, {
    'scripts/cenarios.mjs': isca, 'scripts/x.unit.mjs': isca, 'tools/gen.mjs': isca, 'src/__tests__/y.test.ts': isca,
    'scripts/modelos.py': 'class Fantasma(Base):\n    pass\n@app.get("/py-falsa")\ndef f(): pass\n',
    'src/hooks/useReal.ts': `export const useReal = () => { if (user.role === 'admin') {} return fetch('https://api.real.dev/x'); };`,
    'server/api.ts': `app.get('/real', h);`,
  });
  assert.deepEqual(read('rotas.json').rotas_http_backend.map((r) => `${r.metodo} ${r.caminho}`), ['GET /real']);
  assert.deepEqual(read('hooks.json').hooks.map((h) => h.arquivo), ['src/hooks/useReal.ts']);
  const f = read('ferramentas.json');
  assert.deepEqual(f.feature_flags.flags, []);
  assert.deepEqual(f.permissoes.papeis_no_codigo, [{ papel: 'admin', ocorrencias: 1 }]);
  assert.deepEqual(f.integracoes.hosts_externos, [{ host: 'api.real.dev', arquivos: 1 }]);
  assert.deepEqual(f.integracoes.realtime, []);
  const b = read('banco.json');
  assert.deepEqual(Object.keys(b.tabelas), [], 'pgTable/@Entity/classe Python em fixture não criam tabela');
  assert.deepEqual(b.fonte, []);
  assert.deepEqual(b.buckets, []);
  assert.ok(read('scripts.json').scripts.some((s) => s.arquivo === 'scripts/cenarios.mjs'), 'continua no inventário de scripts');
});

test('teste no padrão Deno (*_test.ts) é teste: não infla a edge, não vaza env e conta como cobertura', (t) => {
  const read = mini(t, {
    'supabase/functions/pagar/index.ts': `Deno.serve(() => new Response(Deno.env.get('PAGAR_KEY')));`,
    'supabase/functions/pagar/index_test.ts': `import '../pagar/index.ts';\nconst u = Deno.env.get('VITE_SUPABASE_URL');\nDeno.test('a', () => {});`,
    'supabase/functions/sem-teste/index.ts': `Deno.serve(() => new Response('x'));`,
  });
  const e = Object.fromEntries(read('edge-functions.json').edges.map((x) => [x.nome, x]));
  assert.equal(e.pagar.arquivos, 1);
  assert.deepEqual(e.pagar.env, ['PAGAR_KEY']);
  assert.equal(e.pagar.testes, 1);
  const tst = read('testes.json');
  assert.deepEqual(tst.arquivos.map((a) => a.arquivo), ['supabase/functions/pagar/index_test.ts']);
  assert.deepEqual(tst.onde_ficam, [{ padrao: 'co-localizado (*.test)', arquivos: 1 }]);
  assert.deepEqual(tst.sem_teste.edges, ['sem-teste']);
  assert.deepEqual(read('ferramentas.json').env.usadas_nas_edges, ['PAGAR_KEY']);
  assert.ok(!read('grafo.json').orfaos.includes('supabase/functions/pagar/index_test.ts'));
});

test('storage.from() é bucket, não tabela (inclusive quebrado em duas linhas); Buffer/Array.from não é tabela', (t) => {
  const read = mini(t, {
    'supabase/migrations/1.sql': `create table public.entregas (id int); insert into storage.buckets (id, name) values ('avatars', 'avatars');`,
    'src/a.ts': `export const up = () => supabase.storage\n  .from('avatars')\n  .upload('x', f);\nexport const url = () => supabase.storage.from("documents").getPublicUrl('y');
export const q = () => supabase.from('entregas').select('*');\nconst b = Buffer.from('aGVsbG8', 'base64'); const c = Array.from('abc'); const d = Uint8Array.from('1');`,
  });
  const b = read('banco.json');
  assert.deepEqual(b.tabelas_usadas_no_codigo_sem_definicao, []);
  assert.equal(b.tabelas.entregas.usada_no_front, 1);
  assert.deepEqual(b.buckets, [{ nome: 'avatars', criado_em_sql: true, usado_em: 1 }, { nome: 'documents', criado_em_sql: false, usado_em: 1 }]);
});

test('"/*" dentro de string não abre comentário e o número da linha sobrevive a comentário de bloco', (t) => {
  const jwt = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0', 'abc123abc123'].join('.'); // sintético (jwt.io), montado em runtime
  const read = mini(t, {
    'src/components/Upload.tsx': `/**\n * Cabeçalho\n * de três linhas\n */\nimport { useX } from '@/hooks/useX';\nexport const Upload = () => {\n  const k = '${jwt}';\n  return (<div>\n    <input type="file" accept="image/*" />\n    {useX() && supabase.from('recibos').select('*')}\n    {/* fim */}\n  </div>);\n};\n`,
    'src/hooks/useX.ts': `export const useX = () => 1;`,
    'vite.config.ts': `export default { include: ['src/**/*.ts'], alias: 1 };\nexport const depois = supabase.from('apos_glob');\n/* fim */\n`,
  });
  const c = read('componentes.json').componentes.find((x) => x.arquivo === 'src/components/Upload.tsx');
  assert.deepEqual(c.tabelas, ['recibos'], 'código entre "image/*" e o próximo */ não pode sumir');
  assert.deepEqual(c.hooks_locais, ['useX']);
  assert.ok(read('banco.json').tabelas_usadas_no_codigo_sem_definicao.includes('apos_glob'));
  assert.deepEqual(read('baseline.json').alertas.possiveis_segredos_no_codigo, ['src/components/Upload.tsx:7'], 'linha real do arquivo');
  for (const f of fs.readdirSync(path.join(read.dir, 'inventario/ia'))) assert.ok(!fs.readFileSync(path.join(read.dir, 'inventario/ia', f), 'utf8').includes(jwt.slice(0, 30)), `valor de segredo vazou em ${f}`);
});

test('cron: job só-SQL não herda a edge do cron.schedule seguinte; vale a última definição do job', (t) => {
  const read = mini(t, {
    'supabase/migrations/1.sql': `select cron.schedule('antigo-edge', '0 1 * * *', $$ select net.http_post(url := 'https://x.supabase.co/functions/v1/velha') $$);`,
    'supabase/migrations/2.sql': `select cron.schedule('so-sql', '20 3 * * *', $$ select public.purge(30); $$);
select cron.schedule('antigo-edge', '0 2 * * *', $$ select public.agora_e_sql(); $$);
select cron.schedule('com-edge', '*/15 * * * *', $cron$ select net.http_post(url := (select s from vault.x) || '/functions/v1/monitor', body := '{}'::jsonb); $cron$);`,
  });
  assert.deepEqual(read('banco.json').cron_jobs.map((c) => [c.nome, c.agenda, c.chama_edge || null]), [['antigo-edge', '0 2 * * *', null], ['com-edge', '*/15 * * * *', 'monitor'], ['so-sql', '20 3 * * *', null]]);
});

test('banco: índice em (materialized) view não cria tabela; schema não-public e "public"."x" entre aspas', (t) => {
  const read = mini(t, {
    'supabase/migrations/1.sql': `create table public.t (id int);
create materialized view public.mv_painel as select 1 as singleton;
create unique index idx_mv on public.mv_painel (singleton);
create materialized view internal.mv_interna as select 1;
create or replace function internal.coleta() returns void language sql as $$ select 1 $$;
create or replace function internal.outra() returns void language sql as $$ select 1 $$;
create or replace function "public"."com_aspas"() returns trigger language plpgsql as $$ begin return new; end $$;
create trigger trg after insert on public.t for each row execute function internal.coleta();
create type internal.estado as enum ('a', 'b');
drop materialized view if exists internal.mv_some;`,
  });
  const b = read('banco.json');
  assert.deepEqual(Object.keys(b.tabelas), ['t']);
  assert.deepEqual(b.views, ['internal.mv_interna', 'mv_painel']);
  assert.deepEqual(b.funcoes, ['com_aspas', 'internal.coleta', 'internal.outra']);
  assert.equal(b.triggers[0].funcao, 'internal.coleta');
  assert.deepEqual(b.enums, { 'internal.estado': ['a', 'b'] });
});

test('ordem da saída não depende do locale da máquina (LC_ALL)', (t) => {
  const files = {};
  for (const n of ['Zeta', 'Tango', 'Sierra', 'Yankee', 'Whisky', 'Victor']) { files[`src/hooks/use${n}.ts`] = `export const use${n} = () => supabase.from('${n.toLowerCase()}');`; files[`src/components/${n}.tsx`] = `export const ${n} = () => <i/>;`; }
  const a = mini(t, files, { env: { LC_ALL: 'C', LANG: 'C' } }); const b = mini(t, files, { env: { LC_ALL: 'et_EE.UTF-8', LANG: 'et_EE.UTF-8' } });
  for (const f of ['hooks.json', 'componentes.json', 'banco.json', 'modulos.json', 'grafo.json', 'INDEX.md']) assert.equal(fs.readFileSync(path.join(a.dir, 'inventario/ia', f), 'utf8'), fs.readFileSync(path.join(b.dir, 'inventario/ia', f), 'utf8'), f);
});

test('CLI: --repo é --root; flag desconhecida, valor ausente e raiz inexistente saem com 2 sem escrever nada', (t) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-ia-repo-')); t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  w(repo, 'package.json', PKG_MIN); w(repo, 'src/a.ts', 'export const a = 1;'); w(repo, 'src/b.ts', 'export const b = 1;');
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-ia-cwd-')); t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  const total = (d) => JSON.parse(fs.readFileSync(path.join(d, 'manifest.json'), 'utf8')).contagens.arquivos_codigo;
  assert.equal(cli(fora, ['--quiet', '--repo', repo, '--out', 'ctx-repo']).status, 0);
  assert.equal(total(path.join(repo, 'ctx-repo')), 2, '--repo aponta a raiz; --out relativo cai dentro dela');
  assert.equal(cli(fora, ['--quiet', `--root=${repo}`, `--out=${path.join(fora, 'abs')}`]).status, 0);
  assert.equal(total(path.join(fora, 'abs')), 2, '--k=v e --out absoluto');
  assert.equal(cli(path.join(repo, 'src'), ['--quiet', '--root', '..', '--out', 'ctx-rel']).status, 0);
  assert.equal(total(path.join(repo, 'ctx-rel')), 2, '--root relativo ao cwd');
  for (const [args, msg] of [[['--raiz', repo], /argumento desconhecido: --raiz/], [['--out'], /--out exige um valor/], [['--root', '--quiet'], /--root exige um valor/], [['--root', path.join(fora, 'nao-existe')], /raiz não é um diretório/], [['--root', path.join(repo, 'package.json')], /raiz não é um diretório/], [['solto'], /argumento desconhecido: solto/]]) {
    const r = cli(fora, args); assert.equal(r.status, 2, args.join(' ')); assert.match(r.stderr, msg); assert.match(r.stderr, /Uso: node scripts\/ai-context\/gerar\.mjs/);
  }
  assert.deepEqual(fs.readdirSync(fora).sort(), ['abs'], 'erro de uso não cria inventario/ nem a raiz inexistente');
  const h = cli(fora, ['--help']); assert.equal(h.status, 0); assert.match(h.stdout, /--root, --repo/);
});

test('saída idêntica byte a byte com cwd fora da raiz e --root/--out relativos ou absolutos', (t) => {
  const read = mini(t, { 'src/a.ts': `import { b } from './b';\nexport const a = b;`, 'src/b.ts': 'export const b = 1;', 'supabase/migrations/1.sql': 'create table public.t (id int);' }, { args: ['--out', 'ctx'] });
  const repo = read.dir; const snap = (d) => Object.fromEntries(fs.readdirSync(d).sort().map((f) => [f, fs.readFileSync(path.join(d, f), 'utf8').replace(/"gerado_em": "[^"]+"/, '')]));
  const base = snap(path.join(repo, 'ctx'));
  assert.equal(Object.keys(base).length, 17);
  fs.rmSync(path.join(repo, 'ctx'), { recursive: true });
  assert.equal(cli(os.tmpdir(), ['--quiet', '--root', repo, '--out', path.join(repo, 'ctx')]).status, 0);
  assert.deepEqual(snap(path.join(repo, 'ctx')), base, 'cwd diferente + caminhos absolutos');
  fs.rmSync(path.join(repo, 'ctx'), { recursive: true });
  assert.equal(cli(path.join(repo, 'src'), ['--quiet', '--root', '..', '--out', 'ctx']).status, 0);
  assert.deepEqual(snap(path.join(repo, 'ctx')), base, 'cwd = subpasta + caminhos relativos');
});

test('edges: symlink quebrado ou arquivo solto em supabase/functions não zera a seção', (t) => {
  const read = mini(t, { 'supabase/functions/a/index.ts': 'Deno.serve(() => new Response("x"));', 'supabase/functions/import_map.json': '{}' }, { antes: (dir) => fs.symlinkSync('/caminho/que/nao/existe', path.join(dir, 'supabase/functions/quebrado')) });
  assert.deepEqual(read('edge-functions.json').edges.map((e) => e.nome), ['a']);
  assert.deepEqual(read('manifest.json').erros, []);
});

test('gerenciador de pacotes: com dois lockfiles vale packageManager e, sem ele, o que a CI instala', (t) => {
  const wf = 'name: CI\non: [push]\njobs:\n  a:\n    steps:\n      - run: npm ci\n      - run: npm ci\n      # - run: bun install\n      - run: bun install --frozen-lockfile\n';
  const pm = (files) => mini(t, files)('ferramentas.json').stack.gerenciador_pacotes;
  assert.equal(pm({ 'bun.lock': '', 'bun.lockb': '', 'package-lock.json': '{}', '.github/workflows/ci.yml': wf }), 'npm', 'bun.lock herdado, CI usa npm ci');
  assert.equal(pm({ 'bun.lock': '', 'package-lock.json': '{}', '.github/workflows/ci.yml': wf, 'package.json': JSON.stringify({ name: 'm', packageManager: 'bun@1.1.0' }) }), 'bun', 'packageManager declarado vence');
  assert.equal(pm({ 'bun.lock': '' }), 'bun');
  assert.equal(pm({ 'bun.lock': '', 'package-lock.json': '{}' }), 'bun', 'sem CI nem packageManager mantém a ordem antiga');
  const g = mini(t, { 'bun.lock': '', 'package-lock.json': '{}', '.github/workflows/ci.yml': wf })('grafo-graphify.json');
  assert.match(g.como_gerar, /\(ou: npm run graph:update\)/);
});

test('scripts.json: descrição limpa (JSDoc, SQL, docstring), env de Python e uso por workflow fora de "node x"', (t) => {
  const read = mini(t, {
    'scripts/a.mjs': '#!/usr/bin/env node\n/**\n * Gate de orçamento.\n *\n * Segunda linha.\n */\nprocess.env.ORCAMENTO;\n',
    'scripts/b.sql': '-- Regenera o catálogo.\n-- Uso: psql -f\nselect 1;\n',
    'scripts/c.py': '#!/usr/bin/env python3\n"""\nSnapshot do banco.\n\nSomente leitura.\n"""\nimport os\nURL = os.environ["DB_URL"]\nT = os.getenv("TIMEOUT")\n',
    'scripts/d.sh': '#!/bin/bash\n# Instala o cliente.\necho ok\n',
    'scripts/e.mjs': '// Citado só em comentário do workflow.\n',
    '.github/workflows/w.yml': 'name: W\non:\n  push:\npermissions:\n  contents: read # só leitura\n  pull-requests: read\njobs:\n  j:\n    steps:\n      # node scripts/e.mjs ficou para depois\n      - run: psql "$URL" -f scripts/b.sql > out.json\n      - run: ./scripts/d.sh && python3 -u scripts/c.py\n      - run: node --test scripts/a.mjs\n',
  });
  const s = Object.fromEntries(read('scripts.json').scripts.map((x) => [x.arquivo, x]));
  assert.equal(s['scripts/a.mjs'].descricao, 'Gate de orçamento. Segunda linha.');
  assert.equal(s['scripts/b.sql'].descricao, 'Regenera o catálogo. Uso: psql -f');
  assert.equal(s['scripts/c.py'].descricao, 'Snapshot do banco. Somente leitura.');
  assert.equal(s['scripts/d.sh'].descricao, 'Instala o cliente.');
  assert.deepEqual(s['scripts/c.py'].env, ['DB_URL', 'TIMEOUT']);
  assert.deepEqual(s['scripts/a.mjs'].env, ['ORCAMENTO']);
  for (const f of ['scripts/a.mjs', 'scripts/b.sql', 'scripts/c.py', 'scripts/d.sh']) assert.deepEqual(s[f].workflows, ['w.yml'], f);
  assert.deepEqual(s['scripts/e.mjs'].workflows, [], 'linha comentada do YAML não é uso');
  const wf = read('ferramentas.json').workflows[0];
  assert.deepEqual(wf.permissoes, ['contents: read', 'pull-requests: read'], 'sem o comentário de fim de linha');
  assert.deepEqual(wf.scripts_usados, ['scripts/a.mjs', 'scripts/b.sql', 'scripts/c.py', 'scripts/d.sh']);
});

test('testes Python em classe (unittest) têm os casos contados', (t) => {
  const read = mini(t, { 'scripts/test_x.py': 'import unittest\nclass A(unittest.TestCase):\n    def setUp(self):\n        pass\n    def test_um(self):\n        pass\n    async def test_dois(self):\n        pass\ndef test_solto():\n    pass\n' });
  assert.deepEqual(read('testes.json').arquivos.map((a) => [a.arquivo, a.casos]), [['scripts/test_x.py', 3]]);
});

test('permissões: "scan_" não é "can_"; role ARIA não é papel; verify_jwt comentado não vale', (t) => {
  const read = mini(t, {
    'supabase/migrations/1.sql': ['get_seq_scan_hotspots', 'is_admin', 'can_edit', 'user_has_role', 'lista'].map((f) => `create function public.${f}() returns int language sql as $$ select 1 $$;`).join('\n'),
    'src/a.tsx': `export const A = () => { supabase.rpc('get_seq_scan_hotspots'); supabase.rpc('is_admin'); supabase.rpc('can_edit'); supabase.rpc('user_has_role'); supabase.rpc('lista');
  return <div role="alert"><nav role='navigation'/><span role="status"/>{user.role === 'gestor' ? 1 : 2}</div>; };`,
    'supabase/config.toml': 'project_id = "x"\n\n[functions.a]\n# verify_jwt = false  (era público [antes])\nverify_jwt = true\n\n[functions.b]\n  # sem jwt: HMAC no código\nverify_jwt = false\n',
    'supabase/functions/a/index.ts': 'Deno.serve(() => new Response("x"));', 'supabase/functions/b/index.ts': 'Deno.serve(() => new Response("x"));',
  });
  const p = read('ferramentas.json').permissoes;
  assert.deepEqual(p.rpcs_de_autorizacao, ['can_edit', 'is_admin', 'user_has_role']);
  assert.deepEqual(p.papeis_no_codigo, [{ papel: 'gestor', ocorrencias: 1 }]);
  assert.deepEqual(read('edge-functions.json').verify_jwt_false, ['b']);
});

test('pendências: marcador só conta em comentário (string, regex e texto de tela não)', (t) => {
  const read = mini(t, {
    'src/a.tsx': `// TODO: trocar a API\nconst re = /\\b(TODO|FIXME)\\b/;\nconst s = 'TODO';\nexport const A = () => <p>\n  {/* FIXME rever layout */}\n  TODO mundo\n</p>;\n/*\n * HACK temporário\n */\n`,
    'scripts/b.py': 'x = "TODO"\n# XXX remover\n',
  });
  assert.deepEqual(read('baseline.json').todos, [{ arquivo: 'src/a.tsx', linha: 1, tipo: 'TODO', texto: 'trocar a API' }, { arquivo: 'src/a.tsx', linha: 5, tipo: 'FIXME', texto: 'rever layout' }, { arquivo: 'src/a.tsx', linha: 9, tipo: 'HACK', texto: 'temporário' }, { arquivo: 'scripts/b.py', linha: 2, tipo: 'XXX', texto: 'remover' }]);
});

test('edge functions: env lida por helper de _shared aparece em env_via_shared', (t) => {
  const read = mini(t, {
    'supabase/functions/_shared/auth.ts': `import { r } from './redis.ts';\nexport const u = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') + r;`,
    'supabase/functions/_shared/redis.ts': `export const r = Deno.env.get('UPSTASH_URL');`,
    'supabase/functions/a/index.ts': `import { u } from '../_shared/auth.ts';\nDeno.serve(() => new Response(Deno.env.get('A_KEY') + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') + u()));`,
    'supabase/functions/b/index.ts': `Deno.serve(() => new Response('x'));`,
  });
  const e = Object.fromEntries(read('edge-functions.json').edges.map((x) => [x.nome, x]));
  assert.deepEqual(e.a.env, ['A_KEY', 'SUPABASE_SERVICE_ROLE_KEY']);
  assert.deepEqual(e.a.env_via_shared, ['UPSTASH_URL'], 'transitivo, sem repetir o que a própria função lê');
  assert.deepEqual(e.b.env_via_shared, []);
});

test('git: janelas de 7/30/90 dias contam a partir da data do HEAD (mesmo commit, mesmo baseline)', (t) => {
  const read = mini(t, { 'src/a.ts': 'export const a = 1;' }, { antes: (dir) => {
    const g = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: dir, env: { ...process.env, GIT_AUTHOR_DATE: '2020-01-10T12:00:00Z', GIT_COMMITTER_DATE: '2020-01-10T12:00:00Z' } });
    g('init', '-q'); g('add', '-A'); g('commit', '-q', '-m', 'feat: antigo');
  } });
  const git = read('baseline.json').git;
  assert.equal(git.arquivos_mudados_7d, 3, 'commit de 2020 continua dentro da janela ancorada no HEAD');
  assert.deepEqual(git.autores_30d, [{ autor: 't', commits: 1 }]);
  assert.deepEqual(git.arquivos_mais_mudados_90d.map((x) => x.arquivo), ['package.json', 'src/a.ts', 'tsconfig.json']);
});

test('falha visível: config inválido, tipo errado, workspaces quebrado e leitura negada entram em erros', (t) => {
  let erros = mini(t, { 'ai-context.config.json': '{ "out": "ctx", ' })('manifest.json').erros;
  assert.equal(erros.length, 1); assert.equal(erros[0].secao, 'config'); assert.match(erros[0].erro, /ai-context\.config\.json ignorado/);
  const tipos = mini(t, { 'ai-context.config.json': JSON.stringify({ skipDirs: 'a', maxFileMB: 'x', aliases: [1], publicacao: 'Publicado em X.' }), 'a/x.ts': 'export const x = 1;' });
  assert.deepEqual(tipos('manifest.json').erros.map((e) => e.erro), ['skipDirs', 'maxFileMB', 'aliases'].map((k) => `ai-context.config.json → ${k} ignorado: tipo inválido`));
  assert.equal(tipos('baseline.json').contagens.arquivos_codigo, 1, 'skipDirs: "a" não pode virar skip da pasta a/');
  assert.match(fs.readFileSync(path.join(tipos.dir, 'inventario/ia/INDEX.md'), 'utf8'), /Publicado em X\.[\s\S]*3 seção\(ões\) falharam/);
  erros = mini(t, { 'package.json': JSON.stringify({ name: 'm', workspaces: [1, null] }) })('manifest.json').erros;
  assert.deepEqual(erros.map((e) => e.secao), ['workspaces']);
  const negado = mini(t, { 'src/ok.ts': 'export const ok = 1;', 'src/priv/p.ts': 'export const p = 1;', 'src/useNegado.ts': 'export const useNegado = () => 1;' }, { antes: (dir) => { fs.chmodSync(path.join(dir, 'src/priv'), 0o000); fs.chmodSync(path.join(dir, 'src/useNegado.ts'), 0o000); }, limpar: (dir) => fs.chmodSync(path.join(dir, 'src/priv'), 0o755) });
  let barrado = false; try { fs.readdirSync(path.join(negado.dir, 'src/priv')); } catch { barrado = true; }
  if (!barrado) { t.diagnostic('rodando como root (permissão não é aplicada): cenário de leitura negada não exercitado'); return; }
  assert.deepEqual(negado('manifest.json').erros.map((e) => e.erro).sort(), ['src/priv: EACCES — conteúdo fora do inventário', 'src/useNegado.ts: EACCES — conteúdo fora do inventário']);
});

test('INDEX.md do fixture: números batem com os JSON, todo arquivo citado existe e nada de segredo', () => {
  const idx = fs.readFileSync(path.join(out, 'INDEX.md'), 'utf8'); const m = J('manifest.json');
  const tabela = Object.fromEntries([...idx.matchAll(/^\| (\w+) \| (\d+) \|$/gm)].map((x) => [x[1], Number(x[2])]));
  assert.deepEqual(tabela, m.contagens);
  const real = { rotas: J('rotas.json').urls.length, rotas_http_backend: J('rotas.json').rotas_http_backend.length, vistas_por_id: J('rotas.json').vistas.length, itens_menu: J('rotas.json').menu.length, modulos: J('modulos.json').modulos.length, componentes: J('componentes.json').componentes.length, hooks: J('hooks.json').hooks.length, edge_functions: J('edge-functions.json').edges.length, tabelas: Object.keys(J('banco.json').tabelas).length, cron_jobs: J('banco.json').cron_jobs.length, testes: J('testes.json').total, workflows: J('ferramentas.json').workflows.length, scripts: J('scripts.json').scripts.length };
  for (const [k, v] of Object.entries(real)) assert.equal(tabela[k], v, k);
  assert.equal(J('componentes.json').total, real.componentes); assert.equal(J('hooks.json').total, real.hooks); assert.equal(J('edge-functions.json').total, real.edge_functions); assert.equal(J('scripts.json').total, real.scripts);
  const citados = [...new Set([...idx.matchAll(/`(?:inventario\/ia\/)?([\w-]+\.json)`/g)].map((x) => x[1]))];
  assert.ok(citados.length >= 15); for (const f of citados) assert.ok(fs.existsSync(path.join(out, f)), `INDEX.md cita ${f}`);
  for (const [f, h] of Object.entries(m.arquivos)) assert.equal(h.length, 16, f);
  assert.equal(J('grafo.json').arestas_em, 'inventario/ia/grafo-arestas.json');
  for (const [de, para] of Object.entries(J('grafo-arestas.json').arestas)) for (const alvo of [de, ...para]) assert.ok(fs.existsSync(path.join(root, alvo)), `aresta para arquivo inexistente: ${alvo}`);
  for (const f of fs.readdirSync(out)) assert.doesNotMatch(fs.readFileSync(path.join(out, f), 'utf8'), /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.|sk_live_|postgres(ql)?:\/\/[^ ]*:[^ @]+@/, f);
});

test('banco: RLS em três estados — partição protegida dentro de DO $$ não vira "sem RLS"', (t) => {
  const read = isolatedFixture(t, (dir) => {
    w(dir, 'supabase/migrations/005_particoes.sql', `create table public.audit_logs (id bigint, criado_em timestamptz) partition by range (criado_em);
create table public.audit_logs_y2026m01 partition of public.audit_logs for values from ('2026-01-01') to ('2026-02-01');`);
    w(dir, 'supabase/migrations/006_rls_particoes.sql', `do $$
declare r record;
begin
  for r in select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname like 'audit_logs_y%' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;`);
    w(dir, 'supabase/migrations/007_plana.sql', `create table public.pagamentos_plano (id uuid primary key);`);
  });
  const b = read('banco.json');
  assert.equal(b.tabelas.audit_logs_y2026m01.sem_rls, 'desconhecido', 'ligada dentro de DO $$: não é "sem RLS"');
  assert.equal(b.tabelas.audit_logs_y2026m01.rls_indeterminado, true);
  assert.equal(b.tabelas.pagamentos_plano.sem_rls, true, 'tabela comum segue comprovadamente sem RLS');
  assert.equal(b.tabelas.pagamentos_plano.rls_indeterminado, undefined);
  const fer = read('ferramentas.json');
  assert.ok(!fer.permissoes.tabelas_sem_rls.includes('audit_logs_y2026m01'), 'não afirma "sem RLS" sobre a partição');
  assert.deepEqual(fer.permissoes.tabelas_rls_indeterminado, ['audit_logs_y2026m01']);
  assert.ok(fer.permissoes.tabelas_rls_indeterminado_como_decidir.includes('relrowsecurity'), 'publica a consulta que decide no banco vivo');
  const base = read('baseline.json');
  assert.ok(!base.alertas.tabelas_sem_rls.includes('audit_logs_y2026m01'));
  assert.deepEqual(base.alertas.tabelas_rls_indeterminado, ['audit_logs_y2026m01']);
  assert.ok(b.avisos.some((a) => /RLS indeterminado/.test(a)), 'aviso informa quantas ficaram indeterminadas');
});

test('ordem de criação dos arquivos no disco não muda a saída', (t) => {
  const files = { 'supabase/migrations/2.sql': 'alter table public.t add column b int;', 'supabase/migrations/1.sql': 'create table public.t (id int);' };
  for (const n of ['d', 'a', 'c', 'b', 'e']) { files[`src/hooks/use${n.toUpperCase()}.ts`] = `import '../lib/${n}';\nexport const use${n.toUpperCase()} = () => supabase.from('t');`; files[`src/lib/${n}.ts`] = `export const ${n} = 1;`; files[`supabase/functions/fn-${n}/index.ts`] = 'Deno.serve(() => new Response("x"));'; }
  const invertido = Object.fromEntries(Object.entries(files).reverse());
  const a = mini(t, files); const b = mini(t, invertido);
  for (const f of fs.readdirSync(path.join(a.dir, 'inventario/ia'))) if (f !== 'manifest.json') assert.equal(fs.readFileSync(path.join(b.dir, 'inventario/ia', f), 'utf8'), fs.readFileSync(path.join(a.dir, 'inventario/ia', f), 'utf8'), f);
  assert.deepEqual(b('manifest.json').arquivos, a('manifest.json').arquivos);
});
