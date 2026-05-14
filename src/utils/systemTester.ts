import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enterprise System Auditor & Multi-Scenario Tester
 * Performs automated high-level sanity checks on production infrastructure.
 */
export const runSystemSanityChecks = async () => {
  const startTime = Date.now();
  const checks = [
    { 
      name: "Sessão de Usuário", 
      fn: async () => { 
        const { data } = await supabase.auth.getSession(); 
        return !!data.session; 
      } 
    },
    { 
      name: "Conectividade de Banco", 
      fn: async () => { 
        const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        return !error; 
      } 
    },
    { 
      name: "Edge Functions (Health)", 
      fn: async () => { 
        try {
          const { data, error } = await supabase.functions.invoke('health-check'); 
          return !error && data?.status === 'healthy'; 
        } catch { return false; }
      } 
    },
    { 
      name: "Realtime (Event Bus)", 
      fn: async () => { 
        const channel = supabase.channel('health-ping'); 
        const status = await new Promise(r => {
          const timeout = setTimeout(() => r('TIMEOUT'), 5000);
          channel.subscribe(s => {
            clearTimeout(timeout);
            r(s);
          });
        }); 
        supabase.removeChannel(channel); 
        return status === 'SUBSCRIBED'; 
      } 
    },
    {
      name: "Auditoria Imutável",
      fn: async () => {
        const { count, error } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).limit(1);
        return !error && count !== null;
      }
    },
    {
      name: "MFA Infrastructure",
      fn: async () => {
        const { data, error } = await supabase.auth.mfa.listFactors();
        return !error && !!data;
      }
    }
  ];

  console.log("🚀 Iniciando auditoria Enterprise 10/10...");
  const results = [];
  
  for (const check of checks) {
    try {
      const ok = await check.fn();
      results.push({ name: check.name, status: ok ? "PASS" : "FAIL" });
    } catch (e) {
      results.push({ name: check.name, status: "ERROR", error: (e as Error).message });
    }
  }

  const duration = Date.now() - startTime;
  const failures = results.filter(r => r.status !== "PASS");

  if (failures.length > 0) {
    toast.error(`Auditoria: ${failures.length} falhas críticas detectadas.`, {
      description: "Verifique o console do desenvolvedor para detalhes técnicos.",
      duration: 6000,
    });
    console.group("❌ Falha na Integridade do Sistema");
    console.table(results);
    console.log(`Tempo total: ${duration}ms`);
    console.groupEnd();
  } else {
    toast.success("Sistema 10/10 validado para produção!", {
      description: `Todas as ${checks.length} camadas operando com sucesso (${duration}ms).`,
      duration: 4000,
    });
    console.group("✅ Sistema Íntegro (10/10)");
    console.table(results);
    console.groupEnd();
  }
  
  return results;
};

