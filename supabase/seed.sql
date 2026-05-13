import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("🌱 Iniciando seeding do banco de dados...");

const seedData = async () => {
  // 1. Criar Regras de Negócio Iniciais
  const businessRules = [
    { key: 'SLA_ENTREGA_DIAS', value: { default: 3, express: 1 }, description: 'Prazo padrão de entrega por tipo de serviço' },
    { key: 'FRETE_GRATIS_MINIMO', value: { value: 250.00 }, description: 'Valor mínimo para frete grátis' },
    { key: 'POINTS_PER_SHIPMENT', value: { value: 10 }, description: 'Pontos ganhos por entrega finalizada' }
  ];

  for (const rule of businessRules) {
    await supabase.from('business_rules_config').upsert(rule, { onConflict: 'key' });
  }

  // 2. Criar Feature Flags
  const flags = [
    { key: 'NEW_DASHBOARD', is_enabled: true, description: 'Habilita novo dashboard v2' },
    { key: 'AI_FREIGHT_SUGGESTIONS', is_enabled: false, description: 'Sugestões de frete via IA' },
    { key: 'BETA_TESTER_PROGRAM', is_enabled: true, description: 'Acesso ao programa beta' }
  ];

  for (const flag of flags) {
    await supabase.from('feature_flags').upsert(flag, { onConflict: 'key' });
  }

  console.log("✅ Seeding concluído com sucesso!");
};

seedData().catch(err => {
  console.error("❌ Erro no seeding:", err);
  Deno.exit(1);
});
