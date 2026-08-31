# Auditoria de paridade origem → destino (in-DB diff)

O destino (`jvfhclubfpxrtrrazrgr`) puxa o manifesto da origem via `pg_net` → `exec_sql` e compara com o próprio catálogo.
Nada passa por ferramenta externa; só as diferenças saem.

- `manifest_full.sql` — 1 SELECT (section, key, def): schema, ext, role, enum, type, table, column, constraint, index, policy,
  function, fn_acl, trigger, view, sequence, grant, defacl, event_trigger, publication, cron, bucket, comment, migration,
  auth_user, storage_objects, vault. ACLs de `sandbox_exec`, versão de `pg_net`, `exec_sql`/`mcp_exec*` e rolconfig de
  `service_role`/`supabase_realtime_admin` já são neutralizados (exceções de plataforma).
- `manifest_data.sql` — rows + md5 de conteúdo (`jsonb_strip_nulls(to_jsonb(row))`, ordenado) por tabela public/internal.

Execução (destino, role postgres): schema `audit_tmp` com `sql(name, body)`, `cfg(src_url, src_key)`, `manifest(side, section, key, def)`,
view `diff` (SAME/DIFF/ONLY_SRC/ONLY_DST) e função `first_diff(a,b)`. Passos: (1) `net.http_post` → `exec_sql` com o body do manifesto;
(2) `INSERT ... jsonb_to_recordset(net._http_response.content)` como `src`; (3) `EXECUTE` local como `dst`;
(4) `SELECT section, status, count(*) FROM audit_tmp.diff GROUP BY 1,2`. A chave da origem é removida de `cfg` ao final.
Relatório: `docs/audit/2026-08-31_auditoria_pos_remediacao.md`.
