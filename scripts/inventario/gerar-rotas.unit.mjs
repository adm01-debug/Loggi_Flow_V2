// Teste de scripts/inventario/gerar-rotas.mjs: funcoes exportadas sobre um repo sintetico em pasta
// temporaria (rotas planas e aninhadas, lazy, wrapper de protecao, Navigate, "*", rota comentada,
// menu, fecho de imports), a CLI como subprocesso numa copia do script e, por fim, o repo de verdade
// (so leitura: confere que o parser enxerga todas as <Route> de src/App.tsx). Offline.
// Rodar: node --test scripts/inventario/gerar-rotas.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  MAX_SALTOS_FEATURE, casaRota, extrairChamadas, extrairImports, fechoDaTela, gerarRotas, lerMenu, lerUrls,
  resolverImport, serializar,
} from './gerar-rotas.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(AQUI, 'gerar-rotas.mjs');
const REPO = path.resolve(AQUI, '..', '..');

const APP = `import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Sobre from "./pages/Sobre";
import './index.css';

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Coletas = lazy(() => import("./pages/Coletas"));
const Detalhe = lazy(() => import("./pages/rastreamento/Detalhe"));
const Estranha = lazy(() => import("./pages/Relatório (novo) [beta]"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminUsuarios = lazy(() => import("./pages/admin/Usuarios"));
const Sumida = lazy(() => import("./pages/NaoExiste"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LazyProviders = lazy(() => import("./components/LazyProviders"));

function AppRoutes() {
  return (
    <div key="x" className="w-full">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route
          path="/coletas"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<div>...</div>}><Coletas /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/rastreamento/:id" element={<ProtectedRoute requiredRoles={['admin', "gestor"]}><Detalhe /></ProtectedRoute>} />
        <Route path={"/relatório (novo)/[beta]"} element={<Estranha />} />
        <Route path='/sobre' element={<Sobre />} />
        <Route path="/antiga" element={<Navigate to="/coletas" replace />} />
        <Route path="/sumida" element={<Sumida />} />
        <Route path="/sem-import" element={<ComponenteSemImport />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route element={<Suspense fallback={null} />}>
            <Route path="usuarios/:id/editar" Component={AdminUsuarios} />
          </Route>
        </Route>
        {/* <Route path="/comentada-jsx" element={<Index />} /> */}
        // <Route path="/comentada-linha" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
export default AppRoutes;
`;

const MENU = `import { NavLink } from "react-router-dom";
interface MenuSection { id: string; title: string; icon: unknown; items: { title: string; url: string; icon: unknown }[] }
const menuSections: MenuSection[] = [
  {
    id: "ops",
    title: "Operações",
    icon: Truck,
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { url: "/coletas", icon: Box, title: "Coletas Compras" },
      { title: 'Rastreio 42', url: '/rastreamento/42', icon: Pin },
      // { title: "Comentado", url: "/comentado", icon: X },
    ],
  },
  {
    id: "rede",
    title: "Rede",
    icon: Map,
    items: [
      { title: "Fantasma", url: "/nao-existe", icon: Ghost },
    ],
  },
];
const adminItems = [
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Coletas (admin)", url: "/coletas", icon: Box },
];
export const AppSidebar = () => (<nav><NavLink to="/sobre">Sobre</NavLink></nav>);
`;

