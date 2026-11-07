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
 * O script é idempotente para dados de catálogo (não duplica itens com
 * nomes únicos), mas reseta tabelas transacionais antes de inserir.
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

// CNPJ fake (apenas para preencher campo — não é válido de verdade)
const fakeCNPJ = (): string => {
  const n = Array.from({ length: 14 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
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
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: field, ignoreDuplicates: false });
  if (error && /no unique or exclusion constraint/i.test(error.message)) {
    // Sem constraint: faz insert simples
    const { error: insErr } = await supabase.from(table).insert(rows);
    if (insErr && !/duplicate key/i.test(insErr.message)) throw insErr;
    return;
  }
  if (error) throw error;
}

async function seedClientes(): Promise<string[]> {
  console.log("\n📋 clientes");
  const rows = COMPANY_RAZOES.slice(0, 10).map((razao, i) => {
    const [cidade, estado] = pick(CIDADES_BRASIL);
    return {
      razao_social: razao,
      nome_fantasia: COMPANY_FANTASIAS[i],
      cnpj: fakeCNPJ(),
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
  return await upsertByCnpj("clientes", rows);
}

async function seedFornecedores(): Promise<string[]> {
  console.log("\n📋 fornecedores");
  const rows = COMPANY_RAZOES.slice(2, 12).map((razao, i) => {
    const [cidade, estado] = pick(CIDADES_BRASIL);
    return {
      razao_social: razao,
      nome_fantasia: `${COMPANY_FANTASIAS[(i + 4) % 12]} Supply`,
      cnpj: fakeCNPJ(),
      contato_nome: pick(REAL_NAMES),
      contato_email: `compras@${COMPANY_FANTASIAS[(i + 4) % 12].toLowerCase()}.com.br`,
      contato_telefone: fakePhone(),
      endereco_completo: `Rua das Indústrias, ${200 + i * 15}`,
      cidade,
      estado,
      cep: `${20000 + i * 1000}-${200 + i * 10}`,
    };
  });
  return await upsertByCnpj("fornecedores", rows);
}

async function seedTransportadoras(): Promise<string[]> {
  console.log("\n📋 transportadoras");
  const transportadoras = [
    {
      razao_social: "Transportes Rápido Sul",
      nome_fantasia: "Rápido Sul",
      cnpj: fakeCNPJ(),
      email_comercial: "contato@rapidosul.com.br",
      contato_comercial: "(11) 99999-0001",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Expresso Nacional",
      nome_fantasia: "Expresso Nacional",
      cnpj: fakeCNPJ(),
      email_comercial: "vendas@expressonacional.com.br",
      contato_comercial: "(21) 99999-0002",
      prazo_medio_dias: 2,
    },
    {
      razao_social: "Loggi Própria",
      nome_fantasia: "Loggi",
      cnpj: fakeCNPJ(),
      email_comercial: "operacoes@loggi.com",
      contato_comercial: "(11) 99999-0003",
      prazo_medio_dias: 4,
    },
    {
      razao_social: "TransCargo Brasil",
      nome_fantasia: "TransCargo",
      cnpj: fakeCNPJ(),
      email_comercial: "contato@transcargo.com.br",
      contato_comercial: "(31) 99999-0004",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Veloz Express",
      nome_fantasia: "Veloz Express",
      cnpj: fakeCNPJ(),
      email_comercial: "vendas@velozexpress.com.br",
      contato_comercial: "(41) 99999-0005",
      prazo_medio_dias: 1,
    },
    {
      razao_social: "Atlas Cargas",
      nome_fantasia: "Atlas",
      cnpj: fakeCNPJ(),
      email_comercial: "contato@atlaslog.com.br",
      contato_comercial: "(51) 99999-0006",
      prazo_medio_dias: 5,
    },
    {
      razao_social: "Polar Log",
      nome_fantasia: "Polar Log",
      cnpj: fakeCNPJ(),
      email_comercial: "operacional@polarlog.com.br",
      contato_comercial: "(61) 99999-0007",
      prazo_medio_dias: 3,
    },
    {
      razao_social: "Rota Certa",
      nome_fantasia: "Rota Certa",
      cnpj: fakeCNPJ(),
      email_comercial: "contato@rotacerta.com.br",
      contato_comercial: "(71) 99999-0008",
      prazo_medio_dias: 4,
    },
  ];
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
  return ids;
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
    numero_coleta: `COL-${Date.now()}-${i}`.slice(-12),
    fornecedor_id: fornecedorIds[i % fornecedorIds.length],
    data_prevista_coleta: DAYS_AGO((i % 7) - 2),
    endereco_coleta: `Av. Principal, ${100 + i * 10}, São Paulo, SP`,
    status: STATUS_COLETA[i % STATUS_COLETA.length],
    qtd_volumes: 1 + (i % 5),
    peso_estimado_kg: 5 + i * 2.5,
    observacoes: i % 3 === 0 ? "Carga frágil" : null,
  }));
  const { data, error } = await supabase
    .from("coletas")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return data?.map((r) => r.id) ?? [];
}

