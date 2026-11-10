/**
 * Seed script — popula um banco Supabase com dados fictícios realistas
 * para desenvolvimento, demos e o usuário de teste do E2E.
 *
 * Uso:
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 *   npm run seed -- --dry-run     (mostra o plano; não exige chave e não faz nenhuma requisição)
 *
 * Flags:
 *   --dry-run              imprime o que seria semeado, sem tocar no banco.
 *   --confirmar-producao   obrigatória quando a URL é o projeto de PRODUÇÃO
 *                          (jvfhclubfpxrtrrazrgr); exige também SEED_PASSWORD própria.
 *
 * Env: SUPABASE_URL (ou VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 *      SEED_PASSWORD (senha dos usuários de seed), SEED_TIMEOUT_MS (por requisição; padrão 30000).
 *
 * IMPORTANTE: usa SERVICE ROLE KEY (admin). NUNCA exponha essa chave no
 * frontend nem commit ela no repositório. Use .env.local ou variável
 * de ambiente temporária. Não há URL padrão: sem SUPABASE_URL o script não roda.
 *
 * Idempotente: só acrescenta o que falta. Cada linha tem chave fixa (cnpj, numero_*,
 * code, name…) e só é inserida se ainda não existir; nada é apagado e linha já existente
 * não é alterada — exceto profiles/user_roles/user_levels dos usuários de seed (upsert).
 * Não há transação (PostgREST): se falhar no meio, o que já entrou fica; reexecute.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Configuração -----------------------------------------------------------

const PRODUCAO_REF = "jvfhclubfpxrtrrazrgr";
// Lovable Cloud, origem do cutover: AGENTS.md proíbe escrita nele.
const ORIGEM_REF = "hgicfqjayrjurivtygqf";
// Credencial de seed local, nao de producao.
const SENHA_PADRAO = "LoggiFlow@2026";

const FLAGS = new Set(["--dry-run", "--confirmar-producao", "--help", "-h"]);
const args = process.argv.slice(2);

function abortar(...linhas: string[]): never {
  for (const l of linhas) console.error(l);
  process.exit(1);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Uso: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed -- [--dry-run] [--confirmar-producao]",
  );
  process.exit(0);
}
const desconhecidas = args.filter((a) => !FLAGS.has(a));
if (desconhecidas.length > 0) {
  // Flag digitada errada (ex.: --dryrun) não pode virar escrita de verdade.
  abortar(
    `❌ Argumento desconhecido: ${desconhecidas.join(" ")}`,
    "   Aceitos: --dry-run, --confirmar-producao, --help",
  );
}
const DRY_RUN = args.includes("--dry-run");

const semBarraFinal = (u: string): string =>
  u.endsWith("/") ? semBarraFinal(u.slice(0, -1)) : u;
const urlsDefinidas = [
  ...new Set(
    [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL]
      .map((u) => semBarraFinal((u ?? "").trim()))
      .filter(Boolean),
  ),
];
if (urlsDefinidas.length > 1) {
  abortar(
    "❌ SUPABASE_URL e VITE_SUPABASE_URL apontam para lugares diferentes.",
    "   Deixe só uma definida para não semear o banco errado.",
  );
}
const SUPABASE_URL = urlsDefinidas[0] ?? "";

const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
// Senha dos usuarios de seed (somente ambiente de dev); sobrescreva com SEED_PASSWORD.
const SEED_PASSWORD = process.env.SEED_PASSWORD || SENHA_PADRAO;
const TIMEOUT_MS = Number(process.env.SEED_TIMEOUT_MS || 30000);

const EH_PRODUCAO = SUPABASE_URL.toLowerCase().includes(PRODUCAO_REF);

function validarAlvo(): void {
  if (!SUPABASE_URL) {
    abortar(
      "❌ Defina SUPABASE_URL (o banco que vai receber o seed) antes de rodar.",
      "   Ex: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed",
    );
  }
  if (!/^https?:\/\/[^/\s]+$/i.test(SUPABASE_URL)) {
    abortar(`❌ SUPABASE_URL inválida: ${SUPABASE_URL} (esperado https://<ref>.supabase.co)`);
  }
  if (SUPABASE_URL.toLowerCase().includes(ORIGEM_REF)) {
    abortar(
      `🚫 ${ORIGEM_REF} é a origem do cutover (Lovable Cloud): não se escreve nela.`,
    );
  }
  if (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS <= 0) {
    abortar("❌ SEED_TIMEOUT_MS precisa ser um número de milissegundos maior que zero.");
  }
  if (!EH_PRODUCAO) return;
  if (!args.includes("--confirmar-producao")) {
    abortar(
      `🚫 A URL aponta para PRODUÇÃO (${PRODUCAO_REF}).`,
      "   O seed grava clientes, entregas e usuários FICTÍCIOS, com um usuário admin.",
      "   Se é isso mesmo que você quer: npm run seed -- --confirmar-producao",
    );
  }
  if (SEED_PASSWORD === SENHA_PADRAO) {
    abortar(
      "🚫 Em produção, defina SEED_PASSWORD com uma senha própria:",
      "   a senha padrão está escrita no repositório e criaria um admin com senha conhecida.",
    );
  }
}

if (!DRY_RUN) {
  validarAlvo();
  if (!SERVICE_ROLE_KEY) {
    abortar(
      "❌ Defina SUPABASE_SERVICE_ROLE_KEY antes de rodar.",
      "   Ex: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed",
    );
  }
}

// Em dry-run não existe cliente: qualquer acesso ao banco vira erro em vez de requisição.
const supabase: SupabaseClient | null = DRY_RUN
  ? null
  : createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }),
      },
    });

function db(): SupabaseClient {
  if (!supabase) throw new Error("dry-run não acessa o banco");
  return supabase;
}

// --- Helpers ----------------------------------------------------------------

const NOW = () => new Date().toISOString();
const DAYS_AGO = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const DAYS_AHEAD = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// CNPJ fake (apenas para preencher campo — não é válido de verdade).
// Fixo por (série, índice): é a chave que impede duplicar a cada execução.
const fakeCNPJ = (serie: number, indice: number): string =>
  `99.${String(serie).padStart(3, "0")}.${String(indice).padStart(3, "0")}/0001-00`;

const fakePhone = (): string =>
  `(${10 + Math.floor(Math.random() * 89)})${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`;

const REAL_NAMES = [
  "Ana Silva",
  "Carlos Mendes",
  "Mariana Costa",
  "Pedro Almeida",
  "Juliana Rocha",
  "Rafael Santos",
  "Beatriz Lima",
  "Lucas Oliveira",
  "Fernanda Souza",
  "Diego Ferreira",
  "Camila Ribeiro",
  "Bruno Cardoso",
];

const COMPANY_RAZOES = [
  "Indústria Aurora Ltda",
  "Comércio Estrela do Sul S.A.",
  "Logística Phoenix ME",
  "Distribuidora Atlas Ltda",
  "Transportes Vanguarda S.A.",
  "Comércio Delta Ltda",
  "Indústria Sigma Eireli",
  "Logística Beta S.A.",
  "Distribuidora Omega ME",
  "Comércio Polaris Ltda",
  "Indústria Nebula S.A.",
  "Logística Cosmos ME",
];

const COMPANY_FANTASIAS = [
  "Aurora",
  "Estrela Sul",
  "PhoenixLog",
  "Atlas",
  "Vanguarda",
  "Delta",
  "Sigma",
  "BetaLog",
  "Omega",
  "Polaris",
  "Nebula",
  "Cosmos",
];

const CIDADES_BRASIL = [
  ["São Paulo", "SP"],
  ["Rio de Janeiro", "RJ"],
  ["Belo Horizonte", "MG"],
  ["Curitiba", "PR"],
  ["Porto Alegre", "RS"],
  ["Salvador", "BA"],
  ["Fortaleza", "CE"],
  ["Brasília", "DF"],
  ["Recife", "PE"],
  ["Goiânia", "GO"],
  ["Manaus", "AM"],
  ["Florianópolis", "SC"],
  ["Vitória", "ES"],
  ["Campinas", "SP"],
  ["Santos", "SP"],
  ["Niterói", "RJ"],
  ["Juiz de Fora", "MG"],
];

const STATUS_ENVIO = [
  "aguardando_producao",
  "pronto_despacho",
  "cotacao_frete",
  "nf_emitida",
  "despachado",
  "em_transito",
  "saiu_entrega",
  "entregue",
  "ocorrencia",
  "finalizado",
] as const;

// --- Seeders por módulo -----------------------------------------------------

type Row = Record<string, unknown>;

// Contagem real do que entrou, para o resumo final (tabela → novos/já existentes).
const resumo = new Map<string, { novos: number; existentes: number }>();
function registrar(tabela: string, novos: number, existentes: number): void {
  const r = resumo.get(tabela) ?? { novos: 0, existentes: 0 };
  resumo.set(tabela, {
    novos: r.novos + novos,
    existentes: r.existentes + existentes,
  });
}

/**
 * Insere só as linhas cuja `chave` ainda não existe e devolve, na ordem de `rows`,
 * o valor de `idCol` de cada uma (nova ou já existente). Não depende de UNIQUE no
 * banco e nunca altera linha existente.
 */