const ARQUIVOS = {
  'src/App.tsx': APP,
  'src/index.css': 'body{}',
  'src/components/layout/AppSidebar.tsx': MENU,
  'src/components/auth/ProtectedRoute.tsx': 'export const ProtectedRoute = ({ children }) => children;\n',
  'src/components/LazyProviders.tsx': 'export default function LazyProviders({ children }) { return children; }\n',
  'src/pages/Index.tsx': `import { MainLayout } from "@/components/layout/MainLayout";
import { useColetas } from "@/hooks/useColetas";
import "./estilo.css";
import logo from "@/assets/logo.svg";
export default function Index() { useColetas(); return <MainLayout />; }
`,
  'src/pages/Auth.tsx': `import { AuthForm } from "./auth/AuthForm";\nexport default function Auth() { return <AuthForm />; }\n`,
  'src/pages/auth/AuthForm.tsx': `import { supabase } from "@/integrations/supabase/client";
export const AuthForm = () => { supabase.functions.invoke("validate-login", {}); supabase.from("login_attempts"); return null; };
`,
  'src/pages/Coletas.tsx': `import { useColetas, useNaoResolve } from "@/hooks/useColetas";
import { coisa } from "@/lib/nao-existe";
import { tabela } from "@/utils/tabela";
import type { SoTipo } from "@/hooks/tipos-inexistentes";
export default function Coletas() { return null; }
`,
  'src/pages/Coletas.test.tsx': 'import "./Coletas";\nsupabase.from("so_no_teste");\n',
  'src/pages/Sobre.tsx': 'export default function Sobre() { return null; }\n',
  'src/pages/rastreamento/Detalhe.tsx': `export default function Detalhe() { fetch(\`\${url}/functions/v1/lalamove-tracking?x=1\`); return null; }\n`,
  'src/pages/Relatório (novo) [beta].tsx': `import { useRelatorio } from "@/hooks/Relatório (novo)/useRelatorio";\nexport default function R() { useRelatorio(); return null; }\n`,
  'src/pages/admin/AdminLayout.tsx': 'export default function AdminLayout() { return null; }\n',
  'src/pages/admin/AdminHome.tsx': 'export default function AdminHome() { return null; }\n',
  'src/pages/admin/Usuarios.tsx': `import { supabase } from "@/integrations/supabase/client";\nexport default function U() { supabase.rpc("listar_usuarios"); return null; }\n`,
  'src/pages/NotFound.tsx': 'export default function NotFound() { return null; }\n',
  'src/pages/Orfa.tsx': 'export default function Orfa() { return null; }\n',
  'src/hooks/useColetas.ts': `import { supabase } from "@/integrations/supabase/client";
const TABELA = 'coletas';
export function useColetas() {
  supabase.from(TABELA).select();
  supabase.from("fornecedores");
  supabase.storage.from("documents").list();
  supabase.rpc('add_user_xp');
  return supabase.functions.invoke(
    'predict-delays', {});
}
`,
  'src/hooks/Relatório (novo)/useRelatorio.ts': 'export const useRelatorio = () => fetch("/rest/v1/relatorios?select=*");\n',
  'src/utils/tabela.ts': 'export const tabela = () => supabase.from("via_utils");\n',
  'src/integrations/supabase/client.ts': 'export const supabase = {};\n',
  'src/assets/logo.svg': '<svg/>',
  'src/pages/estilo.css': 'a{}',
  // cadeia de componentes: pagina -> MainLayout (1) -> Header (2) -> Status (3) -> Fundo (4)
  'src/components/layout/MainLayout.tsx': 'import { Header } from "./Header";\nimport { Button } from "@/components/ui/button";\nexport const MainLayout = () => { supabase.from("salto1"); return <Header />; };\n',
  'src/components/layout/Header.tsx': 'import { Status } from "@/components/common/Status";\nexport const Header = () => { supabase.from("salto2"); return <Status />; };\n',
  'src/components/common/Status.tsx': 'import { Fundo } from "./Fundo";\nexport const Status = () => { supabase.functions.invoke("nexus-auto-healing"); return <Fundo />; };\n',
  'src/components/common/Fundo.tsx': 'export const Fundo = () => { supabase.from("salto4"); return null; };\n',
  'src/components/ui/button.tsx': 'export const Button = () => { supabase.from("kit_de_ui"); return null; };\n',
};

