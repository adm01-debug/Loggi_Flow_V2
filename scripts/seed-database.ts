/**
 * Seed script — popula o banco Supabase com dados fictícios realistas
 * para desenvolvimento e demos.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed-database.ts
 *
 * IMPORTANTE: usa SERVICE ROLE KEY (admin). NUNCA exponha essa chave no
 * frontend nem commit ela no repositório. Use .env.local ou variável
 * de ambiente temporária.
 *
 * Flags:
 *   --dry-run          valida e imprime o plano sem nenhuma escrita.
 *   --apply            confirma escrita quando SUPABASE_URL é PRODUÇÃO
 *                      (o fallback abaixo aponta para o projeto de produção).
 *
 * O script é idempotente: re-execuções não duplicam linhas. Tabelas sem
 * UNIQUE usam pré-filtro client-side; coletas/entregas usam número fixo + upsert.
 * Não há transação: via PostgREST cada statement é autônomo — em falha parcial,
 * o estado reflete o que foi commitado até o erro (re-execute para convergir).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Configuração -----------------------------------------------------------

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://jvfhclubfpxrtrrazrgr.supabase.co";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Senha dos usuarios de seed (somente ambiente de dev); sobrescreva com SEED_PASSWORD.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- credencial de seed local, nao de producao
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "LoggiFlow@2026";

// --- Flags de segurança -----------------------------------------------------

const isDryRun = process.argv.includes("--dry-run");
// URL do projeto de produção (usada como fallback): seed nela exige confirmação.
const PRODUCTION_URL = "https://jvfhclubfpxrtrrazrgr.supabase.co";
const allowProduction =
  process.argv.includes("--apply") ||
  process.env.SEED_ALLOW_PRODUCTION === "1";

if (isDryRun) {
  console.log("🧪 Modo dry-run: nenhuma escrita será feita.\n");
  console.log(`📡 URL: ${SUPABASE_URL}`);
  console.log(
    "📋 Plano: profiles · user_roles · user_levels · clientes · fornecedores · transportadoras · coletas · entregas · ocorrencias · cotacoes_frete · achievements · reward_items · conciliacoes · notifications · ip_access_rules · geo_blocking_rules · audit_logs · system_heartbeat",
  );
  process.exit(0);
}

if (!SERVICE_ROLE_KEY) {
  console.error("❌ Defina SUPABASE_SERVICE_ROLE_KEY antes de rodar.");
  console.error(
    "   Ex: SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed-database.ts",
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Helpers ----------------------------------------------------------------

const NOW = () => new Date().toISOString();
const DAYS_AGO = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const DAYS_AHEAD = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// CNPJ fake determinístico por índice (não é válido de verdade).
// Mesmo índice → mesmo CNPJ → upserts idempotentes entre execuções.
const fakeCNPJ = (index: number): string => {
  const n = String(index * 982451653).padStart(14, "0").slice(-14);
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
};

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

async function getOrCreateUserId(): Promise<string> {
  // Reaproveita o admin@loggiflow se já existir; senão cria um admin fake.
  // Buscar por email evita anexar o perfil admin ao primeiro usuário da lista
  // (que pode ser um usuário comum em re-execuções do seed).
  const { data: users } = await supabase.auth.admin.listUsers();
  const admin = users?.users.find((u) => u.email === "admin@loggiflow.com.br");
  if (admin) return admin.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@loggiflow.com.br",
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Admin Demo" },
  });
  if (error) throw new Error(`Falha ao criar admin user: ${error.message}`);
  return data.user.id;
}

async function seedProfilesAndUsers(): Promise<string> {
  console.log("\n📋 profiles + user_roles");
  const adminId = await getOrCreateUserId();

  const { error: profileErr } = await supabase.from("profiles").upsert(
    {
      id: adminId,
      email: "admin@loggiflow.com.br",
      full_name: "Admin Demo",
      cargo: "Administrador",
      avatar_url: null,
    },
    { onConflict: "id" },
  );
  if (profileErr && /no unique/i.test(profileErr.message)) {
    // Sem unique: insert direto
    await supabase.from("profiles").insert({
      id: adminId,
      email: "admin@loggiflow.com.br",
      full_name: "Admin Demo",
      cargo: "Administrador",
      avatar_url: null,
    });
  } else if (profileErr) {
    console.warn("  profiles upsert:", profileErr.message);
  }

  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: adminId, role: "admin" },
      { onConflict: "user_id,role" },
    );
  if (roleErr && /no unique/i.test(roleErr.message)) {
    await supabase
      .from("user_roles")
      .insert({ user_id: adminId, role: "admin" });
  } else if (roleErr) {
    console.warn("  user_roles upsert:", roleErr.message);
  }

  // Cria 3 usuários adicionais para popular user_levels/achievements
  for (let i = 0; i < 3; i++) {
    const email = `user${i + 1}@loggiflow.com.br`;
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users.find((u) => u.email === email);
    let userId: string;
    if (found) {
      userId = found.id;
    } else {
      const { data } = await supabase.auth.admin.createUser({
        email,
        password: SEED_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: REAL_NAMES[i] },
      });
      userId = data.user!.id;
    }
    await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: REAL_NAMES[i],
        cargo: "Operador",
      },
      { onConflict: "id" },
    );
    await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "user" },
        { onConflict: "user_id,role" },
      );
    await supabase.from("user_levels").upsert(
      {
        user_id: userId,
        current_xp: 250 + i * 100,
        total_xp: 500 + i * 200,
        level: 2 + i,
        coins: 150 + i * 50,
        streak_days: 3 + i,
      },
      { onConflict: "user_id" },
    );
  }

  return adminId;
}

async function upsertByCnpj(
  table: string,
  rows: Array<Record<string, any> & { cnpj: string }>,
): Promise<string[]> {
  // Tenta upsert por cnpj; se a tabela não tiver unique em cnpj,
  // faz fallback para insert com deduplicação client-side.
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "cnpj", ignoreDuplicates: false })
    .select("id");

  if (error && /no unique or exclusion constraint/i.test(error.message)) {
    const { data: existing } = await supabase
      .from(table)
      .select("id, cnpj")
      .in(
        "cnpj",
        rows.map((r) => r.cnpj),
      );
    const existingCnpjs = new Set(existing?.map((e) => e.cnpj) ?? []);
    const fresh = rows.filter((r) => !existingCnpjs.has(r.cnpj));
    if (fresh.length === 0) return existing?.map((e) => e.id) ?? [];
    const { data: inserted, error: insErr } = await supabase
      .from(table)
      .insert(fresh)
      .select("id");
    if (insErr) throw insErr;
    return inserted?.map((r) => r.id) ?? [];
  }
  if (error) throw error;
  return data?.map((r) => r.id) ?? [];
}

async function upsertByField(
  table: string,
  field: string,
  rows: Array<Record<string, any>>,
): Promise<void> {
  if (isDryRun) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: field, ignoreDuplicates: false });
  if (error && /no unique or exclusion constraint/i.test(error.message)) {
    // Sem constraint: pré-filtra client-side por `field` e insere só o novo.
    const fieldValues = rows.map((r) => String(r[field]));
    const { data: existing, error: selErr } = await supabase
      .from(table)
      .select(field)
      .in(field, fieldValues);
    if (selErr) throw selErr;
    const existingSet = new Set(existing?.map((e) => String(e[field])) ?? []);
    const fresh = rows.filter((r) => !existingSet.has(String(r[field])));
    if (fresh.length === 0) return;
    const { error: insErr } = await supabase.from(table).insert(fresh);
    if (insErr) throw insErr;
    return;
  }
  if (error) throw error;
}

async function seedClientes(): Promise<{ ids: string[]; [key: string]: any }> {
  console.log("\n📋 clientes");
  const rows = COMPANY_RAZOES.slice(0, 10).map((razao, i) => {
    const [cidade, estado] = pick(CIDADES_BRASIL);
    return {
      razao_social: razao,
      nome_fantasia: COMPANY_FANTASIAS[i],
      cnpj: fakeCNPJ(i + 1),
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
  const ids = await upsertByCnpj("clientes", rows);
  const result = { ids } as { ids: string[]; [key: string]: any };
  if (isDryRun) result.table = "clientes";
  return result;
}

async function seedFornecedores(): Promise<{ ids: string[]; [key: string]: any }> {
  console.log("\n📋 fornecedores");
  const rows = COMPANY_RAZOES.slice(2, 12).map((razao, i) => {
    const [cidade, estado] = pick(CIDADES_BRASIL);
    return {
      razao_social: razao,
      nome_fantasia: `${COMPANY_FANTASIAS[(i + 4) % 12]} Supply`,
      cnpj: fakeCNPJ(i + 100),
      contato_nome: pick(REAL_NAMES),
      contato_email: `compras@${COMPANY_FANTASIAS[(i + 4) % 12].toLowerCase()}.com.br`,
      contato_telefone: fakePhone(),
      endereco_completo: `Rua das Indústrias, ${200 + i * 15}`,
      cidade,
      estado,
      cep: `${20000 + i * 1000}-${200 + i * 10}`,
    };
  });
  const ids = await upsertByCnpj("fornecedores", rows);
  const result = { ids } as { ids: string[]; [key: string]: any };
  if (isDryRun) result.table = "fornecedores";
  return result;
}

async function seedTransportadoras(): Promise<{ ids: string[]; [key: string]: any }> {
  console.log("\n📋 transportadoras");
  const transportadoras = [
    {
      razao_social: "Transportes Rápido Sul",
      nome_fantasia: "Rápido Sul",
      cnpj: fakeCNPJ(1),
      email_comercial: "contato@rapidosul.com.br",
      contato_comercial: "(11) 99999-0001",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Expresso Nacional",
      nome_fantasia: "Expresso Nacional",
      cnpj: fakeCNPJ(2),
      email_comercial: "vendas@expressonacional.com.br",
      contato_comercial: "(21) 99999-0002",
      prazo_medio_dias: 2,
    },
    {
      razao_social: "Loggi Própria",
      nome_fantasia: "Loggi",
      cnpj: fakeCNPJ(3),
      email_comercial: "operacoes@loggi.com",
      contato_comercial: "(11) 99999-0003",
      prazo_medio_dias: 4,
    },
    {
      razao_social: "TransCargo Brasil",
      nome_fantasia: "TransCargo",
      cnpj: fakeCNPJ(4),
      email_comercial: "contato@transcargo.com.br",
      contato_comercial: "(31) 99999-0004",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Veloz Express",
      nome_fantasia: "Veloz Express",
      cnpj: fakeCNPJ(5),
      email_comercial: "vendas@velozexpress.com.br",
      contato_comercial: "(41) 99999-0005",
      prazo_medio_dias: 1,
    },
    {
      razao_social: "Atlas Cargas",
      nome_fantasia: "Atlas",
      cnpj: fakeCNPJ(6),
      email_comercial: "contato@atlaslog.com.br",
      contato_comercial: "(51) 99999-0006",
      prazo_medio_dias: 5,
    },
    {
      razao_social: "Polar Log",
      nome_fantasia: "Polar Log",
      cnpj: fakeCNPJ(7),
      email_comercial: "operacional@polarlog.com.br",
      contato_comercial: "(61) 99999-0007",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Rota Certa",
      nome_fantasia: "Rota Certa",
      cnpj: fakeCNPJ(8),
      email_comercial: "contato@rotacerta.com.br",
      contato_comercial: "(71) 99999-0008",
      prazo_medio_dias: 4,
    },
  ];
  if (isDryRun) return { ids: [], table: "transportadoras" };
  const ids: string[] = [];
  for (const t of transportadoras) {
    const { data, error } = await supabase
      .from("transportadoras")
      .upsert(t, { onConflict: "cnpj" })
      .select("id")
      .single();
    if (error && /no unique or exclusion constraint/i.test(error.message)) {
      // Sem unique: insert direto (pode duplicar se rodar 2×)
      const { data: ins, error: insErr } = await supabase
        .from("transportadoras")
        .insert(t)
        .select("id")
        .single();
      if (insErr) throw insErr;
      ids.push(ins.id);
    } else if (error) {
      throw error;
    } else {
      ids.push(data.id);
    }
  }
  return { ids };
}

async function seedColetas(fornecedorIds: string[]): Promise<void> {
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
  // Número fixo por iteração → upsert por numero_coleta idempotente.
  const rows = Array.from({ length: 12 }, (_, i) => ({
    numero_coleta: `COL-${String(i + 1).padStart(4, "0")}`,
    fornecedor_id: fornecedorIds[i % fornecedorIds.length],
    data_prevista_coleta: DAYS_AGO((i % 7) - 2),
    endereco_coleta: `Av. Principal, ${100 + i * 10}, São Paulo, SP`,
    status: STATUS_COLETA[i % STATUS_COLETA.length],
    qtd_volumes: 1 + (i % 5),
    peso_estimado_kg: 5 + i * 2.5,
    observacoes: i % 3 === 0 ? "Carga frágil" : null,
  }));
  if (isDryRun) return;
  const { error } = await supabase
    .from("coletas")
    .upsert(rows, { onConflict: "numero_coleta" });
  if (error) throw error;
}

async function seedEntregas(
  clienteIds: string[],
  transportadoraIds: string[],
): Promise<string[]> {
  console.log("\n📋 entregas");
  // Número fixo por iteração → upsert por numero_entrega idempotente.
  const rows = Array.from({ length: 15 }, (_, i) => ({
    numero_entrega: `ENT-${String(i + 1).padStart(4, "0")}`,
    cliente_id: clienteIds[i % clienteIds.length],
    transportadora_id: transportadoraIds[i % transportadoraIds.length],
    codigo_rastreamento: `BR${String(i + 1).padStart(3, "0")}000${i}`,
    status: STATUS_ENVIO[i % STATUS_ENVIO.length],
    data_despacho: DAYS_AGO(i % 14),
    previsao_entrega: DAYS_AHEAD((i % 7) + 1),
    data_entrega_efetiva: i < 5 ? DAYS_AGO(i) : null,
    endereco_entrega: `Rua ${pick(REAL_NAMES).split(" ")[1]}, ${50 + i * 7}, São Paulo, SP`,
    valor_frete: 25 + i * 8.5,
  }));
  if (isDryRun) return [];
  const { data, error } = await supabase
    .from("entregas")
    .upsert(rows, { onConflict: "numero_entrega" })
    .select("id");
  if (error) throw error;
  return data?.map((r) => r.id) ?? [];
}

async function seedOcorrencias(entregaIds: string[]): Promise<void> {
  console.log("\n📋 ocorrencias");
  const tipos = [
    "avaria",
    "atraso",
    "extravio",
    "endereco_incorreto",
    "destinatario_ausente",
    "reentrega",
  ] as const;
  const rows = entregaIds.slice(0, 8).map((entregaId, i) => ({
    entrega_id: entregaId,
    tipo_ocorrencia: tipos[i % tipos.length],
    descricao: `Ocorrência ${tipos[i % tipos.length]} registrada automaticamente`,
    resolvida: i % 3 === 0,
    acao_tomada: i % 3 === 0 ? "Ação corretiva tomada" : null,
  }));
  if (isDryRun) return;
  // Ocorrências/entrega fixa (sempre a mesma posição) → não duplica em re-execução.
  for (const row of rows) {
    const { data: existing } = await supabase
      .from("ocorrencias")
      .select("id")
      .eq("entrega_id", row.entrega_id)
      .eq("tipo_ocorrencia", row.tipo_ocorrencia)
      .maybeSingle();
    if (existing) continue;
    const { error } = await supabase.from("ocorrencias").insert(row);
    if (error) console.warn("  ocorrencias:", error.message);
  }
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
  if (isDryRun) return;
  // Posição i fixa → mesmo par (entrega, transportadora) → não duplica.
  for (const row of rows) {
    const { data: existing } = await supabase
      .from("cotacoes_frete")
      .select("id")
      .eq("entrega_id", row.entrega_id)
      .eq("transportadora_id", row.transportadora_id)
      .maybeSingle();
    if (existing) continue;
    const { error } = await supabase.from("cotacoes_frete").insert(row);
    if (error) console.warn("  cotacoes_frete:", error.message);
  }
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
  await upsertByField("achievements", "code", achievements);

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
  await upsertByField("reward_items", "name", rewards);
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
  if (isDryRun) return;
  // Nome fixo → upsert por nome idempotente (sem UNIQUE, fallback via RPC abaixo).
  const { error } = await supabase
    .from("conciliacoes")
    .upsert(rows, { onConflict: "nome" })
    .select("id");
  if (error) {
    if (/no unique or exclusion constraint/i.test(error.message)) {
      // Sem unique: pré-filtra client-side por nome
      const nomes = rows.map((r) => r.nome);
      const { data: existing, error: selErr } = await supabase
        .from("conciliacoes")
        .select("nome")
        .in("nome", nomes);
      if (selErr) throw selErr;
      const existingSet = new Set(existing?.map((e) => e.nome) ?? []);
      const fresh = rows.filter((r) => !existingSet.has(r.nome));
      if (fresh.length > 0) {
        const { error: insErr } = await supabase
          .from("conciliacoes")
          .insert(fresh);
        if (insErr) throw insErr;
      }
    } else {
      throw error;
    }
  }
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
  if (isDryRun) return;
  // Pré-filtra por (user_id, title) → não duplica em re-execução.
  const titulos = rows.map((r) => r.title);
  const { data: existing, error: selErr } = await supabase
    .from("notifications")
    .select("title")
    .eq("user_id", userId)
    .in("title", titulos);
  if (selErr) throw selErr;
  const existingSet = new Set(existing?.map((e) => e.title) ?? []);
  const fresh = rows.filter((r) => !existingSet.has(r.title));
  if (fresh.length > 0) {
    const { error } = await supabase.from("notifications").insert(fresh);
    if (error) console.warn("  notifications:", error.message);
  }
}

async function seedOcorrenciasCatalog(): Promise<void> {
  console.log("\n📋 ip_access_rules + geo_blocking_rules");
  if (isDryRun) return;
  // ip_access_rules não tem UNIQUE em (ip_pattern, rule_type): pré-filtra.
  const ipRows = [
    { rule_type: "blacklist", ip_pattern: "0.0.0.0", description: "Placeholder", is_active: false },
  ];
  const { data: ipExisting, error: ipSelErr } = await supabase
    .from("ip_access_rules")
    .select("id, rule_type, ip_pattern, description")
    .eq("rule_type", "blacklist")
    .eq("ip_pattern", "0.0.0.0")
    .maybeSingle();
  if (ipSelErr) console.warn("  ip_access_rules:", ipSelErr.message);
  if (!ipExisting) {
    const { error: insErr } = await supabase
      .from("ip_access_rules")
      .insert(ipRows);
    if (insErr && !/duplicate key/i.test(insErr.message)) {
      console.warn("  ip_access_rules:", insErr.message);
    }
  }

  // geo_blocking_rules tem UNIQUE(country_code) e rule_type NOT NULL CHECK ('allow'|'block'): upsert idempotente.
  const geoRow = {
    country_code: "BR",
    country_name: "Brasil",
    rule_type: "block" as const,
    is_active: false,
  };
  const { error: geoErr } = await supabase
    .from("geo_blocking_rules")
    .upsert(geoRow, { onConflict: "country_code" });
  if (geoErr && /no unique or exclusion constraint/i.test(geoErr.message)) {
    const { data: geoExisting } = await supabase
      .from("geo_blocking_rules")
      .select("id")
      .eq("country_code", "BR")
      .maybeSingle();
    if (!geoExisting) {
      const { error: insErr } = await supabase
        .from("geo_blocking_rules")
        .insert(geoRow);
      if (insErr) console.warn("  geo_blocking_rules:", insErr.message);
    }
  } else if (geoErr) {
    console.warn("  geo_blocking_rules:", geoErr.message);
  }
}

async function seedAuditAndLogs(userId: string): Promise<void> {
  console.log("\n📋 audit_logs + system_heartbeat");
  if (isDryRun) return;
  // Audit_logs usa colunas do schema real (entity_type/entity_id/action/old_data/new_data).
  await supabase.from("audit_logs").insert(
    Array.from({ length: 5 }, (_, i) => ({
      user_id: userId,
      action: pick(["login", "create", "update", "delete"] as const),
      entity_type: "clientes",
      entity_id: String(i + 1),
      old_data: null,
      new_data: { source: "seed", index: i },
    })),
  );
  // system_heartbeat usa colunas do schema real (service_name/status/last_check).
  await supabase.from("system_heartbeat").upsert(
    {
      service_name: "api",
      status: "operational",
      last_check: NOW(),
      latency_ms: null,
      version: "1.0.0",
      metadata: { env: "dev" },
    },
    { onConflict: "service_name" },
  );
}

// --- Orquestração -----------------------------------------------------------

async function main() {
  console.log("🚀 Iniciando seed do banco Loggi Flow…\n");
  console.log(`📡 URL: ${SUPABASE_URL}`);
  // Não imprime a service role key (evita vazar segredo em logs).

  // Guarda de produção: URL aponta para o projeto de produção (fallback) →
  // exige flag --apply (ou SEED_ALLOW_PRODUCTION=1) para prosseguir.
  if (
    SUPABASE_URL === PRODUCTION_URL &&
    !allowProduction
  ) {
    console.error(
      "🚫 A URL configurada aponta para PRODUÇÃO (jvfhclubfpxrtrrazrgr).",
    );
    console.error(
      "   Este seed NÃO deve rodar em produção sem confirmação explícita.",
    );
    console.error('   Se realmente deseja, rode com " --apply" (ou SEED_ALLOW_PRODUCTION=1).');
    process.exit(1);
  }

  try {
    const userId = await seedProfilesAndUsers();
    const { ids: clienteIds } = await seedClientes();
    const { ids: fornecedorIds } = await seedFornecedores();
    const { ids: transportadoraIds } = await seedTransportadoras();
    await seedColetas(fornecedorIds);
    const entregaIds = await seedEntregas(clienteIds, transportadoraIds);
    await seedOcorrencias(entregaIds);
    await seedCotacoes(entregaIds, transportadoraIds);
    await seedAchievementsAndRewards();
    await seedConciliacoes(userId);
    await seedNotifications(userId);
    await seedOcorrenciasCatalog();
    await seedAuditAndLogs(userId);

    console.log("\n✅ Seed concluído com sucesso!");
    console.log("\n📊 Resumo:");
    console.log("   - profiles: 4 usuários");
    console.log("   - clientes: 10");
    console.log("   - fornecedores: 10");
    console.log("   - transportadoras: 8");
    console.log("   - coletas: 12");
    console.log("   - entregas: 15");
    console.log("   - ocorrencias: 8");
    console.log("   - cotacoes_frete: 10");
    console.log("   - achievements: 8");
    console.log("   - reward_items: 6");
    console.log("   - conciliacoes: 8");
    console.log("   - notifications: 5");
    console.log(`\n🔐 Login admin: admin@loggiflow.com.br / ${SEED_PASSWORD}`);
  } catch (err: any) {
    console.error("\n❌ Erro durante seed:", err.message);
    process.exit(1);
  }
}

main();
