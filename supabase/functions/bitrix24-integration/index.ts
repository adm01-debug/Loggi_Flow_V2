import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

interface Bitrix24Config {
  webhookUrl: string;
  action: 'create_lead' | 'create_deal' | 'create_task' | 'add_comment' | 'get_contacts' | 'sync_deals' | 'update_deal' | 'get_deals';
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse(req);

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const { webhookUrl, action, data } = await req.json() as Bitrix24Config;

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Bitrix24 webhook URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let endpoint = '';
    let payload: Record<string, unknown> = {};

    switch (action) {
      case 'create_lead':
        endpoint = 'crm.lead.add';
        payload = {
          fields: {
            TITLE: data?.title || 'Nova Lead do Sistema Logístico',
            NAME: data?.name || '',
            PHONE: data?.phone ? [{ VALUE: data.phone, VALUE_TYPE: 'WORK' }] : undefined,
            EMAIL: data?.email ? [{ VALUE: data.email, VALUE_TYPE: 'WORK' }] : undefined,
            COMMENTS: data?.comments || '',
            SOURCE_ID: 'WEB',
            STATUS_ID: 'NEW',
            ...(data?.customFields as Record<string, unknown> || {}),
          },
        };
        break;

      case 'create_deal':
        endpoint = 'crm.deal.add';
        payload = {
          fields: {
            TITLE: data?.title || 'Novo Negócio',
            OPPORTUNITY: data?.value || 0,
            CURRENCY_ID: 'BRL',
            STAGE_ID: data?.stage || 'NEW',
            COMMENTS: data?.comments || '',
            CONTACT_ID: data?.contactId,
            COMPANY_ID: data?.companyId,
            ...(data?.customFields as Record<string, unknown> || {}),
          },
        };
        break;

      case 'create_task':
        endpoint = 'tasks.task.add';
        payload = {
          fields: {
            TITLE: data?.title || 'Nova Tarefa',
            DESCRIPTION: data?.description || '',
            RESPONSIBLE_ID: data?.responsibleId || 1,
            DEADLINE: data?.deadline,
            PRIORITY: data?.priority || 1,
            ...(data?.customFields as Record<string, unknown> || {}),
          },
        };
        break;

      case 'add_comment':
        endpoint = 'crm.timeline.comment.add';
        payload = {
          fields: {
            ENTITY_ID: data?.entityId,
            ENTITY_TYPE: data?.entityType || 'lead',
            COMMENT: data?.comment || '',
          },
        };
        break;

      case 'get_contacts':
        endpoint = 'crm.contact.list';
        payload = {
          filter: data?.filter || {},
          select: ['ID', 'NAME', 'PHONE', 'EMAIL'],
          order: { ID: 'DESC' },
          start: data?.start || 0,
        };
        break;

      case 'get_deals':
        endpoint = 'crm.deal.list';
        payload = {
          filter: data?.filter || {},
          select: ['ID', 'TITLE', 'OPPORTUNITY', 'STAGE_ID', 'CURRENCY_ID', 'DATE_MODIFY', 'CONTACT_ID', 'COMPANY_ID'],
          order: { DATE_MODIFY: 'DESC' },
          start: data?.start || 0,
        };
        break;

      case 'update_deal':
        endpoint = 'crm.deal.update';
        payload = {
          id: data?.dealId,
          fields: {
            STAGE_ID: data?.stage,
            OPPORTUNITY: data?.value,
            COMMENTS: data?.comments,
            ...(data?.customFields as Record<string, unknown> || {}),
          },
        };
        break;

      case 'sync_deals':
        // Fetch recent deals from Bitrix24 for synchronization
        endpoint = 'crm.deal.list';
        payload = {
          filter: {
            '>DATE_MODIFY': data?.lastSyncDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          select: ['ID', 'TITLE', 'OPPORTUNITY', 'STAGE_ID', 'CURRENCY_ID', 'DATE_MODIFY', 'COMMENTS'],
          order: { DATE_MODIFY: 'ASC' },
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers }
        );
    }

    // Make request to Bitrix24
    const bitrixResponse = await fetch(`${webhookUrl}/${endpoint}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await bitrixResponse.json();

    if (result.error) {
      console.error('Bitrix24 error:', result);
      return new Response(
        JSON.stringify({ 
          error: result.error_description || result.error,
          details: result 
        }),
        { status: 400, headers }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.result,
        total: result.total,
      }),
      { headers }
    );

  } catch (error) {
    console.error('Bitrix24 integration error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