function montar(t, { nome = 'inv-rotas-', sem = [], trocar = {} } = {}) {
  const raiz = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), nome)));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  for (const [rel, texto] of Object.entries({ ...ARQUIVOS, ...trocar })) {
    if (sem.includes(rel)) continue;
    fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto);
  }
  return raiz;
}

/** Copia o script para dentro da raiz sintetica e devolve um executor da CLI. */
function cli(raiz) {
  fs.mkdirSync(path.join(raiz, 'scripts/inventario'), { recursive: true });
  const script = path.join(raiz, 'scripts/inventario/gerar-rotas.mjs');
  fs.copyFileSync(SCRIPT, script);
  return (args = [], opcoes = {}) => spawnSync(process.execPath, [script, ...args], { cwd: raiz, encoding: 'utf8', ...opcoes });
}

// ---------- pecas ----------

test('extrairImports: default, nomeado com alias, namespace, efeito colateral, dinamico e re-export; `import type` fica fora', () => {
  const imps = extrairImports(`import A, { useB as useC, type T, d } from './a';
import * as NS from "@/ns";
import type { X } from './tipos';
import './efeito.css';
const L = lazy(() => import("./lazy"));
export { z } from './reexport';
export * from './barril';
`);
  const por = Object.fromEntries(imps.map((i) => [i.especificador, i.nomes]));
  assert.deepEqual(por['./a'], ['A', 'useC', 'T', 'd']);
  assert.deepEqual(por['@/ns'], ['NS']);
  assert.ok(!('./tipos' in por));
  for (const esp of ['./efeito.css', './lazy', './reexport', './barril']) assert.ok(esp in por, esp);
});

test('extrairChamadas: tabelas, buckets, rpcs e edges nos formatos usados no repo', () => {
  const c = extrairChamadas(`const T = 'via_const';
export const BUCKET = "avatars";
function f(param) {
  const DENTRO = 'nao_e_modulo';
  supabase.from('coletas'); supabase.from(\`entregas\`); supabase.from(T); supabase.from(DENTRO); supabase.from(param);
  supabase.storage.from("documents"); supabase.storage.from(BUCKET);
  supabase.rpc("add_user_xp"); fetch(base + "/rest/v1/rpc/via_rest"); fetch("/rest/v1/tabela_rest?select=*");
  supabase.functions.invoke('predict-delays'); supabase.functions.invoke<Tipo>(
    "com-generico", {});
  supabase.functions.invoke('evolution-api/connect');
  fetch(\`\${SUPABASE_URL}/functions/v1/health-check\`);
  Array.from(lista); Buffer.from("texto_qualquer");
}`);
  assert.deepEqual(c.tabelas.sort(), ['coletas', 'entregas', 'tabela_rest', 'texto_qualquer', 'via_const']);
  assert.deepEqual(c.buckets.sort(), ['avatars', 'documents']);
  assert.deepEqual(c.rpcs.sort(), ['add_user_xp', 'via_rest']);
  assert.deepEqual(c.edges.sort(), ['com-generico', 'evolution-api', 'health-check', 'predict-delays']);
});

test('resolverImport: alias @/, relativo, index, externo (null) e local inexistente (undefined)', (t) => {
  const raiz = montar(t);
  const de = path.join(raiz, 'src/pages/Index.tsx');
  assert.equal(resolverImport(raiz, de, '@/hooks/useColetas'), path.join(raiz, 'src/hooks/useColetas.ts'));
  assert.equal(resolverImport(raiz, de, './auth/AuthForm'), path.join(raiz, 'src/pages/auth/AuthForm.tsx'));
  assert.equal(resolverImport(raiz, de, './estilo.css'), path.join(raiz, 'src/pages/estilo.css'));
  assert.equal(resolverImport(raiz, de, 'react'), null);
  assert.equal(resolverImport(raiz, de, '@/lib/nao-existe'), undefined);
  assert.equal(resolverImport(raiz, de, './auth'), undefined, 'pasta sem index nao e arquivo');
});

