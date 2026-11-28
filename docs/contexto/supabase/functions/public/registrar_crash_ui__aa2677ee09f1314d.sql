CREATE OR REPLACE FUNCTION public.registrar_crash_ui(p_message text, p_stack_trace text DEFAULT NULL::text, p_url text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_message text := left(nullif(btrim(coalesce(p_message, '')), ''), 500);
begin
  if v_message is null then
    return;
  end if;

  insert into public.telemetry_logs (
    severity,
    category,
    message,
    stack_trace,
    metadata,
    user_id,
    url,
    device_info
  ) values (
    'error',
    'ui_crash',
    v_message,
    left(p_stack_trace, 4000),
    case
      when p_metadata is null then '{}'::jsonb
      when length(p_metadata::text) > 2048 then '{}'::jsonb
      else p_metadata
    end,
    auth.uid(),
    left(p_url, 500),
    jsonb_build_object('source', 'ErrorBoundary')
  );
end;
$function$
