import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8nConfig {
  webhookUrl: string;
  data?: Record<string, unknown>;
  waitForResponse?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { webhookUrl, data, waitForResponse = false } = await req.json() as N8nConfig;

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'n8n webhook URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate webhook URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(webhookUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare payload with metadata
    const payload = {
      timestamp: new Date().toISOString(),
      source: 'logistica-system',
      ...data,
    };

    console.log('Triggering n8n webhook:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload));

    // Make request to n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Logistica-System/1.0',
      },
      body: JSON.stringify(payload),
    });

    // Handle response based on configuration
    if (waitForResponse) {
      // Wait for and return n8n workflow response
      const contentType = n8nResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const result = await n8nResponse.json();
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: n8nResponse.status,
            data: result,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const text = await n8nResponse.text();
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: n8nResponse.status,
            data: text,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fire and forget - just confirm the webhook was triggered
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook triggered successfully',
          status: n8nResponse.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('n8n integration error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
