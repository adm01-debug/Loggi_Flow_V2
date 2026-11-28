# Tipos customizados (enums, domains, composites)

| tipo | kind | valores / definição | usado em |
|---|---|---|---|
| public.app_role | enum | admin, user | public.role_permissions.role, public.user_roles.role |
| public.coleta_status | enum | aguardando_liberacao, solicitada, em_transito, chegou_expedicao, conferencia_ok, divergencia, finalizada | public.coletas.status |
| public.coleta_tipo | enum | lalamove, transportadora | public.coletas.tipo_coleta |
| public.entrega_status | enum | aguardando_producao, pronto_despacho, cotacao_frete, nf_emitida, despachado, em_transito, saiu_entrega, entregue, ocorrencia, finalizado | public.entregas.status |
| public.frete_interno_status | enum | pendente, em_transito, entregue, atrasado, cancelado | public.fretes_internos.status |
| public.frete_tipo | enum | cif, fob, cortesia | public.entregas.tipo_frete |
| public.notification_type | enum | info, success, warning, error, achievement | public.notifications.type |
