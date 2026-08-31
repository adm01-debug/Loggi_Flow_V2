-- Manifesto de auditoria — detalhado por objeto
-- Sections: tables, columns, indexes, policies, functions, triggers, enums, constraints

-- Tables
SELECT 'table' AS type, schemaname||'.'||tablename AS name,
       md5(schemaname||tablename) AS hash
  FROM pg_tables WHERE schemaname IN ('public','internal') ORDER BY 2;

-- Columns (com NOT NULL e default)
SELECT 'column' AS type,
       table_schema||'.'||table_name||'.'||column_name AS name,
       md5(table_schema||table_name||column_name||data_type||COALESCE(is_nullable,'')::text||COALESCE(column_default,'')) AS hash
  FROM information_schema.columns
  WHERE table_schema IN ('public','internal') ORDER BY 2;

-- Indexes
SELECT 'index' AS type, schemaname||'.'||indexname AS name,
       md5(indexdef) AS hash
  FROM pg_indexes WHERE schemaname IN ('public','internal') ORDER BY 2;

-- Policies
SELECT 'policy' AS type, schemaname||'.'||tablename||'.'||policyname AS name,
       md5(policyname||COALESCE(cmd,'')||COALESCE(qual,'')||COALESCE(with_check,'')||COALESCE(roles::text,'')) AS hash
  FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY 2;

-- Functions
SELECT 'function' AS type, n.nspname||'.'||p.proname AS name,
       md5(pg_get_functiondef(p.oid)) AS hash
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public','internal') ORDER BY 2;

-- Triggers
SELECT 'trigger' AS type,
       n.nspname||'.'||c.relname||'.'||t.tgname AS name,
       md5(t.tgname||c.relname||t.tgenabled::text) AS hash
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal ORDER BY 2;