async function inserirFaltantes(
  tabela: string,
  chave: string[],
  rows: Row[],
  idCol = "id",
): Promise<string[]> {
  if (DRY_RUN) {
    console.log(
      `  [dry-run] ${tabela}: ${rows.length} linha(s), chave (${chave.join(", ")})`,
    );
    registrar(tabela, rows.length, 0);
    return rows.map((_, i) => `dry-run-${tabela}-${i + 1}`);
  }
  const assinatura = (r: Row) => JSON.stringify(chave.map((k) => String(r[k])));
  const colunas = [...new Set([idCol, ...chave])].join(",");

  let consulta = db().from(tabela).select(colunas);
  for (const k of chave) {
    consulta = consulta.in(k, [...new Set(rows.map((r) => r[k]))]);
  }
  const { data: existentes, error: selErr } = await consulta;
  if (selErr) throw new Error(`${tabela} (consulta): ${selErr.message}`);

  const ids = new Map<string, string>();
  for (const e of (existentes ?? []) as unknown as Row[]) {
    if (!ids.has(assinatura(e))) ids.set(assinatura(e), String(e[idCol]));
  }
  const novos = rows.filter((r) => !ids.has(assinatura(r)));
  if (novos.length > 0) {
    const { data: inseridos, error: insErr } = await db()
      .from(tabela)
      .insert(novos)
      .select(colunas);
    if (insErr) throw new Error(`${tabela} (insert): ${insErr.message}`);
    for (const r of (inseridos ?? []) as unknown as Row[]) {
      ids.set(assinatura(r), String(r[idCol]));
    }
  }
  registrar(tabela, novos.length, rows.length - novos.length);
  return rows.map((r) => {
    const id = ids.get(assinatura(r));
    if (id === undefined) {
      throw new Error(`${tabela}: o banco não devolveu a linha ${assinatura(r)}`);
    }
    return id;
  });
}