test('casaRota: igualdade, :param, * no fim e o "*" solto (404) que nao e destino de menu', () => {
  assert.equal(casaRota('/coletas', '/coletas'), true);
  assert.equal(casaRota('/coletas', '/coletas/1'), false);
  assert.equal(casaRota('/rastreamento/:id', '/rastreamento/42'), true);
  assert.equal(casaRota('/rastreamento/:id', '/rastreamento/42/mapa'), false);
  assert.equal(casaRota('/docs/*', '/docs/a/b'), true);
  assert.equal(casaRota('/a.b/:id', '/aXb/1'), false, 'ponto do caminho e literal');
  assert.equal(casaRota('*', '/qualquer'), false);
  assert.equal(casaRota('*', '*'), true);
});

// ---------- URLs ----------

test('lerUrls: todas as <Route> com path/index, na ordem por caminho, sem as comentadas', (t) => {
  const urls = lerUrls(montar(t));
  assert.deepEqual(urls.map((u) => u.caminho), [
    '*', '/', '/admin', '/admin', '/admin/usuarios', '/admin/usuarios/:id/editar', '/antiga', '/auth', '/coletas',
    '/rastreamento/:id', '/relatório (novo)/[beta]', '/sem-import', '/sobre', '/sumida',
  ]);
  assert.ok(!urls.some((u) => u.caminho.includes('comentada')));
});

test('lerUrls: componente, arquivo, protecao, papeis e redirecionamento de cada tipo de rota', (t) => {
  const urls = lerUrls(montar(t));
  const de = (caminho, componente) => urls.find((u) => u.caminho === caminho && (!componente || u.componente === componente));
  assert.deepEqual(de('/auth'), { caminho: '/auth', componente: 'Auth', arquivo: 'src/pages/Auth.tsx', protegida: false, papeis: [], redireciona: null });
  assert.deepEqual(de('/'), { caminho: '/', componente: 'Index', arquivo: 'src/pages/Index.tsx', protegida: true, papeis: [], redireciona: null });
  assert.deepEqual(de('/coletas'), { caminho: '/coletas', componente: 'Coletas', arquivo: 'src/pages/Coletas.tsx', protegida: true, papeis: ['admin'], redireciona: null },
    'tag em varias linhas, requiredRole="admin" e Suspense no meio');
  assert.deepEqual(de('/rastreamento/:id').papeis, ['admin', 'gestor']);
  assert.equal(de('/rastreamento/:id').arquivo, 'src/pages/rastreamento/Detalhe.tsx');
  assert.equal(de('/relatório (novo)/[beta]').arquivo, 'src/pages/Relatório (novo) [beta].tsx', 'path={"..."} e arquivo com espaco, acento, () e []');
  assert.equal(de('/sobre').arquivo, 'src/pages/Sobre.tsx', 'import estatico, path com aspas simples');
  assert.deepEqual(de('/antiga'), { caminho: '/antiga', componente: null, arquivo: null, protegida: false, papeis: [], redireciona: '/coletas' });
  assert.equal(de('/sumida').arquivo, null);
  assert.equal(de('/sem-import').componente, 'ComponenteSemImport');
  assert.equal(de('*').componente, 'NotFound');
});

test('lerUrls: rota aninhada herda caminho, protecao e papeis do pai; rota de layout sem path nao vira URL', (t) => {
  const urls = lerUrls(montar(t));
  const admin = urls.filter((u) => u.caminho.startsWith('/admin'));
  assert.deepEqual(admin, [
    { caminho: '/admin', componente: 'AdminLayout', arquivo: 'src/pages/admin/AdminLayout.tsx', protegida: true, papeis: ['admin'], redireciona: null },
    { caminho: '/admin', componente: 'AdminHome', arquivo: 'src/pages/admin/AdminHome.tsx', protegida: true, papeis: ['admin'], redireciona: null },
    { caminho: '/admin/usuarios', componente: 'AdminUsuarios', arquivo: 'src/pages/admin/Usuarios.tsx', protegida: true, papeis: ['admin'], redireciona: null },
    { caminho: '/admin/usuarios/:id/editar', componente: 'AdminUsuarios', arquivo: 'src/pages/admin/Usuarios.tsx', protegida: true, papeis: ['admin'], redireciona: null },
  ]);
});

