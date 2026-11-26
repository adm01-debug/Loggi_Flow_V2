-- Etapa 285 do censo (docs/qa/03-ACHADOS.md, H-14).
--
-- O ErrorBoundary já grava o crash de render em `public.telemetry_logs`, mas a
-- policy "Strict insert telemetry logs" exige sessão (auth.uid() IS NOT NULL):
-- quem cai na tela de login nunca vira registro e o erro morre no console.
--
-- Esta RPC é o único caminho de escrita liberado para `anon`. Ela fixa
-- severity/category, corta os campos em tamanho conhecido e descarta metadata
-- acima de 2 KB, para não transformar a tabela em depósito de payload alheio.
-- A tabela segue sem INSERT direto para `anon`.

create or replace function public.registrar_crash_ui(
  p_message text,
  p_stack_trace text default null,
  p_url text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
$$;

comment on function public.registrar_crash_ui(text, text, text, jsonb) is
  'Grava crash de render do ErrorBoundary em telemetry_logs, inclusive sem sessao (etapa 285/H-14).';

revoke all on function public.registrar_crash_ui(text, text, text, jsonb) from public;
grant execute on function public.registrar_crash_ui(text, text, text, jsonb) to anon, authenticated, service_role;