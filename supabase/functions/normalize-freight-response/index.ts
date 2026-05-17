import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { text, transportadora_id, cotacao_id } = await req.json()

    if (!text || !transportadora_id) {
      throw new Error('Text and transportadora_id are required')
    }

    // 1. Fetch normalization config
    const { data: carrier, error: carrierError } = await supabaseClient
      .from('transportadoras')
      .select('non_api_config')
      .eq('id', transportadora_id)
      .single()

    if (carrierError) throw carrierError

    const config = carrier.non_api_config?.normalization || {}
    let price = null
    let days = null

    // 2. Try Regex if defined
    if (config.price_pattern) {
      const priceRegex = new RegExp(config.price_pattern, 'i')
      const priceMatch = text.match(priceRegex)
      if (priceMatch && priceMatch[1]) {
        price = parseFloat(priceMatch[1].replace(',', '.'))
      }
    }

    if (config.term_pattern) {
      const termRegex = new RegExp(config.term_pattern, 'i')
      const termMatch = text.match(termRegex)
      if (termMatch && termMatch[1]) {
        days = parseInt(termMatch[1])
      }
    }

    // 3. Use AI if fallback is enabled and we are missing data
    if ((!price || !days) && (config.fallback_strategy === 'ai_extraction' || config.fallback_strategy === 'hybrid')) {
      console.log('Using AI to extract data...')
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: config.ai_prompt || 'Extract freight price and delivery days from the text. Return JSON: {"price": number, "days": number}' },
            { role: 'user', content: text }
          ],
          response_format: { type: 'json_object' }
        })
      })

      const aiData = await aiResponse.json()
      const extracted = JSON.parse(aiData.choices[0].message.content)
      price = price || extracted.price
      days = days || extracted.days
    }

    // 4. Update the quote if cotacao_id is provided
    if (cotacao_id && (price !== null || days !== null)) {
      await supabaseClient
        .from('cotacoes_frete')
        .update({
          valor_cotado: price,
          prazo_dias: days,
          status: 'respondido',
          observacoes: `Extraído automaticamente: ${text.substring(0, 100)}...`
        })
        .eq('id', cotacao_id)
    }

    return new Response(
      JSON.stringify({ success: true, price, days }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