test('lerUrls: rota coringa "/x/*" nao abre comentario; path que e expressao aparece cru em vez de sumir', (t) => {
  const app = `import A from "./pages/Sobre";
export default () => (<Routes>
  <Route path="/docs/*" element={<A />} />
  <Route path="/depois-do-coringa" element={<A />} />
  {/* comentario de verdade, que fecha aqui */}
  <Route path={ROTAS.painel} element={<A />} />
  <Route path="/fim" element={<A fallback={<span>{"}"}</span>} />} />
</Routes>);
`;
  const urls = lerUrls(montar(t, { trocar: { 'src/App.tsx': app } }));
  assert.deepEqual(urls.map((u) => u.caminho), ['/depois-do-coringa', '/docs/*', '/fim', '/{ROTAS.painel}']);
  assert.ok(urls.every((u) => u.arquivo === 'src/pages/Sobre.tsx'));
});

test('lerUrls: arquivo sem <Routes> ou sem nenhuma <Route> com path falha em vez de devolver lista vazia', (t) => {
  assert.throws(() => lerUrls(montar(t, { trocar: { 'src/App.tsx': 'export default () => <div />;\n' } })), /nao tem <Routes>/);
  assert.throws(() => lerUrls(montar(t, { trocar: { 'src/App.tsx': 'export default () => <Routes>{/* <Route path="/a" element={<A />} /> */}</Routes>;\n' } })), /nenhuma <Route> com path/);
  assert.throws(() => lerUrls(montar(t, { sem: ['src/App.tsx'] })), { code: 'ENOENT' });
});

// ---------- menu ----------

test('lerMenu: itens { title, url } em qualquer ordem de chave, com lista e grupo; link fixo `to=`; comentado fica fora', (t) => {
  const menu = lerMenu(montar(t));
  assert.deepEqual(menu, {
    '/': [{ rotulo: 'Dashboard', secao: 'menuSections', grupo: 'Operações' }],
    '/coletas': [
      { rotulo: 'Coletas Compras', secao: 'menuSections', grupo: 'Operações' },
      { rotulo: 'Coletas (admin)', secao: 'adminItems', grupo: null },
    ],
    '/rastreamento/42': [{ rotulo: 'Rastreio 42', secao: 'menuSections', grupo: 'Operações' }],
    '/nao-existe': [{ rotulo: 'Fantasma', secao: 'menuSections', grupo: 'Rede' }],
    '/admin/usuarios': [{ rotulo: 'Usuários', secao: 'adminItems', grupo: null }],
    '/sobre': [{ rotulo: null, secao: null, grupo: null }],
  });
});

test('lerMenu: menu sem nenhum item reconhecivel falha em vez de devolver vazio', (t) => {
  assert.throws(() => lerMenu(montar(t, { trocar: { 'src/components/layout/AppSidebar.tsx': 'export const AppSidebar = () => null;\n' } })), /nenhum item \{ title, url \}/);
  assert.throws(() => lerMenu(montar(t, { sem: ['src/components/layout/AppSidebar.tsx'] })), { code: 'ENOENT' });
});

// ---------- fecho ----------

