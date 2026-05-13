import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()

    if (!userId) throw new Error('User ID is required')

    // 1. Apagar dados PII
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) throw profileError

    // 2. Anonimizar entregas vinculadas
    const { error: anonError } = await supabaseClient
      .from('entregas')
      .update({ 
        cliente_nome: 'ANONIMIZADO',
        cliente_email: 'anon@example.com',
        cliente_documento: '000.000.000-00'
      })
      .eq('user_id', userId)

    if (anonError) throw anonError

    // 3. Registrar no log de auditoria
    await supabaseClient.from('audit_logs').insert({
      event: 'lgpd_erase',
      user_id: userId,
      metadata: { timestamp: new Date().toISOString(), status: 'success' }
    })

    return new Response(JSON.stringify({ message: "User data erased/anonymized successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