/** Upsert das tabelas por usuário de seed, onde a linha já nasce por trigger no signup. */
async function upsertRows(
  tabela: string,
  onConflict: string,
  rows: Row[],
): Promise<void> {
  registrar(tabela, rows.length, 0);
  if (DRY_RUN) {
    console.log(
      `  [dry-run] ${tabela}: ${rows.length} linha(s), upsert por (${onConflict})`,
    );
    return;
  }
  const { error } = await db().from(tabela).upsert(rows, { onConflict });
  if (error) throw new Error(`${tabela} (upsert): ${error.message}`);
}

// E-mail → id de todos os usuários do Auth (todas as páginas, uma vez só).
let usuariosPorEmail: Map<string, string> | null = null;
const usuariosCriados: string[] = [];

async function carregarUsuarios(): Promise<Map<string, string>> {
  if (usuariosPorEmail) return usuariosPorEmail;
  const mapa = new Map<string, string>();
  const perPage = 200;
  for (let page = 1; page <= 500; page++) {
    const { data, error } = await db().auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth (listar usuários): ${error.message}`);
    for (const u of data.users) {
      if (u.email) mapa.set(u.email.toLowerCase(), u.id);
    }
    if (data.users.length === 0) break;
  }
  usuariosPorEmail = mapa;
  return mapa;
}

async function garantirUsuario(email: string, fullName: string): Promise<string> {
  if (DRY_RUN) {
    console.log(`  [dry-run] auth.users: ${email} (cria se não existir)`);
    return `dry-run-user-${email}`;
  }
  const usuarios = await carregarUsuarios();
  const existente = usuarios.get(email);
  if (existente) return existente;

  const { data, error } = await db().auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    throw new Error(
      `auth (criar ${email}): ${error?.message ?? "resposta sem usuário"}`,
    );
  }
  usuarios.set(email, data.user.id);
  usuariosCriados.push(email);
  return data.user.id;
}

async function seedProfilesAndUsers(): Promise<string> {
  console.log("\n📋 profiles + user_roles + user_levels");
  // Reaproveita o admin@loggiflow se já existir; senão cria um admin fake.
  // Buscar por email evita anexar o perfil admin ao primeiro usuário da lista
  // (que pode ser um usuário comum em re-execuções do seed).
  const adminId = await garantirUsuario("admin@loggiflow.com.br", "Admin Demo");

  const profiles: Row[] = [
    {
      id: adminId,
      email: "admin@loggiflow.com.br",
      full_name: "Admin Demo",
      cargo: "Administrador",
    },
  ];
  const roles: Row[] = [{ user_id: adminId, role: "admin" }];
  const levels: Row[] = [];

  // Cria 3 usuários adicionais para popular user_levels/achievements
  for (let i = 0; i < 3; i++) {
    const email = `user${i + 1}@loggiflow.com.br`;
    const userId = await garantirUsuario(email, REAL_NAMES[i]);
    profiles.push({
      id: userId,
      email,
      full_name: REAL_NAMES[i],
      cargo: "Operador",
    });
    roles.push({ user_id: userId, role: "user" });
    levels.push({
      user_id: userId,
      current_xp: 250 + i * 100,
      total_xp: 500 + i * 200,
      level: 2 + i,
      coins: 150 + i * 50,
      streak_days: 3 + i,
    });
  }

  await upsertRows("profiles", "id", profiles);
  await upsertRows("user_roles", "user_id,role", roles);
  await upsertRows("user_levels", "user_id", levels);

  return adminId;
}

async function seedClientes(): Promise<string[]> {
  console.log("\n📋 clientes");
  const rows = COMPANY_RAZOES.slice(0, 10).map((razao, i) => {
    const [cidade, estado] = pick(CIDADES_BRASIL);
    return {
      razao_social: razao,
      nome_fantasia: COMPANY_FANTASIAS[i],
      cnpj: fakeCNPJ(1, i + 1),
      contato_nome: pick(REAL_NAMES),
      contato_email: `contato@${COMPANY_FANTASIAS[i].toLowerCase().replace(/\s+/g, "")}.com.br`,
      contato_telefone: fakePhone(),
      endereco_completo: `Av. ${pick(REAL_NAMES).split(" ")[1]}, ${100 + i * 10}`,
      cidade,
      estado,
      cep: `${10000 + i * 1000}-${100 + i * 10}`,
      horario_entrega: "08:00 - 18:00",
    };
  });
  return await inserirFaltantes("clientes", ["cnpj"], rows);
}

async function seedFornecedores(): Promise<string[]> {
  console.log("\n📋 fornecedores");
  const rows = COMPANY_RAZOES.slice(2, 12).map((razao, i) => {
    const [cidade, estado] = pick(CIDADES_BRASIL);
    return {
      razao_social: razao,
      nome_fantasia: `${COMPANY_FANTASIAS[(i + 4) % 12]} Supply`,
      cnpj: fakeCNPJ(2, i + 1),
      contato_nome: pick(REAL_NAMES),
      contato_email: `compras@${COMPANY_FANTASIAS[(i + 4) % 12].toLowerCase()}.com.br`,
      contato_telefone: fakePhone(),
      endereco_completo: `Rua das Indústrias, ${200 + i * 15}`,
      cidade,
      estado,
      cep: `${20000 + i * 1000}-${200 + i * 10}`,
    };
  });
  return await inserirFaltantes("fornecedores", ["cnpj"], rows);
}

async function seedTransportadoras(): Promise<string[]> {
  console.log("\n📋 transportadoras");
  const transportadoras = [
    {
      razao_social: "Transportes Rápido Sul",
      nome_fantasia: "Rápido Sul",
      cnpj: fakeCNPJ(3, 1),
      email_comercial: "contato@rapidosul.com.br",
      contato_comercial: "(11) 99999-0001",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Expresso Nacional",
      nome_fantasia: "Expresso Nacional",
      cnpj: fakeCNPJ(3, 2),
      email_comercial: "vendas@expressonacional.com.br",
      contato_comercial: "(21) 99999-0002",
      prazo_medio_dias: 2,
    },
    {
      razao_social: "Loggi Própria",
      nome_fantasia: "Loggi",
      cnpj: fakeCNPJ(3, 3),
      email_comercial: "operacoes@loggi.com",
      contato_comercial: "(11) 99999-0003",
      prazo_medio_dias: 4,
    },
    {
      razao_social: "TransCargo Brasil",
      nome_fantasia: "TransCargo",
      cnpj: fakeCNPJ(3, 4),
      email_comercial: "contato@transcargo.com.br",
      contato_comercial: "(31) 99999-0004",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Veloz Express",
      nome_fantasia: "Veloz Express",
      cnpj: fakeCNPJ(3, 5),
      email_comercial: "vendas@velozexpress.com.br",
      contato_comercial: "(41) 99999-0005",
      prazo_medio_dias: 1,
    },
    {
      razao_social: "Atlas Cargas",
      nome_fantasia: "Atlas",
      cnpj: fakeCNPJ(3, 6),
      email_comercial: "contato@atlaslog.com.br",
      contato_comercial: "(51) 99999-0006",
      prazo_medio_dias: 5,
    },
    {
      razao_social: "Polar Log",
      nome_fantasia: "Polar Log",
      cnpj: fakeCNPJ(3, 7),
      email_comercial: "operacional@polarlog.com.br",
      contato_comercial: "(61) 99999-0007",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Rota Certa",
      nome_fantasia: "Rota Certa",
      cnpj: fakeCNPJ(3, 8),
      email_comercial: "contato@rotacerta.com.br",
      contato_comercial: "(71) 99999-0008",
      prazo_medio_dias: 4,
    },
  ];
  return await inserirFaltantes("transportadoras", ["cnpj"], transportadoras);
}

async function seedColetas(fornecedorIds: string[]): Promise<string[]> {
  console.log("\n📋 coletas");
  const STATUS_COLETA = [
    "aguardando_liberacao",
    "solicitada",
    "em_transito",
    "chegou_expedicao",
    "conferencia_ok",
    "divergencia",
    "finalizada",
  ] as const;
  const rows = Array.from({ length: 12 }, (_, i) => ({
    numero_coleta: `SEED-COL-${String(i + 1).padStart(3, "0")}`,
    fornecedor_id: fornecedorIds[i % fornecedorIds.length],
    data_prevista_coleta: DAYS_AGO((i % 7) - 2),
    endereco_coleta: `Av. Principal, ${100 + i * 10}, São Paulo, SP`,
    status: STATUS_COLETA[i % STATUS_COLETA.length],
    qtd_volumes: 1 + (i % 5),
    peso_estimado_kg: 5 + i * 2.5,
    observacoes: i % 3 === 0 ? "Carga frágil" : null,
  }));
  return await inserirFaltantes("coletas", ["numero_coleta"], rows);
}

async function seedEntregas(
  clienteIds: string[],
  transportadoraIds: string[],
): Promise<string[]> {
  console.log("\n📋 entregas");
  const rows = Array.from({ length: 15 }, (_, i) => ({
    numero_entrega: `SEED-ENT-${String(i + 1).padStart(3, "0")}`,
    cliente_id: clienteIds[i % clienteIds.length],
    transportadora_id: transportadoraIds[i % transportadoraIds.length],
    codigo_rastreamento: `BRSEED${String(i + 1).padStart(7, "0")}`,
    status: STATUS_ENVIO[i % STATUS_ENVIO.length],
    data_despacho: DAYS_AGO(i % 14),
    previsao_entrega: DAYS_AHEAD((i % 7) + 1),
    data_entrega_efetiva: i < 5 ? DAYS_AGO(i) : null,
    endereco_entrega: `Rua ${pick(REAL_NAMES).split(" ")[1]}, ${50 + i * 7}, São Paulo, SP`,
    valor_frete: 25 + i * 8.5,
  }));
  return await inserirFaltantes("entregas", ["numero_entrega"], rows);
}

async function seedOcorrencias(entregaIds: string[]): Promise<void> {
  console.log("\n📋 ocorrencias");
  const tipos = [
    "avaria",
    "atraso",
    "extravio",
    "endereco_incorreto",
    "ausente",
    "recusa",
  ] as const;
  const rows = entregaIds.slice(0, 8).map((entregaId, i) => ({
    entrega_id: entregaId,
    tipo_ocorrencia: tipos[i % tipos.length],
    descricao: `Ocorrência ${tipos[i % tipos.length]} registrada automaticamente`,
    resolvida: i % 3 === 0,
    acao_tomada: i % 3 === 0 ? "Ação corretiva tomada" : null,
  }));
  await inserirFaltantes("ocorrencias", ["entrega_id", "tipo_ocorrencia"], rows);
}

async function seedCotacoes(
  entregaIds: string[],
  transportadoraIds: string[],
): Promise<void> {
  console.log("\n📋 cotacoes_frete");
  const rows = Array.from({ length: 10 }, (_, i) => ({
    entrega_id: entregaIds[i % entregaIds.length],
    transportadora_id: transportadoraIds[i % transportadoraIds.length],
    valor: 30 + i * 12,
    prazo_dias: 1 + (i % 5),
    observacoes: i % 2 === 0 ? "Frete competitivo" : null,
  }));
  await inserirFaltantes(
    "cotacoes_frete",
    ["entrega_id", "transportadora_id"],
    rows,
  );
}

async function seedAchievementsAndRewards(): Promise<void> {
  console.log("\n📋 achievements + reward_items");
  const achievements = [
    {
      code: "first_delivery",
      name: "Primeira Entrega",
      description: "Complete sua primeira entrega",
      icon: "package",
      category: "deliveries",
      rarity: "common",
      xp_reward: 50,
      coins_reward: 10,
      requirement_type: "deliveries",
      requirement_value: 1,
    },
    {
      code: "marathon_10",
      name: "Maratonista",
      description: "Complete 10 entregas",
      icon: "zap",
      category: "deliveries",
      rarity: "rare",
      xp_reward: 100,
      coins_reward: 25,
      requirement_type: "deliveries",
      requirement_value: 10,
    },
    {
      code: "pro_50",
      name: "Profissional",
      description: "Complete 50 entregas",
      icon: "award",
      category: "deliveries",
      rarity: "epic",
      xp_reward: 250,
      coins_reward: 50,
      requirement_type: "deliveries",
      requirement_value: 50,
    },
    {
      code: "legend_100",
      name: "Lenda",
      description: "Complete 100 entregas",
      icon: "crown",
      category: "deliveries",
      rarity: "legendary",
      xp_reward: 500,
      coins_reward: 100,
      requirement_type: "deliveries",
      requirement_value: 100,
    },
    {
      code: "streak_7",
      name: "Sequência de 7 dias",
      description: "Mantenha uma sequência de 7 dias",
      icon: "flame",
      category: "streak",
      rarity: "common",
      xp_reward: 150,
      coins_reward: 30,
      requirement_type: "streak",
      requirement_value: 7,
    },
    {
      code: "streak_30",
      name: "Sequência de 30 dias",
      description: "Mantenha uma sequência de 30 dias",
      icon: "fire",
      category: "streak",
      rarity: "epic",
      xp_reward: 500,
      coins_reward: 100,
      requirement_type: "streak",
      requirement_value: 30,
    },
    {
      code: "sla_master",
      name: "SLA Master",
      description: "Mantenha 95% de SLA",
      icon: "target",
      category: "sla",
      rarity: "epic",
      xp_reward: 200,
      coins_reward: 50,
      requirement_type: "sla",
      requirement_value: 95,
    },
    {
      code: "collector_25",
      name: "Coletor Ágil",
      description: "Complete 25 coletas",
      icon: "truck",
      category: "collections",
      rarity: "rare",
      xp_reward: 175,
      coins_reward: 35,
      requirement_type: "collections",
      requirement_value: 25,
    },
  ];
  await inserirFaltantes("achievements", ["code"], achievements);

  const rewards = [
    {
      name: "Vale Presente R$50",
      description: "Vale presente em estabelecimentos parceiros",
      icon: "Gift",
      coins_cost: 500,
      stock: 50,
      available: true,
      category: "vale",
      rarity: "rare",
    },
    {
      name: "Dia de Folga",
      description: "Uma folga remunerada",
      icon: "Calendar",
      coins_cost: 1000,
      stock: 5,
      available: true,
      category: "beneficio",
      rarity: "epic",
    },
    {
      name: "Kit Loggi",
      description: "Kit com camiseta, caneca e garrafa",
      icon: "Package",
      coins_cost: 300,
      stock: 100,
      available: true,
      category: "produto",
      rarity: "common",
    },
    {
      name: "Bonificação R$100",
      description: "Bônus em dinheiro",
      icon: "DollarSign",
      coins_cost: 1500,
      stock: null,
      available: true,
      category: "dinheiro",
      rarity: "legendary",
    },
    {
      name: "Curso de Capacitação",
      description: "Curso online com certificado",
      icon: "Book",
      coins_cost: 800,
      stock: 30,
      available: true,
      category: "educacao",
      rarity: "epic",
    },
    {
      name: "Fone Bluetooth",
      description: "Fone de ouvido sem fio",
      icon: "Headphones",
      coins_cost: 1200,
      stock: 15,
      available: true,
      category: "produto",
      rarity: "epic",
    },
  ];
  await inserirFaltantes("reward_items", ["name"], rewards);
}

async function seedConciliacoes(userId: string): Promise<void> {
  console.log("\n📋 conciliacoes");
  const TIPOS = [
    "faturas_entregas",
    "custos_previstos_realizados",
    "pagamentos_notas",
  ] as const;
  const STATUS_CONC = [
    "rascunho",
    "em_andamento",
    "concluida",
    "arquivada",
  ] as const;
  const rows = Array.from({ length: 8 }, (_, i) => ({
    tipo: TIPOS[i % TIPOS.length],
    nome: `Conciliação ${i + 1}`,
    descricao: `Período de conciliação ${i + 1}`,
    periodo_inicio: DAYS_AGO(30 - i * 3),
    periodo_fim: DAYS_AGO(i * 3),
    status: STATUS_CONC[i % STATUS_CONC.length],
    total_itens_importados: 10 + i * 2,
    total_itens_conciliados: 8 + i,
    total_divergencias: i,
    valor_total_importado: 5000 + i * 500,
    valor_total_sistema: 5000 + i * 480,
    diferenca_total: i * 20,
    created_by: userId,
  }));
  await inserirFaltantes("conciliacoes", ["nome"], rows);
}

async function seedNotifications(userId: string): Promise<void> {
  console.log("\n📋 notifications");
  const rows = [
    {
      user_id: userId,
      title: "Nova coleta agendada",
      message: "Coleta #1234 agendada para hoje às 14h",
      type: "info",
      read: false,
    },
    {
      user_id: userId,
      title: "Entrega concluída",
      message: "Envio para São Paulo foi entregue",
      type: "success",
      read: false,
    },
    {
      user_id: userId,
      title: "Alerta de SLA",
      message: "1 envio próximo do vencimento de SLA",
      type: "warning",
      read: true,
    },
    {
      user_id: userId,
      title: "Conquista desbloqueada!",
      message: "Você desbloqueou 'Maratonista' +100 XP",
      type: "achievement",
      read: false,
    },
    {
      user_id: userId,
      title: "Custo acima do esperado",
      message: "Frete SP→RJ 15% acima da média",
      type: "warning",
      read: false,
    },
  ];
  await inserirFaltantes("notifications", ["user_id", "title"], rows);
}

async function seedOcorrenciasCatalog(): Promise<void> {
  console.log("\n📋 ip_access_rules + geo_blocking_rules");
  await inserirFaltantes(
    "ip_access_rules",
    ["ip_pattern", "rule_type"],
    [
      {
        rule_type: "blacklist",
        ip_pattern: "0.0.0.0",
        is_active: false,
        description: "Placeholder",
      },
    ],
  );
  await inserirFaltantes(
    "geo_blocking_rules",
    ["country_code"],
    [
      {
        country_code: "BR",
        country_name: "Brasil",
        rule_type: "block",
        is_active: false,
        description: "Placeholder",
      },
    ],
  );
}

async function seedAuditAndLogs(userId: string): Promise<void> {
  console.log("\n📋 audit_logs + system_heartbeat");
  const acoes = ["INSERT", "UPDATE", "DELETE"] as const;
  await inserirFaltantes(
    "audit_logs",
    ["record_id", "table_name"],
    Array.from({ length: 5 }, (_, i) => ({
      user_id: userId,
      action: acoes[i % acoes.length],
      table_name: "clientes",
      record_id: `seed-${i + 1}`,
      new_data: { source: "seed" },
    })),
  );
  await inserirFaltantes(
    "system_heartbeat",
    ["service_name"],
    [
      {
        service_name: "api",
        status: "operational",
        last_check: NOW(),
        version: "1.0.0",
        metadata: { env: "dev" },
      },
    ],
    "service_name",
  );
}

// --- Orquestração -----------------------------------------------------------

// A chave nunca vai para o log, nem embutida em mensagem de erro de terceiros.
function semSegredo(texto: string): string {
  let limpo = texto;
  for (const segredo of [SERVICE_ROLE_KEY, process.env.SEED_PASSWORD ?? ""]) {
    if (segredo) limpo = limpo.split(segredo).join("***");
  }
  return limpo;
}

async function main() {
  console.log(
    DRY_RUN
      ? "🧪 Dry-run do seed do banco Loggi Flow — nenhuma requisição será feita.\n"
      : "🚀 Iniciando seed do banco Loggi Flow…\n",
  );
  console.log(`📡 URL: ${SUPABASE_URL || "(SUPABASE_URL não definida)"}`);
  if (EH_PRODUCAO) console.log("⚠️  Alvo: PRODUÇÃO");

  try {
    const userId = await seedProfilesAndUsers();
    const clienteIds = await seedClientes();
    const fornecedorIds = await seedFornecedores();
    const transportadoraIds = await seedTransportadoras();
    await seedColetas(fornecedorIds);
    const entregaIds = await seedEntregas(clienteIds, transportadoraIds);
    await seedOcorrencias(entregaIds);
    await seedCotacoes(entregaIds, transportadoraIds);
    await seedAchievementsAndRewards();
    await seedConciliacoes(userId);
    await seedNotifications(userId);
    await seedAuditAndLogs(userId);
    // Por último: o vocabulário de geo_blocking_rules.rule_type não está em nenhuma
    // migration do repo; se o banco recusar, o restante já entrou.
    await seedOcorrenciasCatalog();

    console.log(
      DRY_RUN
        ? "\n🧪 Dry-run concluído: nada foi gravado."
        : "\n✅ Seed concluído com sucesso!",
    );
    console.log(DRY_RUN ? "\n📊 Plano:" : "\n📊 Resumo:");
    for (const [tabela, r] of resumo) {
      console.log(
        DRY_RUN
          ? `   - ${tabela}: ${r.novos}`
          : `   - ${tabela}: ${r.novos} novo(s), ${r.existentes} já existia(m)`,
      );
    }
    if (DRY_RUN) return;
    if (usuariosCriados.includes("admin@loggiflow.com.br")) {
      const senha =
        SEED_PASSWORD === SENHA_PADRAO ? SENHA_PADRAO : "(valor de SEED_PASSWORD)";
      console.log(`\n🔐 Login admin: admin@loggiflow.com.br / ${senha}`);
    } else {
      console.log(
        "\n🔐 Login admin: admin@loggiflow.com.br (já existia — senha não alterada)",
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("\n❌ Erro durante seed:", semSegredo(msg));
    console.error(
      "   Nada é desfeito: o que entrou antes do erro continua no banco. Corrija e reexecute.",
    );
    process.exit(1);
  }
}

main();