test('fechoDaTela: segue hooks, utils e componentes ate MAX_SALTOS_FEATURE; kit de UI, teste e `import type` ficam fora', (t) => {
  const raiz = montar(t);
  assert.equal(MAX_SALTOS_FEATURE, 3);
  const index = fechoDaTela(raiz, path.join(raiz, 'src/pages/Index.tsx'));
  assert.deepEqual(index.tabelas, ['coletas', 'fornecedores', 'salto1', 'salto2'], 'salto4 esta alem do limite; kit_de_ui nunca entra');
  assert.deepEqual(index.edges, ['nexus-auto-healing', 'predict-delays'], 'a edge do 3o salto (layout -> header -> status) entra');
  assert.deepEqual(index.buckets, ['documents']);
  assert.deepEqual(index.rpcs, ['add_user_xp']);
  assert.deepEqual(index.hooks, [{ nome: 'useColetas', arquivo: 'src/hooks/useColetas.ts' }]);
  assert.deepEqual(index.imports_quebrados, [], '.css e .svg nao sao import quebrado');
  assert.equal(index.arquivos_lidos, 6, 'Index, MainLayout, Header, Status, useColetas e o estilo.css da propria pasta');

  const lidos = new Set();
  const coletas = fechoDaTela(raiz, path.join(raiz, 'src/pages/Coletas.tsx'), lidos);
  assert.deepEqual(coletas.tabelas, ['coletas', 'fornecedores', 'via_utils'], 'src/utils entra; so_no_teste nao');
  assert.deepEqual(coletas.imports_quebrados, ['src/pages/Coletas.tsx -> @/lib/nao-existe']);
  assert.deepEqual(coletas.hooks.map((h) => h.nome), ['useColetas', 'useNaoResolve']);
  assert.deepEqual([...lidos].map((p) => path.relative(raiz, p)).sort(), ['src/hooks/useColetas.ts', 'src/pages/Coletas.tsx', 'src/utils/tabela.ts']);
});

// ---------- inventario inteiro ----------

test('gerarRotas: resumo, telas, hooks e problemas do repo sintetico', (t) => {
  const inv = gerarRotas(montar(t));
  assert.equal(inv.format_version, 1);
  assert.deepEqual(inv.resumo, { urls: 14, telas: 11, itens_de_menu: 7, hooks_distintos: 3, arquivos_em_pages: 12, problemas: 6 });
  assert.equal(inv.urls.length, 14);
  assert.deepEqual(inv.telas.map((x) => x.id), inv.urls.filter((u) => u.arquivo).map((u) => u.caminho));
  const tela = (id) => inv.telas.find((x) => x.id === id);
  assert.deepEqual(tela('/coletas').menu.map((m) => m.rotulo), ['Coletas Compras', 'Coletas (admin)']);
  assert.deepEqual(tela('/rastreamento/:id').menu.map((m) => m.rotulo), ['Rastreio 42'], 'menu casa com rota dinamica');
  assert.deepEqual(tela('/rastreamento/:id').edges, ['lalamove-tracking']);
  assert.deepEqual(tela('*').menu, [], 'a rota "*" nao recebe o menu inteiro');
  assert.deepEqual(tela('/relatório (novo)/[beta]').tabelas, ['relatorios']);
  assert.deepEqual(tela('/relatório (novo)/[beta]').hooks, [{ nome: 'useRelatorio', arquivo: 'src/hooks/Relatório (novo)/useRelatorio.ts' }]);
  assert.deepEqual(tela('/auth').edges, ['validate-login']);
  assert.deepEqual(tela('/admin/usuarios').rpcs, ['listar_usuarios']);
  assert.deepEqual(inv.hooks.useColetas, { arquivo: 'src/hooks/useColetas.ts', telas: ['/', '/coletas'] });
  assert.deepEqual(Object.keys(inv.hooks), ['useColetas', 'useNaoResolve', 'useRelatorio']);
  assert.deepEqual(inv.problemas.map((p) => `${p.tipo} ${p.id}`), [
    'menu_sem_rota /nao-existe',
    'rota_sem_menu /admin', // layout e index dividem a URL: um aviso so
    'url_sem_arquivo /sem-import',
    'url_sem_arquivo /sumida',
    'pagina_sem_rota src/pages/Orfa.tsx',
    'import_quebrado /coletas',
  ]);
  assert.equal(inv.problemas[5].detalhe, 'src/pages/Coletas.tsx -> @/lib/nao-existe');
});

