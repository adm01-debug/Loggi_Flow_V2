-- Manifesto de auditoria — detalhado por objeto
-- Sections: schema, table, column, constraint, index, policy, function, trigger, enum
-- Saída única: (section, key, def) no padrão do pipeline audit_tmp.manifest
-- Idempotente e robusto: CREATE TEMP TABLE + INSERT + SELECT final + DROP.

-- Sobra de execução interrompida na mesma sessão: sem este DROP o CREATE falha e, com o psql no modo
-- padrão (segue após erro), as linhas velhas saem misturadas no manifesto novo.
DROP TABLE IF EXISTS pg_temp._manifest_detail;
CREATE TEMP TABLE _manifest_detail (section text, key text, def text);

INSERT INTO _manifest_detail
SELECT 'schema', n.nspname,
       coalesce(n.nspacl::text,'<default>')
  FROM pg_namespace n WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'table', n.nspname||'.'||c.relname,
       c.relkind::text||' rls='||c.relrowsecurity||' force='||c.relforcerowsecurity||' part='||c.relispartition||' opts='||coalesce(c.reloptions::text,'')
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public','internal') AND c.relkind IN ('r','p')
UNION ALL
SELECT 'column', n.nspname||'.'||c.relname||'.'||a.attname,
       format_type(a.atttypid,a.atttypmod)||' nn='||a.attnotnull||' def='||coalesce(pg_get_expr(d.adbin,d.adrelid),'')
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE n.nspname IN ('public','internal') AND c.relkind IN ('r','p')
    AND a.attnum > 0 AND a.atttypid <> 0 AND NOT a.attisdropped
UNION ALL
SELECT 'constraint', n.nspname||'.'||c.relname||'.'||k.conname,
       k.contype::text||' '||pg_get_constraintdef(k.oid)||' defer='||k.condeferrable||k.condeferred||' valid='||k.convalidated
  FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'index', i.schemaname||'.'||i.indexname,
       i.indexdef
  FROM pg_indexes i WHERE i.schemaname IN ('public','internal')
UNION ALL
SELECT 'policy', p.schemaname||'.'||p.tablename||'.'||p.policyname,
       p.cmd||' roles='||coalesce(p.roles::text,'')||' using='||coalesce(p.qual,'')||' check='||coalesce(p.with_check,'')
  FROM pg_policies p WHERE p.schemaname IN ('public','internal','storage')
UNION ALL
SELECT 'function', n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
       CASE WHEN p.prokind IN ('f','p') THEN pg_get_functiondef(p.oid)
            ELSE p.prokind::text||':'||pg_get_function_result(p.oid) END
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'trigger', n.nspname||'.'||c.relname||'.'||t.tgname,
       t.tgenabled::text
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public','internal')
    AND NOT t.tgisinternal
UNION ALL
SELECT 'enum', n.nspname||'.'||t.typname,
       string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE n.nspname IN ('public','internal')
  GROUP BY 1, 2;

SELECT section, key, def FROM _manifest_detail ORDER BY section, key;

DROP TABLE _manifest_detail;
