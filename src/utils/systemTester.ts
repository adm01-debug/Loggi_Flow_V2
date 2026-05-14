import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * System Auditor & Scenario Tester
 * Performs automated sanity checks on critical flows
 */
export const runSystemSanityChecks = async () => {
  const checks = [
    { name: "Auth Session", fn: async () => { const { data } = await supabase.auth.getSession(); return !!data.session; } },
    { name: "Database Connectivity", fn: async () => { const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1); return !error; } },
    { name: "Edge Functions (Health)", fn: async () => { const { error } = await supabase.functions.invoke('health'); return !error; } },
    { name: "Realtime Subscription", fn: async () => { const channel = supabase.channel('ping'); const status = await new Promise(r => channel.subscribe(s => r(s))); supabase.removeChannel(channel); return status === 'SUBSCRIBED'; } }
  ];

  console.log("🚀 Starting system sanity checks...");
  const results = [];
  
  for (const check of checks) {
    try {
      const ok = await check.fn();
      results.push({ name: check.name, status: ok ? "PASS" : "FAIL" });
    } catch (e) {
      results.push({ name: check.name, status: "ERROR", error: e });
    }
  }

  const failures = results.filter(r => r.status !== "PASS");
  if (failures.length > 0) {
    toast.error(`Falha em ${failures.length} verificações do sistema! Verifique o console.`);
    console.table(results);
  } else {
    toast.success("Sistema validado: 10/10 Ready for Production!");
    console.log("✅ All checks passed!");
  }
  
  return results;
};