test('gerarRotas: saida deterministica e sem data', (t) => {
  const raiz = montar(t);
  const um = serializar(gerarRotas(raiz));
  assert.equal(um, serializar(gerarRotas(raiz)));
  assert.ok(um.endsWith('}\n'));
  assert.ok(!/gerado_em|medido_em/.test(um));
});

// ---------- CLI ----------

test('CLI: grava rotas.json, --check em dia (0) e desatualizado (1), de qualquer cwd', (t) => {
  const raiz = montar(t, { nome: 'inv rotas ação (1) [x] ' });
  const rodar = cli(raiz);
  const saida = path.join(raiz, 'inventario/estado/rotas.json');
  const semArquivo = rodar(['--check']);
  assert.equal(semArquivo.status, 1, 'sem rotas.json o --check acusa');
  assert.ok(!fs.existsSync(saida), '--check nao grava');
  const gravou = rodar([], { cwd: os.tmpdir() });
  assert.equal(gravou.status, 0, gravou.stderr);
  assert.match(gravou.stdout, /^rotas\.json: 14 URLs, 11 telas, 7 itens de menu, 3 hooks, 6 problemas\.\n$/);
  assert.equal(fs.readFileSync(saida, 'utf8'), serializar(gerarRotas(raiz)));
  assert.equal(rodar(['--check']).status, 0);
  fs.appendFileSync(path.join(raiz, 'src/App.tsx'), '\n');
  assert.equal(rodar(['--check']).status, 0, 'mudanca que nao altera o inventario nao desatualiza');
  fs.writeFileSync(path.join(raiz, 'src/App.tsx'), APP.replace('<Route path="*"', '<Route path="/nova" element={<Index />} />\n        <Route path="*"'));
  const desatualizado = rodar(['--check']);
  assert.equal(desatualizado.status, 1);
  assert.match(desatualizado.stderr, /rotas\.json desatualizado/);
});

test('CLI: o mesmo arquivo em qualquer locale (antes a ordem vinha de localeCompare)', (t) => {
  const trocar = { 'src/App.tsx': APP.replace('<Route path="*"', '<Route path="/ch" element={<Index />} />\n        <Route path="/h" element={<Index />} />\n        <Route path="/ä" element={<Index />} />\n        <Route path="/z" element={<Index />} />\n        <Route path="*"') };
  const raiz = montar(t, { trocar });
  const rodar = cli(raiz);
  const saida = path.join(raiz, 'inventario/estado/rotas.json');
  const gerar = (locale) => {
    assert.equal(rodar([], { env: { ...process.env, LC_ALL: locale, LANG: locale } }).status, 0);
    return fs.readFileSync(saida, 'utf8');
  };
  const c = gerar('C');
  assert.equal(gerar('cs_CZ.UTF-8'), c);
  assert.equal(gerar('sv_SE.UTF-8'), c);
  const caminhos = JSON.parse(c).urls.map((u) => u.caminho);
  assert.ok(caminhos.indexOf('/ch') < caminhos.indexOf('/h') && caminhos.indexOf('/z') < caminhos.indexOf('/ä'), 'ordem por unidade de codigo');
});