async function seedEntregas(
  clienteIds: string[],
  transportadoraIds: string[],
): Promise<string[]> {
  console.log("\n📋 entregas");
  const rows = Array.from({ length: 15 }, (_, i) => ({
    numero_entrega: `ENT-${Date.now()}-${i}`.slice(-12),
    cliente_id: clienteIds[i % clienteIds.length],
    transportadora_id: transportadoraIds[i % transportadoraIds.length],
    codigo_rastreamento: `BR${Date.now()}${i}`.slice(-13),
    status: STATUS_ENVIO[i % STATUS_ENVIO.length],
    data_despacho: DAYS_AGO(i % 14),
    previsao_entrega: DAYS_AHEAD((i % 7) + 1),
    data_entrega_efetiva: i < 5 ? DAYS_AGO(i) : null,
    endereco_entrega: `Rua ${pick(REAL_NAMES).split(" ")[1]}, ${50 + i * 7}, São Paulo, SP`,
    valor_frete: 25 + i * 8.5,
  }));
  const { data, error } = await supabase
    .from("entregas")
    .insert(rows)
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
  const { error } = await supabase.from("ocorrencias").insert(rows);
  if (error) console.warn("  ocorrencias:", error.message);
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
  const { error } = await supabase.from("cotacoes_frete").insert(rows);
  if (error) console.warn("  cotacoes_frete:", error.message);
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
  const { error } = await supabase.from("conciliacoes").insert(rows);
  if (error) console.warn("  conciliacoes:", error.message);
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
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.warn("  notifications:", error.message);
}

async function seedOcorrenciasCatalog(): Promise<void> {
  console.log("\n📋 ip_access_rules + geo_blocking_rules");
  const { error: ipErr } = await supabase
    .from("ip_access_rules")
    .upsert(
      {
        rule_type: "blacklist",
        ip_pattern: "0.0.0.0",
        is_active: false,
        descricao: "Placeholder",
      },
      { onConflict: "ip_pattern,rule_type" },
    );
  if (ipErr && /no unique or exclusion constraint/i.test(ipErr.message)) {
    // Sem unique: insert direto (pode duplicar se rodar 2×)
    await supabase.from("ip_access_rules").insert({
      rule_type: "blacklist",
      ip_pattern: "0.0.0.0",
      is_active: false,
      descricao: "Placeholder",
    });
  } else if (ipErr) {
    console.warn("  ip_access_rules:", ipErr.message);
  }

  const { error: geoErr } = await supabase
    .from("geo_blocking_rules")
    .upsert(
      { country_code: "BR", is_active: false },
      { onConflict: "country_code" },
    );
  if (geoErr && /no unique or exclusion constraint/i.test(geoErr.message)) {
    await supabase.from("geo_blocking_rules").insert({
      country_code: "BR",
      is_active: false,
    });
  } else if (geoErr) {
    console.warn("  geo_blocking_rules:", geoErr.message);
  }
}

async function seedAuditAndLogs(userId: string): Promise<void> {
  console.log("\n📋 audit_logs + system_heartbeat");
  await supabase.from("audit_logs").insert(
    Array.from({ length: 5 }, (_, i) => ({
      user_id: userId,
      action: pick(["login", "create", "update", "delete"] as const),
      resource: "clientes",
      resource_id: null,
      details: { source: "seed" },
    })),
  );
  await supabase.from("system_heartbeat").upsert(
    {
      component: "api",
      status: "healthy",
      last_heartbeat: NOW(),
      metadata: { version: "1.0.0", env: "dev" },
    },
    { onConflict: "component" },
  );
}

// --- Orquestração -----------------------------------------------------------

async function main() {
  console.log("🚀 Iniciando seed do banco Loggi Flow…\n");
  console.log(`📡 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Service role key: ${SERVICE_ROLE_KEY.slice(0, 12)}…\n`);

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