test('CLI: sem o arquivo de rotas ou de menu falha fechado (exit 2) e nao grava nada', async (t) => {
  const casos = {
    'sem src/App.tsx (antes: aviso "pulando" e exit 0)': [{ sem: ['src/App.tsx'] }, /arquivo esperado nao existe: .*src[\\/]App\.tsx/],
    'sem o menu': [{ sem: ['src/components/layout/AppSidebar.tsx'] }, /arquivo esperado nao existe: .*AppSidebar\.tsx/],
    'App.tsx sem <Routes>': [{ trocar: { 'src/App.tsx': 'export default () => null;\n' } }, /nao tem <Routes>/],
  };
  for (const [nome, [opcoes, erro]] of Object.entries(casos)) {
    await t.test(nome, () => {
      const raiz = montar(t, opcoes);
      const rodar = cli(raiz);
      for (const args of [[], ['--check']]) {
        const saida = rodar(args);
        assert.equal(saida.status, 2, `${args.join(' ')}: ${saida.stdout}${saida.stderr}`);
        assert.match(saida.stderr, erro);
        assert.equal(saida.stdout, '');
      }
      assert.ok(!fs.existsSync(path.join(raiz, 'inventario')));
    });
  }
});

test('CLI: --help e argumento desconhecido nao geram nada', (t) => {
  const raiz = montar(t);
  const rodar = cli(raiz);
  const ajuda = rodar(['--help']);
  assert.equal(ajuda.status, 0);
  assert.match(ajuda.stdout, /^Uso: node scripts\/inventario\/gerar-rotas\.mjs \[--check\]/);
  const estranho = rodar(['--chek']);
  assert.equal(estranho.status, 2);
  assert.match(estranho.stderr, /argumento desconhecido: --chek/);
  assert.ok(!fs.existsSync(path.join(raiz, 'inventario')));
});

// ---------- o repo de verdade (so leitura) ----------

test('repo real: o parser enxerga todas as <Route> de src/App.tsx e todos os itens do menu', () => {
  const app = fs.readFileSync(path.join(REPO, 'src/App.tsx'), 'utf8');
  // Contagem independente do parser: linhas de <Route ... path=...> que nao estao comentadas.
  const esperadas = app.split('\n').filter((l) => /<Route\s[^>]*\bpath=/.test(l) && !/^\s*(\/\/|\{\/\*)/.test(l)).length;
  const inv = gerarRotas(REPO);
  assert.ok(esperadas > 0);
  assert.equal(inv.resumo.urls, esperadas);
  assert.equal(new Set(inv.urls.map((u) => u.caminho)).size, inv.urls.length, 'sem caminho repetido');
  for (const u of inv.urls) {
    assert.ok(u.redireciona || u.arquivo, `${u.caminho}: componente ${u.componente} sem arquivo`);
    if (u.arquivo) assert.ok(fs.existsSync(path.join(REPO, u.arquivo)), u.arquivo);
  }
  assert.ok(inv.urls.some((u) => u.caminho === '*'), 'rota 404');
  assert.ok(inv.urls.some((u) => u.caminho.includes(':')), 'rota dinamica');
  assert.ok(inv.urls.some((u) => u.papeis.includes('admin')), 'requiredRole="admin"');
  assert.ok(inv.urls.some((u) => !u.protegida) && inv.urls.some((u) => u.protegida));

  const menu = fs.readFileSync(path.join(REPO, 'src/components/layout/AppSidebar.tsx'), 'utf8');
  // Titulo longo quebra o item em varias linhas: conta ocorrencias de `url: "..."`, nao linhas.
  const itens = [...menu.matchAll(/\burl:\s*["'`]/g)].length;
  const fixos = new Set([...menu.matchAll(/\bto="(\/[^"]*)"/g)].map((m) => m[1]));
  assert.ok(itens > 0);
  assert.ok(inv.resumo.itens_de_menu >= itens && inv.resumo.itens_de_menu <= itens + fixos.size);

  const paginas = [];
  const andar = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) andar(path.join(dir, e.name));
      else if (/\.tsx$/.test(e.name) && !/\.(test|spec|stories)\./.test(e.name)) paginas.push(e.name);
    }
  };
  andar(path.join(REPO, 'src/pages'));
  assert.equal(inv.resumo.arquivos_em_pages, paginas.length);
  assert.equal(inv.resumo.telas, inv.urls.filter((u) => u.arquivo).length);
});
